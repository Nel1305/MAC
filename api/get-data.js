// api/get-data.js — GET /api/get-data?store=X&q=search&page=1
'use strict';
const { supabase, json, cors, checkAdmin } = require('./_shared');

const PRIVATE = new Set(['commandes','reservations','messages','newsletter']);
const PAGE_SIZE = 50;

module.exports = async function(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'GET')     return json(res, { error: 'Méthode non autorisée' }, 405);

  const store = req.query.store || '';
  const q     = (req.query.q || '').trim().toLowerCase();
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const from  = (page - 1) * PAGE_SIZE;
  const to    = from + PAGE_SIZE - 1;

  const VALID = new Set(['albums','events','galerie','settings_public','commandes','reservations','messages','newsletter']);
  if (!VALID.has(store)) return json(res, { error: 'Store invalide' }, 400);
  if (PRIVATE.has(store) && !checkAdmin(req)) return json(res, { error: 'Non autorisé' }, 401);

  try {
    let query;

    if (store === 'albums') {
      query = supabase.from('albums')
        .select('id,titre,annee,genre,prix,badge,badge_label,code,theme,cover_url,visible', { count: 'exact' })
        .order('id', { ascending: true });
      if (q) query = query.or(`titre.ilike.%${q}%,genre.ilike.%${q}%`);

    } else if (store === 'events') {
      query = supabase.from('evenements')
        .select('id,titre,lieu,jour,mois,annee,type,type_label,prix,statut,visible', { count: 'exact' })
        .order('id', { ascending: true });
      if (q) query = query.or(`titre.ilike.%${q}%,lieu.ilike.%${q}%`);

    } else if (store === 'galerie') {
      query = supabase.from('galerie')
        .select('id,url,legende,visible,created_at', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (q) query = query.ilike('legende', `%${q}%`);

    } else if (store === 'settings_public') {
      const { data, error } = await supabase.from('settings')
        .select('key,value').in('key', ['bio','hero_quote','stats']);
      if (error) throw error;
      return json(res, { items: data || [], total: (data || []).length });

    } else if (store === 'commandes') {
      query = supabase.from('commandes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (q) query = query.or(`prenom.ilike.%${q}%,nom.ilike.%${q}%,email.ilike.%${q}%,album.ilike.%${q}%,id.ilike.%${q}%`);

    } else if (store === 'reservations') {
      query = supabase.from('reservations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (q) query = query.or(`prenom.ilike.%${q}%,nom.ilike.%${q}%,email.ilike.%${q}%,evenement.ilike.%${q}%,id.ilike.%${q}%`);

    } else if (store === 'messages') {
      query = supabase.from('messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (q) query = query.or(`prenom.ilike.%${q}%,nom.ilike.%${q}%,email.ilike.%${q}%,message.ilike.%${q}%`);

    } else if (store === 'newsletter') {
      query = supabase.from('newsletter')
        .select('email,created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (q) query = query.ilike('email', `%${q}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    let items = data || [];
    if (store === 'albums') items = items.map(r => ({ ...r, badgeLabel: r.badge_label }));
    if (store === 'events') items = items.map(r => ({ ...r, typeLabel: r.type_label }));

    return json(res, { items, total: count ?? items.length, page, pageSize: PAGE_SIZE });

  } catch (err) {
    console.error(`[get-data:${store}]`, err?.message);
    return json(res, { error: 'Erreur serveur' }, 500);
  }
};
