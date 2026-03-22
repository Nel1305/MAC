// M.A.C JAMAIS ASSEZ — save-message.js
// POST /api/save-message

import { supabase, json, cors, clean, isEmail, parseBody } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'POST')    return json({ error: 'Méthode non autorisée' }, 405);

  const body = await parseBody(req);
  if (!body) return json({ error: 'Données invalides' }, 400);

  const nom     = clean(body.nom     ?? '');
  const email   = clean(body.email   ?? '');
  const message = clean(body.message ?? '', 1000);

  if (!nom)               return json({ error: 'Nom obligatoire' }, 400);
  if (!isEmail(email))    return json({ error: 'Email invalide' }, 400);
  if (message.length < 5) return json({ error: 'Message trop court' }, 400);

  const id   = 'MSG-' + Date.now();
  const date = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' });

  const { error } = await supabase.from('messages').insert({ id, nom, email, message, date });

  if (error) {
    console.error('[save-message]', error.message);
    return json({ error: 'Erreur serveur' }, 500);
  }

  return json({ success: true, id });
};

export const config = { path: '/api/save-message' };
