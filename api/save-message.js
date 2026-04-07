// api/save-message.js — POST /api/save-message
'use strict';
const { supabase, json, cors, clean, isEmail } = require('./_shared');

module.exports = async function(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'POST')    return json(res, { error: 'Méthode non autorisée' }, 405);
  const b = req.body || {};
  const prenom  = clean(b.prenom  || '');
  const nom     = clean(b.nom     || '');
  const email   = clean(b.email   || '');
  const sujet   = ['general','booking','presse','collaboration','autre'].includes(b.sujet) ? b.sujet : 'general';
  const message = clean(b.message || '', 1000);

  if (!prenom || !nom)    return json(res, { error: 'Prénom et nom obligatoires' }, 400);
  if (!isEmail(email))    return json(res, { error: 'Email invalide' }, 400);
  if (message.length < 5) return json(res, { error: 'Message trop court' }, 400);

  const id      = 'MSG-' + Date.now();
  const date_fr = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' });
  const { error } = await supabase.from('messages')
    .insert({ id, prenom, nom, email, sujet, message, lu: false, date_fr });
  if (error) { console.error('[save-message]', error.message); return json(res, { error: 'Erreur serveur' }, 500); }
  return json(res, { success: true, id });
};
