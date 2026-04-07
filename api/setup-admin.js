// api/setup-admin.js — GET /api/setup-admin?username=admin&password=XXXX
// ⚠ Appeler UNE SEULE FOIS puis supprimer ce fichier du repo
'use strict';
const bcrypt = require('bcryptjs');
const { supabase, json, cors } = require('./_shared');

module.exports = async function(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  const { username = '', password = '' } = req.query;
  if (!username || !password) return json(res, { error: 'username et password requis', usage: '/api/setup-admin?username=admin&password=TonMotDePasse' }, 400);
  if (password.length < 8)    return json(res, { error: 'Mot de passe minimum 8 caractères' }, 400);
  const hash = await bcrypt.hash(password, 12);
  const { error } = await supabase.from('admin_users')
    .upsert({ username: username.toLowerCase(), password_hash: hash, active: true }, { onConflict: 'username' });
  if (error) return json(res, { error: error.message }, 500);
  return json(res, { success: true, message: `Compte "${username}" créé. Supprime maintenant api/setup-admin.js !` });
};
