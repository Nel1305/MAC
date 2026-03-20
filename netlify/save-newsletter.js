// M.A.C JAMAIS ASSEZ — save-newsletter.js
// POST /api/save-newsletter

import { getStore } from '@netlify/blobs';
import { json, cors, isEmail, parseBody } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'POST')    return json({ error: 'Méthode non autorisée' }, 405);

  const body  = await parseBody(req);
  const email = String(body?.email ?? '').trim().toLowerCase().substring(0, 150);

  if (!isEmail(email)) return json({ error: 'Email invalide' }, 400);

  // Clé unique dérivée de l'email → pas de doublons
  const key = email.replace(/[@.+]/g, '_');
  const now = new Date();

  try {
    const store    = getStore('newsletter');
    const existing = await store.get(key).catch(() => null);
    if (existing)  return json({ success: true, alreadySubscribed: true });

    await store.setJSON(key, {
      email,
      date:      now.toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' }),
      createdAt: now.toISOString()
    });
  } catch (err) {
    console.error('[save-newsletter]', err?.message);
    return json({ error: 'Erreur serveur' }, 500);
  }

  return json({ success: true, alreadySubscribed: false });
};

export const config = { path: '/api/save-newsletter' };
