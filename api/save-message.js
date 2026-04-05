// M.A.C JAMAIS ASSEZ — api/save-message.js
const { supabase, json, cors, clean, isEmail } = require('./_shared');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'POST')    return json(res, { error: 'Méthode non autorisée' }, 405);

  const b       = req.body ?? {};
  const nom     = clean(b.nom     ?? '');
  const email   = clean(b.email   ?? '');
  const message = clean(b.message ?? '', 1000);

  if (!nom)             return json(res, { error: 'Nom obligatoire' }, 400);
  if (!isEmail(email))  return json(res, { error: 'Email invalide' }, 400);
  if (message.length<5) return json(res, { error: 'Message trop court' }, 400);

  const id   = 'MSG-' + Date.now();
  const date = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' });

  const { error } = await supabase.from('messages').insert({ id, nom, email, message, date });
  if (error) { console.error('[save-message]', error.message); return json(res, { error: 'Erreur serveur' }, 500); }
  return json(res, { success: true, id });
};
