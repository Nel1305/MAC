// ══════════════════════════════════════════════════════
//  M.A.C JAMAIS ASSEZ — netlify/functions/save-message.js
//  Sauvegarde un message de contact dans Netlify Blobs
// ══════════════════════════════════════════════════════

import { getStore } from "@netlify/blobs";

function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.trim()
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;")
    .substring(0, 1000);
}
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  let body;
  try { body = await req.json(); }
  catch { return json({ error: "Corps de la requête invalide" }, 400); }

  const { nom, email, message } = body;

  // ── Validation ──
  if (!nom)                  return json({ error: "Nom obligatoire" }, 400);
  if (!isValidEmail(email))  return json({ error: "Email invalide" }, 400);
  if (!message || message.trim().length < 5) return json({ error: "Message trop court" }, 400);

  const id = "MSG-" + Date.now();
  const msg = {
    id,
    nom:       sanitize(nom),
    email:     sanitize(email),
    message:   sanitize(message),
    date:      new Date().toLocaleString("fr-FR"),
    createdAt: new Date().toISOString()
  };

  try {
    const store = getStore("messages");
    await store.setJSON(id, msg);
  } catch (err) {
    console.error("Blobs save-message error:", err);
    return json({ error: "Erreur serveur lors de la sauvegarde" }, 500);
  }

  return json({ success: true, id });
};

export const config = { path: "/api/save-message" };
