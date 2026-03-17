/* ═══════════════════════════════════════════════════════
   M.A.C JAMAIS ASSEZ — script.js  v3.0
   • Données dynamiques via localStorage
   • Formulaires d'achat & réservation avec validation
   • Notifications email via EmailJS (sans serveur)
   • Sécurité : sanitisation des entrées, rate-limit
═══════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────
   CONFIG EMAILJS
   1. Créez un compte sur https://www.emailjs.com
   2. Créez un Service (Gmail, etc.) → copiez le Service ID
   3. Créez un Template → copiez le Template ID
   4. Copiez votre Public Key
   Remplacez les valeurs ci-dessous.
───────────────────────────────────────── */
const EMAILJS_CONFIG = {
  publicKey:  'VOTRE_PUBLIC_KEY',       // ex: 'user_xxxxxxxxxxxxxxxx'
  serviceId:  'VOTRE_SERVICE_ID',       // ex: 'service_xxxxxxx'
  templateId: 'VOTRE_TEMPLATE_ID'       // ex: 'template_xxxxxxx'
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
   SÉCURITÉ — Sanitisation & Rate-limit
───────────────────────────────────────── */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.trim()
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;').replace(/\//g,'&#x2F;')
    .substring(0, 300);
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
function isValidPhone(phone) {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
}

// Rate-limit : max 3 soumissions par 10 minutes par type
const _rateMap = {};
function rateCheck(key) {
  const now = Date.now();
  const window = 10 * 60 * 1000;
  if (!_rateMap[key]) _rateMap[key] = [];
  _rateMap[key] = _rateMap[key].filter(t => now - t < window);
  if (_rateMap[key].length >= 3) return false;
  _rateMap[key].push(now);
  return true;
}

/* ─────────────────────────────────────────
   STOCKAGE SÉCURISÉ
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

const getAlbums = () => Store.get('mac_albums', DEFAULT_ALBUMS);
const getEvents = () => Store.get('mac_events', DEFAULT_EVENTS);
const getPhoto  = () => { try { return localStorage.getItem('mac_photo') || null; } catch { return null; } };

/* ─────────────────────────────────────────
   EMAILJS — Envoi notification
───────────────────────────────────────── */
function sendEmailNotification(templateParams) {
  if (!window.emailjs) return Promise.resolve({ skipped: true });
  return emailjs.send(
    EMAILJS_CONFIG.serviceId,
    EMAILJS_CONFIG.templateId,
    templateParams,
    EMAILJS_CONFIG.publicKey
  );
}

/* ─────────────────────────────────────────
   MODAL GÉNÉRIQUE
───────────────────────────────────────── */
function openModal(id)  {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
// Fermer en cliquant hors du modal
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});
// Fermer avec Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
  }
});

/* ─────────────────────────────────────────
   MODAL ACHAT ALBUM
───────────────────────────────────────── */
let _currentAlbum = null;

function openBuyModal(albumData) {
  _currentAlbum = albumData;
  document.getElementById('buyAlbumTitle').textContent = albumData.titre;
  document.getElementById('buyAlbumPrice').textContent = albumData.prix;
  document.getElementById('buyAlbumYear').textContent  = albumData.annee + ' · ' + albumData.genre;
  // Reset form
  ['buyNom','buyPrenom','buyEmail','buyTel','buyVille','buyQty'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'buyQty' ? '1' : '';
  });
  clearErrors('buyForm');
  openModal('modalAchat');
}

function submitAchat() {
  const nom    = document.getElementById('buyNom').value.trim();
  const prenom = document.getElementById('buyPrenom').value.trim();
  const email  = document.getElementById('buyEmail').value.trim();
  const tel    = document.getElementById('buyTel').value.trim();
  const ville  = document.getElementById('buyVille').value.trim();
  const qty    = parseInt(document.getElementById('buyQty').value) || 1;

  clearErrors('buyForm');
  let valid = true;
  if (!nom)              { showError('buyNom',    'Nom obligatoire'); valid = false; }
  if (!prenom)           { showError('buyPrenom', 'Prénom obligatoire'); valid = false; }
  if (!isValidEmail(email)) { showError('buyEmail', 'Email invalide'); valid = false; }
  if (tel && !isValidPhone(tel)) { showError('buyTel', 'Numéro invalide'); valid = false; }
  if (!valid) return;

  if (!rateCheck('achat')) {
    showFormMsg('buyForm', 'Trop de tentatives. Réessayez dans 10 minutes.', 'error');
    return;
  }

  const order = {
    id:        'CMD-' + Date.now(),
    type:      'achat',
    album:     sanitize(_currentAlbum.titre),
    prix:      sanitize(_currentAlbum.prix),
    nom:       sanitize(nom),
    prenom:    sanitize(prenom),
    email:     sanitize(email),
    tel:       sanitize(tel),
    ville:     sanitize(ville),
    quantite:  qty,
    date:      new Date().toLocaleString('fr-FR'),
    statut:    'en_attente'
  };

  Store.push('mac_commandes', order, []);

  const btn = document.getElementById('btnSubmitAchat');
  btn.disabled = true;
  btn.textContent = 'Envoi en cours...';

  sendEmailNotification({
    type:      '🛒 Nouvelle commande album',
    reference: order.id,
    client:    order.prenom + ' ' + order.nom,
    email:     order.email,
    tel:       order.tel || 'Non renseigné',
    ville:     order.ville || 'Non renseignée',
    detail:    `Album: ${order.album} × ${order.quantite}`,
    prix:      order.prix,
    date:      order.date
  }).then(() => {
    closeModal('modalAchat');
    showSuccessOverlay('achat', order);
  }).catch(() => {
    // On sauvegarde quand même même si l'email échoue
    closeModal('modalAchat');
    showSuccessOverlay('achat', order);
  }).finally(() => {
    btn.disabled = false;
    btn.textContent = 'Confirmer la commande';
  });
}

/* ─────────────────────────────────────────
   MODAL RÉSERVATION BILLET
───────────────────────────────────────── */
let _currentEvent = null;

function openTicketModal(eventData) {
  _currentEvent = eventData;
  document.getElementById('ticketEventTitle').textContent = eventData.titre;
  document.getElementById('ticketEventDate').textContent  = eventData.jour + ' ' + eventData.mois + ' ' + eventData.annee;
  document.getElementById('ticketEventLieu').textContent  = eventData.lieu;
  document.getElementById('ticketEventPrix').textContent  = eventData.prix;
  ['ticketNom','ticketPrenom','ticketEmail','ticketTel','ticketQty'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'ticketQty' ? '1' : '';
  });
  clearErrors('ticketForm');
  openModal('modalTicket');
}

function submitTicket() {
  const nom    = document.getElementById('ticketNom').value.trim();
  const prenom = document.getElementById('ticketPrenom').value.trim();
  const email  = document.getElementById('ticketEmail').value.trim();
  const tel    = document.getElementById('ticketTel').value.trim();
  const qty    = parseInt(document.getElementById('ticketQty').value) || 1;

  clearErrors('ticketForm');
  let valid = true;
  if (!nom)               { showError('ticketNom',    'Nom obligatoire'); valid = false; }
  if (!prenom)            { showError('ticketPrenom', 'Prénom obligatoire'); valid = false; }
  if (!isValidEmail(email)) { showError('ticketEmail', 'Email invalide'); valid = false; }
  if (!tel)               { showError('ticketTel',    'Téléphone obligatoire'); valid = false; }
  else if (!isValidPhone(tel)) { showError('ticketTel', 'Numéro invalide'); valid = false; }
  if (!valid) return;

  if (!rateCheck('reservation')) {
    showFormMsg('ticketForm', 'Trop de tentatives. Réessayez dans 10 minutes.', 'error');
    return;
  }

  const reservation = {
    id:         'RES-' + Date.now(),
    type:       'reservation',
    evenement:  sanitize(_currentEvent.titre),
    date_event: _currentEvent.jour + ' ' + _currentEvent.mois + ' ' + _currentEvent.annee,
    lieu:       sanitize(_currentEvent.lieu),
    prix:       sanitize(_currentEvent.prix),
    nom:        sanitize(nom),
    prenom:     sanitize(prenom),
    email:      sanitize(email),
    tel:        sanitize(tel),
    quantite:   qty,
    date:       new Date().toLocaleString('fr-FR'),
    statut:     'confirmee'
  };

  Store.push('mac_reservations', reservation, []);

  const btn = document.getElementById('btnSubmitTicket');
  btn.disabled = true;
  btn.textContent = 'Envoi en cours...';

  sendEmailNotification({
    type:      '🎫 Nouvelle réservation billet',
    reference: reservation.id,
    client:    reservation.prenom + ' ' + reservation.nom,
    email:     reservation.email,
    tel:       reservation.tel,
    detail:    `${reservation.evenement} — ${reservation.date_event}`,
    lieu:      reservation.lieu,
    prix:      reservation.prix + ' × ' + reservation.quantite,
    date:      reservation.date
  }).then(() => {
    closeModal('modalTicket');
    showSuccessOverlay('ticket', reservation);
  }).catch(() => {
    closeModal('modalTicket');
    showSuccessOverlay('ticket', reservation);
  }).finally(() => {
    btn.disabled = false;
    btn.textContent = 'Confirmer la réservation';
  });
}

/* ─────────────────────────────────────────
   OVERLAY DE CONFIRMATION
───────────────────────────────────────── */
function showSuccessOverlay(type, data) {
  const overlay = document.getElementById('successOverlay');
  const isAchat = type === 'achat';
  document.getElementById('successRef').textContent   = data.id;
  document.getElementById('successNom').textContent   = data.prenom + ' ' + data.nom;
  document.getElementById('successEmail').textContent = data.email;
  document.getElementById('successDetail').textContent = isAchat
    ? data.album + ' × ' + data.quantite
    : data.evenement + ' — ' + data.date_event;
  document.getElementById('successType').textContent = isAchat ? 'Commande album' : 'Réservation billet';
  openModal('successOverlay');
}

/* ─────────────────────────────────────────
   HELPERS FORMULAIRES
───────────────────────────────────────── */
function showError(inputId, msg) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.add('input-error');
  const err = document.createElement('span');
  err.className = 'field-error';
  err.textContent = msg;
  input.parentNode.appendChild(err);
}
function clearErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.field-error').forEach(e => e.remove());
  form.querySelectorAll('.input-error').forEach(e => e.classList.remove('input-error'));
  form.querySelectorAll('.form-msg').forEach(e => e.remove());
}
function showFormMsg(formId, msg, type = 'error') {
  const form = document.getElementById(formId);
  if (!form) return;
  const div = document.createElement('div');
  div.className = `form-msg form-msg-${type}`;
  div.textContent = msg;
  form.appendChild(div);
}

/* ─────────────────────────────────────────
   RENDU DISCOGRAPHIE
───────────────────────────────────────── */
function renderAlbums() {
  const grid = document.querySelector('.disco-grid');
  if (!grid) return;
  const albums = getAlbums().filter(a => a.visible);
  if (!albums.length) {
    grid.innerHTML = '<p style="color:var(--argent);grid-column:1/-1;text-align:center;padding:3rem 0;">Aucun album disponible.</p>';
    return;
  }
  grid.innerHTML = albums.map(a => `
    <div class="album">
      <div class="alb-cover">
        <div class="alb-art ${a.theme}"><span>${a.code}</span></div>
        <div class="alb-overlay">
          <div class="alb-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
        </div>
        ${a.badge ? `<span class="alb-badge ${a.badge}">${a.badgeLabel}</span>` : ''}
      </div>
      <div class="alb-title">${a.titre}</div>
      <div class="alb-meta">${a.annee} · ${a.genre}</div>
      <div class="alb-price">${a.prix}</div>
      <button class="btn-acheter" data-album-id="${a.id}">Acheter l'album</button>
    </div>
  `).join('');
  bindBuyButtons();
}

/* ─────────────────────────────────────────
   RENDU ÉVÉNEMENTS
───────────────────────────────────────── */
function renderEvents() {
  const list = document.querySelector('.event-list');
  if (!list) return;
  const events = getEvents().filter(e => e.visible);
  if (!events.length) {
    list.innerHTML = '<p style="color:var(--argent);text-align:center;padding:3rem 0;">Aucun événement à venir.</p>';
    return;
  }
  list.innerHTML = events.map(ev => `
    <div class="event-item">
      <div class="event-date">${ev.jour}</div>
      <div class="event-month-yr">
        <span class="event-mo">${ev.mois}</span>
        <span class="event-yr">${ev.annee}</span>
      </div>
      <div class="event-info">
        <div class="event-title">${ev.titre}</div>
        <div class="event-lieu">${ev.lieu}</div>
      </div>
      <span class="event-type-tag ${ev.type}">${ev.typeLabel}</span>
      <button class="btn-ticket${ev.statut === 'complet' ? ' sold' : ''}" data-event-id="${ev.id}">
        ${ev.statut === 'complet' ? 'Complet' : `Billets · ${ev.prix}`}
      </button>
    </div>
  `).join('');
  bindTicketButtons();
}

/* ─────────────────────────────────────────
   LIAISONS BOUTONS
───────────────────────────────────────── */
function bindBuyButtons() {
  document.querySelectorAll('.btn-acheter').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = parseInt(btn.dataset.albumId);
      const album = getAlbums().find(a => a.id === id);
      if (album) openBuyModal(album);
    });
  });
}
function bindTicketButtons() {
  document.querySelectorAll('.btn-ticket:not(.sold)').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = parseInt(btn.dataset.eventId);
      const event = getEvents().find(e => e.id === id);
      if (event) openTicketModal(event);
    });
  });
}

/* ─────────────────────────────────────────
   PHOTO ARTISTE
───────────────────────────────────────── */
function renderPhoto() {
  const photoEl  = document.querySelector('.bio-photo');
  if (!photoEl) return;
  const monogram = photoEl.querySelector('.bio-photo-monogram');
  const existing = photoEl.querySelector('.bio-real-photo');
  if (existing) existing.remove();
  const photo = getPhoto();
  if (photo) {
    if (monogram) monogram.style.display = 'none';
    const img = document.createElement('img');
    img.src = photo; img.alt = 'M.A.C Jamais Assez';
    img.className = 'bio-real-photo';
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;';
    photoEl.appendChild(img);
  } else {
    if (monogram) monogram.style.display = '';
  }
}

/* ─────────────────────────────────────────
   MENU HAMBURGER (mobile)
───────────────────────────────────────── */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const btn  = document.getElementById('hamburger');
  if (!menu || !btn) return;
  const isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}
function closeMenu() {
  const menu = document.getElementById('mobileMenu');
  const btn  = document.getElementById('hamburger');
  if (!menu || !btn) return;
  menu.classList.remove('open');
  btn.classList.remove('open');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────
   NAV SCROLL
───────────────────────────────────────── */
const navEl = document.getElementById('nav');
if (navEl) {
  window.addEventListener('scroll', () => navEl.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
}

/* ─────────────────────────────────────────
   SMOOTH SCROLL
───────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ─────────────────────────────────────────
   NEWSLETTER
───────────────────────────────────────── */
const nlBtn   = document.querySelector('.nl-btn');
const nlInput = document.querySelector('.nl-input');
if (nlBtn && nlInput) {
  nlBtn.addEventListener('click', function () {
    const email = nlInput.value.trim();
    if (!isValidEmail(email)) {
      nlInput.style.borderColor = 'rgba(196,48,48,0.6)';
      setTimeout(() => nlInput.style.borderColor = '', 2000);
      return;
    }
    if (!rateCheck('newsletter')) return;
    const orig = this.textContent;
    this.textContent = '✓ Inscrit !';
    this.style.background = '#2D7A50';
    nlInput.value = '';
    // Stocker l'email newsletter
    const list = Store.get('mac_newsletter', []);
    if (!list.includes(email)) { list.push(email); Store.set('mac_newsletter', list); }
    setTimeout(() => { this.textContent = orig; this.style.background = ''; }, 3000);
  });
}

/* ─────────────────────────────────────────
   CONTACT
───────────────────────────────────────── */
const sendBtn = document.getElementById('sendBtn');
if (sendBtn) {
  sendBtn.addEventListener('click', function () {
    const nom     = document.querySelector('[data-contact="nom"]')?.value.trim();
    const email   = document.querySelector('[data-contact="email"]')?.value.trim();
    const message = document.querySelector('[data-contact="message"]')?.value.trim();
    if (!nom || !isValidEmail(email || '') || !message) {
      this.textContent = 'Remplissez tous les champs';
      this.style.background = 'rgba(139,26,26,0.8)';
      setTimeout(() => { this.textContent = 'Envoyer le Message'; this.style.background = ''; }, 2500);
      return;
    }
    if (!rateCheck('contact')) return;
    const msg = { nom: sanitize(nom), email: sanitize(email), message: sanitize(message), date: new Date().toLocaleString('fr-FR') };
    Store.push('mac_messages', msg, []);
    sendEmailNotification({ type: '✉️ Message de contact', client: msg.nom, email: msg.email, detail: msg.message, date: msg.date });
    const orig = this.textContent;
    this.textContent = '✓ Message envoyé !';
    this.style.background = '#2D7A50';
    setTimeout(() => { this.textContent = orig; this.style.background = ''; }, 3000);
  });
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Charger EmailJS
  const ejs = document.createElement('script');
  ejs.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  ejs.onload = () => {
    if (window.emailjs && EMAILJS_CONFIG.publicKey !== 'VOTRE_PUBLIC_KEY') {
      emailjs.init(EMAILJS_CONFIG.publicKey);
    }
  };
  document.head.appendChild(ejs);

  renderAlbums();
  renderEvents();
  renderPhoto();
});
