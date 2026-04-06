// M.A.C JAMAIS ASSEZ — api/_shared.js

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// ═══════════════════════════════════════════════════════
//  CONFIGURATION — Remplis uniquement ces 3 valeurs
//  Supabase → Settings → API pour les deux premières
// ═══════════════════════════════════════════════════════
const SUPABASE_URL = 'https://XXXXXXXXXXXXXXXX.supabase.co'; // ← Project URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXXX'; // ← service_role key
const JWT_SECRET   = 'CHANGE_MOI_une_chaine_longue_et_aleatoire_32chars+'; // ← clé secrète JWT (inventée par toi, min 32 caractères)
// ═══════════════════════════════════════════════════════

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Headers CORS ──
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// ── Réponse JSON ──
function json(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.status(status).json(data);
}

// ── Preflight CORS ──
function cors(res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.status(204).end();
}

// ── Sanitisation texte ──
function clean(str, max = 300) {
  if (typeof str !== 'string') return '';
  return str.trim()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .substring(0, max);
}

// ── Validation URL HTTPS ──
function isValidUrl(s) {
  try { const u = new URL(s); return u.protocol === 'https:'; }
  catch { return false; }
}

// ── Validations ──
const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e).toLowerCase());
const isPhone = p => /^[\d\s+\-()\x20]{7,20}$/.test(String(p));

// ── Vérifie le JWT dans le header Authorization: Bearer <token> ──
function checkAdmin(req) {
  try {
    const auth = req.headers['authorization'] ?? '';
    if (!auth.startsWith('Bearer ')) return false;
    const token = auth.slice(7);
    jwt.verify(token, JWT_SECRET); // lève une exception si invalide ou expiré
    return true;
  } catch {
    return false;
  }
}

// ── Génère un JWT admin (durée 8h) ──
function signAdminToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
}

module.exports = {
  supabase,
  jwt, JWT_SECRET,
  json, cors,
  clean, isValidUrl,
  isEmail, isPhone,
  checkAdmin, signAdminToken
};
