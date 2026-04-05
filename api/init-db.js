// M.A.C JAMAIS ASSEZ — api/init-db.js
// GET → vérifie les tables Supabase (admin)
const { supabase, json, cors, checkAdmin } = require('./_shared');

const TABLES = ['albums','evenements','commandes','reservations','messages','newsletter','settings','galerie'];

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (!checkAdmin(req)) return json(res, { error: 'Non autorisé' }, 401);

  const results = await Promise.all(
    TABLES.map(async t => {
      const { error } = await supabase.from(t).select('id').limit(1);
      return [t, error ? `❌ ${error.message}` : '✅ OK'];
    })
  );

  const checks = Object.fromEntries(results);
  const ok = results.every(([, v]) => v.startsWith('✅'));

  return json(res, {
    success: ok,
    tables: checks,
    message: ok ? 'Toutes les tables sont accessibles.' : 'Certaines tables manquent — vérifiez Supabase SQL Editor.'
  }, ok ? 200 : 500);
};
