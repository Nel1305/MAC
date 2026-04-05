// M.A.C JAMAIS ASSEZ — api/save-newsletter.js
const { supabase, json, cors, isEmail } = require('./_shared');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'POST')    return json(res, { error: 'Méthode non autorisée' }, 405);

  const email = String(req.body?.email ?? '').trim().toLowerCase().substring(0, 150);
  if (!isEmail(email)) return json(res, { error: 'Email invalide' }, 400);

  const { data: ex } = await supabase.from('newsletter').select('email').eq('email', email).maybeSingle();
  if (ex) return json(res, { success: true, alreadySubscribed: true });

  const { error } = await supabase.from('newsletter').insert({ email });
  if (error) return json(res, { error: 'Erreur serveur' }, 500);
  return json(res, { success: true, alreadySubscribed: false });
};
