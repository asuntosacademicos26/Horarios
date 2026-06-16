import { getSchools } from "./firebase.js";

let schools      = {};
let activeSchool = "";

// ── Escape para prevenir XSS en template strings ──────────────────
function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

// ── Loading ───────────────────────────────────────────────────────
function setLoading(on) {
  document.getElementById("loadingSpinner").style.display = on ? "flex"  : "none";
  document.getElementById("appContent").style.display     = on ? "none"  : "block";
}

// ── Nav de facultades ─────────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById("schoolNav");
  nav.innerHTML = "";
  Object.keys(schools).forEach(key => {
    const btn = document.createElement("button");
    btn.textContent = key;
    btn.title       = schools[key].name;
    btn.className   = "school-pill" + (key === activeSchool ? " is-active" : "");
    btn.addEventListener("click", () => { activeSchool = key; renderNav(); renderContent(); });
    nav.appendChild(btn);
  });
}

// ── Tarjetas de carreras ──────────────────────────────────────────
function renderContent() {
  const school  = schools[activeSchool];
  const content = document.getElementById("schoolContent");

  const cards = school.careers.map((c, i) => `
    <article class="ver-horario career-card" style="--i:${i}" tabindex="0"
         data-name="${esc(c.name)}" data-url="${esc(c.scheduleUrl)}">

      <img class="career-card__img" src="${esc(c.img)}" alt="${esc(c.name)}"
           style="object-position:${esc(c.imgPosition||'50% 50%')}"
           onerror="this.src='https://placehold.co/520x300/06223d/c9a24b?text=Sin+imagen'">

      <div class="career-card__scrim"></div>

      <div class="career-card__body">
        <h3 class="career-card__name">${esc(c.name)}</h3>
        <span class="career-card__cta">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
          </svg>
          Ver horario <span class="arrow">&rarr;</span>
        </span>
      </div>
    </article>
  `).join("");

  content.innerHTML = `
    <div class="faculty-head">
      <p class="faculty-head__tag">Facultad</p>
      <h2 class="faculty-head__name">${esc(school.name)}</h2>
    </div>
    <div class="career-grid">
      ${cards}
    </div>
    <section class="media">
      <p class="media__tag">Vida universitaria</p>
      <h3 class="media__title">Conoce más de la Facultad</h3>
      <div class="media__frame">
        <iframe
          src="https://www.youtube.com/embed/MVK4sv5hyjs"
          title="Video de YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
    </section>
  `;
}

// Event delegation — Ver Horario (funciona con innerHTML dinámico)
document.getElementById("schoolContent").addEventListener("click", e => {
  const btn = e.target.closest(".ver-horario");
  if (btn) openModal(btn.dataset.name, btn.dataset.url);
});

// Accesibilidad: abrir con Enter / Espacio cuando la tarjeta tiene foco
document.getElementById("schoolContent").addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const btn = e.target.closest(".ver-horario");
  if (btn) { e.preventDefault(); openModal(btn.dataset.name, btn.dataset.url); }
});

// ── Modal PDF ─────────────────────────────────────────────────────
const pdfModal = document.getElementById("pdfModal");

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// Para Google Drive: convierte a /preview para el iframe
function toDrivePreviewUrl(url) {
  return url
    .replace(/\/view(\?.*)?$/, "/preview")
    .replace(/\/edit(\?.*)?$/, "/preview");
}

function openModal(title, url) {
  const isGDrive = url.includes("drive.google.com");

  // En móvil usar Google Docs Viewer para mostrar sin descargar
  if (isMobile()) {
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("pdfFrame").src           = viewerUrl;
    pdfModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    return;
  }

  // Desktop: iframe directo
  const frameUrl = isGDrive ? toDrivePreviewUrl(url) : url;
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("pdfFrame").src           = frameUrl;
  pdfModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  pdfModal.style.display = "none";
  document.getElementById("pdfFrame").src = "";
  document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener("click", closeModal);
pdfModal.addEventListener("click", e => { if (e.target === pdfModal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ── Arranque ──────────────────────────────────────────────────────
(async () => {
  setLoading(true);
  try {
    schools      = await getSchools();
    activeSchool = Object.keys(schools)[0] ?? "";
    renderNav();
    renderContent();
  } catch (err) {
    console.error("Firebase error:", err);
    document.getElementById("loadingSpinner").innerHTML = `
      <p class="load-error">
        Error al conectar con Firebase.
        <span>Verifica tu conexión e intenta de nuevo.</span>
      </p>`;
    return;
  } finally {
    setLoading(false);
  }
})();
