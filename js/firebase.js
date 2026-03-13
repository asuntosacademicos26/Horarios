import { initializeApp }                              from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
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
      { name: "Nutrición",  img: "https://scontent.flim10-1.fna.fbcdn.net/v/t39.30808-6/482123448_1047301527431571_9171378740564011403_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_ohc=ui6GEJmhHskQ7kNvwGChcIO&_nc_oc=Adn7258nGv5Kjic75wHdrHOzR4kVpr1ctpBLQvQkqmbawKVgya3Dt5b0UrJcphrmZOU&_nc_zt=23&_nc_ht=scontent.flim10-1.fna&_nc_gid=dk-z7yOLjrPWTvGkLVnRvA&oh=00_AfZD8HrJL42mitdo0M4zSKx3J2lAlf-oKk1_xJ5ltJhOxw&oe=68E4C35D", scheduleUrl: "https://drive.google.com/file/d/1CL01AnyrzJA9pISjP4KBZBU7cap3fKqi/preview" },
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
      { name: "Educación Física",                           img: "https://scontent.flim10-1.fna.fbcdn.net/v/t1.6435-9/74495177_960545844323567_527685359933325312_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=0b6b33&_nc_ohc=NhNs1OHWn3QQ7kNvwGYkbdg&_nc_oc=AdkSCO1NcFYHhupg67DwwlyGQvPVckqeN_8CU010efpz45VrMekVUaV0Zb4j9efUvDM&_nc_zt=23&_nc_ht=scontent.flim10-1.fna&_nc_gid=N7aUN7OMLRDkFCj9aYKwiA&oh=00_AffzIBUO91QzBHYeXBAwEF755zZeOfcs_8ZOY09wqE3ahw&oe=69065B55", scheduleUrl: "https://drive.google.com/file/d/1mOtpLtJgwaWdOvN5LCJWSTL46Da0zMCV/preview" },
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

// ─────────────────────────────────────────────────────────────────
// Utilidad: convierte link de Drive a URL de preview
// ─────────────────────────────────────────────────────────────────
export function toPreviewUrl(url) {
  return url
    .replace(/\/view(\?.*)?$/, "/preview")
    .replace(/\/edit(\?.*)?$/, "/preview");
}
