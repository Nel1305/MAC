// M.A.C JAMAIS ASSEZ — api/login.js
// POST /api/login → vérifie identifiants, retourne un JWT
// Les identifiants sont stockés dans Supabase (table admin_users)

const bcrypt = require('bcryptjs');
const { supabase, json, cors, signAdminToken } = require('./_shared');

// Rate-limit simple en mémoire (reset au redémarrage de la fonction)
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'POST')    return json(res, { error: 'Méthode non autorisée' }, 405);

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();

  // Vérifie le rate-limit par IP
  const att = attempts.get(ip);
  if (att && att.count >= MAX_ATTEMPTS && now - att.firstAt < LOCK_DURATION) {
    const resteSec = Math.ceil((LOCK_DURATION - (now - att.firstAt)) / 1000);
    return json(res, { error: `Trop de tentatives. Réessayez dans ${Math.ceil(resteSec/60)} min.` }, 429);
  }

  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return json(res, { error: 'Identifiant et mot de passe requis' }, 400);
  }

  // Cherche l'utilisateur dans Supabase
  const { data: user, error } = await supabase
    .from('admin_users')
    .select('username, password_hash, active')
    .eq('username', String(username).trim().toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('[login]', error.message);
    return json(res, { error: 'Erreur serveur' }, 500);
  }

  // Vérifie le mot de passe avec bcrypt
  const valid = user?.active && await bcrypt.compare(String(password), user.password_hash ?? '');

  if (!valid) {
    // Enregistre la tentative échouée
    if (!att) {
      attempts.set(ip, { count: 1, firstAt: now });
    } else {
      att.count++;
      if (att.count >= MAX_ATTEMPTS) att.firstAt = now; // repart le timer
    }
    // Délai artificiel pour ralentir le brute-force
    await new Promise(r => setTimeout(r, 500));
    return json(res, { error: 'Identifiant ou mot de passe incorrect' }, 401);
  }

  // Succès — reset les tentatives
  attempts.delete(ip);

  // Génère et retourne le JWT
  const token = signAdminToken();
  return json(res, { success: true, token });
};
