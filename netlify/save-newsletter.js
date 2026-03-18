// ══════════════════════════════════════════════════════
//  M.A.C JAMAIS ASSEZ — netlify/functions/save-newsletter.js
//  Sauvegarde un email newsletter dans Netlify Blobs
//  Utilise l'email comme clé pour éviter les doublons
// ══════════════════════════════════════════════════════

import { getStore } from "@netlify/blobs";

function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.trim().toLowerCase().substring(0, 200);
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

  const email = sanitize(body.email || "");
  if (!isValidEmail(email)) return json({ error: "Email invalide" }, 400);

  // Clé = email nettoyé (garantit l'unicité)
  const key = email.replace(/[@.]/g, "_");

  try {
    const store = getStore("newsletter");

    // Vérifie si déjà inscrit
    const existing = await store.get(key);
    if (existing) {
      return json({ success: true, alreadySubscribed: true });
    }

    await store.setJSON(key, {
      email,
      date:      new Date().toLocaleString("fr-FR"),
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Blobs save-newsletter error:", err);
    return json({ error: "Erreur serveur lors de la sauvegarde" }, 500);
  }

  return json({ success: true, alreadySubscribed: false });
};

export const config = { path: "/api/save-newsletter" };
