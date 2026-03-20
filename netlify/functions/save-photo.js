// M.A.C JAMAIS ASSEZ — save-photo.js
// POST /api/save-photo   →  sauvegarde la photo artiste dans Neon
// GET  /api/save-photo   →  retourne la photo (public, pas de token)

import { sql, json, cors, checkAdmin, parseBody } from './_shared.js';

// Crée la table si elle n'existe pas
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key   VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();

  // ── GET : retourne la photo (appelé par index.html) ──
  if (req.method === 'GET') {
    try {
      await ensureTable();
      const rows = await sql`SELECT value FROM settings WHERE key = 'artist_photo'`;
      const photo = rows[0]?.value || null;
      return json({ photo });
    } catch (err) {
      console.error('[save-photo GET]', err?.message);
      return json({ photo: null });
    }
  }

  // ── POST : sauvegarde ou supprime la photo (admin uniquement) ──
  if (req.method === 'POST') {
    if (!checkAdmin(req)) return json({ error: 'Non autorisé' }, 401);

    const body = await parseBody(req);
    if (!body) return json({ error: 'Données invalides' }, 400);

    const { photo, action } = body; // action = 'save' | 'delete'

    try {
      await ensureTable();

      if (action === 'delete') {
        await sql`DELETE FROM settings WHERE key = 'artist_photo'`;
        return json({ success: true, action: 'deleted' });
      }

      // Vérifie que c'est bien une image base64
      if (!photo || !String(photo).startsWith('data:image/')) {
        return json({ error: 'Format image invalide' }, 400);
      }

      await sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES ('artist_photo', ${photo}, NOW())
        ON CONFLICT (key) DO UPDATE SET
          value      = EXCLUDED.value,
          updated_at = NOW()
      `;

      return json({ success: true, action: 'saved' });

    } catch (err) {
      console.error('[save-photo POST]', err?.message);
      return json({ error: 'Erreur serveur' }, 500);
    }
  }

  return json({ error: 'Méthode non autorisée' }, 405);
};

export const config = { path: '/api/save-photo' };
