/* ═══════════════════════════════════════════════════════════
   M.A.C JAMAIS ASSEZ — firebase.js
   Couche de données Firebase Firestore
   ─────────────────────────────────────────────────────────
   INSTRUCTIONS DE CONFIGURATION :
   1. Allez sur https://console.firebase.google.com
   2. Cliquez "Créer un projet" → donnez un nom (ex: mac-jamais-assez)
   3. Désactivez Google Analytics si vous n'en avez pas besoin
   4. Dans le projet : cliquez l'icône </> (Web app)
   5. Enregistrez l'app → copiez la configuration firebaseConfig
   6. Remplacez les valeurs dans FIREBASE_CONFIG ci-dessous
   7. Dans le menu gauche : Build → Firestore Database
   8. Créez la base → choisissez "Démarrer en mode test"
   9. Choisissez la région : eur3 (Europe) ou nam5 (Amérique)
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   ⚙️  REMPLACEZ CES VALEURS PAR LES VÔTRES
   (copiées depuis la console Firebase)
───────────────────────────────────────── */
const FIREBASE_CONFIG = {
  apiKey:            "VOTRE_API_KEY",
  authDomain:        "VOTRE_PROJECT.firebaseapp.com",
  projectId:         "VOTRE_PROJECT_ID",
  storageBucket:     "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId:             "VOTRE_APP_ID"
};

/* ─────────────────────────────────────────
   ÉTAT DE LA CONNEXION
───────────────────────────────────────── */
let _db          = null;   // instance Firestore
let _fbReady     = false;  // Firebase chargé et initialisé
let _fbCallbacks = [];     // files d'attente si Firebase pas encore prêt

function onFirebaseReady(fn) {
  if (_fbReady) { fn(); }
  else { _fbCallbacks.push(fn); }
}

/* ─────────────────────────────────────────
   INITIALISATION (chargement dynamique)
───────────────────────────────────────── */
function initFirebase() {
  return new Promise((resolve, reject) => {
    // Vérifie que la config a été remplie
    if (FIREBASE_CONFIG.apiKey === 'VOTRE_API_KEY') {
      console.warn('[Firebase] Config non renseignée → mode localStorage activé.');
      resolve(false);
      return;
    }

    // Charge le SDK Firebase via CDN
    const script = document.createElement('script');
    script.type   = 'module';
    script.textContent = `
      import { initializeApp }          from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
      import { getFirestore, collection, doc, addDoc, getDocs, getDoc,
               updateDoc, deleteDoc, onSnapshot, query, orderBy, setDoc }
               from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

      const app = initializeApp(${JSON.stringify(FIREBASE_CONFIG)});
      const db  = getFirestore(app);

      // Expose l'API Firestore sur window pour y accéder hors module
      window._firestore = {
        db, collection, doc, addDoc, getDocs, getDoc,
        updateDoc, deleteDoc, onSnapshot, query, orderBy, setDoc
      };

      // Signale que Firebase est prêt
      window.dispatchEvent(new Event('firebaseReady'));
    `;
    document.head.appendChild(script);

    window.addEventListener('firebaseReady', () => {
      _db      = window._firestore.db;
      _fbReady = true;
      _fbCallbacks.forEach(fn => fn());
      _fbCallbacks = [];
      resolve(true);
    }, { once: true });

    // Timeout de sécurité (5 s)
    setTimeout(() => {
      if (!_fbReady) {
        console.warn('[Firebase] Timeout → mode localStorage activé.');
        resolve(false);
      }
    }, 5000);
  });
}

/* ─────────────────────────────────────────
   COLLECTIONS FIRESTORE
   Structure :
   mac_albums       → catalogue albums
   mac_events       → événements
   mac_commandes    → achats albums
   mac_reservations → réservations billets
   mac_messages     → messages de contact
   mac_newsletter   → abonnés newsletter
───────────────────────────────────────── */
const COL = {
  ALBUMS:       'mac_albums',
  EVENTS:       'mac_events',
  COMMANDES:    'mac_commandes',
  RESERVATIONS: 'mac_reservations',
  MESSAGES:     'mac_messages',
  NEWSLETTER:   'mac_newsletter'
};

/* ─────────────────────────────────────────
   HELPERS FIRESTORE
───────────────────────────────────────── */
function fsCol(name) {
  const { collection } = window._firestore;
  return collection(_db, name);
}
function fsDoc(colName, id) {
  const { doc } = window._firestore;
  return doc(_db, colName, id);
}

/* ─────────────────────────────────────────
   API PUBLIQUE — DB
   Toutes les fonctions retournent des Promises.
   Elles utilisent Firebase si disponible,
   sinon localStorage comme fallback.
───────────────────────────────────────── */
const DB = {

  /* ── ALBUMS ── */
  async getAlbums() {
    if (!_fbReady) return Store.get('mac_albums', DEFAULT_ALBUMS);
    try {
      const snap = await window._firestore.getDocs(fsCol(COL.ALBUMS));
      const albums = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      return albums.length ? albums : DEFAULT_ALBUMS;
    } catch(e) { console.error('getAlbums', e); return Store.get('mac_albums', DEFAULT_ALBUMS); }
  },

  async saveAlbum(album) {
    if (!_fbReady) { const a=Store.get('mac_albums',DEFAULT_ALBUMS); const i=a.findIndex(x=>x.id===album.id); if(i>-1)a[i]=album; else a.push(album); Store.set('mac_albums',a); return; }
    try {
      const id = album.firestoreId || String(album.id);
      await window._firestore.setDoc(fsDoc(COL.ALBUMS, id), album);
    } catch(e) { console.error('saveAlbum', e); }
  },

  async deleteAlbum(album) {
    if (!_fbReady) { Store.set('mac_albums', Store.get('mac_albums',DEFAULT_ALBUMS).filter(a=>a.id!==album.id)); return; }
    try {
      const id = album.firestoreId || String(album.id);
      await window._firestore.deleteDoc(fsDoc(COL.ALBUMS, id));
    } catch(e) { console.error('deleteAlbum', e); }
  },

  /* ── ÉVÉNEMENTS ── */
  async getEvents() {
    if (!_fbReady) return Store.get('mac_events', DEFAULT_EVENTS);
    try {
      const snap = await window._firestore.getDocs(fsCol(COL.EVENTS));
      const events = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      return events.length ? events : DEFAULT_EVENTS;
    } catch(e) { console.error('getEvents', e); return Store.get('mac_events', DEFAULT_EVENTS); }
  },

  async saveEvent(event) {
    if (!_fbReady) { const e=Store.get('mac_events',DEFAULT_EVENTS); const i=e.findIndex(x=>x.id===event.id); if(i>-1)e[i]=event; else e.push(event); Store.set('mac_events',e); return; }
    try {
      const id = event.firestoreId || String(event.id);
      await window._firestore.setDoc(fsDoc(COL.EVENTS, id), event);
    } catch(e) { console.error('saveEvent', e); }
  },

  async deleteEvent(event) {
    if (!_fbReady) { Store.set('mac_events', Store.get('mac_events',DEFAULT_EVENTS).filter(e=>e.id!==event.id)); return; }
    try {
      const id = event.firestoreId || String(event.id);
      await window._firestore.deleteDoc(fsDoc(COL.EVENTS, id));
    } catch(e) { console.error('deleteEvent', e); }
  },

  /* ── COMMANDES ── */
  async addCommande(order) {
    // Sauvegarde locale en backup
    Store.push('mac_commandes', order, []);
    if (!_fbReady) return order.id;
    try {
      const ref = await window._firestore.addDoc(fsCol(COL.COMMANDES), {
        ...order,
        createdAt: new Date().toISOString()
      });
      return ref.id;
    } catch(e) { console.error('addCommande', e); return order.id; }
  },

  async getCommandes() {
    if (!_fbReady) return Store.get('mac_commandes', []);
    try {
      const { query, orderBy, getDocs } = window._firestore;
      const q    = query(fsCol(COL.COMMANDES), orderBy('createdAt','desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    } catch(e) { console.error('getCommandes', e); return Store.get('mac_commandes',[]); }
  },

  async updateCommandeStatut(firestoreId, statut) {
    if (!_fbReady) { const c=Store.get('mac_commandes',[]); const i=c.findIndex(x=>x.id===firestoreId||x.firestoreId===firestoreId); if(i>-1){c[i].statut=statut;Store.set('mac_commandes',c);} return; }
    try { await window._firestore.updateDoc(fsDoc(COL.COMMANDES, firestoreId), { statut }); }
    catch(e) { console.error('updateCommandeStatut', e); }
  },

  /* ── RÉSERVATIONS ── */
  async addReservation(res) {
    Store.push('mac_reservations', res, []);
    if (!_fbReady) return res.id;
    try {
      const ref = await window._firestore.addDoc(fsCol(COL.RESERVATIONS), {
        ...res,
        createdAt: new Date().toISOString()
      });
      return ref.id;
    } catch(e) { console.error('addReservation', e); return res.id; }
  },

  async getReservations() {
    if (!_fbReady) return Store.get('mac_reservations', []);
    try {
      const { query, orderBy, getDocs } = window._firestore;
      const q    = query(fsCol(COL.RESERVATIONS), orderBy('createdAt','desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    } catch(e) { console.error('getReservations', e); return Store.get('mac_reservations',[]); }
  },

  async updateReservationStatut(firestoreId, statut) {
    if (!_fbReady) { const r=Store.get('mac_reservations',[]); const i=r.findIndex(x=>x.id===firestoreId||x.firestoreId===firestoreId); if(i>-1){r[i].statut=statut;Store.set('mac_reservations',r);} return; }
    try { await window._firestore.updateDoc(fsDoc(COL.RESERVATIONS, firestoreId), { statut }); }
    catch(e) { console.error('updateReservationStatut', e); }
  },

  /* ── MESSAGES ── */
  async addMessage(msg) {
    Store.push('mac_messages', msg, []);
    if (!_fbReady) return;
    try {
      await window._firestore.addDoc(fsCol(COL.MESSAGES), {
        ...msg,
        createdAt: new Date().toISOString()
      });
    } catch(e) { console.error('addMessage', e); }
  },

  async getMessages() {
    if (!_fbReady) return Store.get('mac_messages', []);
    try {
      const { query, orderBy, getDocs } = window._firestore;
      const q    = query(fsCol(COL.MESSAGES), orderBy('createdAt','desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    } catch(e) { console.error('getMessages', e); return Store.get('mac_messages',[]); }
  },

  /* ── NEWSLETTER ── */
  async addNewsletter(email) {
    const list = Store.get('mac_newsletter', []);
    if (!list.includes(email)) { list.push(email); Store.set('mac_newsletter', list); }
    if (!_fbReady) return;
    try {
      // On utilise l'email comme ID pour éviter les doublons
      const safeId = email.replace(/[@.]/g,'_');
      await window._firestore.setDoc(fsDoc(COL.NEWSLETTER, safeId), {
        email,
        createdAt: new Date().toISOString()
      });
    } catch(e) { console.error('addNewsletter', e); }
  },

  async getNewsletter() {
    if (!_fbReady) return Store.get('mac_newsletter', []).map(e => ({ email: e }));
    try {
      const snap = await window._firestore.getDocs(fsCol(COL.NEWSLETTER));
      return snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    } catch(e) { console.error('getNewsletter', e); return Store.get('mac_newsletter',[]).map(e=>({email:e})); }
  },

  async deleteNewsletter(firestoreId) {
    if (!_fbReady) return;
    try { await window._firestore.deleteDoc(fsDoc(COL.NEWSLETTER, firestoreId)); }
    catch(e) { console.error('deleteNewsletter', e); }
  },

  /* ── PHOTO ── */
  getPhoto() {
    // La photo est toujours en localStorage (base64 trop grande pour Firestore)
    // Pour une vraie prod, utilisez Firebase Storage
    try { return localStorage.getItem('mac_photo') || null; } catch { return null; }
  },
  savePhoto(data) {
    try { localStorage.setItem('mac_photo', data); } catch(e) { console.error('savePhoto', e); }
  },
  removePhoto() {
    try { localStorage.removeItem('mac_photo'); } catch(e) {}
  },

  /* ── ÉCOUTE EN TEMPS RÉEL (pour l'admin) ── */
  listenCommandes(callback) {
    if (!_fbReady) return () => {};
    try {
      const { query, orderBy, onSnapshot } = window._firestore;
      const q = query(fsCol(COL.COMMANDES), orderBy('createdAt','desc'));
      return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
      });
    } catch(e) { return () => {}; }
  },

  listenReservations(callback) {
    if (!_fbReady) return () => {};
    try {
      const { query, orderBy, onSnapshot } = window._firestore;
      const q = query(fsCol(COL.RESERVATIONS), orderBy('createdAt','desc'));
      return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
      });
    } catch(e) { return () => {}; }
  }
};

/* ─────────────────────────────────────────
   FALLBACK STORE (localStorage)
   Utilisé quand Firebase n'est pas configuré
───────────────────────────────────────── */
const Store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch { return false; }
  },
  push(key, item, fallback = []) {
    const arr = this.get(key, fallback);
    arr.push(item);
    return this.set(key, arr);
  }
};

/* ─────────────────────────────────────────
   DONNÉES PAR DÉFAUT
───────────────────────────────────────── */
const DEFAULT_ALBUMS = [
  { id:1, titre:'Jamais Assez Vol.1', annee:'2024', genre:'Rap / Gospel',    prix:'12 000 FCFA', badge:'new',    badgeLabel:'Nouveau', code:'JA',  theme:'a1', visible:true },
  { id:2, titre:'Foi & Lumière',      annee:'2022', genre:'Gospel / Mbalax', prix:'10 000 FCFA', badge:'gospel', badgeLabel:'Gospel',  code:'FOI', theme:'a2', visible:true },
  { id:3, titre:'Dakar Debout',       annee:'2020', genre:'Rap / Mbalax',    prix:'8 000 FCFA',  badge:'',       badgeLabel:'',        code:'DKR', theme:'a3', visible:true },
  { id:4, titre:'Rue de la Médina',   annee:'2017', genre:'Rap Sénégalais',  prix:'6 000 FCFA',  badge:'',       badgeLabel:'',        code:'RUE', theme:'a4', visible:true }
];
const DEFAULT_EVENTS = [
  { id:1, jour:'18', mois:'Avr', annee:'2025', titre:'Concert de Lancement — Jamais Assez Vol.1', lieu:'CCBM — Centre Culturel Blaise Senghor, Dakar', type:'concert', typeLabel:'Concert',  prix:'7 500 FCFA', statut:'dispo',   visible:true },
  { id:2, jour:'02', mois:'Mai', annee:'2025', titre:'Soirée Gospel & Louange',                   lieu:'Église Évangélique de Dakar-Plateau',           type:'gospel',  typeLabel:'Gospel',   prix:'Gratuit',    statut:'dispo',   visible:true },
  { id:3, jour:'24', mois:'Mai', annee:'2025', titre:'Festival Hip-Hop Sénégal',                  lieu:'Stade Iba Mar Diop, Dakar',                     type:'festival',typeLabel:'Festival', prix:'5 000 FCFA', statut:'dispo',   visible:true },
  { id:4, jour:'07', mois:'Jun', annee:'2025', titre:'Nuit du Mbalax — Spécial M.A.C',            lieu:'Thiossane Club, Dakar',                         type:'festival',typeLabel:'Mbalax',   prix:'—',          statut:'complet', visible:true },
  { id:5, jour:'19', mois:'Jul', annee:'2025', titre:'Tournée Diaspora — Paris',                  lieu:'La Cigale, Paris, France',                      type:'concert', typeLabel:'Concert',  prix:'28 €',       statut:'dispo',   visible:true }
];

/* ─────────────────────────────────────────
   EXPORT GLOBAL
───────────────────────────────────────── */
window.DB         = DB;
window.Store      = Store;
window.initFirebase = initFirebase;
window.DEFAULT_ALBUMS = DEFAULT_ALBUMS;
window.DEFAULT_EVENTS = DEFAULT_EVENTS;
