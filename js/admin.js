import {
  getSchoolsRaw,
  addFaculty, deleteFaculty,
  addCareer,  deleteCareer, updateCareer,
  toPreviewUrl, uploadFile
} from "./firebase.js";

// ── Credenciales ──────────────────────────────────────────────────
const ADMIN_USER = "cris";
const ADMIN_PASS = "73820210";

// ── Estado global ─────────────────────────────────────────────────
let schools         = {};
let selectedFaculty = null;
let editingCareer   = null;

// URL actuales del formulario (de archivo subido o URL pegada)
const formUrls = { img: "", pdf: "" };

// ── Escape XSS ────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;");
}

// ── Pantallas ─────────────────────────────────────────────────────
const loginScreen = document.getElementById("loginScreen");
const dashboard   = document.getElementById("dashboard");

function showDashboard() {
  loginScreen.style.display = "none";
  dashboard.style.display   = "flex";
  loadData();
}
function showLogin() {
  dashboard.style.display   = "none";
  loginScreen.style.display = "flex";
  document.getElementById("loginForm").reset();
  document.getElementById("loginError").textContent = "";
}

// ── Login ─────────────────────────────────────────────────────────
document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const user  = document.getElementById("username").value.trim();
  const pass  = document.getElementById("password").value;
  const errEl = document.getElementById("loginError");
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    errEl.textContent = "";
    showDashboard();
  } else {
    errEl.textContent = "Usuario o contraseña incorrectos.";
    document.getElementById("password").value = "";
    document.getElementById("password").focus();
  }
});
document.getElementById("logoutBtn").addEventListener("click", showLogin);

// ── Tabs ──────────────────────────────────────────────────────────
const TAB_ON  = ["bg-white/10","text-white","border-l-4","border-amber-400","font-semibold"];
const TAB_OFF = ["text-slate-400","border-l-4","border-transparent","hover:text-white","hover:bg-white/5"];

function setActiveTab(name) {
  document.querySelectorAll("[data-tab]").forEach(btn => {
    const on = btn.dataset.tab === name;
    btn.classList.remove(...TAB_ON, ...TAB_OFF);
    btn.classList.add(...(on ? TAB_ON : TAB_OFF));
  });
  document.querySelectorAll(".tab-pane").forEach(p =>
    p.classList.toggle("hidden", p.dataset.pane !== name));
}
document.querySelectorAll("[data-tab]").forEach(b =>
  b.addEventListener("click", () => setActiveTab(b.dataset.tab)));

// ── Cargar datos ──────────────────────────────────────────────────
async function loadData() {
  try {
    schools = await getSchoolsRaw();
    renderFacultyList();
    renderFacultySelect();
    if (!selectedFaculty || !schools[selectedFaculty])
      selectedFaculty = Object.keys(schools)[0] ?? null;
    renderCareerList();
  } catch (err) {
    showToast("Error al cargar datos: " + err.message, "error");
  }
}

// ══════════════════════════════════════════════════════════════════
//  ZONA DUAL: drag & drop  ←→  URL pegada
// ══════════════════════════════════════════════════════════════════

/**
 * Configura una zona dual (arrastre + URL) para imagen o PDF.
 *
 * @param {object} cfg
 *   zone         - elemento contenedor de la zona de arrastre
 *   fileInput    - <input type="file"> oculto
 *   urlInput     - <input type="url"> para pegar URL
 *   accept       - "image/*" | ".pdf,application/pdf"
 *   maxMb        - tamaño máximo en MB
 *   storagePath  - función(file) → string, ruta en Storage
 *   stateKey     - "img" | "pdf"
 *   onReady      - callback(url) cuando hay URL lista (upload o pegada)
 *   onClear      - callback() cuando se borra el archivo
 *   previewFn    - función(url) que renderiza el preview (o null para PDF)
 */
function setupDualZone(cfg) {
  const { zone, fileInput, urlInput, accept, maxMb,
          storagePath, stateKey, onReady, onClear, previewFn } = cfg;

  const progressWrap = zone.querySelector("[data-role=progress]");
  const progressBar  = zone.querySelector("[data-role=bar]");
  const progressPct  = zone.querySelector("[data-role=pct]");
  const statusWrap   = zone.querySelector("[data-role=status]");
  const statusText   = zone.querySelector("[data-role=status-text]");
  const clearBtn     = zone.querySelector("[data-role=clear]");
  const emptyState   = zone.querySelector("[data-role=empty]");

  function showEmpty() {
    emptyState.classList.remove("hidden");
    progressWrap.classList.add("hidden");
    statusWrap.classList.add("hidden");
    zone.classList.remove("border-green-400","bg-green-50","drop-active");
    zone.classList.add("border-slate-300");
    urlInput.value = "";
    formUrls[stateKey] = "";
    onClear?.();
  }

  function showProgress(pct) {
    emptyState.classList.add("hidden");
    statusWrap.classList.add("hidden");
    progressWrap.classList.remove("hidden");
    progressBar.style.width = pct + "%";
    progressPct.textContent = pct + "%";
  }

  function showReady(url, label) {
    progressWrap.classList.add("hidden");
    emptyState.classList.add("hidden");
    statusWrap.classList.remove("hidden");
    statusText.textContent = label;
    zone.classList.remove("border-slate-300","drop-active");
    zone.classList.add("border-green-400","bg-green-50");
    urlInput.value = url;
    formUrls[stateKey] = url;
    previewFn?.(url);
    onReady?.(url);
  }

  async function handleFile(file) {
    // Validar tipo
    const isImage = stateKey === "img";
    if (isImage && !file.type.startsWith("image/")) {
      return showToast("Solo se permiten imágenes (PNG, JPG, WEBP).", "error");
    }
    if (!isImage && file.type !== "application/pdf") {
      return showToast("Solo se permiten archivos PDF.", "error");
    }
    // Validar tamaño
    if (file.size > maxMb * 1024 * 1024) {
      return showToast(`El archivo supera el límite de ${maxMb} MB.`, "error");
    }

    showProgress(0);
    const path = storagePath(file);
    try {
      const url = await uploadFile(path, file, pct => showProgress(pct));
      showReady(url, `✓ ${file.name}`);
    } catch (err) {
      showEmpty();
      showToast("Error al subir el archivo: " + err.message, "error");
    }
  }

  // Click en zona → abrir selector
  zone.addEventListener("click", e => {
    if (e.target === clearBtn || clearBtn?.contains(e.target)) return;
    if (statusWrap && !statusWrap.classList.contains("hidden")) return;
    fileInput.click();
  });

  // Selección por input
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = "";
  });

  // Drag & drop
  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.classList.add("drop-active","border-[#003865]","bg-blue-50");
    zone.classList.remove("border-slate-300","border-green-400","bg-green-50");
  });
  ["dragleave","dragend"].forEach(ev =>
    zone.addEventListener(ev, () => {
      zone.classList.remove("drop-active","border-[#003865]","bg-blue-50");
      const isDone = formUrls[stateKey] !== "";
      zone.classList.add(isDone ? "border-green-400" : "border-slate-300");
      if (isDone) zone.classList.add("bg-green-50");
    })
  );
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("drop-active","border-[#003865]","bg-blue-50");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // URL pegada manualmente
  urlInput.addEventListener("input", () => {
    const url = urlInput.value.trim();
    if (!url) { showEmpty(); return; }
    const finalUrl = stateKey === "pdf" ? toPreviewUrl(url) : url;
    showReady(finalUrl, "✓ URL establecida");
  });

  // Botón limpiar
  clearBtn?.addEventListener("click", e => { e.stopPropagation(); showEmpty(); });

  // API pública
  return { setUrl: (url) => url ? showReady(url, "✓ URL actual") : showEmpty() };
}

// ── Inicializar zonas al cargar ───────────────────────────────────
const imgZone = document.getElementById("imgDropZone");
const pdfZone = document.getElementById("pdfDropZone");

const imgZoneCtrl = setupDualZone({
  zone:        imgZone,
  fileInput:   document.getElementById("imgFileInput"),
  urlInput:    document.getElementById("imgUrlInput"),
  accept:      "image/*",
  maxMb:       5,
  stateKey:    "img",
  storagePath: f => `images/${selectedFaculty ?? "general"}/${Date.now()}-${f.name}`,
  previewFn:   url => {
    const el = document.getElementById("imgPreviewThumb");
    if (el) { el.src = url; el.classList.remove("hidden"); }
  },
  onClear: () => {
    const el = document.getElementById("imgPreviewThumb");
    if (el) { el.src = ""; el.classList.add("hidden"); }
  }
});

const pdfZoneCtrl = setupDualZone({
  zone:        pdfZone,
  fileInput:   document.getElementById("pdfFileInput"),
  urlInput:    document.getElementById("pdfUrlInput"),
  accept:      ".pdf,application/pdf",
  maxMb:       20,
  stateKey:    "pdf",
  storagePath: f => `schedules/${selectedFaculty ?? "general"}/${Date.now()}-${f.name}`,
  previewFn:   null
});

// ── FACULTADES ────────────────────────────────────────────────────
document.getElementById("addFacultyForm").addEventListener("submit", async e => {
  e.preventDefault();
  const key  = document.getElementById("facultyKey").value.trim().toUpperCase().replace(/\s+/g,"_");
  const name = document.getElementById("facultyName").value.trim();
  if (!key || !name) return;
  const btn = e.submitter;
  btn.disabled = true; btn.textContent = "Guardando...";
  try {
    await addFaculty(key, name);
    e.target.reset();
    showToast(`Facultad "${name}" creada correctamente.`);
    await loadData();
  } catch (err) { showToast(err.message, "error"); }
  finally { btn.disabled = false; btn.textContent = "Agregar Facultad"; }
});

function renderFacultyList() {
  const list = document.getElementById("facultyList");
  const keys = Object.keys(schools);
  if (!keys.length) {
    list.innerHTML = `<p class="text-slate-400 text-sm py-4">No hay facultades registradas.</p>`;
    return;
  }
  list.innerHTML = `
    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 text-left font-semibold">Código</th>
            <th class="px-4 py-3 text-left font-semibold">Nombre</th>
            <th class="px-4 py-3 text-center font-semibold">Carreras</th>
            <th class="px-4 py-3 text-center font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${keys.map(k => `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3">
                <span class="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">${esc(k)}</span>
              </td>
              <td class="px-4 py-3 text-slate-700 font-medium">${esc(schools[k].name)}</td>
              <td class="px-4 py-3 text-center text-slate-500">${(schools[k].careers||[]).length}</td>
              <td class="px-4 py-3 text-center">
                <button class="text-xs font-semibold px-3 py-1.5 rounded-lg
                               text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                        data-action="delete-faculty" data-key="${esc(k)}">
                  Eliminar
                </button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

document.getElementById("facultyList").addEventListener("click", async e => {
  const btn = e.target.closest("[data-action='delete-faculty']");
  if (!btn) return;
  const key   = btn.dataset.key;
  const count = (schools[key]?.careers||[]).length;
  if (!confirm(count > 0
    ? `¿Eliminar "${key}" y sus ${count} carrera(s)? No se puede deshacer.`
    : `¿Eliminar la facultad "${key}"?`)) return;
  try {
    await deleteFaculty(key);
    if (selectedFaculty === key) selectedFaculty = null;
    showToast(`Facultad "${key}" eliminada.`);
    await loadData();
  } catch (err) { showToast("Error: " + err.message, "error"); }
});

// ── ESCUELAS PROFESIONALES ────────────────────────────────────────
function renderFacultySelect() {
  const sel  = document.getElementById("facultySelect");
  const keys = Object.keys(schools);
  sel.innerHTML = keys.length
    ? keys.map(k => `<option value="${esc(k)}" ${k===selectedFaculty?"selected":""}>${esc(k)} – ${esc(schools[k].name)}</option>`).join("")
    : `<option value="">Sin facultades</option>`;
  if (keys.length && !selectedFaculty) selectedFaculty = keys[0];
}

document.getElementById("facultySelect").addEventListener("change", e => {
  selectedFaculty = e.target.value;
  cancelEdit();
  renderCareerList();
});

// Formulario submit
document.getElementById("careerForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!selectedFaculty) return showToast("Selecciona una facultad primero.", "error");

  const name = document.getElementById("careerName").value.trim();
  const img  = formUrls.img;
  const pdf  = formUrls.pdf;

  if (!name)  return showToast("Escribe el nombre de la escuela profesional.", "error");
  if (!img)   return showToast("Agrega una imagen (sube un archivo o pega una URL).", "error");
  if (!pdf)   return showToast("Agrega el horario PDF (sube un archivo o pega una URL).", "error");

  const btn = e.submitter;
  btn.disabled = true;
  btn.textContent = editingCareer ? "Actualizando..." : "Guardando...";

  try {
    if (editingCareer) {
      await updateCareer(editingCareer.schoolKey, editingCareer.careerId,
        { name, img, scheduleUrl: pdf });
      showToast(`"${name}" actualizado correctamente.`);
      cancelEdit();
    } else {
      await addCareer(selectedFaculty, { name, img, scheduleUrl: pdf });
      showToast(`"${name}" agregado correctamente.`);
      resetCareerForm();
    }
    await loadData();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = editingCareer ? "Actualizar" : "Agregar";
  }
});

function resetCareerForm() {
  document.getElementById("careerForm").reset();
  imgZoneCtrl.setUrl("");
  pdfZoneCtrl.setUrl("");
  formUrls.img = "";
  formUrls.pdf = "";
}

// Editar / cancelar
function startEdit(schoolKey, careerId) {
  const career = schools[schoolKey]?.careers.find(c => c._id === careerId);
  if (!career) return;
  editingCareer = { schoolKey, careerId };

  document.getElementById("careerName").value = career.name;
  imgZoneCtrl.setUrl(career.img);
  pdfZoneCtrl.setUrl(career.scheduleUrl);
  formUrls.img = career.img;
  formUrls.pdf = career.scheduleUrl;

  document.getElementById("formTitle").textContent       = "Editar Escuela Profesional";
  document.getElementById("submitCareerBtn").textContent  = "Actualizar";
  document.getElementById("cancelEditBtn").classList.remove("hidden");
  document.getElementById("careerFormSection").scrollIntoView({ behavior:"smooth", block:"start" });
}

function cancelEdit() {
  editingCareer = null;
  resetCareerForm();
  document.getElementById("formTitle").textContent       = "Nueva Escuela Profesional";
  document.getElementById("submitCareerBtn").textContent  = "Agregar";
  document.getElementById("cancelEditBtn").classList.add("hidden");
}
document.getElementById("cancelEditBtn").addEventListener("click", cancelEdit);

// Lista de carreras
function renderCareerList() {
  const list    = document.getElementById("careerList");
  const careers = schools[selectedFaculty]?.careers || [];
  if (!selectedFaculty || !careers.length) {
    list.innerHTML = `<p class="text-slate-400 text-sm py-4">No hay escuelas profesionales en esta facultad.</p>`;
    return;
  }
  list.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      ${careers.map(c => `
        <div class="rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
          <img src="${esc(c.img)}" alt="${esc(c.name)}"
               class="w-full h-36 object-cover"
               onerror="this.src='https://placehold.co/300x144/e2e8f0/94a3b8?text=Sin+imagen'">
          <div class="p-4">
            <h4 class="text-sm font-semibold text-slate-800 leading-snug mb-3 min-h-[2.5rem]">${esc(c.name)}</h4>
            <div class="flex gap-2 flex-wrap">
              <button class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#003865] text-white hover:bg-[#002548] transition-colors"
                      data-action="preview" data-url="${esc(c.scheduleUrl)}">
                Ver Horario
              </button>
              <button class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                      data-action="edit" data-school-key="${esc(selectedFaculty)}" data-career-id="${esc(c._id)}">
                Editar
              </button>
              <button class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors"
                      data-action="delete" data-school-key="${esc(selectedFaculty)}" data-career-id="${esc(c._id)}" data-career-name="${esc(c.name)}">
                Eliminar
              </button>
            </div>
          </div>
        </div>`).join("")}
    </div>`;
}

document.getElementById("careerList").addEventListener("click", async e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action } = btn.dataset;
  if (action === "preview") openPdfModal(btn.dataset.url);
  else if (action === "edit") startEdit(btn.dataset.schoolKey, btn.dataset.careerId);
  else if (action === "delete") {
    const { schoolKey, careerId, careerName } = btn.dataset;
    if (!confirm(`¿Eliminar "${careerName}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteCareer(schoolKey, careerId);
      showToast(`"${careerName}" eliminado.`);
      await loadData();
    } catch (err) { showToast("Error: " + err.message, "error"); }
  }
});

// ── Visor PDF ─────────────────────────────────────────────────────
const pdfModal = document.getElementById("pdfModal");
function openPdfModal(url) {
  document.getElementById("pdfFrame").src = url;
  pdfModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}
function closePdfModal() {
  pdfModal.style.display = "none";
  document.getElementById("pdfFrame").src = "";
  document.body.style.overflow = "";
}
document.getElementById("closePdfModal").addEventListener("click", closePdfModal);
pdfModal.addEventListener("click", e => { if (e.target === pdfModal) closePdfModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closePdfModal(); });

// ── Toast ─────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent     = msg;
  t.style.background = type === "error" ? "#dc2626" : "#16a34a";
  t.style.opacity    = "1";
  t.style.transform  = "translateY(0)";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.style.opacity   = "0";
    t.style.transform = "translateY(10px)";
  }, 3500);
}
