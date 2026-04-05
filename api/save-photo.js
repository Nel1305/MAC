// M.A.C JAMAIS ASSEZ — api/save-photo.js
// GET  → photo publique
// POST → sauvegarder / supprimer (admin)
const { supabase, json, cors, checkAdmin } = require('./_shared');

const MAX_PHOTO_SIZE = 3_000_000;

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res);

  if (req.method === 'GET') {
    const { data } = await supabase.from('settings').select('value').eq('key', 'artist_photo').maybeSingle();
    return json(res, { photo: data?.value ?? null });
  }

  if (req.method === 'POST') {
    if (!checkAdmin(req)) return json(res, { error: 'Non autorisé' }, 401);
    const b = req.body ?? {};

    if (b.action === 'delete') {
      await supabase.from('settings').delete().eq('key', 'artist_photo');
      return json(res, { success: true });
    }

    const photo = String(b.photo ?? '');
    if (!photo.startsWith('data:image/'))
      return json(res, { error: 'Format invalide (data:image/ requis)' }, 400);
    if (photo.length > MAX_PHOTO_SIZE)
      return json(res, { error: 'Image trop lourde (max ~2 Mo)' }, 400);

    const { error } = await supabase.from('settings').upsert(
      { key: 'artist_photo', value: photo, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) { console.error('[save-photo]', error.message); return json(res, { error: 'Erreur serveur' }, 500); }
    return json(res, { success: true });
  }

  return json(res, { error: 'Méthode non autorisée' }, 405);
};
