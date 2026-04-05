// M.A.C JAMAIS ASSEZ — api/save-commande.js
const { supabase, json, cors, clean, isEmail, isPhone } = require('./_shared');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'POST')    return json(res, { error: 'Méthode non autorisée' }, 405);

  const b = req.body ?? {};
  const nom    = clean(b.nom    ?? '');
  const prenom = clean(b.prenom ?? '');
  const email  = clean(b.email  ?? '');
  const tel    = clean(b.tel    ?? '');
  const ville  = clean(b.ville  ?? '');
  const album  = clean(b.album  ?? '');
  const prix   = clean(b.prix   ?? '');
  const qty    = Math.max(1, Math.min(99, parseInt(b.quantite) || 1));

  if (!nom || !prenom)      return json(res, { error: 'Nom et prénom obligatoires' }, 400);
  if (!isEmail(email))      return json(res, { error: 'Email invalide' }, 400);
  if (!album)               return json(res, { error: 'Album manquant' }, 400);
  if (tel && !isPhone(tel)) return json(res, { error: 'Téléphone invalide' }, 400);

  const id   = 'CMD-' + Date.now();
  const date = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' });

  const { error } = await supabase.from('commandes')
    .insert({ id, nom, prenom, email, tel, ville, album, prix, quantite: qty, statut: 'en_attente', date });

  if (error) { console.error('[save-commande]', error.message); return json(res, { error: 'Erreur serveur' }, 500); }
  return json(res, { success: true, id });
};
