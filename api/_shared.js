// M.A.C JAMAIS ASSEZ — api/_shared.js
// Utilitaires partagés — Vercel Serverless Functions + Supabase

const { createClient } = require('@supabase/supabase-js');

// ── Supabase (variables d'env Vercel) ──
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Headers CORS ──
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'
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

// ── Auth admin timing-safe ──
function checkAdmin(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return true;
  const token = req.headers['x-admin-token'] ?? '';
  if (token.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

module.exports = { supabase, json, cors, clean, isValidUrl, isEmail, isPhone, checkAdmin };
