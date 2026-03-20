// M.A.C JAMAIS ASSEZ — update-statut.js
// PATCH /api/update-statut   →  protégé X-Admin-Token

import { getStore } from '@netlify/blobs';
import { json, cors, checkAdmin, parseBody } from './_shared.js';

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
  if (!id || typeof id !== 'string')    return json({ error: 'ID manquant' }, 400);
  if (!ALLOWED[store].includes(statut)) return json({ error: 'Statut invalide' }, 400);

  try {
    const s        = getStore({ name: store, consistency: 'strong' });
    const existing = await s.get(id, { type: 'json' }).catch(() => null);
    if (!existing) return json({ error: 'Entrée introuvable' }, 404);

    await s.setJSON(id, {
      ...existing,
      statut,
      updatedAt: new Date().toISOString()
    });

    return json({ success: true, id, statut });
  } catch (err) {
    console.error('[update-statut]', err?.message);
    return json({ error: 'Erreur serveur' }, 500);
  }
};

export const config = { path: '/api/update-statut' };
