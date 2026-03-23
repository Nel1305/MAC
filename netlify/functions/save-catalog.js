// M.A.C JAMAIS ASSEZ — save-catalog.js
// POST /api/save-catalog  →  protégé X-Admin-Token

import { supabase, json, cors, clean, checkAdmin, parseBody } from './_shared.js';

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

  // ── SUPPRESSION ──
  if (action === 'delete') {
    let error;
    if (store === 'albums') {
      ({ error } = await supabase.from('albums').delete().eq('id', parseInt(item.id)));
    } else if (store === 'events') {
      ({ error } = await supabase.from('evenements').delete().eq('id', parseInt(item.id)));
    } else if (store === 'newsletter') {
      ({ error } = await supabase.from('newsletter').delete().eq('email', String(item.id)));
    }
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, action: 'deleted', id: item.id });
  }

  // ── SAUVEGARDE / MISE À JOUR ──
  if (store === 'albums') {
    const payload = {
      id:          parseInt(item.id),
      titre:       clean(item.titre      ?? ''),
      annee:       clean(item.annee      ?? ''),
      genre:       clean(item.genre      ?? ''),
      prix:        clean(item.prix       ?? ''),
      badge:       clean(item.badge      ?? ''),
      badge_label: clean(item.badgeLabel ?? ''),
      code:        clean(item.code       ?? '').toUpperCase(),
      theme:       ['a1','a2','a3','a4'].includes(item.theme) ? item.theme : 'a1',
      visible:     !!item.visible,
      updated_at:  new Date().toISOString()
    };
    const { error } = await supabase.from('albums').upsert(payload, { onConflict: 'id' });
    if (error) return json({ error: error.message }, 500);
  }

  if (store === 'events') {
    const payload = {
      id:         parseInt(item.id),
      jour:       clean(item.jour      ?? ''),
      mois:       clean(item.mois      ?? ''),
      annee:      clean(item.annee     ?? ''),
      titre:      clean(item.titre     ?? ''),
      lieu:       clean(item.lieu      ?? ''),
      type:       ['concert','festival','gospel'].includes(item.type) ? item.type : 'concert',
      type_label: clean(item.typeLabel ?? 'Concert'),
      prix:       clean(item.prix      ?? ''),
      statut:     item.statut === 'complet' ? 'complet' : 'dispo',
      visible:    !!item.visible,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('evenements').upsert(payload, { onConflict: 'id' });
    if (error) return json({ error: error.message }, 500);
  }

  return json({ success: true, action: 'saved', id: item.id });
};

export const config = { path: '/api/save-catalog' };
