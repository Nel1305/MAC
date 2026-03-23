// M.A.C JAMAIS ASSEZ — init-db.js
// GET /api/init-db  →  insère les données de départ (albums + événements)
// Les tables doivent être créées via Supabase Dashboard → SQL Editor
// Protégé par X-Admin-Token

import { supabase, json, cors, checkAdmin } from './_shared.js';

const DEFAULT_ALBUMS = [
  { id:1, titre:'Jamais Assez Vol.1', annee:'2024', genre:'Rap / Gospel',    prix:'12 000 FCFA', badge:'new',    badge_label:'Nouveau', code:'JA',  theme:'a1', visible:true },
  { id:2, titre:'Foi & Lumière',      annee:'2022', genre:'Gospel / Mbalax', prix:'10 000 FCFA', badge:'gospel', badge_label:'Gospel',  code:'FOI', theme:'a2', visible:true },
  { id:3, titre:'Dakar Debout',       annee:'2020', genre:'Rap / Mbalax',    prix:'8 000 FCFA',  badge:'',       badge_label:'',        code:'DKR', theme:'a3', visible:true },
  { id:4, titre:'Rue de la Médina',   annee:'2017', genre:'Rap Sénégalais',  prix:'6 000 FCFA',  badge:'',       badge_label:'',        code:'RUE', theme:'a4', visible:true }
];

const DEFAULT_EVENTS = [
  { id:1, jour:'18', mois:'Avr', annee:'2025', titre:'Concert de Lancement — Jamais Assez Vol.1', lieu:'CCBM — Centre Culturel Blaise Senghor, Dakar', type:'concert', type_label:'Concert',  prix:'7 500 FCFA', statut:'dispo',   visible:true },
  { id:2, jour:'02', mois:'Mai', annee:'2025', titre:'Soirée Gospel & Louange',                   lieu:'Église Évangélique de Dakar-Plateau',           type:'gospel',  type_label:'Gospel',   prix:'Gratuit',    statut:'dispo',   visible:true },
  { id:3, jour:'24', mois:'Mai', annee:'2025', titre:'Festival Hip-Hop Sénégal',                  lieu:'Stade Iba Mar Diop, Dakar',                     type:'festival',type_label:'Festival', prix:'5 000 FCFA', statut:'dispo',   visible:true },
  { id:4, jour:'07', mois:'Jun', annee:'2025', titre:'Nuit du Mbalax — Spécial M.A.C',            lieu:'Thiossane Club, Dakar',                         type:'festival',type_label:'Mbalax',   prix:'—',          statut:'complet', visible:true },
  { id:5, jour:'19', mois:'Jul', annee:'2025', titre:'Tournée Diaspora — Paris',                  lieu:'La Cigale, Paris, France',                      type:'concert', type_label:'Concert',  prix:'28 €',       statut:'dispo',   visible:true }
];

export default async (req) => {
  if (req.method === 'OPTIONS') return cors();
  if (!checkAdmin(req))         return json({ error: 'Non autorisé' }, 401);

  const results = {};

  // ── Albums (upsert — ne remplace pas si déjà existant) ──
  const { error: eAlb, data: dAlb } = await supabase
    .from('albums')
    .upsert(DEFAULT_ALBUMS, { onConflict: 'id', ignoreDuplicates: true })
    .select('id');

  results.albums = eAlb ? `Erreur: ${eAlb.message}` : `${dAlb?.length ?? 0} insérés`;

  // ── Événements ──
  const { error: eEv, data: dEv } = await supabase
    .from('evenements')
    .upsert(DEFAULT_EVENTS, { onConflict: 'id', ignoreDuplicates: true })
    .select('id');

  results.evenements = eEv ? `Erreur: ${eEv.message}` : `${dEv?.length ?? 0} insérés`;

  const hasError = Object.values(results).some(v => String(v).startsWith('Erreur'));

  return json({
    success: !hasError,
    results,
    note: hasError
      ? 'Vérifiez que les tables existent dans Supabase (SQL Editor).'
      : 'Données de départ insérées avec succès.'
  }, hasError ? 500 : 200);
};

export const config = { path: '/api/init-db' };
