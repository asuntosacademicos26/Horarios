import { getSchools } from "./firebase.js";

let schools      = {};
let activeSchool = "";

// ── Mostrar/ocultar spinner ──────────────────────────────────────
function setLoading(on) {
  document.getElementById("loadingSpinner").style.display = on ? "flex" : "none";
  document.getElementById("appContent").style.display     = on ? "none" : "block";
}

// ── Navegación por facultad ──────────────────────────────────────
function renderNav() {
  const nav = document.getElementById("schoolNav");
  nav.innerHTML = "";
  Object.keys(schools).forEach(key => {
    const btn = document.createElement("button");
    btn.textContent = key;
    btn.className   = key === activeSchool ? "active" : "";
    btn.onclick     = () => { activeSchool = key; renderNav(); renderContent(); };
    nav.appendChild(btn);
  });
}

// ── Contenido de carreras ────────────────────────────────────────
function renderContent() {
  const school  = schools[activeSchool];
  const content = document.getElementById("schoolContent");

  content.innerHTML = `
    <h2 style="text-align:center; margin-bottom:20px;">${school.name}</h2>
    <div class="careers">
      ${school.careers.map(c => `
        <div class="card">
          <h3>${c.name}</h3>
          <img src="${c.img}" alt="${c.name}">
          <button onclick="openModal('${c.name.replace(/'/g, "\\'")}', '${c.scheduleUrl}')">Ver Horario</button>
        </div>
      `).join("")}
    </div>

    <div style="margin-top:40px; text-align:center;">
      <h3 style="color:#003865;">Conoce más de la Facultad</h3>
      <div style="max-width:900px; margin:20px auto;">
        <iframe width="100%" height="500"
          src="https://www.youtube.com/embed/MVK4sv5hyjs"
          title="Video de YouTube" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    </div>
  `;
}

// ── Modal PDF ────────────────────────────────────────────────────
window.openModal = function(title, url) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("pdfFrame").src           = url;
  document.getElementById("pdfModal").style.display = "block";
};

document.getElementById("closeModal").onclick = () => {
  document.getElementById("pdfModal").style.display = "none";
  document.getElementById("pdfFrame").src = "";
};

window.onclick = event => {
  const modal = document.getElementById("pdfModal");
  if (event.target === modal) {
    modal.style.display = "none";
    document.getElementById("pdfFrame").src = "";
  }
};

// ── Arranque: cargar datos desde Firebase ────────────────────────
(async () => {
  setLoading(true);
  try {
    schools      = await getSchools();
    activeSchool = Object.keys(schools)[0];
    renderNav();
    renderContent();
  } catch (err) {
    console.error("Error cargando datos:", err);
    document.getElementById("loadingSpinner").innerHTML =
      `<p style="color:#dc2626;">Error al conectar con Firebase.<br>Verifica tu conexión e intenta de nuevo.</p>`;
  } finally {
    setLoading(false);
  }
})();
