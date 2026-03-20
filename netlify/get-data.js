// M.A.C JAMAIS ASSEZ — get-data.js
// GET /api/get-data?store=<name>   →  protégé X-Admin-Token
// Utilise la cohérence forte Netlify Blobs pour l'admin

import { getStore } from '@netlify/blobs';
import { json, cors, checkAdmin } from './_shared.js';

const STORES = new Set(['commandes','reservations','messages','newsletter','albums','events']);

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'GET')     return json({ error: 'Méthode non autorisée' }, 405);
  if (!checkAdmin(req))         return json({ error: 'Non autorisé' }, 401);

  const store = new URL(req.url).searchParams.get('store') ?? '';
  if (!STORES.has(store)) return json({ error: `Store invalide` }, 400);

  try {
    // consistency: 'strong' → garantit les dernières écritures
    const s           = getStore({ name: store, consistency: 'strong' });
    const { blobs }   = await s.list();

    if (!blobs.length) return json({ items: [] });

    // Lecture en parallèle de tous les blobs
    const items = (await Promise.all(
      blobs.map(({ key }) => s.get(key, { type: 'json' }).catch(() => null))
    )).filter(Boolean);

    // Tri du plus récent au plus ancien
    items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

    return json({ items, total: items.length });
  } catch (err) {
    console.error(`[get-data:${store}]`, err?.message);
    return json({ error: 'Erreur serveur' }, 500);
  }
};

export const config = { path: '/api/get-data' };
