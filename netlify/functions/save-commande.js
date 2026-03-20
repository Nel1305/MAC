// M.A.C JAMAIS ASSEZ — save-commande.js
// POST /api/save-commande

import { sql, json, cors, clean, isEmail, isPhone, parseBody } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'POST')    return json({ error: 'Méthode non autorisée' }, 405);

  const body = await parseBody(req);
  if (!body) return json({ error: 'Données invalides' }, 400);

  const nom    = clean(body.nom    ?? '');
  const prenom = clean(body.prenom ?? '');
  const email  = clean(body.email  ?? '');
  const tel    = clean(body.tel    ?? '');
  const ville  = clean(body.ville  ?? '');
  const album  = clean(body.album  ?? '');
  const prix   = clean(body.prix   ?? '');
  const qty    = Math.max(1, Math.min(99, parseInt(body.quantite) || 1));

  if (!nom || !prenom)      return json({ error: 'Nom et prénom obligatoires' }, 400);
  if (!isEmail(email))      return json({ error: 'Email invalide' }, 400);
  if (!album)               return json({ error: 'Album manquant' }, 400);
  if (tel && !isPhone(tel)) return json({ error: 'Téléphone invalide' }, 400);

  const id   = 'CMD-' + Date.now();
  const date = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' });

  try {
    await sql`
      INSERT INTO commandes (id, nom, prenom, email, tel, ville, album, prix, quantite, statut, date)
      VALUES (${id}, ${nom}, ${prenom}, ${email}, ${tel}, ${ville}, ${album}, ${prix}, ${qty}, 'en_attente', ${date})
    `;
  } catch (err) {
    console.error('[save-commande]', err?.message);
    return json({ error: 'Erreur serveur' }, 500);
  }

  return json({ success: true, id });
};

export const config = { path: '/api/save-commande' };
