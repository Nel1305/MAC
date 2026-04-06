// M.A.C JAMAIS ASSEZ — api/setup-admin.js
// GET /api/setup-admin?username=admin&password=TON_MOT_DE_PASSE
// ⚠ À appeler UNE SEULE FOIS après déploiement pour créer le compte admin
// ⚠ Supprime ce fichier de ton repo après utilisation

const bcrypt = require('bcryptjs');
const { supabase, json, cors } = require('./_shared');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res);

  const username = String(req.query.username ?? '').trim().toLowerCase();
  const password = String(req.query.password ?? '');

  if (!username || !password) {
    return json(res, {
      error: 'Paramètres manquants',
      usage: '/api/setup-admin?username=admin&password=TON_MOT_DE_PASSE'
    }, 400);
  }

  if (password.length < 8) {
    return json(res, { error: 'Mot de passe trop court (minimum 8 caractères)' }, 400);
  }

  // Hash bcrypt (coût 12 = sécurisé et rapide)
  const hash = await bcrypt.hash(password, 12);

  // Insère ou met à jour l'admin
  const { error } = await supabase
    .from('admin_users')
    .upsert({ username, password_hash: hash, active: true }, { onConflict: 'username' });

  if (error) {
    console.error('[setup-admin]', error.message);
    return json(res, { error: error.message }, 500);
  }

  return json(res, {
    success: true,
    message: `Compte "${username}" créé avec succès. Supprime maintenant api/setup-admin.js de ton repo !`,
    username
  });
};
