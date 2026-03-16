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
    btn.className   = key === activeSchool
      ? "px-5 py-2 rounded-xl text-sm font-bold bg-[#003865] text-white shadow-md"
      : "px-5 py-2 rounded-xl text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors";
    btn.addEventListener("click", () => { activeSchool = key; renderNav(); renderContent(); });
    nav.appendChild(btn);
  });
}

// ── Tarjetas de carreras ──────────────────────────────────────────
function renderContent() {
  const school  = schools[activeSchool];
  const content = document.getElementById("schoolContent");

  const cards = school.careers.map(c => `
    <div class="ver-horario group relative cursor-pointer rounded-2xl overflow-hidden shadow-md
                transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 active:scale-95"
         data-name="${esc(c.name)}" data-url="${esc(c.scheduleUrl)}">

      <!-- Imagen de fondo -->
      <img src="${esc(c.img)}" alt="${esc(c.name)}"
           class="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
           style="object-position:${esc(c.imgPosition||'50% 50%')}"
           onerror="this.src='https://placehold.co/400x208/e2e8f0/64748b?text=Sin+imagen'">

      <!-- Overlay oscuro al hacer hover -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <!-- Contenido inferior -->
      <div class="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0
                  transition-transform duration-300">
        <h3 class="text-white text-sm font-bold leading-snug drop-shadow text-center
                   opacity-0 group-hover:opacity-100 transition-opacity duration-300 mb-2">
          ${esc(c.name)}
        </h3>
        <div class="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm
                    border border-white/30 rounded-xl py-2 px-3
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg class="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
          </svg>
          <span class="text-white text-xs font-semibold">Ver Horario</span>
        </div>
      </div>

      <!-- Nombre visible siempre (parte baja con gradiente suave) -->
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent
                  px-4 pb-3 pt-8 group-hover:opacity-0 transition-opacity duration-300">
        <h3 class="text-white text-sm font-semibold text-center leading-snug drop-shadow">
          ${esc(c.name)}
        </h3>
      </div>
    </div>
  `).join("");

  content.innerHTML = `
    <h2 class="text-center text-2xl font-bold text-gray-800 mb-8">${esc(school.name)}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
      ${cards}
    </div>
    <div class="mt-14 text-center max-w-4xl mx-auto">
      <h3 class="text-xl font-semibold text-[#003865] mb-5">Conoce más de la Facultad</h3>
      <div class="rounded-2xl overflow-hidden shadow-md">
        <iframe width="100%" height="480"
          src="https://www.youtube.com/embed/MVK4sv5hyjs"
          title="Video de YouTube" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
    </div>
  `;
}

// Event delegation — Ver Horario (funciona con innerHTML dinámico)
document.getElementById("schoolContent").addEventListener("click", e => {
  const btn = e.target.closest(".ver-horario");
  if (btn) openModal(btn.dataset.name, btn.dataset.url);
});

// ── Modal PDF ─────────────────────────────────────────────────────
const pdfModal = document.getElementById("pdfModal");

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// Convierte /preview a URL apta para visor móvil de Google Drive
function toMobileViewUrl(url) {
  // Extrae el file ID y arma una URL de visor de Google Docs embebido
  const match = url.match(/\/d\/([^/]+)\//);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/view`;
  }
  return url;
}

function openModal(title, url) {
  if (isMobile()) {
    window.open(toMobileViewUrl(url), "_blank", "noopener,noreferrer");
    return;
  }
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("pdfFrame").src           = url;
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
      <p class="text-red-600 text-center px-4">
        Error al conectar con Firebase.<br>
        <span class="text-sm text-gray-500">Verifica tu conexión e intenta de nuevo.</span>
      </p>`;
    return;
  } finally {
    setLoading(false);
  }
})();
