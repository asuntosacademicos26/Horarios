/**
 * Worker de subida/entrega de archivos (R2) + autenticación de administradores.
 *
 *   POST   /login              → { token, username, exp }  (verifica contra RTDB)
 *   GET    /admins             → lista de administradores (sin hashes)   [token]
 *   POST   /admins             → crea administrador { username, password } [token]
 *   DELETE /admins/<id>        → elimina administrador                    [token]
 *   PUT    /upload/<...ruta>   → guarda archivo en R2, responde { url }   [token]
 *   GET    /files/<...ruta>    → sirve el archivo desde R2 (público)
 *
 * Secretos requeridos:
 *   AUTH_SECRET         — clave HMAC para firmar tokens (wrangler secret put)
 *   FIREBASE_DB_SECRET  — opcional; se añade como ?auth= al leer/escribir RTDB
 *                         cuando las reglas de la base dejen de ser públicas.
 *
 * Las contraseñas se guardan en RTDB como PBKDF2-SHA256 (100k iteraciones).
 * Los registros legados en texto plano se migran automáticamente al hacer login.
 */

const DB_URL = "https://horario-b4ff3-default-rtdb.firebaseio.com";
const PBKDF2_ITERATIONS = 100000;
const TOKEN_TTL_SECONDS = 8 * 3600;

const RULES = {
  images:    { maxMb: 5,  accepts: type => type.startsWith("image/") },
  schedules: { maxMb: 20, accepts: type => type === "application/pdf" }
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS }
  });
}

// ── Utilidades binarias ──────────────────────────────────────────
const te = new TextEncoder();

function toHex(bytes) {
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function b64urlEncode(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}
/** Comparación en tiempo constante */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── Hash de contraseñas (PBKDF2-SHA256) ──────────────────────────
async function hashPassword(password, saltBytes, iterations = PBKDF2_ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw", te.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations },
    keyMaterial, 256
  );
  return new Uint8Array(bits);
}

async function makePasswordRecord(username, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  return { username, salt: toHex(salt), hash: toHex(hash), iterations: PBKDF2_ITERATIONS };
}

async function verifyPassword(password, record) {
  const expected = fromHex(record.hash);
  const actual = await hashPassword(password, fromHex(record.salt), record.iterations || PBKDF2_ITERATIONS);
  return safeEqual(actual, expected);
}

// ── Tokens (HMAC-SHA256) ─────────────────────────────────────────
async function hmacKey(env) {
  return crypto.subtle.importKey(
    "raw", te.encode(env.AUTH_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
}

async function signToken(env, username) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = b64urlEncode(te.encode(JSON.stringify({ u: username, exp })));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(env), te.encode(payload));
  return { token: `${payload}.${b64urlEncode(sig)}`, exp };
}

/** Devuelve el username si el token es válido, o null */
async function verifyToken(env, request) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const [payload, sig] = auth.slice(7).split(".");
  if (!payload || !sig) return null;
  try {
    const expected = await crypto.subtle.sign("HMAC", await hmacKey(env), te.encode(payload));
    if (!safeEqual(b64urlDecode(sig), new Uint8Array(expected))) return null;
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    if (!data.u || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data.u;
  } catch {
    return null;
  }
}

// ── Realtime Database (REST) ─────────────────────────────────────
function dbPath(env, path) {
  const auth = env.FIREBASE_DB_SECRET ? `?auth=${env.FIREBASE_DB_SECRET}` : "";
  return `${DB_URL}/${path}.json${auth}`;
}

async function dbFetch(env, path, init) {
  const res = await fetch(dbPath(env, path), init);
  if (!res.ok) throw new Error(`RTDB ${init?.method || "GET"} ${path}: HTTP ${res.status}`);
  return res.json();
}

// ── Rutas de autenticación / administración ──────────────────────
async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return json(400, { error: "JSON inválido" }); }
  const { username, password } = body || {};
  if (!username || !password) return json(400, { error: "Faltan credenciales" });

  let admins = await dbFetch(env, "admins") || {};

  // Seed del admin por defecto si la tabla está vacía
  if (!Object.keys(admins).length) {
    const record = await makePasswordRecord("cris", "73820210");
    await dbFetch(env, "admins", { method: "POST", body: JSON.stringify(record) });
    admins = await dbFetch(env, "admins") || {};
  }

  for (const [id, a] of Object.entries(admins)) {
    if (a.username !== username) continue;

    let ok = false;
    if (a.hash && a.salt) {
      ok = await verifyPassword(password, a);
    } else if (typeof a.password === "string") {
      // Registro legado en texto plano: verificar y migrar a hash
      ok = safeEqual(te.encode(a.password), te.encode(password));
      if (ok) {
        const record = await makePasswordRecord(username, password);
        await dbFetch(env, `admins/${id}`, { method: "PUT", body: JSON.stringify(record) });
      }
    }
    if (ok) {
      const { token, exp } = await signToken(env, username);
      return json(200, { token, username, exp });
    }
  }
  return json(401, { error: "Usuario o contraseña incorrectos" });
}

async function handleAdmins(request, env, url) {
  if (request.method === "GET") {
    const admins = await dbFetch(env, "admins") || {};
    const safe = {};
    for (const [id, a] of Object.entries(admins)) safe[id] = { username: a.username };
    return json(200, safe);
  }

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json(400, { error: "JSON inválido" }); }
    const { username, password } = body || {};
    if (!username || !password) return json(400, { error: "Faltan usuario o contraseña" });
    if (password.length < 6) return json(400, { error: "La contraseña debe tener al menos 6 caracteres" });

    const admins = await dbFetch(env, "admins") || {};
    if (Object.values(admins).some(a => a.username === username)) {
      return json(409, { error: `Ya existe un usuario con el nombre "${username}"` });
    }
    const record = await makePasswordRecord(username, password);
    await dbFetch(env, "admins", { method: "POST", body: JSON.stringify(record) });
    return json(200, { ok: true });
  }

  if (request.method === "DELETE") {
    const id = url.pathname.slice("/admins/".length);
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return json(400, { error: "ID inválido" });
    await dbFetch(env, `admins/${id}`, { method: "DELETE" });
    return json(200, { ok: true });
  }

  return json(405, { error: "Método no permitido" });
}

// ── Archivos ─────────────────────────────────────────────────────
/** Limpia cada segmento de la ruta: sin "..", sin caracteres raros, sin tildes */
function sanitizeKey(rawPath) {
  const segments = decodeURIComponent(rawPath)
    .split("/")
    .filter(s => s.length > 0)
    .map(s =>
      s.normalize("NFKD")
       .replace(/[̀-ͯ]/g, "")
       .replace(/[^a-zA-Z0-9._-]/g, "_")
    );
  if (segments.length < 2 || segments.some(s => s === "." || s === "..")) return null;
  return segments.join("/");
}

async function handleUpload(request, env, url) {
  const key = sanitizeKey(url.pathname.slice("/upload/".length));
  if (!key) return json(400, { error: "Ruta inválida" });

  const folder = key.split("/")[0];
  const rule = RULES[folder];
  if (!rule) return json(400, { error: `Carpeta no permitida: ${folder}` });

  const type = request.headers.get("Content-Type") || "";
  if (!rule.accepts(type)) {
    return json(415, { error: `Tipo de archivo no permitido: ${type}` });
  }

  const size = Number(request.headers.get("Content-Length") || 0);
  if (!size || size > rule.maxMb * 1024 * 1024) {
    return json(413, { error: `El archivo supera el límite de ${rule.maxMb} MB` });
  }

  await env.FILES.put(key, request.body, {
    httpMetadata: {
      contentType: type,
      cacheControl: "public, max-age=31536000, immutable"
    }
  });

  return json(200, { url: `${url.origin}/files/${key}` });
}

async function handleFiles(request, env, url) {
  const key = url.pathname.slice("/files/".length);
  const object = await env.FILES.get(key);
  if (!object) return json(404, { error: "Archivo no encontrado" });

  const headers = new Headers(CORS);
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Content-Disposition", "inline");

  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}

// ── Router ───────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    try {
      // Público
      if (request.method === "POST" && pathname === "/login") {
        return await handleLogin(request, env);
      }
      if ((request.method === "GET" || request.method === "HEAD") && pathname.startsWith("/files/")) {
        return await handleFiles(request, env, url);
      }

      // Protegido: requiere token válido
      const isProtected =
        (request.method === "PUT" && pathname.startsWith("/upload/")) ||
        pathname === "/admins" || pathname.startsWith("/admins/");

      if (isProtected) {
        const user = await verifyToken(env, request);
        if (!user) return json(401, { error: "Sesión inválida o expirada. Vuelve a iniciar sesión." });

        if (pathname.startsWith("/upload/")) return await handleUpload(request, env, url);
        return await handleAdmins(request, env, url);
      }

      return json(404, { error: "Ruta no encontrada" });
    } catch (err) {
      return json(500, { error: err.message });
    }
  }
};
