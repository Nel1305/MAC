// M.A.C JAMAIS ASSEZ — init-db.js
// GET /api/init-db  →  vérifie que les tables Supabase sont accessibles
// Protégé par X-Admin-Token

import { supabase, json, cors, checkAdmin } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (!checkAdmin(req))         return json({ error: 'Non autorisé' }, 401);

  const checks = {};

  // Vérifie chaque table en lisant 1 ligne
  const tables = ['albums', 'evenements', 'commandes', 'reservations', 'messages', 'newsletter', 'settings'];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    checks[table] = error ? `❌ ${error.message}` : '✅ OK';
  }

  const allOk = Object.values(checks).every(v => v.startsWith('✅'));

  return json({
    success: allOk,
    tables:  checks,
    message: allOk
      ? 'Toutes les tables sont accessibles. Le site est prêt.'
      : 'Certaines tables sont inaccessibles. Vérifiez Supabase SQL Editor.'
  }, allOk ? 200 : 500);
};

export const config = { path: '/api/init-db' };
