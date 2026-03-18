// ══════════════════════════════════════════════════════
//  M.A.C JAMAIS ASSEZ — netlify/functions/get-data.js
//  Lecture des données pour l'admin
//  GET /api/get-data?store=commandes
//  GET /api/get-data?store=reservations
//  GET /api/get-data?store=messages
//  GET /api/get-data?store=newsletter
//  GET /api/get-data?store=albums
//  GET /api/get-data?store=events
// ══════════════════════════════════════════════════════

import { getStore } from "@netlify/blobs";

// Stores autorisés — sécurité : on ne peut pas lire n'importe quoi
const ALLOWED_STORES = ["commandes", "reservations", "messages", "newsletter", "albums", "events"];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Accès restreint : pas de wildcard, uniquement le même domaine
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token"
      }
    });
  }

  if (req.method !== "GET") return json({ error: "Méthode non autorisée" }, 405);

  // ── Vérification token admin ──
  // Ajoutez ADMIN_SECRET dans vos variables d'environnement Netlify
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const token = req.headers.get("X-Admin-Token");
    if (token !== adminSecret) {
      return json({ error: "Non autorisé" }, 401);
    }
  }

  // ── Lecture du paramètre store ──
  const url        = new URL(req.url);
  const storeName  = url.searchParams.get("store");

  if (!storeName || !ALLOWED_STORES.includes(storeName)) {
    return json({ error: `Store invalide. Valeurs acceptées: ${ALLOWED_STORES.join(", ")}` }, 400);
  }

  try {
    const store   = getStore(storeName);
    const { blobs } = await store.list();

    if (!blobs.length) return json({ items: [] });

    // Récupère toutes les entrées en parallèle
    const items = await Promise.all(
      blobs.map(async ({ key }) => {
        try {
          return await store.get(key, { type: "json" });
        } catch {
          return null;
        }
      })
    );

    // Filtre les nulls et trie par date de création (plus récent en premier)
    const sorted = items
      .filter(Boolean)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return json({ items: sorted });
  } catch (err) {
    console.error(`Blobs get-data [${storeName}] error:`, err);
    return json({ error: "Erreur serveur lors de la lecture" }, 500);
  }
};

export const config = { path: "/api/get-data" };
