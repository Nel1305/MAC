// M.A.C JAMAIS ASSEZ — save-reservation.js
// POST /api/save-reservation

import { getStore } from '@netlify/blobs';
import { json, cors, clean, isEmail, isPhone, parseBody } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'POST')    return json({ error: 'Méthode non autorisée' }, 405);

  const body = await parseBody(req);
  if (!body) return json({ error: 'Données invalides' }, 400);

  const nom       = clean(body.nom        ?? '');
  const prenom    = clean(body.prenom     ?? '');
  const email     = clean(body.email      ?? '');
  const tel       = clean(body.tel        ?? '');
  const evenement = clean(body.evenement  ?? '');
  const date_ev   = clean(body.date_event ?? '');
  const lieu      = clean(body.lieu       ?? '');
  const prix      = clean(body.prix       ?? '');
  const qty       = Math.max(1, Math.min(20, parseInt(body.quantite) || 1));

  if (!nom || !prenom)  return json({ error: 'Nom et prénom obligatoires' }, 400);
  if (!isEmail(email))  return json({ error: 'Email invalide' }, 400);
  if (!tel)             return json({ error: 'Téléphone obligatoire' }, 400);
  if (!isPhone(tel))    return json({ error: 'Téléphone invalide' }, 400);
  if (!evenement)       return json({ error: 'Événement manquant' }, 400);

  const id  = 'RES-' + Date.now();
  const now = new Date();

  try {
    await getStore('reservations').setJSON(id, {
      id, nom, prenom, email, tel,
      evenement, date_event: date_ev, lieu, prix,
      quantite:  qty,
      statut:    'confirmee',
      date:      now.toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' }),
      createdAt: now.toISOString()
    });
  } catch (err) {
    console.error('[save-reservation]', err?.message);
    return json({ error: 'Erreur serveur' }, 500);
  }

  return json({ success: true, id });
};

export const config = { path: '/api/save-reservation' };
