/* ═══════════════════════════════════════════════════════
   M.A.C JAMAIS ASSEZ — script.js  v6.0
   Optimisé Netlify Blobs
═══════════════════════════════════════════════════════ */
'use strict';

/* ── CONFIG EMAILJS ── */
const EMAILJS_CONFIG = {
  publicKey:  'C6F_StHUlgq2eIluh',
  serviceId:  'service_ezxfwzg',
  templateId: 'template_c0yitid'
};

/* ── DONNÉES PAR DÉFAUT (fallback si API indisponible) ── */
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

/* ── SÉCURITÉ ── */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.trim()
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;').replace(/\//g,'&#x2F;')
    .substring(0, 300);
}
const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const isValidPhone = p => /^[\d\s+\-()\x20]{7,20}$/.test(p);

// Rate-limit : 3 soumissions max / 10 min / action
const _rateMap = {};
function rateCheck(key) {
  const now = Date.now(), win = 10 * 60 * 1000;
  _rateMap[key] = (_rateMap[key] || []).filter(t => now - t < win);
  if (_rateMap[key].length >= 3) return false;
  _rateMap[key].push(now);
  return true;
}

/* ── APPELS API ── */
async function apiPost(endpoint, data) {
  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data)
  });
  if (!res.ok && res.status !== 400) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiGet(store) {
  try {
    const res = await fetch(`/api/get-data?store=${store}`);
    if (!res.ok) return null;
    return (await res.json()).items || null;
  } catch { return null; }
}

/* ── EMAILJS ── */
function sendEmail(params) {
  if (!window.emailjs) return Promise.resolve();
  return emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, params, EMAILJS_CONFIG.publicKey);
}

/* ── MODALS ── */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
});

/* ── RENDU DISCOGRAPHIE ── */
async function renderAlbums() {
  const grid = document.querySelector('.disco-grid');
  if (!grid) return;
  grid.innerHTML = '<p style="color:var(--argent);grid-column:1/-1;text-align:center;padding:3rem 0;">Chargement…</p>';
  const albums = ((await apiGet('albums')) || DEFAULT_ALBUMS).filter(a => a.visible);
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
  window._albumsList = albums;
  bindBuyButtons();
}

/* ── RENDU ÉVÉNEMENTS ── */
async function renderEvents() {
  const list = document.querySelector('.event-list');
  if (!list) return;
  list.innerHTML = '<p style="color:var(--argent);text-align:center;padding:2rem 0;">Chargement…</p>';
  const events = ((await apiGet('events')) || DEFAULT_EVENTS).filter(e => e.visible);
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
  window._eventsList = events;
  bindTicketButtons();
}

/* ── PHOTO ARTISTE (Neon via API) ── */
async function renderPhoto() {
  const photoEl  = document.querySelector('.bio-photo');
  if (!photoEl) return;
  const monogram = photoEl.querySelector('.bio-photo-monogram');
  const existing = photoEl.querySelector('.bio-real-photo');
  if (existing) existing.remove();

  let photo = null;
  try {
    const res = await fetch('/api/save-photo');
    if (res.ok) photo = (await res.json()).photo || null;
  } catch {}

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

/* ── BOUTONS ── */
function bindBuyButtons() {
  document.querySelectorAll('.btn-acheter').forEach(btn => {
    btn.addEventListener('click', () => {
      const album = (window._albumsList || []).find(a => a.id === parseInt(btn.dataset.albumId));
      if (album) openBuyModal(album);
    });
  });
}
function bindTicketButtons() {
  document.querySelectorAll('.btn-ticket:not(.sold)').forEach(btn => {
    btn.addEventListener('click', () => {
      const ev = (window._eventsList || []).find(e => e.id === parseInt(btn.dataset.eventId));
      if (ev) openTicketModal(ev);
    });
  });
}

/* ── MODAL ACHAT ── */
let _currentAlbum = null;

function openBuyModal(album) {
  _currentAlbum = album;
  document.getElementById('buyAlbumTitle').textContent = album.titre;
  document.getElementById('buyAlbumPrice').textContent = album.prix;
  document.getElementById('buyAlbumYear').textContent  = album.annee + ' · ' + album.genre;
  ['buyNom','buyPrenom','buyEmail','buyTel','buyVille'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const qty = document.getElementById('buyQty'); if (qty) qty.value = '1';
  clearErrors('buyForm');
  openModal('modalAchat');
}

async function submitAchat() {
  const nom    = document.getElementById('buyNom').value.trim();
  const prenom = document.getElementById('buyPrenom').value.trim();
  const email  = document.getElementById('buyEmail').value.trim();
  const tel    = document.getElementById('buyTel').value.trim();
  const ville  = document.getElementById('buyVille').value.trim();
  const qty    = parseInt(document.getElementById('buyQty').value) || 1;

  clearErrors('buyForm');
  let ok = true;
  if (!nom)                      { showError('buyNom',    'Nom obligatoire'); ok = false; }
  if (!prenom)                   { showError('buyPrenom', 'Prénom obligatoire'); ok = false; }
  if (!isValidEmail(email))      { showError('buyEmail',  'Email invalide'); ok = false; }
  if (tel && !isValidPhone(tel)) { showError('buyTel',    'Numéro invalide'); ok = false; }
  if (!ok) return;
  if (!rateCheck('achat')) { showFormMsg('buyForm', 'Trop de tentatives. Réessayez dans 10 minutes.', 'error'); return; }

  const btn = document.getElementById('btnSubmitAchat');
  btn.disabled = true; btn.textContent = 'Envoi en cours…';

  try {
    const result = await apiPost('/api/save-commande', {
      nom: sanitize(nom), prenom: sanitize(prenom),
      email: sanitize(email), tel: sanitize(tel), ville: sanitize(ville),
      album: sanitize(_currentAlbum.titre), prix: sanitize(_currentAlbum.prix),
      quantite: qty
    });
    if (!result.success) { showFormMsg('buyForm', result.error || 'Erreur.', 'error'); return; }

    sendEmail({
      name:    `${sanitize(prenom)} ${sanitize(nom)} (${sanitize(email)})`,
      time:    new Date().toLocaleString('fr-FR'),
      message: `🛒 COMMANDE ALBUM\nRéf : ${result.id}\nAlbum : ${_currentAlbum.titre} × ${qty}\nPrix : ${_currentAlbum.prix}\nTél : ${tel || '—'}\nVille : ${ville || '—'}`
    }).catch(() => {});

    closeModal('modalAchat');
    showSuccessOverlay('achat', {
      id: result.id, prenom: sanitize(prenom), nom: sanitize(nom),
      email: sanitize(email), album: _currentAlbum.titre, quantite: qty
    });
  } catch {
    showFormMsg('buyForm', 'Erreur réseau. Réessayez.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Confirmer la commande';
  }
}

/* ── MODAL RÉSERVATION ── */
let _currentEvent = null;

function openTicketModal(ev) {
  _currentEvent = ev;
  document.getElementById('ticketEventTitle').textContent = ev.titre;
  document.getElementById('ticketEventDate').textContent  = `${ev.jour} ${ev.mois} ${ev.annee}`;
  document.getElementById('ticketEventLieu').textContent  = ev.lieu;
  document.getElementById('ticketEventPrix').textContent  = ev.prix;
  ['ticketNom','ticketPrenom','ticketEmail','ticketTel'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const qty = document.getElementById('ticketQty'); if (qty) qty.value = '1';
  clearErrors('ticketForm');
  openModal('modalTicket');
}

async function submitTicket() {
  const nom    = document.getElementById('ticketNom').value.trim();
  const prenom = document.getElementById('ticketPrenom').value.trim();
  const email  = document.getElementById('ticketEmail').value.trim();
  const tel    = document.getElementById('ticketTel').value.trim();
  const qty    = parseInt(document.getElementById('ticketQty').value) || 1;

  clearErrors('ticketForm');
  let ok = true;
  if (!nom)                    { showError('ticketNom',    'Nom obligatoire'); ok = false; }
  if (!prenom)                 { showError('ticketPrenom', 'Prénom obligatoire'); ok = false; }
  if (!isValidEmail(email))    { showError('ticketEmail',  'Email invalide'); ok = false; }
  if (!tel)                    { showError('ticketTel',    'Téléphone obligatoire'); ok = false; }
  else if (!isValidPhone(tel)) { showError('ticketTel',    'Numéro invalide'); ok = false; }
  if (!ok) return;
  if (!rateCheck('reservation')) { showFormMsg('ticketForm', 'Trop de tentatives. Réessayez dans 10 minutes.', 'error'); return; }

  const btn = document.getElementById('btnSubmitTicket');
  btn.disabled = true; btn.textContent = 'Envoi en cours…';

  try {
    const result = await apiPost('/api/save-reservation', {
      nom: sanitize(nom), prenom: sanitize(prenom),
      email: sanitize(email), tel: sanitize(tel),
      evenement:  sanitize(_currentEvent.titre),
      date_event: `${_currentEvent.jour} ${_currentEvent.mois} ${_currentEvent.annee}`,
      lieu:       sanitize(_currentEvent.lieu),
      prix:       sanitize(_currentEvent.prix),
      quantite:   qty
    });
    if (!result.success) { showFormMsg('ticketForm', result.error || 'Erreur.', 'error'); return; }

    sendEmail({
      name:    `${sanitize(prenom)} ${sanitize(nom)} (${sanitize(email)})`,
      time:    new Date().toLocaleString('fr-FR'),
      message: `🎫 RÉSERVATION\nRéf : ${result.id}\nÉvénement : ${_currentEvent.titre}\nDate : ${_currentEvent.jour} ${_currentEvent.mois} ${_currentEvent.annee}\nLieu : ${_currentEvent.lieu}\nBillets : ${qty} × ${_currentEvent.prix}\nTél : ${tel}`
    }).catch(() => {});

    closeModal('modalTicket');
    showSuccessOverlay('ticket', {
      id: result.id, prenom: sanitize(prenom), nom: sanitize(nom),
      email: sanitize(email), evenement: _currentEvent.titre,
      date_event: `${_currentEvent.jour} ${_currentEvent.mois} ${_currentEvent.annee}`
    });
  } catch {
    showFormMsg('ticketForm', 'Erreur réseau. Réessayez.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Confirmer la réservation';
  }
}

/* ── OVERLAY SUCCÈS ── */
function showSuccessOverlay(type, data) {
  const isAchat = type === 'achat';
  document.getElementById('successType').textContent   = isAchat ? 'Commande album' : 'Réservation billet';
  document.getElementById('successRef').textContent    = data.id;
  document.getElementById('successNom').textContent    = `${data.prenom} ${data.nom}`;
  document.getElementById('successEmail').textContent  = data.email;
  document.getElementById('successDetail').textContent = isAchat
    ? `${data.album} × ${data.quantite}`
    : `${data.evenement} — ${data.date_event}`;
  openModal('successOverlay');
}

/* ── HELPERS FORMULAIRES ── */
function showError(id, msg) {
  const el = document.getElementById(id); if (!el) return;
  el.classList.add('input-error');
  const s = document.createElement('span');
  s.className = 'field-error'; s.textContent = msg;
  el.parentNode.appendChild(s);
}
function clearErrors(formId) {
  const f = document.getElementById(formId); if (!f) return;
  f.querySelectorAll('.field-error, .form-msg').forEach(e => e.remove());
  f.querySelectorAll('.input-error').forEach(e => e.classList.remove('input-error'));
}
function showFormMsg(formId, msg, type = 'error') {
  const f = document.getElementById(formId); if (!f) return;
  const d = document.createElement('div');
  d.className = `form-msg form-msg-${type}`; d.textContent = msg;
  f.appendChild(d);
}

/* ── NAV SCROLL ── */
const navEl = document.getElementById('nav');
if (navEl) {
  window.addEventListener('scroll', () =>
    navEl.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
}

/* ── SMOOTH SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ── NEWSLETTER ── */
const nlBtn   = document.querySelector('.nl-btn');
const nlInput = document.querySelector('.nl-input');
if (nlBtn && nlInput) {
  nlBtn.addEventListener('click', async function () {
    const email = nlInput.value.trim();
    if (!isValidEmail(email)) {
      nlInput.style.borderColor = 'rgba(196,48,48,0.6)';
      setTimeout(() => nlInput.style.borderColor = '', 2000);
      return;
    }
    if (!rateCheck('newsletter')) return;
    const orig = this.textContent;
    this.textContent = '⏳'; this.disabled = true;
    try {
      const r = await apiPost('/api/save-newsletter', { email });
      this.textContent = '✓ Inscrit !'; this.style.background = '#2D7A50';
      nlInput.value = '';
      setTimeout(() => { this.textContent = orig; this.style.background = ''; this.disabled = false; }, 3000);
    } catch {
      this.textContent = orig; this.disabled = false;
      nlInput.style.borderColor = 'rgba(196,48,48,0.6)';
      setTimeout(() => nlInput.style.borderColor = '', 2000);
    }
  });
}

/* ── CONTACT ── */
const sendBtn = document.getElementById('sendBtn');
if (sendBtn) {
  sendBtn.addEventListener('click', async function () {
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
    this.textContent = '⏳ Envoi…'; this.disabled = true;
    try {
      const r = await apiPost('/api/save-message', {
        nom: sanitize(nom), email: sanitize(email), message: sanitize(message)
      });
      if (r.success) {
        sendEmail({ name: `${sanitize(nom)} (${sanitize(email)})`, time: new Date().toLocaleString('fr-FR'), message: sanitize(message) }).catch(() => {});
        ['nom','email','message'].forEach(k => {
          const el = document.querySelector(`[data-contact="${k}"]`);
          if (el) el.value = '';
        });
        this.textContent = '✓ Message envoyé !'; this.style.background = '#2D7A50';
      } else {
        this.textContent = 'Erreur. Réessayez.'; this.style.background = 'rgba(139,26,26,0.8)';
      }
    } catch {
      this.textContent = 'Erreur réseau.'; this.style.background = 'rgba(139,26,26,0.8)';
    } finally {
      setTimeout(() => { this.textContent = 'Envoyer le Message'; this.style.background = ''; this.disabled = false; }, 3000);
    }
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  // Charge EmailJS
  const ejs = document.createElement('script');
  ejs.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  ejs.onload = () => {
    if (window.emailjs) emailjs.init(EMAILJS_CONFIG.publicKey);
  };
  document.head.appendChild(ejs);

  // Chargement en parallèle — photo depuis Neon, albums et événements depuis Neon
  Promise.all([renderPhoto(), renderAlbums(), renderEvents()]);
});
