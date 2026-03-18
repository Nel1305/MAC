// ══════════════════════════════════════════════════════
//  M.A.C JAMAIS ASSEZ — netlify/functions/save-reservation.js
//  Sauvegarde une réservation de billet dans Netlify Blobs
// ══════════════════════════════════════════════════════

import { getStore } from "@netlify/blobs";

function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.trim()
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;")
    .substring(0, 300);
}
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }
function isValidPhone(p) { return /^[\d\s+\-()\x20]{7,20}$/.test(p); }

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

  const { nom, prenom, email, tel, evenement, date_event, lieu, prix, quantite } = body;

  // ── Validation ──
  if (!nom || !prenom)        return json({ error: "Nom et prénom obligatoires" }, 400);
  if (!isValidEmail(email))   return json({ error: "Email invalide" }, 400);
  if (!tel)                   return json({ error: "Téléphone obligatoire" }, 400);
  if (!isValidPhone(tel))     return json({ error: "Téléphone invalide" }, 400);
  if (!evenement)             return json({ error: "Événement manquant" }, 400);

  const id = "RES-" + Date.now();
  const reservation = {
    id,
    type:       "reservation",
    nom:        sanitize(nom),
    prenom:     sanitize(prenom),
    email:      sanitize(email),
    tel:        sanitize(tel),
    evenement:  sanitize(evenement),
    date_event: sanitize(date_event || ""),
    lieu:       sanitize(lieu || ""),
    prix:       sanitize(prix || ""),
    quantite:   parseInt(quantite) || 1,
    statut:     "confirmee",
    date:       new Date().toLocaleString("fr-FR"),
    createdAt:  new Date().toISOString()
  };

  try {
    const store = getStore("reservations");
    await store.setJSON(id, reservation);
  } catch (err) {
    console.error("Blobs save-reservation error:", err);
    return json({ error: "Erreur serveur lors de la sauvegarde" }, 500);
  }

  return json({ success: true, id });
};

export const config = { path: "/api/save-reservation" };
