// M.A.C JAMAIS ASSEZ — save-catalog.js
// POST /api/save-catalog   →  protégé X-Admin-Token
// Gère albums, events et suppression newsletter

import { getStore } from '@netlify/blobs';
import { json, cors, clean, checkAdmin, parseBody } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'POST')    return json({ error: 'Méthode non autorisée' }, 405);
  if (!checkAdmin(req))         return json({ error: 'Non autorisé' }, 401);

  const body = await parseBody(req);
  if (!body) return json({ error: 'Données invalides' }, 400);

  const { store, action, item } = body;

  if (!['albums','events','newsletter'].includes(store)) return json({ error: 'Store invalide' }, 400);
  if (!['set','delete'].includes(action))                return json({ error: 'Action invalide' }, 400);
  if (!item?.id)                                         return json({ error: 'ID manquant' }, 400);

  const key = String(item.id);

  try {
    const s = getStore({ name: store, consistency: 'strong' });

    if (action === 'delete') {
      await s.delete(key);
      return json({ success: true, action: 'deleted', id: key });
    }

    // ── Payload selon le store ──
    let payload;

    if (store === 'albums') {
      payload = {
        id:         parseInt(key) || key,
        titre:      clean(item.titre      ?? ''),
        annee:      clean(item.annee      ?? ''),
        genre:      clean(item.genre      ?? ''),
        prix:       clean(item.prix       ?? ''),
        badge:      clean(item.badge      ?? ''),
        badgeLabel: clean(item.badgeLabel ?? ''),
        code:       clean(item.code       ?? '').toUpperCase(),
        theme:      ['a1','a2','a3','a4'].includes(item.theme) ? item.theme : 'a1',
        visible:    !!item.visible,
        updatedAt:  new Date().toISOString()
      };
    } else if (store === 'events') {
      payload = {
        id:        parseInt(key) || key,
        jour:      clean(item.jour      ?? ''),
        mois:      clean(item.mois      ?? ''),
        annee:     clean(item.annee     ?? ''),
        titre:     clean(item.titre     ?? ''),
        lieu:      clean(item.lieu      ?? ''),
        type:      ['concert','festival','gospel'].includes(item.type) ? item.type : 'concert',
        typeLabel: clean(item.typeLabel ?? 'Concert'),
        prix:      clean(item.prix      ?? ''),
        statut:    item.statut === 'complet' ? 'complet' : 'dispo',
        visible:   !!item.visible,
        updatedAt: new Date().toISOString()
      };
    } else {
      // newsletter
      payload = { ...item, updatedAt: new Date().toISOString() };
    }

    await s.setJSON(key, payload);
    return json({ success: true, action: 'saved', id: key });

  } catch (err) {
    console.error(`[save-catalog:${store}]`, err?.message);
    return json({ error: 'Erreur serveur' }, 500);
  }
};

export const config = { path: '/api/save-catalog' };
