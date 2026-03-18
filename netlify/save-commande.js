// ══════════════════════════════════════════════════════
//  M.A.C JAMAIS ASSEZ — netlify/functions/save-commande.js
//  Sauvegarde une commande d'album dans Netlify Blobs
// ══════════════════════════════════════════════════════

import { getStore } from "@netlify/blobs";

// ── Helpers sécurité (mêmes règles que script.js côté client) ──
function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.trim()
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;")
    .substring(0, 300);
}
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}
function isValidPhone(p) {
  return /^[\d\s+\-()\x20]{7,20}$/.test(p);
}

// ── Réponse JSON helper ──
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export default async (req) => {
  // OPTIONS pour CORS preflight
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

  // Méthode POST uniquement
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  // Parse du body
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corps de la requête invalide" }, 400);
  }

  const { nom, prenom, email, tel, ville, album, prix, quantite } = body;

  // ── Validation ──
  if (!nom || !prenom)           return json({ error: "Nom et prénom obligatoires" }, 400);
  if (!isValidEmail(email))      return json({ error: "Email invalide" }, 400);
  if (!album)                    return json({ error: "Album manquant" }, 400);
  if (tel && !isValidPhone(tel)) return json({ error: "Téléphone invalide" }, 400);

  // ── Construction de la commande ──
  const id = "CMD-" + Date.now();
  const commande = {
    id,
    type:      "achat",
    nom:       sanitize(nom),
    prenom:    sanitize(prenom),
    email:     sanitize(email),
    tel:       sanitize(tel || ""),
    ville:     sanitize(ville || ""),
    album:     sanitize(album),
    prix:      sanitize(prix || ""),
    quantite:  parseInt(quantite) || 1,
    statut:    "en_attente",
    date:      new Date().toLocaleString("fr-FR"),
    createdAt: new Date().toISOString()
  };

  // ── Sauvegarde dans Netlify Blobs ──
  try {
    const store = getStore("commandes");
    await store.setJSON(id, commande);
  } catch (err) {
    console.error("Blobs save-commande error:", err);
    return json({ error: "Erreur serveur lors de la sauvegarde" }, 500);
  }

  return json({ success: true, id });
};

export const config = { path: "/api/save-commande" };
