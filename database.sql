-- ══════════════════════════════════════════════════
--  M.A.C JAMAIS ASSEZ — Base de données MySQL
--  Copiez ce code dans phpMyAdmin → onglet SQL
-- ══════════════════════════════════════════════════

-- Table commandes (achats albums)
CREATE TABLE IF NOT EXISTS `commandes` (
  `id`        VARCHAR(30)  NOT NULL PRIMARY KEY,
  `nom`       VARCHAR(100) NOT NULL,
  `prenom`    VARCHAR(100) NOT NULL,
  `email`     VARCHAR(150) NOT NULL,
  `tel`       VARCHAR(30)  DEFAULT '',
  `ville`     VARCHAR(100) DEFAULT '',
  `album`     VARCHAR(200) NOT NULL,
  `prix`      VARCHAR(50)  DEFAULT '',
  `quantite`  INT          DEFAULT 1,
  `statut`    ENUM('en_attente','traite','annule') DEFAULT 'en_attente',
  `date`      VARCHAR(50)  NOT NULL,
  `created_at` TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table reservations (billets concerts)
CREATE TABLE IF NOT EXISTS `reservations` (
  `id`         VARCHAR(30)  NOT NULL PRIMARY KEY,
  `nom`        VARCHAR(100) NOT NULL,
  `prenom`     VARCHAR(100) NOT NULL,
  `email`      VARCHAR(150) NOT NULL,
  `tel`        VARCHAR(30)  NOT NULL,
  `evenement`  VARCHAR(200) NOT NULL,
  `date_event` VARCHAR(100) DEFAULT '',
  `lieu`       VARCHAR(200) DEFAULT '',
  `prix`       VARCHAR(50)  DEFAULT '',
  `quantite`   INT          DEFAULT 1,
  `statut`     ENUM('confirmee','traite','annule') DEFAULT 'confirmee',
  `date`       VARCHAR(50)  NOT NULL,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table messages (formulaire de contact)
CREATE TABLE IF NOT EXISTS `messages` (
  `id`         VARCHAR(30)  NOT NULL PRIMARY KEY,
  `nom`        VARCHAR(100) NOT NULL,
  `email`      VARCHAR(150) NOT NULL,
  `message`    TEXT         NOT NULL,
  `date`       VARCHAR(50)  NOT NULL,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table newsletter (abonnés)
CREATE TABLE IF NOT EXISTS `newsletter` (
  `email`      VARCHAR(150) NOT NULL PRIMARY KEY,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table albums (catalogue)
CREATE TABLE IF NOT EXISTS `albums` (
  `id`          INT          NOT NULL PRIMARY KEY,
  `titre`       VARCHAR(200) NOT NULL,
  `annee`       VARCHAR(10)  DEFAULT '',
  `genre`       VARCHAR(100) DEFAULT '',
  `prix`        VARCHAR(50)  DEFAULT '',
  `badge`       VARCHAR(20)  DEFAULT '',
  `badge_label` VARCHAR(30)  DEFAULT '',
  `code`        VARCHAR(10)  DEFAULT '',
  `theme`       VARCHAR(5)   DEFAULT 'a1',
  `visible`     TINYINT(1)   DEFAULT 1,
  `updated_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table evenements (agenda)
CREATE TABLE IF NOT EXISTS `evenements` (
  `id`          INT          NOT NULL PRIMARY KEY,
  `jour`        VARCHAR(5)   DEFAULT '',
  `mois`        VARCHAR(10)  DEFAULT '',
  `annee`       VARCHAR(10)  DEFAULT '',
  `titre`       VARCHAR(200) NOT NULL,
  `lieu`        VARCHAR(200) DEFAULT '',
  `type`        VARCHAR(20)  DEFAULT 'concert',
  `type_label`  VARCHAR(30)  DEFAULT 'Concert',
  `prix`        VARCHAR(50)  DEFAULT '',
  `statut`      ENUM('dispo','complet') DEFAULT 'dispo',
  `visible`     TINYINT(1)   DEFAULT 1,
  `updated_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Données de départ — Albums
INSERT IGNORE INTO `albums` (`id`,`titre`,`annee`,`genre`,`prix`,`badge`,`badge_label`,`code`,`theme`,`visible`) VALUES
(1,'Jamais Assez Vol.1','2024','Rap / Gospel',   '12 000 FCFA','new',   'Nouveau','JA', 'a1',1),
(2,'Foi & Lumière',     '2022','Gospel / Mbalax','10 000 FCFA','gospel','Gospel', 'FOI','a2',1),
(3,'Dakar Debout',      '2020','Rap / Mbalax',   '8 000 FCFA', '',      '',       'DKR','a3',1),
(4,'Rue de la Médina',  '2017','Rap Sénégalais',  '6 000 FCFA', '',      '',       'RUE','a4',1);

-- Données de départ — Événements
INSERT IGNORE INTO `evenements` (`id`,`jour`,`mois`,`annee`,`titre`,`lieu`,`type`,`type_label`,`prix`,`statut`,`visible`) VALUES
(1,'18','Avr','2025','Concert de Lancement — Jamais Assez Vol.1','CCBM — Centre Culturel Blaise Senghor, Dakar','concert','Concert','7 500 FCFA','dispo',1),
(2,'02','Mai','2025','Soirée Gospel & Louange',                  'Église Évangélique de Dakar-Plateau',         'gospel', 'Gospel', 'Gratuit',  'dispo',1),
(3,'24','Mai','2025','Festival Hip-Hop Sénégal',                 'Stade Iba Mar Diop, Dakar',                   'festival','Festival','5 000 FCFA','dispo',1),
(4,'07','Jun','2025','Nuit du Mbalax — Spécial M.A.C',           'Thiossane Club, Dakar',                       'festival','Mbalax',  '—',        'complet',1),
(5,'19','Jul','2025','Tournée Diaspora — Paris',                 'La Cigale, Paris, France',                    'concert','Concert', '28 €',     'dispo',1);
