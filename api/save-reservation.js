// api/save-reservation.js — POST /api/save-reservation
'use strict';
const { supabase, json, cors, clean, isEmail, isPhone } = require('./_shared');

module.exports = async function(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'POST')    return json(res, { error: 'Méthode non autorisée' }, 405);
  const b = req.body || {};
  const prenom    = clean(b.prenom     || '');
  const nom       = clean(b.nom        || '');
  const email     = clean(b.email      || '');
  const tel       = clean(b.tel        || '');
  const evenement = clean(b.evenement  || '');
  const date_ev   = clean(b.date_event || '');
  const lieu      = clean(b.lieu       || '');
  const prix      = clean(b.prix       || '');
  const qty       = Math.max(1, Math.min(20, parseInt(b.quantite) || 1));

  if (!prenom || !nom) return json(res, { error: 'Prénom et nom obligatoires' }, 400);
  if (!isEmail(email)) return json(res, { error: 'Email invalide' }, 400);
  if (!tel)            return json(res, { error: 'Téléphone obligatoire' }, 400);
  if (!isPhone(tel))   return json(res, { error: 'Téléphone invalide' }, 400);
  if (!evenement)      return json(res, { error: 'Événement manquant' }, 400);

  const id      = 'RES-' + Date.now();
  const date_fr = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' });
  const { error } = await supabase.from('reservations')
    .insert({ id, prenom, nom, email, tel, evenement, date_event: date_ev, lieu, prix, quantite: qty, statut: 'confirmee', date_fr });
  if (error) { console.error('[save-reservation]', error.message); return json(res, { error: 'Erreur serveur' }, 500); }
  return json(res, { success: true, id });
};
