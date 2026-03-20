// M.A.C JAMAIS ASSEZ — init-db.js
// GET /api/init-db  →  crée les tables si elles n'existent pas encore
// À appeler UNE SEULE FOIS après le premier déploiement
// Protégé par X-Admin-Token

import { sql, json, cors, checkAdmin } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (!checkAdmin(req))         return json({ error: 'Non autorisé' }, 401);

  try {
    // ── Commandes (achats albums) ──
    await sql`
      CREATE TABLE IF NOT EXISTS commandes (
        id          VARCHAR(30)  PRIMARY KEY,
        nom         VARCHAR(100) NOT NULL,
        prenom      VARCHAR(100) NOT NULL,
        email       VARCHAR(150) NOT NULL,
        tel         VARCHAR(30)  DEFAULT '',
        ville       VARCHAR(100) DEFAULT '',
        album       VARCHAR(200) NOT NULL,
        prix        VARCHAR(50)  DEFAULT '',
        quantite    INT          DEFAULT 1,
        statut      VARCHAR(20)  DEFAULT 'en_attente',
        date        VARCHAR(50)  NOT NULL,
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    // ── Réservations (billets) ──
    await sql`
      CREATE TABLE IF NOT EXISTS reservations (
        id          VARCHAR(30)  PRIMARY KEY,
        nom         VARCHAR(100) NOT NULL,
        prenom      VARCHAR(100) NOT NULL,
        email       VARCHAR(150) NOT NULL,
        tel         VARCHAR(30)  NOT NULL,
        evenement   VARCHAR(200) NOT NULL,
        date_event  VARCHAR(100) DEFAULT '',
        lieu        VARCHAR(200) DEFAULT '',
        prix        VARCHAR(50)  DEFAULT '',
        quantite    INT          DEFAULT 1,
        statut      VARCHAR(20)  DEFAULT 'confirmee',
        date        VARCHAR(50)  NOT NULL,
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    // ── Messages de contact ──
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id          VARCHAR(30)  PRIMARY KEY,
        nom         VARCHAR(100) NOT NULL,
        email       VARCHAR(150) NOT NULL,
        message     TEXT         NOT NULL,
        date        VARCHAR(50)  NOT NULL,
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    // ── Newsletter ──
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter (
        email       VARCHAR(150) PRIMARY KEY,
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    // ── Albums ──
    await sql`
      CREATE TABLE IF NOT EXISTS albums (
        id          INT          PRIMARY KEY,
        titre       VARCHAR(200) NOT NULL,
        annee       VARCHAR(10)  DEFAULT '',
        genre       VARCHAR(100) DEFAULT '',
        prix        VARCHAR(50)  DEFAULT '',
        badge       VARCHAR(20)  DEFAULT '',
        badge_label VARCHAR(30)  DEFAULT '',
        code        VARCHAR(10)  DEFAULT '',
        theme       VARCHAR(5)   DEFAULT 'a1',
        visible     BOOLEAN      DEFAULT TRUE,
        updated_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    // ── Événements ──
    await sql`
      CREATE TABLE IF NOT EXISTS evenements (
        id          INT          PRIMARY KEY,
        jour        VARCHAR(5)   DEFAULT '',
        mois        VARCHAR(10)  DEFAULT '',
        annee       VARCHAR(10)  DEFAULT '',
        titre       VARCHAR(200) NOT NULL,
        lieu        VARCHAR(200) DEFAULT '',
        type        VARCHAR(20)  DEFAULT 'concert',
        type_label  VARCHAR(30)  DEFAULT 'Concert',
        prix        VARCHAR(50)  DEFAULT '',
        statut      VARCHAR(20)  DEFAULT 'dispo',
        visible     BOOLEAN      DEFAULT TRUE,
        updated_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    // ── Données de départ albums ──
    await sql`
      INSERT INTO albums (id,titre,annee,genre,prix,badge,badge_label,code,theme,visible) VALUES
        (1,'Jamais Assez Vol.1','2024','Rap / Gospel',   '12 000 FCFA','new',   'Nouveau','JA', 'a1',true),
        (2,'Foi & Lumière',     '2022','Gospel / Mbalax','10 000 FCFA','gospel','Gospel', 'FOI','a2',true),
        (3,'Dakar Debout',      '2020','Rap / Mbalax',   '8 000 FCFA', '',      '',       'DKR','a3',true),
        (4,'Rue de la Médina',  '2017','Rap Sénégalais',  '6 000 FCFA', '',      '',       'RUE','a4',true)
      ON CONFLICT (id) DO NOTHING
    `;

    // ── Données de départ événements ──
    await sql`
      INSERT INTO evenements (id,jour,mois,annee,titre,lieu,type,type_label,prix,statut,visible) VALUES
        (1,'18','Avr','2025','Concert de Lancement — Jamais Assez Vol.1','CCBM — Centre Culturel Blaise Senghor, Dakar','concert','Concert', '7 500 FCFA','dispo',  true),
        (2,'02','Mai','2025','Soirée Gospel & Louange',                  'Église Évangélique de Dakar-Plateau',         'gospel', 'Gospel',  'Gratuit',  'dispo',  true),
        (3,'24','Mai','2025','Festival Hip-Hop Sénégal',                 'Stade Iba Mar Diop, Dakar',                   'festival','Festival','5 000 FCFA','dispo',  true),
        (4,'07','Jun','2025','Nuit du Mbalax — Spécial M.A.C',           'Thiossane Club, Dakar',                       'festival','Mbalax',  '—',        'complet',true),
        (5,'19','Jul','2025','Tournée Diaspora — Paris',                 'La Cigale, Paris, France',                    'concert','Concert',  '28 €',     'dispo',  true)
      ON CONFLICT (id) DO NOTHING
    `;

    return json({ success: true, message: 'Tables créées et données de départ insérées.' });

  } catch (err) {
    console.error('[init-db]', err?.message);
    return json({ error: err?.message || 'Erreur serveur' }, 500);
  }
};

export const config = { path: '/api/init-db' };
