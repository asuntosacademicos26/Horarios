/**
 * Script para configurar CORS en Firebase Storage.
 * Ejecutar UNA SOLA VEZ:
 *   npm install @google-cloud/storage
 *   node set-cors.js
 *
 * Necesitas una Service Account Key de Firebase:
 *   Firebase Console → Configuración → Cuentas de servicio
 *   → "Generar nueva clave privada" → guarda como serviceAccountKey.json
 */

const { Storage } = require("@google-cloud/storage");
const path = require("path");

const storage = new Storage({
  keyFilename: path.join(__dirname, "serviceAccountKey.json")
});

const BUCKET = "horario-b4ff3.firebasestorage.app";

const corsConfig = [
  {
    origin: ["*"],
    method: ["GET", "POST", "PUT", "DELETE", "HEAD"],
    responseHeader: [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "x-goog-resumable"
    ],
    maxAgeSeconds: 3600
  }
];

async function setCors() {
  await storage.bucket(BUCKET).setCorsConfiguration(corsConfig);
  console.log("✅ CORS configurado correctamente en Firebase Storage.");
}

setCors().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
