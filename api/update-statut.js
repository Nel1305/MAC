// M.A.C JAMAIS ASSEZ — api/update-statut.js
const { supabase, json, cors, checkAdmin } = require('./_shared');

const ALLOWED = {
  commandes:    ['en_attente','traite','annule'],
  reservations: ['confirmee','traite','annule']
};

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'PATCH')   return json(res, { error: 'Méthode non autorisée' }, 405);
  if (!checkAdmin(req))         return json(res, { error: 'Non autorisé' }, 401);

  const { store, id, statut } = req.body ?? {};
  if (!ALLOWED[store])                  return json(res, { error: 'Store invalide' }, 400);
  if (!id)                              return json(res, { error: 'ID manquant' }, 400);
  if (!ALLOWED[store].includes(statut)) return json(res, { error: 'Statut invalide' }, 400);

  const { error } = await supabase.from(store).update({ statut }).eq('id', id);
  if (error) return json(res, { error: 'Erreur serveur' }, 500);
  return json(res, { success: true, id, statut });
};
