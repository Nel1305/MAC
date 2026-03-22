// M.A.C JAMAIS ASSEZ — init-db.js
// GET /api/init-db  →  crée les tables Supabase (1 seule fois)
// Protégé par X-Admin-Token

import { supabase, json, cors, checkAdmin } from './_shared.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (!checkAdmin(req))         return json({ error: 'Non autorisé' }, 401);

  try {
    // Supabase permet d'exécuter du SQL brut via rpc('exec_sql')
    // On crée toutes les tables avec CREATE TABLE IF NOT EXISTS
    const queries = [

      // Commandes
      `CREATE TABLE IF NOT EXISTS commandes (
        id          TEXT        PRIMARY KEY,
        nom         TEXT        NOT NULL,
        prenom      TEXT        NOT NULL,
        email       TEXT        NOT NULL,
        tel         TEXT        DEFAULT '',
        ville       TEXT        DEFAULT '',
        album       TEXT        NOT NULL,
        prix        TEXT        DEFAULT '',
        quantite    INT         DEFAULT 1,
        statut      TEXT        DEFAULT 'en_attente',
        date        TEXT        NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )`,

      // Réservations
      `CREATE TABLE IF NOT EXISTS reservations (
        id          TEXT        PRIMARY KEY,
        nom         TEXT        NOT NULL,
        prenom      TEXT        NOT NULL,
        email       TEXT        NOT NULL,
        tel         TEXT        NOT NULL,
        evenement   TEXT        NOT NULL,
        date_event  TEXT        DEFAULT '',
        lieu        TEXT        DEFAULT '',
        prix        TEXT        DEFAULT '',
        quantite    INT         DEFAULT 1,
        statut      TEXT        DEFAULT 'confirmee',
        date        TEXT        NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )`,

      // Messages
      `CREATE TABLE IF NOT EXISTS messages (
        id          TEXT        PRIMARY KEY,
        nom         TEXT        NOT NULL,
        email       TEXT        NOT NULL,
        message     TEXT        NOT NULL,
        date        TEXT        NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )`,

      // Newsletter
      `CREATE TABLE IF NOT EXISTS newsletter (
        email       TEXT        PRIMARY KEY,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )`,

      // Albums
      `CREATE TABLE IF NOT EXISTS albums (
        id          INT         PRIMARY KEY,
        titre       TEXT        NOT NULL,
        annee       TEXT        DEFAULT '',
        genre       TEXT        DEFAULT '',
        prix        TEXT        DEFAULT '',
        badge       TEXT        DEFAULT '',
        badge_label TEXT        DEFAULT '',
        code        TEXT        DEFAULT '',
        theme       TEXT        DEFAULT 'a1',
        visible     BOOLEAN     DEFAULT TRUE,
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )`,

      // Événements
      `CREATE TABLE IF NOT EXISTS evenements (
        id          INT         PRIMARY KEY,
        jour        TEXT        DEFAULT '',
        mois        TEXT        DEFAULT '',
        annee       TEXT        DEFAULT '',
        titre       TEXT        NOT NULL,
        lieu        TEXT        DEFAULT '',
        type        TEXT        DEFAULT 'concert',
        type_label  TEXT        DEFAULT 'Concert',
        prix        TEXT        DEFAULT '',
        statut      TEXT        DEFAULT 'dispo',
        visible     BOOLEAN     DEFAULT TRUE,
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )`,

      // Settings (photo artiste, etc.)
      `CREATE TABLE IF NOT EXISTS settings (
        key         TEXT        PRIMARY KEY,
        value       TEXT,
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )`
    ];

    // Exécute chaque requête via Supabase RPC
    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { query });
      if (error) throw new Error(error.message);
    }

    // Données de départ — Albums
    await supabase.from('albums').upsert([
      { id:1, titre:'Jamais Assez Vol.1', annee:'2024', genre:'Rap / Gospel',    prix:'12 000 FCFA', badge:'new',    badge_label:'Nouveau', code:'JA',  theme:'a1', visible:true },
      { id:2, titre:'Foi & Lumière',      annee:'2022', genre:'Gospel / Mbalax', prix:'10 000 FCFA', badge:'gospel', badge_label:'Gospel',  code:'FOI', theme:'a2', visible:true },
      { id:3, titre:'Dakar Debout',       annee:'2020', genre:'Rap / Mbalax',    prix:'8 000 FCFA',  badge:'',       badge_label:'',        code:'DKR', theme:'a3', visible:true },
      { id:4, titre:'Rue de la Médina',   annee:'2017', genre:'Rap Sénégalais',  prix:'6 000 FCFA',  badge:'',       badge_label:'',        code:'RUE', theme:'a4', visible:true }
    ], { onConflict: 'id', ignoreDuplicates: true });

    // Données de départ — Événements
    await supabase.from('evenements').upsert([
      { id:1, jour:'18', mois:'Avr', annee:'2025', titre:'Concert de Lancement — Jamais Assez Vol.1', lieu:'CCBM — Centre Culturel Blaise Senghor, Dakar', type:'concert', type_label:'Concert',  prix:'7 500 FCFA', statut:'dispo',   visible:true },
      { id:2, jour:'02', mois:'Mai', annee:'2025', titre:'Soirée Gospel & Louange',                   lieu:'Église Évangélique de Dakar-Plateau',           type:'gospel',  type_label:'Gospel',   prix:'Gratuit',    statut:'dispo',   visible:true },
      { id:3, jour:'24', mois:'Mai', annee:'2025', titre:'Festival Hip-Hop Sénégal',                  lieu:'Stade Iba Mar Diop, Dakar',                     type:'festival',type_label:'Festival', prix:'5 000 FCFA', statut:'dispo',   visible:true },
      { id:4, jour:'07', mois:'Jun', annee:'2025', titre:'Nuit du Mbalax — Spécial M.A.C',            lieu:'Thiossane Club, Dakar',                         type:'festival',type_label:'Mbalax',   prix:'—',          statut:'complet', visible:true },
      { id:5, jour:'19', mois:'Jul', annee:'2025', titre:'Tournée Diaspora — Paris',                  lieu:'La Cigale, Paris, France',                      type:'concert', type_label:'Concert',  prix:'28 €',       statut:'dispo',   visible:true }
    ], { onConflict: 'id', ignoreDuplicates: true });

    return json({ success: true, message: 'Tables créées et données de départ insérées.' });

  } catch (err) {
    console.error('[init-db]', err?.message);
    // Fallback : Supabase Dashboard → SQL Editor est plus simple
    return json({
      error: err?.message,
      tip: 'Si exec_sql échoue, créez les tables manuellement dans Supabase Dashboard → SQL Editor.'
    }, 500);
  }
};

export const config = { path: '/api/init-db' };
