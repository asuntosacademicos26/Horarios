import { initializeApp }                            from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set, push, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCkO6b1UJGw7Of1_l22IiIfwn8LzuYje-w",
  authDomain:        "horario-b4ff3.firebaseapp.com",
  databaseURL:       "https://horario-b4ff3-default-rtdb.firebaseio.com",
  projectId:         "horario-b4ff3",
  storageBucket:     "horario-b4ff3.firebasestorage.app",
  messagingSenderId: "826520337197",
  appId:             "1:826520337197:web:429d7c2165fc368f57b1a4"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// Worker de Cloudflare que sube y sirve imágenes/PDFs desde R2
const UPLOAD_WORKER_URL = "https://horarios-files.horarios-upeu.workers.dev";

// ── Datos por defecto (seed si la BD está vacía) ─────────────────
const defaultSchools = {
  FIA: {
    name: "Facultad de Ingeniería y Arquitectura",
    careers: [
      { name: "Ingeniería de Industrias Alimentarias", img: "https://blog.upeu.edu.pe/wp-content/uploads/2022/08/fruit-juice-bottle-and-healthy-water-production-pr-2021-10-19-04-09-25-utc-2048x1363-1024x682.jpg", scheduleUrl: "https://drive.google.com/file/d/1WYsYf70ozCNBBUIQwvN1eMeEfiPUtWgs/preview" },
      { name: "Ingeniería Ambiental",                  img: "https://www.esneca.com/wp-content/uploads/ingenieria-ambiental-que-es.jpg",                                                                    scheduleUrl: "https://drive.google.com/file/d/18me87S621E1WtdZQJPoHS6VkG2pjQHfJ/preview" },
      { name: "Arquitectura y Urbanismo",               img: "https://cm-psi.com/wp-content/uploads/2023/09/Serv-Arq-y-Urbanismo02.jpg",                                                                    scheduleUrl: "https://drive.google.com/file/d/1vT1KeuczbKed16hhr_0CnqQAcRcpX3GB/preview" },
      { name: "Arquitectura",                           img: "https://media.licdn.com/dms/image/v2/D4E12AQEIqJtftwjxjg/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1696032510104?e=2147483647&v=beta&t=WSdzBwEpNbldtvIW4Ev9W243bK91rEb98KH2B_oGORo", scheduleUrl: "https://drive.google.com/file/d/1jlOoIiU8uIEsC7hYJ9rV3dULnUMV-1tf/preview" },
      { name: "Ingeniería Civil",                       img: "https://d5tnfl9agh5vb.cloudfront.net/uploads/2016/03/habilidades-de-un-ingeniero-civil-570x363.jpg",                                          scheduleUrl: "https://drive.google.com/file/d/1yqwRph7QmkRKj8bysBYT7H7t_7Em2zQ2/preview" },
      { name: "Ingeniería de Sistemas",                 img: "https://cba.ucb.edu.bo/blog/wp-content/uploads/2021/04/desarrollo-programadores-desarrollo-tecnologias-diseno-codificacion-sitios-web_18497-1019.jpg", scheduleUrl: "https://drive.google.com/file/d/1nBpAb6_ySnQxMeO-iT5aexRNRexkyv2l/preview" }
    ]
  },
  FCS: {
    name: "Facultad de Ciencias de la Salud",
    careers: [
      { name: "Enfermería", img: "https://upeu.edu.pe/facultad-de-salud/wp-content/uploads/sites/6/2024/05/enfer-e1726161841770.jpg",    scheduleUrl: "https://drive.google.com/file/d/1D-nYVjs6nnpc1fLq8Q4V3coTTeUlDnLA/preview" },
      { name: "Nutrición",  img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80", scheduleUrl: "https://drive.google.com/file/d/1CL01AnyrzJA9pISjP4KBZBU7cap3fKqi/preview" },
      { name: "Psicología", img: "https://upeu.edu.pe/facultad-de-salud/wp-content/uploads/sites/6/2023/08/enfermera-2023-1.jpg",        scheduleUrl: "https://drive.google.com/file/d/1bpPtfRQzd3FKqYrdTnO88BUMr3SIN0cF/preview" }
    ]
  },
  FCE: {
    name: "Facultad de Ciencias Empresariales",
    careers: [
      { name: "Administración y Negocios Internacionales",   img: "https://upeu.edu.pe/facultad-de-empresariales/wp-content/uploads/sites/2/2024/09/w-Marketing.jpg", scheduleUrl: "https://drive.google.com/file/d/12pqIEebyZloMnola2SPhptKntxMn_xYi/preview" },
      { name: "Administración",                              img: "https://adistancia.upeu.edu.pe/wp-content/uploads/2024/09/w-admin.jpg",                             scheduleUrl: "https://drive.google.com/file/d/1w022V4F0mW5ACf8KaElOEIXlij3Sv-xU/preview" },
      { name: "Contabilidad, Gestión Tributaria y Aduanera", img: "https://upeu.edu.pe/facultad-de-empresariales/wp-content/uploads/sites/2/2024/09/man-conta.jpg",   scheduleUrl: "https://drive.google.com/file/d/10PB4iEKj58PSm5B-Hd0dZt6uxJcCY6Q4/preview" },
      { name: "Contabilidad y Gestión Tributaria",           img: "https://adistancia.upeu.edu.pe/wp-content/uploads/2024/09/WOMAN-.jpg",                             scheduleUrl: "https://drive.google.com/file/d/1l7v2WvnVbd0jKQ0qBcirETrhWhwRvEYB/preview" }
    ]
  },
  FACIHED: {
    name: "Facultad de Ciencias Humanas y Educación",
    careers: [
      { name: "Educación Física",                           img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80", scheduleUrl: "https://drive.google.com/file/d/1mOtpLtJgwaWdOvN5LCJWSTL46Da0zMCV/preview" },
      { name: "Educación Inglés y Español",                 img: "https://pedagogicochimbote.edu.pe/wp-content/uploads/2023/01/PORTADAS-PROGRAMAS-04.jpg",             scheduleUrl: "https://drive.google.com/file/d/1gLs3LQJ8gqxG040ANaUyG2yOSxfT7Umb/preview" },
      { name: "Educación Inicial y Puericultura",           img: "https://blog.upeu.edu.pe/wp-content/uploads/2025/04/teacher-performs-exercises-to-the-children-2024-11-25-15-03-00-utc-2048x1365.jpg", scheduleUrl: "https://drive.google.com/file/d/1jWh5mGeS2WoR6cFYARr9KQEyIoKaYTxN/preview" },
      { name: "Educación Lingüística e Inglés",             img: "https://upeu.edu.pe/facultad-de-educacion/wp-content/uploads/sites/4/2024/09/INGLE-MAN-e1725403847871.jpg", scheduleUrl: "https://drive.google.com/file/d/1h1hv-YWoz25aD6hmPhkF1_yWI_jM_Wtv/preview" },
      { name: "Educación Primaria y Pedagogìa Terapeùtica", img: "https://upeu.edu.pe/facultad-de-educacion/wp-content/uploads/sites/4/2024/09/primaria-w.jpg",        scheduleUrl: "https://drive.google.com/file/d/1YhBUzF5dk3DetkpJk37Za5HDwTY95Mwx/preview" },
      { name: "Educación Primaria",                         img: "https://www.tuproyectodevida.pe/wp-content/uploads/2022/11/que-es-educacion-primaria-1200x628.jpg",   scheduleUrl: "https://drive.google.com/file/d/1-vgdnfoxvUwbUs6r4ser_vnUHdx8frTg/preview" }
    ]
  }
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Convierte objeto de Firebase (puede ser array numérico o push-keys) a array con _id */
function normalizeCareers(raw) {
  if (!raw) return [];
  return Object.entries(raw).map(([id, data]) => ({ _id: id, ...data }));
}

// ─────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────

/**
 * Retorna escuelas normalizadas para el sitio público.
 * Si la BD está vacía sube los datos por defecto.
 */
export async function getSchools() {
  const snapshot = await get(ref(db, "schools"));

  if (snapshot.exists()) {
    const raw = snapshot.val();
    Object.keys(raw).forEach(key => {
      raw[key].careers = normalizeCareers(raw[key].careers);
    });
    return raw;
  }

  await set(ref(db, "schools"), defaultSchools);
  const seeded = JSON.parse(JSON.stringify(defaultSchools));
  Object.keys(seeded).forEach(k => {
    seeded[k].careers = seeded[k].careers.map((c, i) => ({ _id: String(i), ...c }));
  });
  return seeded;
}

/**
 * Retorna escuelas en formato raw (con _id por carrera) para el admin.
 */
export async function getSchoolsRaw() {
  const snapshot = await get(ref(db, "schools"));
  if (!snapshot.exists()) return {};
  const raw = snapshot.val();
  Object.keys(raw).forEach(key => {
    raw[key].careers = normalizeCareers(raw[key].careers);
  });
  return raw;
}

// ─────────────────────────────────────────────────────────────────
// FACULTADES
// ─────────────────────────────────────────────────────────────────

export async function addFaculty(key, name) {
  const existing = await get(ref(db, `schools/${key}`));
  if (existing.exists()) throw new Error(`Ya existe una facultad con el código "${key}"`);
  await set(ref(db, `schools/${key}`), { name, careers: {} });
}

export async function deleteFaculty(key) {
  await remove(ref(db, `schools/${key}`));
}

// ─────────────────────────────────────────────────────────────────
// ESCUELAS PROFESIONALES (carreras)
// ─────────────────────────────────────────────────────────────────

export async function addCareer(schoolKey, careerData) {
  const newRef = push(ref(db, `schools/${schoolKey}/careers`));
  await set(newRef, careerData);
  return newRef.key;
}

export async function deleteCareer(schoolKey, careerId) {
  await remove(ref(db, `schools/${schoolKey}/careers/${careerId}`));
}

export async function updateCareer(schoolKey, careerId, data) {
  await set(ref(db, `schools/${schoolKey}/careers/${careerId}`), data);
}

export async function updateFaculty(key, name) {
  await set(ref(db, `schools/${key}/name`), name);
}

// ─────────────────────────────────────────────────────────────────
// USUARIOS ADMIN — vía Worker (las contraseñas nunca se leen aquí)
// ─────────────────────────────────────────────────────────────────

const TOKEN_KEY = "horarios_token";

function authHeaders() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function workerRequest(path, options = {}) {
  const res = await fetch(`${UPLOAD_WORKER_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options.headers }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export async function getAdmins() {
  return workerRequest("/admins");
}

export async function addAdmin(username, password) {
  await workerRequest("/admins", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function deleteAdmin(id) {
  await workerRequest(`/admins/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function checkAdminCredentials(username, password) {
  const res = await fetch(`${UPLOAD_WORKER_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (res.status === 401) return false;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
  const { token } = await res.json();
  sessionStorage.setItem(TOKEN_KEY, token);
  return true;
}

// ─────────────────────────────────────────────────────────────────
// STORAGE — subir archivo (Cloudflare R2 vía Worker)
// ─────────────────────────────────────────────────────────────────

/**
 * Sube un archivo a Cloudflare R2 a través del Worker.
 * @param {string}   path       Ruta destino (ej: "images/FIA/foto.jpg")
 * @param {File}     file       Objeto File del input / drop
 * @param {function} onProgress Callback con porcentaje 0-100
 * @returns {Promise<string>}   URL pública del archivo
 */
export function uploadFile(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `${UPLOAD_WORKER_URL}/upload/${encodedPath}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress?.(Math.round(e.loaded / e.total * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).url);
        } catch {
          reject(new Error("Respuesta inválida del servidor"));
        }
      } else {
        let msg = `Error ${xhr.status}`;
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Error de red al subir el archivo"));
    xhr.send(file);
  });
}

// ─────────────────────────────────────────────────────────────────
// Utilidad: convierte link de Drive a URL de preview
// ─────────────────────────────────────────────────────────────────
export function toPreviewUrl(url) {
  return url
    .replace(/\/view(\?.*)?$/, "/preview")
    .replace(/\/edit(\?.*)?$/, "/preview");
}
