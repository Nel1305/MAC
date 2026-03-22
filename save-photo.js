// M.A.C JAMAIS ASSEZ — save-photo.js
// GET  /api/save-photo        → retourne la photo (public)
// POST /api/save-photo        → sauvegarde ou supprime (admin)

import { supabase, json, cors, checkAdmin, parseBody } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();

  // ── GET : retourne la photo pour index.html ──
  if (req.method === 'GET') {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'artist_photo')
      .single();
    return json({ photo: data?.value || null });
  }

  // ── POST : sauvegarde ou supprime (admin) ──
  if (req.method === 'POST') {
    if (!checkAdmin(req)) return json({ error: 'Non autorisé' }, 401);

    const body = await parseBody(req);
    if (!body) return json({ error: 'Données invalides' }, 400);

    if (body.action === 'delete') {
      await supabase.from('settings').delete().eq('key', 'artist_photo');
      return json({ success: true, action: 'deleted' });
    }

    if (!body.photo || !String(body.photo).startsWith('data:image/')) {
      return json({ error: 'Format image invalide' }, 400);
    }

    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'artist_photo', value: body.photo, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      console.error('[save-photo]', error.message);
      return json({ error: 'Erreur serveur' }, 500);
    }

    return json({ success: true, action: 'saved' });
  }

  return json({ error: 'Méthode non autorisée' }, 405);
};

export const config = { path: '/api/save-photo' };
