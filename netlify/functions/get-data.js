// M.A.C JAMAIS ASSEZ — get-data.js
// GET /api/get-data?store=<n>  →  protégé X-Admin-Token

import { sql, json, cors, checkAdmin } from './_shared.js';

const TABLES = {
  commandes:    'commandes',
  reservations: 'reservations',
  messages:     'messages',
  newsletter:   'newsletter',
  albums:       'albums',
  events:       'evenements'
};

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'GET')     return json({ error: 'Méthode non autorisée' }, 405);
  if (!checkAdmin(req))         return json({ error: 'Non autorisé' }, 401);

  const store = new URL(req.url).searchParams.get('store') ?? '';
  if (!TABLES[store]) return json({ error: `Store invalide` }, 400);

  const table = TABLES[store];

  try {
    let rows;

    if (store === 'albums') {
      rows = await sql`
        SELECT id, titre, annee, genre, prix, badge, badge_label AS "badgeLabel",
               code, theme, visible
        FROM albums ORDER BY id ASC
      `;
    } else if (store === 'events') {
      rows = await sql`
        SELECT id, jour, mois, annee, titre, lieu, type,
               type_label AS "typeLabel", prix, statut, visible
        FROM evenements ORDER BY id ASC
      `;
    } else if (store === 'newsletter') {
      rows = await sql`SELECT email, created_at FROM newsletter ORDER BY created_at DESC`;
    } else {
      rows = await sql`SELECT * FROM ${sql(table)} ORDER BY created_at DESC`;
    }

    return json({ items: rows, total: rows.length });

  } catch (err) {
    console.error(`[get-data:${store}]`, err?.message);
    return json({ error: 'Erreur serveur' }, 500);
  }
};

export const config = { path: '/api/get-data' };
