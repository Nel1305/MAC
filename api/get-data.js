// M.A.C JAMAIS ASSEZ — api/get-data.js
// GET /api/get-data?store=<n>

const { supabase, json, cors, checkAdmin } = require('./_shared');

const PRIVATE = new Set(['commandes','reservations','messages','newsletter']);

const TABLE = {
  albums:          'albums',
  events:          'evenements',
  galerie:         'galerie',
  settings_public: 'settings',
  commandes:       'commandes',
  reservations:    'reservations',
  messages:        'messages',
  newsletter:      'newsletter'
};

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'GET')     return json(res, { error: 'Méthode non autorisée' }, 405);

  const store = req.query.store ?? '';
  if (!TABLE[store]) return json(res, { error: 'Store invalide' }, 400);

  if (PRIVATE.has(store) && !checkAdmin(req)) {
    return json(res, { error: 'Non autorisé' }, 401);
  }

  try {
    let query;

    if (store === 'albums') {
      query = supabase.from('albums')
        .select('id,titre,annee,genre,prix,badge,badge_label,code,theme,cover_url,visible')
        .order('id', { ascending: true });

    } else if (store === 'events') {
      query = supabase.from('evenements')
        .select('id,jour,mois,annee,titre,lieu,type,type_label,prix,statut,visible')
        .order('id', { ascending: true });

    } else if (store === 'galerie') {
      query = supabase.from('galerie')
        .select('id,url,legende,visible,created_at')
        .eq('visible', true)
        .order('created_at', { ascending: false });

    } else if (store === 'settings_public') {
      query = supabase.from('settings')
        .select('key,value')
        .in('key', ['bio','hero_quote','stats']);

    } else if (store === 'newsletter') {
      query = supabase.from('newsletter')
        .select('email,created_at')
        .order('created_at', { ascending: false });

    } else {
      query = supabase.from(TABLE[store])
        .select('*')
        .order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    let items = data || [];
    if (store === 'albums') items = items.map(r => ({ ...r, badgeLabel: r.badge_label }));
    if (store === 'events') items = items.map(r => ({ ...r, typeLabel:  r.type_label  }));

    return json(res, { items, total: items.length });

  } catch (err) {
    console.error(`[get-data:${store}]`, err?.message);
    return json(res, { error: 'Erreur serveur' }, 500);
  }
};
