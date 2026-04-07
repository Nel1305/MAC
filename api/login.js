// api/login.js — POST /api/login
'use strict';
const bcrypt = require('bcryptjs');
const { supabase, json, cors, signAdminToken } = require('./_shared');

const attempts = new Map();
const MAX = 5, LOCK = 15 * 60 * 1000;

module.exports = async function(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'POST')    return json(res, { error: 'Méthode non autorisée' }, 405);

  const ip = (req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const now = Date.now();
  const att = attempts.get(ip) || { count: 0, firstAt: now };

  if (att.count >= MAX && now - att.firstAt < LOCK) {
    return json(res, { error: `Trop de tentatives. Réessayez dans ${Math.ceil((LOCK - now + att.firstAt) / 60000)} min.` }, 429);
  }

  const { username = '', password = '' } = req.body || {};
  if (!username || !password) return json(res, { error: 'Identifiant et mot de passe requis' }, 400);

  const { data: user } = await supabase.from('admin_users')
    .select('password_hash, active')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle();

  const ok = user?.active && password && await bcrypt.compare(password, user.password_hash || '');

  if (!ok) {
    att.count++; att.firstAt = att.count === 1 ? now : att.firstAt;
    attempts.set(ip, att);
    await new Promise(r => setTimeout(r, 600));
    return json(res, { error: 'Identifiant ou mot de passe incorrect' }, 401);
  }

  attempts.delete(ip);
  return json(res, { success: true, token: signAdminToken() });
};
