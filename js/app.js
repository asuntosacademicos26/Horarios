import { getSchools } from "./supabase.js";

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
    <div class="bg-white rounded-2xl shadow hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">
      <img src="${esc(c.img)}" alt="${esc(c.name)}"
           class="w-full h-52 object-cover"
           onerror="this.src='https://placehold.co/400x208/e2e8f0/64748b?text=Sin+imagen'">
      <div class="p-5 text-center flex flex-col flex-1 justify-between">
        <h3 class="text-base font-semibold text-gray-800 mb-4 leading-snug">${esc(c.name)}</h3>
        <button class="ver-horario w-full bg-[#003865] hover:bg-[#002548] active:scale-95 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
                data-name="${esc(c.name)}" data-url="${esc(c.scheduleUrl)}">
          Ver Horario
        </button>
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

function openModal(title, url) {
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
    console.error("Supabase error:", err);
    document.getElementById("loadingSpinner").innerHTML = `
      <p class="text-red-600 text-center px-4">
        Error al conectar con Supabase.<br>
        <span class="text-sm text-gray-500">Verifica tu conexión e intenta de nuevo.</span>
      </p>`;
    return;
  } finally {
    setLoading(false);
  }
})();
