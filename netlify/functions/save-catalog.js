// M.A.C JAMAIS ASSEZ — save-catalog.js
// POST /api/save-catalog  →  protégé X-Admin-Token
// Gère albums, événements et suppression newsletter

import { sql, json, cors, clean, checkAdmin, parseBody } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (req.method !== 'POST')    return json({ error: 'Méthode non autorisée' }, 405);
  if (!checkAdmin(req))         return json({ error: 'Non autorisé' }, 401);

  const body = await parseBody(req);
  if (!body) return json({ error: 'Données invalides' }, 400);

  const { store, action, item } = body;

  if (!['albums','events','newsletter'].includes(store)) return json({ error: 'Store invalide' }, 400);
  if (!['set','delete'].includes(action))                return json({ error: 'Action invalide' }, 400);
  if (!item?.id)                                         return json({ error: 'ID manquant' }, 400);

  try {

    /* ── SUPPRESSION ── */
    if (action === 'delete') {
      if (store === 'albums') {
        await sql`DELETE FROM albums WHERE id = ${parseInt(item.id)}`;
      } else if (store === 'events') {
        await sql`DELETE FROM evenements WHERE id = ${parseInt(item.id)}`;
      } else if (store === 'newsletter') {
        // Pour newsletter, item.id est l'email
        await sql`DELETE FROM newsletter WHERE email = ${String(item.id)}`;
      }
      return json({ success: true, action: 'deleted', id: item.id });
    }

    /* ── SAUVEGARDE / MISE À JOUR ── */
    if (store === 'albums') {
      const id         = parseInt(item.id);
      const titre      = clean(item.titre      ?? '');
      const annee      = clean(item.annee      ?? '');
      const genre      = clean(item.genre      ?? '');
      const prix       = clean(item.prix       ?? '');
      const badge      = clean(item.badge      ?? '');
      const badgeLabel = clean(item.badgeLabel ?? '');
      const code       = clean(item.code       ?? '').toUpperCase();
      const theme      = ['a1','a2','a3','a4'].includes(item.theme) ? item.theme : 'a1';
      const visible    = !!item.visible;

      await sql`
        INSERT INTO albums (id, titre, annee, genre, prix, badge, badge_label, code, theme, visible)
        VALUES (${id}, ${titre}, ${annee}, ${genre}, ${prix}, ${badge}, ${badgeLabel}, ${code}, ${theme}, ${visible})
        ON CONFLICT (id) DO UPDATE SET
          titre      = EXCLUDED.titre,
          annee      = EXCLUDED.annee,
          genre      = EXCLUDED.genre,
          prix       = EXCLUDED.prix,
          badge      = EXCLUDED.badge,
          badge_label= EXCLUDED.badge_label,
          code       = EXCLUDED.code,
          theme      = EXCLUDED.theme,
          visible    = EXCLUDED.visible,
          updated_at = NOW()
      `;
    }

    if (store === 'events') {
      const id        = parseInt(item.id);
      const jour      = clean(item.jour      ?? '');
      const mois      = clean(item.mois      ?? '');
      const annee     = clean(item.annee     ?? '');
      const titre     = clean(item.titre     ?? '');
      const lieu      = clean(item.lieu      ?? '');
      const type      = ['concert','festival','gospel'].includes(item.type) ? item.type : 'concert';
      const typeLabel = clean(item.typeLabel ?? 'Concert');
      const prix      = clean(item.prix      ?? '');
      const statut    = item.statut === 'complet' ? 'complet' : 'dispo';
      const visible   = !!item.visible;

      await sql`
        INSERT INTO evenements (id, jour, mois, annee, titre, lieu, type, type_label, prix, statut, visible)
        VALUES (${id}, ${jour}, ${mois}, ${annee}, ${titre}, ${lieu}, ${type}, ${typeLabel}, ${prix}, ${statut}, ${visible})
        ON CONFLICT (id) DO UPDATE SET
          jour       = EXCLUDED.jour,
          mois       = EXCLUDED.mois,
          annee      = EXCLUDED.annee,
          titre      = EXCLUDED.titre,
          lieu       = EXCLUDED.lieu,
          type       = EXCLUDED.type,
          type_label = EXCLUDED.type_label,
          prix       = EXCLUDED.prix,
          statut     = EXCLUDED.statut,
          visible    = EXCLUDED.visible,
          updated_at = NOW()
      `;
    }

    return json({ success: true, action: 'saved', id: item.id });

  } catch (err) {
    console.error(`[save-catalog:${store}]`, err?.message);
    return json({ error: 'Erreur serveur' }, 500);
  }
};

export const config = { path: '/api/save-catalog' };
