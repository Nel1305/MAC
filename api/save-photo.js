// api/save-photo.js — GET /api/save-photo (public) | POST (admin)
'use strict';
const { supabase, json, cors, checkAdmin } = require('./_shared');
const MAX = 3_000_000;

module.exports = async function(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method === 'GET') {
    const { data } = await supabase.from('settings').select('value').eq('key','artist_photo').maybeSingle();
    return json(res, { photo: data?.value || null });
  }
  if (req.method !== 'POST') return json(res, { error: 'Méthode non autorisée' }, 405);
  if (!checkAdmin(req))      return json(res, { error: 'Non autorisé' }, 401);
  const { action, photo } = req.body || {};
  if (action === 'delete') {
    await supabase.from('settings').delete().eq('key','artist_photo');
    return json(res, { success: true });
  }
  const p = String(photo || '');
  if (!p.startsWith('data:image/')) return json(res, { error: 'Format invalide' }, 400);
  if (p.length > MAX)               return json(res, { error: 'Image trop lourde (max ~2Mo)' }, 400);
  const { error } = await supabase.from('settings').upsert({ key:'artist_photo', value:p, updated_at:new Date().toISOString() }, { onConflict:'key' });
  if (error) return json(res, { error: error.message }, 500);
  return json(res, { success: true });
};
