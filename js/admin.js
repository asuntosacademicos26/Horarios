import {
  getSchoolsRaw,
  addFaculty, deleteFaculty,
  addCareer,  deleteCareer, updateCareer,
  toPreviewUrl
} from "./firebase.js";

// ── Credenciales ─────────────────────────────────────────────────
const ADMIN_USER = "cris";
const ADMIN_PASS = "73820210";

// ── Estado ───────────────────────────────────────────────────────
let schools       = {};
let selectedFaculty = null;
let editingCareer   = null; // { schoolKey, careerId } cuando editamos

// ── Pantallas ────────────────────────────────────────────────────
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
}

// ── Login ────────────────────────────────────────────────────────
document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    showDashboard();
  } else {
    document.getElementById("loginError").textContent = "Usuario o contraseña incorrectos.";
  }
});

document.getElementById("logoutBtn").addEventListener("click", showLogin);

// ── Tabs ─────────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ── Cargar datos ─────────────────────────────────────────────────
async function loadData() {
  try {
    schools = await getSchoolsRaw();
    renderFacultyList();
    renderFacultySelect();
    if (selectedFaculty && schools[selectedFaculty]) {
      renderCareerList();
    } else {
      selectedFaculty = Object.keys(schools)[0] || null;
      renderCareerList();
    }
  } catch (err) {
    showToast("Error al cargar datos: " + err.message, "error");
  }
}

// ── FACULTADES ────────────────────────────────────────────────────

document.getElementById("addFacultyForm").addEventListener("submit", async e => {
  e.preventDefault();
  const key  = document.getElementById("facultyKey").value.trim().toUpperCase().replace(/\s+/g, "_");
  const name = document.getElementById("facultyName").value.trim();
  if (!key || !name) return;

  const btn = e.submitter;
  btn.disabled = true;
  btn.textContent = "Guardando...";
  try {
    await addFaculty(key, name);
    document.getElementById("facultyKey").value  = "";
    document.getElementById("facultyName").value = "";
    showToast(`Facultad "${name}" creada correctamente.`);
    await loadData();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Agregar Facultad";
  }
});

function renderFacultyList() {
  const list = document.getElementById("facultyList");
  const keys = Object.keys(schools);

  if (!keys.length) {
    list.innerHTML = `<p class="empty-msg">No hay facultades registradas.</p>`;
    return;
  }

  list.innerHTML = `
    <table>
      <thead><tr><th>Código</th><th>Nombre</th><th>Carreras</th><th>Acciones</th></tr></thead>
      <tbody>
        ${keys.map(k => `
          <tr>
            <td><span class="badge">${k}</span></td>
            <td>${schools[k].name}</td>
            <td>${(schools[k].careers || []).length}</td>
            <td>
              <button class="btn-danger btn-sm" onclick="confirmDeleteFaculty('${k}')">
                Eliminar
              </button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>`;
}

window.confirmDeleteFaculty = async function(key) {
  const count = (schools[key]?.careers || []).length;
  const msg   = count > 0
    ? `¿Eliminar la facultad "${key}" y sus ${count} carrera(s)? Esta acción no se puede deshacer.`
    : `¿Eliminar la facultad "${key}"?`;
  if (!confirm(msg)) return;
  try {
    await deleteFaculty(key);
    if (selectedFaculty === key) selectedFaculty = null;
    showToast(`Facultad "${key}" eliminada.`);
    await loadData();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
};

// ── ESCUELAS PROFESIONALES ────────────────────────────────────────

function renderFacultySelect() {
  const sel  = document.getElementById("facultySelect");
  const keys = Object.keys(schools);
  sel.innerHTML = keys.length
    ? keys.map(k => `<option value="${k}" ${k === selectedFaculty ? "selected" : ""}>${k} – ${schools[k].name}</option>`).join("")
    : `<option value="">Sin facultades</option>`;
  if (keys.length && !selectedFaculty) selectedFaculty = keys[0];
}

document.getElementById("facultySelect").addEventListener("change", e => {
  selectedFaculty = e.target.value;
  cancelEdit();
  renderCareerList();
});

// Formulario agregar / editar carrera
document.getElementById("careerForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!selectedFaculty) return showToast("Selecciona una facultad primero.", "error");

  const name        = document.getElementById("careerName").value.trim();
  const img         = document.getElementById("careerImg").value.trim();
  const rawSchedule = document.getElementById("careerSchedule").value.trim();
  const scheduleUrl = rawSchedule ? toPreviewUrl(rawSchedule) : "";

  if (!name || !img || !scheduleUrl) return showToast("Completa todos los campos.", "error");

  const btn = e.submitter;
  btn.disabled = true;
  btn.textContent = editingCareer ? "Actualizando..." : "Agregar";

  try {
    if (editingCareer) {
      await updateCareer(selectedFaculty, editingCareer.careerId, { name, img, scheduleUrl });
      showToast(`"${name}" actualizado.`);
      cancelEdit();
    } else {
      await addCareer(selectedFaculty, { name, img, scheduleUrl });
      showToast(`"${name}" agregado correctamente.`);
      document.getElementById("careerForm").reset();
      document.getElementById("imgPreview").src = "";
      document.getElementById("imgPreviewBox").style.display = "none";
    }
    await loadData();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = editingCareer ? "Actualizar" : "Agregar";
  }
});

// Preview de imagen en tiempo real
document.getElementById("careerImg").addEventListener("input", e => {
  const url = e.target.value.trim();
  const box = document.getElementById("imgPreviewBox");
  const img = document.getElementById("imgPreview");
  if (url) { img.src = url; box.style.display = "block"; }
  else     { img.src = ""; box.style.display = "none";  }
});

function renderCareerList() {
  const list    = document.getElementById("careerList");
  const careers = schools[selectedFaculty]?.careers || [];

  if (!selectedFaculty) { list.innerHTML = ""; return; }

  if (!careers.length) {
    list.innerHTML = `<p class="empty-msg">No hay escuelas profesionales en esta facultad.</p>`;
    return;
  }

  list.innerHTML = `
    <div class="career-grid">
      ${careers.map(c => `
        <div class="career-card">
          <img src="${c.img}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/300x160?text=Sin+imagen'">
          <div class="career-card-body">
            <h4>${c.name}</h4>
            <div class="career-actions">
              <button class="btn-outline btn-sm" onclick="previewSchedule('${c.scheduleUrl}')">Ver Horario</button>
              <button class="btn-secondary btn-sm" onclick="startEdit('${selectedFaculty}','${c._id}')">Editar</button>
              <button class="btn-danger btn-sm"    onclick="confirmDeleteCareer('${selectedFaculty}','${c._id}','${c.name.replace(/'/g,"\\'").replace(/"/g,"&quot;")}')">Eliminar</button>
            </div>
          </div>
        </div>
      `).join("")}
    </div>`;
}

window.startEdit = function(schoolKey, careerId) {
  const career = schools[schoolKey].careers.find(c => c._id === careerId);
  if (!career) return;
  editingCareer = { schoolKey, careerId };
  document.getElementById("careerName").value     = career.name;
  document.getElementById("careerImg").value      = career.img;
  document.getElementById("careerSchedule").value = career.scheduleUrl;
  document.getElementById("imgPreview").src        = career.img;
  document.getElementById("imgPreviewBox").style.display = "block";
  document.getElementById("formTitle").textContent  = "Editar Escuela Profesional";
  document.getElementById("submitCareerBtn").textContent = "Actualizar";
  document.getElementById("cancelEditBtn").style.display = "inline-flex";
  document.getElementById("careerFormSection").scrollIntoView({ behavior: "smooth" });
};

window.cancelEdit = function() {
  editingCareer = null;
  document.getElementById("careerForm").reset();
  document.getElementById("imgPreview").src        = "";
  document.getElementById("imgPreviewBox").style.display = "none";
  document.getElementById("formTitle").textContent  = "Nueva Escuela Profesional";
  document.getElementById("submitCareerBtn").textContent = "Agregar";
  document.getElementById("cancelEditBtn").style.display = "none";
};

window.confirmDeleteCareer = async function(schoolKey, careerId, name) {
  if (!confirm(`¿Eliminar la carrera "${name}"? Esta acción no se puede deshacer.`)) return;
  try {
    await deleteCareer(schoolKey, careerId);
    showToast(`"${name}" eliminado.`);
    await loadData();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
};

// ── Visor de horario ──────────────────────────────────────────────
window.previewSchedule = function(url) {
  document.getElementById("pdfFrame").src           = url;
  document.getElementById("pdfModal").style.display = "flex";
};

document.getElementById("closePdfModal").addEventListener("click", () => {
  document.getElementById("pdfModal").style.display = "none";
  document.getElementById("pdfFrame").src = "";
});

document.getElementById("pdfModal").addEventListener("click", e => {
  if (e.target === document.getElementById("pdfModal")) {
    document.getElementById("pdfModal").style.display = "none";
    document.getElementById("pdfFrame").src = "";
  }
});

// ── Toast ─────────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent  = msg;
  t.className    = "toast show " + type;
  setTimeout(() => t.classList.remove("show"), 3500);
}
