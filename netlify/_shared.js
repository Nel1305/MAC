// M.A.C JAMAIS ASSEZ — _shared.js  (Netlify Functions)
// Utilitaires partagés — optimisés pour Netlify Blobs

// ── Réponse JSON + CORS ──
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':                'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type, X-Admin-Token',
      'Cache-Control':               'no-store, no-cache'
    }
  });
}

// ── Preflight CORS ──
export function cors() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type, X-Admin-Token'
    }
  });
}

// ── Sanitisation XSS ──
export function clean(str, max = 300) {
  if (typeof str !== 'string') return '';
  return str.trim()
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;').replace(/\//g,'&#x2F;')
    .substring(0, max);
}

// ── Validations ──
export const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e));
export const isPhone = p => /^[\d\s+\-()\x20]{7,20}$/.test(String(p));

// ── Auth admin via variable d'environnement ADMIN_SECRET ──
export function checkAdmin(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return true; // dev local sans secret = accès libre
  return req.headers.get('X-Admin-Token') === secret;
}

// ── Parse body JSON sécurisé ──
export async function parseBody(req) {
  try { return await req.json(); }
  catch { return null; }
}
