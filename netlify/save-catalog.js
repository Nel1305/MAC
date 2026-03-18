// ══════════════════════════════════════════════════════
//  M.A.C JAMAIS ASSEZ — netlify/functions/save-catalog.js
//  Sauvegarde albums et événements depuis l'admin
//  POST /api/save-catalog
//  Body: { store: "albums"|"events", action: "set"|"delete", item: {...} }
// ══════════════════════════════════════════════════════

import { getStore } from "@netlify/blobs";

const ALLOWED_STORES  = ["albums", "events"];
const ALLOWED_ACTIONS = ["set", "delete"];

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
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token"
      }
    });
  }

  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  // ── Vérification token admin ──
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const token = req.headers.get("X-Admin-Token");
    if (token !== adminSecret) return json({ error: "Non autorisé" }, 401);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: "Corps de la requête invalide" }, 400); }

  const { store: storeName, action, item } = body;

  if (!ALLOWED_STORES.includes(storeName))  return json({ error: "Store invalide" }, 400);
  if (!ALLOWED_ACTIONS.includes(action))    return json({ error: "Action invalide" }, 400);
  if (!item || !item.id)                    return json({ error: "Item manquant ou sans ID" }, 400);

  const key = String(item.id);

  try {
    const store = getStore(storeName);

    if (action === "delete") {
      await store.delete(key);
      return json({ success: true, action: "deleted", id: key });
    }

    // action === "set"
    await store.setJSON(key, { ...item, updatedAt: new Date().toISOString() });
    return json({ success: true, action: "saved", id: key });

  } catch (err) {
    console.error(`Blobs save-catalog [${storeName}] error:`, err);
    return json({ error: "Erreur serveur" }, 500);
  }
};

export const config = { path: "/api/save-catalog" };
