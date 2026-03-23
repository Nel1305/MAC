// M.A.C JAMAIS ASSEZ — _shared.js
// Utilitaires partagés + connexion Supabase

import { createClient } from '@supabase/supabase-js';

// ── Connexion Supabase ──
// Ces variables sont définies dans Netlify → Environment variables
const SUPABASE_URL = https://iszoodumwzpovxotisnm.supabase.co;
const SUPABASE_KEY = sb_publishable_Lml4ABUXc8PIkxpC3WsF9Q_hwXwBd2k; // service_role key (côté serveur uniquement)

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Réponse JSON + CORS ──
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':                 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
      'Cache-Control':                'no-store'
    }
  });
}

// ── Preflight CORS ──
export function cors() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'
    }
  });
}

// ── Sanitisation XSS ──
export function clean(str, max = 300) {
  if (typeof str !== 'string') return '';
  return str.trim()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;')
    .substring(0, max);
}

// ── Validations ──
export const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e));
export const isPhone = p => /^[\d\s+\-()\x20]{7,20}$/.test(String(p));

// ── Auth admin ──
export function checkAdmin(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return true;
  return req.headers.get('X-Admin-Token') === secret;
}

// ── Parse body JSON ──
export async function parseBody(req) {
  try { return await req.json(); }
  catch { return null; }
}
