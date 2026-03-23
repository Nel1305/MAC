// M.A.C JAMAIS ASSEZ — save-newsletter.js
// POST /api/save-newsletter

import { supabase, json, cors, isEmail, parseBody } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'POST')    return json({ error: 'Méthode non autorisée' }, 405);

  const body  = await parseBody(req);
  const email = String(body?.email ?? '').trim().toLowerCase().substring(0, 150);

  if (!isEmail(email)) return json({ error: 'Email invalide' }, 400);

  // Vérifie si l'email existe déjà
  const { data: existing } = await supabase
    .from('newsletter')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (existing) return json({ success: true, alreadySubscribed: true });

  // Insère l'email
  const { error } = await supabase.from('newsletter').insert({ email });

  if (error) {
    console.error('[save-newsletter]', error.message);
    return json({ error: 'Erreur serveur' }, 500);
  }

  return json({ success: true, alreadySubscribed: false });
};

export const config = { path: '/api/save-newsletter' };
