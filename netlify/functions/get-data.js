// M.A.C JAMAIS ASSEZ — get-data.js
// GET /api/get-data?store=<n>  →  protégé X-Admin-Token

import { supabase, json, cors, checkAdmin } from './_shared.js';

const STORES = {
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
  if (!STORES[store]) return json({ error: 'Store invalide' }, 400);

  const table = STORES[store];

  let query;

  if (store === 'albums') {
    query = supabase
      .from(table)
      .select('id, titre, annee, genre, prix, badge, badge_label, code, theme, visible')
      .order('id', { ascending: true });
  } else if (store === 'events') {
    query = supabase
      .from(table)
      .select('id, jour, mois, annee, titre, lieu, type, type_label, prix, statut, visible')
      .order('id', { ascending: true });
  } else if (store === 'newsletter') {
    query = supabase
      .from(table)
      .select('email, created_at')
      .order('created_at', { ascending: false });
  } else {
    query = supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[get-data:${store}]`, error.message);
    return json({ error: 'Erreur serveur' }, 500);
  }

  // Normalise les noms de colonnes pour le JS (badge_label → badgeLabel, type_label → typeLabel)
  let items = data;
  if (store === 'albums') {
    items = data.map(r => ({ ...r, badgeLabel: r.badge_label }));
  }
  if (store === 'events') {
    items = data.map(r => ({ ...r, typeLabel: r.type_label }));
  }

  return json({ items, total: items.length });
};

export const config = { path: '/api/get-data' };
