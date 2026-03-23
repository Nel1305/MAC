// M.A.C JAMAIS ASSEZ — update-statut.js
// PATCH /api/update-statut  →  protégé X-Admin-Token

import { supabase, json, cors, checkAdmin, parseBody } from './_shared.js';

const ALLOWED = {
  commandes:    ['en_attente', 'traite', 'annule'],
  reservations: ['confirmee',  'traite', 'annule']
};

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'PATCH')   return json({ error: 'Méthode non autorisée' }, 405);
  if (!checkAdmin(req))         return json({ error: 'Non autorisé' }, 401);

  const body = await parseBody(req);
  if (!body) return json({ error: 'Données invalides' }, 400);

  const { store, id, statut } = body;

  if (!ALLOWED[store])                  return json({ error: 'Store invalide' }, 400);
  if (!id)                              return json({ error: 'ID manquant' }, 400);
  if (!ALLOWED[store].includes(statut)) return json({ error: 'Statut invalide' }, 400);

  const { error, count } = await supabase
    .from(store)
    .update({ statut })
    .eq('id', id);

  if (error) {
    console.error('[update-statut]', error.message);
    return json({ error: 'Erreur serveur' }, 500);
  }

  return json({ success: true, id, statut });
};

export const config = { path: '/api/update-statut' };
