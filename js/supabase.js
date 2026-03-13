import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://kofrjygksvxckainxino.supabase.co";
const SUPABASE_KEY = "sb_publishable_iYsE2orCY6sCG0p5I17Eig_zaQwEwW9";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─────────────────────────────────────────────────────────────────
// Datos por defecto (seed automático si las tablas están vacías)
// ─────────────────────────────────────────────────────────────────
const defaultSchools = {
  FIA: {
    name: "Facultad de Ingeniería y Arquitectura",
    careers: [
      { name: "Ingeniería de Industrias Alimentarias", img: "https://blog.upeu.edu.pe/wp-content/uploads/2022/08/fruit-juice-bottle-and-healthy-water-production-pr-2021-10-19-04-09-25-utc-2048x1363-1024x682.jpg", scheduleUrl: "https://drive.google.com/file/d/1WYsYf70ozCNBBUIQwvN1eMeEfiPUtWgs/preview" },
      { name: "Ingeniería Ambiental",                  img: "https://www.esneca.com/wp-content/uploads/ingenieria-ambiental-que-es.jpg",                                                                    scheduleUrl: "https://drive.google.com/file/d/18me87S621E1WtdZQJPoHS6VkG2pjQHfJ/preview" },
      { name: "Arquitectura y Urbanismo",               img: "https://cm-psi.com/wp-content/uploads/2023/09/Serv-Arq-y-Urbanismo02.jpg",                                                                    scheduleUrl: "https://drive.google.com/file/d/1vT1KeuczbKed16hhr_0CnqQAcRcpX3GB/preview" },
      { name: "Arquitectura",                           img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/AmesBuildingBoston.jpg/800px-AmesBuildingBoston.jpg",                               scheduleUrl: "https://drive.google.com/file/d/1jlOoIiU8uIEsC7hYJ9rV3dULnUMV-1tf/preview" },
      { name: "Ingeniería Civil",                       img: "https://d5tnfl9agh5vb.cloudfront.net/uploads/2016/03/habilidades-de-un-ingeniero-civil-570x363.jpg",                                          scheduleUrl: "https://drive.google.com/file/d/1yqwRph7QmkRKj8bysBYT7H7t_7Em2zQ2/preview" },
      { name: "Ingeniería de Sistemas",                 img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80",                                                                     scheduleUrl: "https://drive.google.com/file/d/1nBpAb6_ySnQxMeO-iT5aexRNRexkyv2l/preview" }
    ]
  },
  FCS: {
    name: "Facultad de Ciencias de la Salud",
    careers: [
      { name: "Enfermería", img: "https://upeu.edu.pe/facultad-de-salud/wp-content/uploads/sites/6/2024/05/enfer-e1726161841770.jpg",    scheduleUrl: "https://drive.google.com/file/d/1D-nYVjs6nnpc1fLq8Q4V3coTTeUlDnLA/preview" },
      { name: "Nutrición",  img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80",                              scheduleUrl: "https://drive.google.com/file/d/1CL01AnyrzJA9pISjP4KBZBU7cap3fKqi/preview" },
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
      { name: "Educación Física",                           img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80",                                                                 scheduleUrl: "https://drive.google.com/file/d/1mOtpLtJgwaWdOvN5LCJWSTL46Da0zMCV/preview" },
      { name: "Educación Inglés y Español",                 img: "https://pedagogicochimbote.edu.pe/wp-content/uploads/2023/01/PORTADAS-PROGRAMAS-04.jpg",             scheduleUrl: "https://drive.google.com/file/d/1gLs3LQJ8gqxG040ANaUyG2yOSxfT7Umb/preview" },
      { name: "Educación Inicial y Puericultura",           img: "https://blog.upeu.edu.pe/wp-content/uploads/2025/04/teacher-performs-exercises-to-the-children-2024-11-25-15-03-00-utc-2048x1365.jpg", scheduleUrl: "https://drive.google.com/file/d/1jWh5mGeS2WoR6cFYARr9KQEyIoKaYTxN/preview" },
      { name: "Educación Lingüística e Inglés",             img: "https://upeu.edu.pe/facultad-de-educacion/wp-content/uploads/sites/4/2024/09/INGLE-MAN-e1725403847871.jpg",                             scheduleUrl: "https://drive.google.com/file/d/1h1hv-YWoz25aD6hmPhkF1_yWI_jM_Wtv/preview" },
      { name: "Educación Primaria y Pedagogía Terapéutica", img: "https://upeu.edu.pe/facultad-de-educacion/wp-content/uploads/sites/4/2024/09/primaria-w.jpg",        scheduleUrl: "https://drive.google.com/file/d/1YhBUzF5dk3DetkpJk37Za5HDwTY95Mwx/preview" },
      { name: "Educación Primaria",                         img: "https://www.tuproyectodevida.pe/wp-content/uploads/2022/11/que-es-educacion-primaria-1200x628.jpg",   scheduleUrl: "https://drive.google.com/file/d/1-vgdnfoxvUwbUs6r4ser_vnUHdx8frTg/preview" }
    ]
  }
};

// ─────────────────────────────────────────────────────────────────
// Helper: filas Supabase → formato { FIA: { name, careers[] } }
// ─────────────────────────────────────────────────────────────────
function rowsToSchools(faculties, careers) {
  const result = {};
  for (const f of faculties) {
    result[f.id] = {
      name: f.name,
      careers: (careers || [])
        .filter(c => c.faculty_id === f.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(c => ({
          _id:         c.id,
          name:        c.name,
          img:         c.img,
          scheduleUrl: c.schedule_url
        }))
    };
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────
// Seed automático
// ─────────────────────────────────────────────────────────────────
async function seedDefaults() {
  for (const [key, school] of Object.entries(defaultSchools)) {
    const { error: fe } = await supabase
      .from("faculties")
      .upsert({ id: key, name: school.name }, { onConflict: "id" });
    if (fe) throw new Error("Seed faculties: " + fe.message);

    for (const c of school.careers) {
      const { error: ce } = await supabase
        .from("careers")
        .insert({ faculty_id: key, name: c.name, img: c.img, schedule_url: c.scheduleUrl });
      if (ce) throw new Error("Seed careers: " + ce.message);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// READ — sitio público + admin
// ─────────────────────────────────────────────────────────────────
async function fetchAll() {
  const [{ data: faculties, error: fe }, { data: careers, error: ce }] = await Promise.all([
    supabase.from("faculties").select("*").order("id"),
    supabase.from("careers").select("*").order("created_at")
  ]);
  if (fe) throw new Error(fe.message);
  if (ce) throw new Error(ce.message);
  return { faculties: faculties ?? [], careers: careers ?? [] };
}

const CACHE_KEY = "upeu_schools_cache";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

export async function getSchools() {
  // 1. Intentar leer desde caché local
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data; // caché vigente
    }
  } catch { /* localStorage no disponible */ }

  // 2. Consultar Supabase
  let { faculties, careers } = await fetchAll();
  if (!faculties.length) {
    await seedDefaults();
    ({ faculties, careers } = await fetchAll());
  }
  const schools = rowsToSchools(faculties, careers);

  // 3. Guardar en caché
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: schools, ts: Date.now() }));
  } catch { /* cuota excedida, ignorar */ }

  return schools;
}

// Admin: siempre consulta Supabase fresco (sin caché)
export async function getSchoolsRaw() {
  const { faculties, careers } = await fetchAll();
  return rowsToSchools(faculties, careers);
}

// Invalida el caché del sitio público (llamar después de cada escritura)
function invalidateCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* noop */ }
}

// ─────────────────────────────────────────────────────────────────
// FACULTADES
// ─────────────────────────────────────────────────────────────────
export async function addFaculty(key, name) {
  const { data: existing } = await supabase
    .from("faculties").select("id").eq("id", key).maybeSingle();
  if (existing) throw new Error(`Ya existe una facultad con el código "${key}"`);

  const { error } = await supabase.from("faculties").insert({ id: key, name });
  if (error) throw new Error(error.message);
  invalidateCache();
}

export async function deleteFaculty(key) {
  const { error } = await supabase.from("faculties").delete().eq("id", key);
  if (error) throw new Error(error.message);
  invalidateCache();
}

// ─────────────────────────────────────────────────────────────────
// CARRERAS
// ─────────────────────────────────────────────────────────────────
export async function addCareer(facultyId, { name, img, scheduleUrl }) {
  const { error } = await supabase.from("careers").insert({
    faculty_id:   facultyId,
    name,
    img,
    schedule_url: scheduleUrl
  });
  if (error) throw new Error(error.message);
  invalidateCache();
}

export async function deleteCareer(_facultyId, careerId) {
  const { error } = await supabase.from("careers").delete().eq("id", careerId);
  if (error) throw new Error(error.message);
  invalidateCache();
}

export async function updateCareer(_facultyId, careerId, { name, img, scheduleUrl }) {
  const { error } = await supabase.from("careers")
    .update({ name, img, schedule_url: scheduleUrl })
    .eq("id", careerId);
  if (error) throw new Error(error.message);
  invalidateCache();
}

// ─────────────────────────────────────────────────────────────────
// STORAGE — subir archivo con progreso real (XHR)
// path format: "images/FACULTY/filename"  →  bucket = "images"
//              "schedules/FACULTY/filename" → bucket = "schedules"
// ─────────────────────────────────────────────────────────────────
export function uploadFile(fullPath, file, onProgress) {
  return new Promise((resolve, reject) => {
    const slash  = fullPath.indexOf("/");
    const bucket = fullPath.substring(0, slash);
    const path   = fullPath.substring(slash + 1);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURIComponent(path).replace(/%2F/g, "/")}`);
    xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_KEY}`);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable) onProgress?.(Math.round(e.loaded / e.total * 100));
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // URL pública del archivo (el bucket debe ser público en Supabase)
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
        resolve(publicUrl);
      } else {
        let msg = `Error ${xhr.status}`;
        try { msg = JSON.parse(xhr.responseText)?.error ?? msg; } catch { /* noop */ }
        reject(new Error(msg));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Error de red al subir el archivo.")));
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
