// M.A.C JAMAIS ASSEZ — api/_shared.js
'use strict';

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// ═══════════════════════════════════════════════════════
//  CONFIGURATION — Remplis ces 3 valeurs uniquement
// ═══════════════════════════════════════════════════════
const SUPABASE_URL = 'https://xrsnvyhkduglfjpeagie.supabase.co'; // Supabase → Settings → API → Project URL
const SUPABASE_KEY = 'sb_publishable_o5CIsupL_A3hYruzzPkxwQ_27DVt1e6'; // Supabase → Settings → API → service_role
const JWT_SECRET   = 'sb_secret_q3-IiLd3Cxs9lQRdlwamWA_2EYBRkdx'; // invente une clé longue
// ═══════════════════════════════════════════════════════

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function json(res, data, status = 200) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(data);
}

function cors(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  res.status(204).end();
}

function clean(str, max = 300) {
  if (typeof str !== 'string') return '';
  return str.trim()
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;')
    .substring(0, max);
}

function isValidUrl(s) {
  try { const u = new URL(s); return u.protocol === 'https:'; }
  catch { return false; }
}

const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e).toLowerCase());
const isPhone = p => /^[\d\s+\-()\x20]{7,20}$/.test(String(p));

function checkAdmin(req) {
  try {
    const auth = req.headers['authorization'] ?? '';
    if (!auth.startsWith('Bearer ')) return false;
    jwt.verify(auth.slice(7), JWT_SECRET);
    return true;
  } catch { return false; }
}

function signAdminToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
}

module.exports = { supabase, json, cors, clean, isValidUrl, isEmail, isPhone, checkAdmin, signAdminToken };
