// ══════════════════════════════════════════════════════
//  M.A.C JAMAIS ASSEZ — netlify/functions/update-statut.js
//  Mise à jour du statut d'une commande ou réservation
//  PATCH /api/update-statut
//  Body: { store: "commandes"|"reservations", id: "CMD-...", statut: "traite"|"annule" }
// ══════════════════════════════════════════════════════

import { getStore } from "@netlify/blobs";

const ALLOWED_STORES  = ["commandes", "reservations"];
const ALLOWED_STATUTS = {
  commandes:    ["en_attente", "traite", "annule"],
  reservations: ["confirmee", "traite", "annule"]
};

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
        "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token"
      }
    });
  }

  if (req.method !== "PATCH") return json({ error: "Méthode non autorisée" }, 405);

  // ── Vérification token admin ──
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const token = req.headers.get("X-Admin-Token");
    if (token !== adminSecret) return json({ error: "Non autorisé" }, 401);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: "Corps de la requête invalide" }, 400); }

  const { store: storeName, id, statut } = body;

  if (!ALLOWED_STORES.includes(storeName))    return json({ error: "Store invalide" }, 400);
  if (!id || typeof id !== "string")           return json({ error: "ID manquant" }, 400);
  if (!ALLOWED_STATUTS[storeName].includes(statut)) return json({ error: "Statut invalide" }, 400);

  try {
    const store = getStore(storeName);

    // Récupère l'entrée existante
    const existing = await store.get(id, { type: "json" });
    if (!existing) return json({ error: "Entrée introuvable" }, 404);

    // Met à jour uniquement le statut
    await store.setJSON(id, { ...existing, statut, updatedAt: new Date().toISOString() });

    return json({ success: true, id, statut });
  } catch (err) {
    console.error("Blobs update-statut error:", err);
    return json({ error: "Erreur serveur lors de la mise à jour" }, 500);
  }
};

export const config = { path: "/api/update-statut" };
