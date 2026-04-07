// api/save-catalog.js — POST /api/save-catalog (admin)
'use strict';
const { supabase, json, cors, clean, isValidUrl, checkAdmin } = require('./_shared');

const THEMES  = new Set(['terra','or','vert','sable']);
const TYPES   = new Set(['concert','festival','gospel','mbalax']);
const STATUTS = new Set(['dispo','complet']);

async function nextId(table) {
  const { data } = await supabase.from(table).select('id').order('id', { ascending: false }).limit(1);
  return (data?.[0]?.id ?? 0) + 1;
}

module.exports = async function(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'POST')    return json(res, { error: 'Méthode non autorisée' }, 405);
  if (!checkAdmin(req))         return json(res, { error: 'Non autorisé' }, 401);

  const { store, action, item } = req.body || {};
  if (!['albums','events','galerie','settings','newsletter'].includes(store)) return json(res, { error: 'Store invalide' }, 400);
  if (!['set','delete'].includes(action)) return json(res, { error: 'Action invalide' }, 400);
  if (action === 'set' && !item)          return json(res, { error: 'Item manquant' }, 400);

  try {
    // ── SUPPRESSION ──
    if (action === 'delete') {
      const tbl   = { albums:'albums', events:'evenements', galerie:'galerie', settings:'settings', newsletter:'newsletter' }[store];
      const field = store === 'newsletter' ? 'email' : store === 'settings' ? 'key' : 'id';
      const val   = (field === 'email' || field === 'key') ? String(item.id) : parseInt(item.id);
      if (!val && val !== 0) return json(res, { error: 'ID invalide' }, 400);
      const { error } = await supabase.from(tbl).delete().eq(field, val);
      if (error) return json(res, { error: error.message }, 500);
      return json(res, { success: true, action: 'deleted' });
    }

    // ── ALBUMS ──
    if (store === 'albums') {
      if (!item.titre?.trim()) return json(res, { error: 'Titre obligatoire' }, 400);
      const id  = item.id ? parseInt(item.id) : await nextId('albums');
      const url = item.cover_url && isValidUrl(item.cover_url) ? item.cover_url : null;
      const { error } = await supabase.from('albums').upsert({
        id, titre: clean(item.titre), annee: clean(item.annee || '', 10),
        genre: clean(item.genre || ''), prix: clean(item.prix || ''),
        badge: clean(item.badge || '', 20), badge_label: clean(item.badgeLabel || '', 30),
        code: clean(item.code || '', 5).toUpperCase() || clean(item.titre).slice(0,3).toUpperCase(),
        theme: THEMES.has(item.theme) ? item.theme : 'terra',
        cover_url: url, visible: item.visible !== false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) return json(res, { error: error.message }, 500);
      return json(res, { success: true, action: 'saved', id });
    }

    // ── ÉVÉNEMENTS ──
    if (store === 'events') {
      if (!item.titre?.trim()) return json(res, { error: 'Titre obligatoire' }, 400);
      const id = item.id ? parseInt(item.id) : await nextId('evenements');
      const tv = TYPES.has(item.type) ? item.type : 'concert';
      const lbl = { concert:'Concert', festival:'Festival', gospel:'Gospel', mbalax:'Mbalax' }[tv];
      const { error } = await supabase.from('evenements').upsert({
        id, titre: clean(item.titre), lieu: clean(item.lieu || ''),
        jour: clean(item.jour || '', 2), mois: clean(item.mois || '', 4),
        annee: clean(item.annee || '', 4), type: tv, type_label: lbl,
        prix: clean(item.prix || ''),
        statut: STATUTS.has(item.statut) ? item.statut : 'dispo',
        visible: item.visible !== false, updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) return json(res, { error: error.message }, 500);
      return json(res, { success: true, action: 'saved', id });
    }

    // ── GALERIE ──
    if (store === 'galerie') {
      if (!item.url || !isValidUrl(item.url)) return json(res, { error: 'URL HTTPS valide requise' }, 400);
      const id = item.id ? parseInt(item.id) : await nextId('galerie');
      const { error } = await supabase.from('galerie').upsert({
        id, url: item.url, legende: clean(item.legende || '', 200),
        visible: item.visible !== false, created_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) return json(res, { error: error.message }, 500);
      return json(res, { success: true, action: 'saved', id });
    }

    // ── SETTINGS ──
    if (store === 'settings') {
      const key = String(item.key || '').trim();
      if (!key) return json(res, { error: 'Clé manquante' }, 400);
      const { error } = await supabase.from('settings').upsert(
        { key, value: item.value ?? '', updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
      if (error) return json(res, { error: error.message }, 500);
      return json(res, { success: true, action: 'saved' });
    }

    return json(res, { error: 'Store non traité' }, 400);
  } catch (err) {
    console.error(`[save-catalog:${store}]`, err?.message);
    return json(res, { error: 'Erreur serveur' }, 500);
  }
};
