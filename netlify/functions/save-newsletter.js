// M.A.C JAMAIS ASSEZ — save-newsletter.js
// POST /api/save-newsletter

import { supabase, json, cors, isEmail, parseBody } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'POST')    return json({ error: 'Méthode non autorisée' }, 405);

  const body  = await parseBody(req);
  const email = String(body?.email ?? '').trim().toLowerCase().substring(0, 150);

  if (!isEmail(email)) return json({ error: 'Email invalide' }, 400);

  // upsert avec ignoreDuplicates → pas d'erreur si l'email existe déjà
  const { error, data } = await supabase
    .from('newsletter')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })
    .select();

  if (error) {
    console.error('[save-newsletter]', error.message);
    return json({ error: 'Erreur serveur' }, 500);
  }

  const inserted = data && data.length > 0;
  return json({ success: true, alreadySubscribed: !inserted });
};

export const config = { path: '/api/save-newsletter' };
