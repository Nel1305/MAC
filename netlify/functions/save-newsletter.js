// M.A.C JAMAIS ASSEZ — save-newsletter.js
// POST /api/save-newsletter

import { sql, json, cors, isEmail, parseBody } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'POST')    return json({ error: 'Méthode non autorisée' }, 405);

  const body  = await parseBody(req);
  const email = String(body?.email ?? '').trim().toLowerCase().substring(0, 150);

  if (!isEmail(email)) return json({ error: 'Email invalide' }, 400);

  try {
    // INSERT OR IGNORE via ON CONFLICT (email est PRIMARY KEY)
    const result = await sql`
      INSERT INTO newsletter (email)
      VALUES (${email})
      ON CONFLICT (email) DO NOTHING
    `;

    const inserted = result.count > 0;
    return json({ success: true, alreadySubscribed: !inserted });

  } catch (err) {
    console.error('[save-newsletter]', err?.message);
    return json({ error: 'Erreur serveur' }, 500);
  }
};

export const config = { path: '/api/save-newsletter' };
