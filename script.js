/* M.A.C JAMAIS ASSEZ — script.js · Vercel + Supabase + EmailJS */
'use strict';

/* ── EMAILJS ── */
const EJS = {
  publicKey:  'C6F_StHUlgq2eIluh',
  serviceId:  'service_ezxfwzg',
  templateId: 'template_c0yitid'
};

/* ── SANITISATION ── */
const esc = s => typeof s !== 'string' ? '' : s.trim()
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#x27;').slice(0,300);

const safeUrl = s => {
  try { const u = new URL(s); return u.protocol === 'https:' ? s : ''; }
  catch { return ''; }
};

const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e));
const isPhone = p => /^[\d\s+\-()\x20]{7,20}$/.test(String(p));

/* Rate-limit client : 3 / 10 min / action */
const _rl = {};
function rateOk(k) {
  const now = Date.now(), w = 600000;
  _rl[k] = (_rl[k] || []).filter(t => now - t < w);
  if (_rl[k].length >= 3) return false;
  _rl[k].push(now); return true;
}

/* ── API ── */
const apiGet = async store => {
  try {
    const r = await fetch(`/api/get-data?store=${encodeURIComponent(store)}`);
    if (!r.ok) return [];
    return (await r.json()).items || [];
  } catch { return []; }
};

const apiPost = async (path, data) => {
  try {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return r.json();
  } catch (e) { return { error: String(e) }; }
};

/* ── EMAIL ── */
const sendEmail = p => window.emailjs?.send(EJS.serviceId, EJS.templateId, p, EJS.publicKey).catch(() => {});

/* ── PAGE LOADER ── */
function hideLoader() {
  const l = document.getElementById('pageLoader');
  if (l) { l.classList.add('hidden'); setTimeout(() => l.remove(), 700); }
}

/* ── MODALS ── */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  m.querySelector('input,button')?.focus();
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

/* ── NAV ── */
function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMenu()  { document.getElementById('mobileMenu').classList.remove('open'); }
window.addEventListener('scroll', () =>
  document.getElementById('nav')?.classList.toggle('scrolled', scrollY > 60),
  { passive: true }
);
document.querySelectorAll('a[href^="#"]').forEach(a =>
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); closeMenu(); t.scrollIntoView({ behavior: 'smooth' }); }
  })
);

/* ── PHOTO ARTISTE ── */
async function loadPhoto() {
  const frame = document.getElementById('heroPhoto');
  if (!frame) return;
  try {
    const { photo } = await fetch('/api/save-photo').then(r => r.json());
    if (photo?.startsWith('data:image/')) {
      const img = document.createElement('img');
      img.src = photo; img.alt = 'M.A.C Jamais Assez';
      frame.querySelector('.hero-photo-mono')?.remove();
      frame.appendChild(img);
      frame.classList.add('loaded');
    } else {
      frame.classList.add('loaded');
    }
  } catch { frame.classList.add('loaded'); }
}

/* ── SETTINGS ── */
async function loadSettings() {
  const items = await apiGet('settings_public');
  const get = k => items.find(i => i.key === k)?.value ?? null;

  const bioEl = document.getElementById('bioText');
  const bio = get('bio');
  if (bioEl) {
    bioEl.innerHTML = bio
      ? bio.split('\n').filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('')
      : '<p style="color:var(--gris)">Biographie à venir.</p>';
  }

  const q = get('hero_quote');
  const qEl = document.getElementById('heroQuote');
  if (qEl && q) qEl.textContent = `"${q}"`;

  const stats = get('stats');
  if (stats) {
    try {
      const s = JSON.parse(stats);
      const ids = { statAlbums: s.albums, statConcerts: s.concerts, statAnnees: s.annees };
      Object.entries(ids).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '—';
      });
    } catch {}
  }
}

/* ── ALBUMS ── */
let _albums = [];
let _albumsCtrl = null;

async function loadAlbums() {
  const grid = document.getElementById('albumsGrid');
  if (!grid) return;
  _albumsCtrl?.abort(); _albumsCtrl = new AbortController();

  const items = await apiGet('albums');
  _albums = items.filter(a => a.visible);

  if (!_albums.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🎵</div><div class="empty-txt">Aucun album pour le moment.</div></div>`;
    return;
  }

  grid.innerHTML = _albums.map(a => {
    const cover = safeUrl(a.cover_url || '');
    const badge = a.badge ? `<span class="album-badge badge-${a.badge}">${esc(a.badge_label||a.badge)}</span>` : '';
    return `<div class="album-card" data-id="${a.id}">
      <div class="album-cover theme-${a.theme||'terra'}">
        ${cover ? `<img src="${cover}" alt="${esc(a.titre)}" loading="lazy">` : `<span class="album-cover-mono">${esc(a.code||a.titre.slice(0,3).toUpperCase())}</span>`}
        <div class="album-hover">
          <button class="btn-primary" style="font-size:.68rem;padding:.55rem 1.2rem;" data-action="buy">Commander</button>
        </div>
        ${badge}
      </div>
      <div class="album-info">
        <div class="album-titre">${esc(a.titre)}</div>
        <div class="album-meta">${esc(a.annee)}${a.genre ? ' · '+esc(a.genre) : ''}</div>
        <div class="album-prix">${esc(a.prix||'—')}</div>
        <button class="album-btn" data-action="buy">Acheter</button>
      </div>
    </div>`;
  }).join('');

  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="buy"]');
    if (!btn) return;
    const id = parseInt(btn.closest('.album-card')?.dataset.id, 10);
    openBuyModal(id);
  }, { signal: _albumsCtrl.signal });
}

/* ── ÉVÉNEMENTS ── */
let _events = [];
let _eventsCtrl = null;

async function loadEvents() {
  const list = document.getElementById('eventsList');
  if (!list) return;
  _eventsCtrl?.abort(); _eventsCtrl = new AbortController();

  const items = await apiGet('events');
  _events = items.filter(e => e.visible);

  if (!_events.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🎭</div><div class="empty-txt">Aucun événement à venir.</div></div>`;
    return;
  }

  const complet = ev => ev.statut === 'complet';
  list.innerHTML = _events.map(ev => `
    <div class="event-card" data-id="${ev.id}">
      <div class="ev-date">
        <div class="ev-day">${esc(ev.jour)}</div>
        <div class="ev-month">${esc(ev.mois)}</div>
        <div class="ev-year">${esc(ev.annee)}</div>
      </div>
      <div class="ev-info">
        <div class="ev-titre">${esc(ev.titre)}</div>
        <div class="ev-lieu">📍 ${esc(ev.lieu)}</div>
        <div class="ev-tags">
          <span class="ev-tag ${ev.type}">${esc(ev.typeLabel||ev.type)}</span>
          ${complet(ev) ? '<span class="ev-tag complet">Complet</span>' : ''}
        </div>
      </div>
      <div class="ev-action">
        <div class="ev-prix">${esc(ev.prix||'—')}</div>
        ${complet(ev)
          ? '<span class="btn-complet">Complet</span>'
          : `<button class="btn-primary" style="font-size:.68rem;padding:.55rem 1.2rem;" data-action="ticket">Réserver</button>`}
      </div>
    </div>`).join('');

  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="ticket"]');
    if (!btn) return;
    const id = parseInt(btn.closest('.event-card')?.dataset.id, 10);
    openTicketModal(id);
  }, { signal: _eventsCtrl.signal });
}

/* ── GALERIE ── */
let _galerieCtrl = null;

async function loadGalerie() {
  const grid = document.getElementById('galerieGrid');
  if (!grid) return;
  _galerieCtrl?.abort(); _galerieCtrl = new AbortController();

  const items = await apiGet('galerie');
  const photos = items.filter(p => p.visible && safeUrl(p.url));

  if (!photos.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📷</div><div class="empty-txt">Aucune photo pour le moment.</div></div>`;
    return;
  }

  grid.innerHTML = photos.map(p => {
    const url = safeUrl(p.url);
    const cap = esc(p.legende || '');
    return `<div class="galerie-item" data-url="${url}" data-cap="${cap}">
      <img src="${url}" alt="${cap||'Photo'}" loading="lazy">
      <div class="galerie-overlay">${cap ? `<span class="galerie-cap">${cap}</span>` : ''}</div>
    </div>`;
  }).join('');

  grid.addEventListener('click', e => {
    const it = e.target.closest('.galerie-item');
    if (it) openPhotoModal(it.dataset.url, it.dataset.cap);
  }, { signal: _galerieCtrl.signal });
}

/* ── MODALS CONTENT ── */
function openPhotoModal(url, cap) {
  document.getElementById('modalPhotoImg').src = url;
  document.getElementById('modalPhotoCap').textContent = cap;
  openModal('modalPhoto');
}

let _buyAlbum = null;
function openBuyModal(id) {
  _buyAlbum = _albums.find(x => x.id === id || String(x.id) === String(id));
  if (!_buyAlbum) return;
  document.getElementById('buyAlbumTitle').textContent = _buyAlbum.titre;
  document.getElementById('buyAlbumMeta').textContent  = [_buyAlbum.annee, _buyAlbum.genre].filter(Boolean).join(' · ');
  document.getElementById('buyAlbumPrix').textContent  = _buyAlbum.prix || '—';
  clearForm('buyForm'); openModal('modalAchat');
}

let _ticketEv = null;
function openTicketModal(id) {
  _ticketEv = _events.find(x => x.id === id || String(x.id) === String(id));
  if (!_ticketEv) return;
  document.getElementById('ticketEvTitle').textContent = _ticketEv.titre;
  document.getElementById('ticketEvMeta').textContent  = `${_ticketEv.jour} ${_ticketEv.mois} ${_ticketEv.annee} · ${_ticketEv.lieu}`;
  document.getElementById('ticketEvPrix').textContent  = _ticketEv.prix || '—';
  clearForm('ticketForm'); openModal('modalTicket');
}

/* ── SUBMIT ACHAT ── */
async function submitAchat(e) {
  e.preventDefault();
  const prenom = document.getElementById('buyPrenom').value.trim();
  const nom    = document.getElementById('buyNom').value.trim();
  const email  = document.getElementById('buyEmail').value.trim();
  const tel    = document.getElementById('buyTel').value.trim();
  const ville  = document.getElementById('buyVille').value.trim();
  const qty    = Math.max(1, Math.min(10, parseInt(document.getElementById('buyQty').value)||1));
  const msg    = document.getElementById('buyMsg');
  const btn    = document.getElementById('buyBtn');

  msg.className = 'form-msg';
  if (!prenom||!nom)      { showMsg(msg,'Prénom et nom obligatoires.','error'); return; }
  if (!isEmail(email))    { showMsg(msg,'Email invalide.','error'); return; }
  if (tel&&!isPhone(tel)) { showMsg(msg,'Téléphone invalide.','error'); return; }
  if (!rateOk('achat'))   { showMsg(msg,'Trop de tentatives. Réessayez dans 10 min.','error'); return; }

  btn.disabled = true; btn.textContent = 'Envoi…';

  const r = await apiPost('/api/save-commande', {
    prenom: esc(prenom), nom: esc(nom), email: esc(email),
    tel: esc(tel), ville: esc(ville),
    album: _buyAlbum.titre, prix: _buyAlbum.prix, quantite: qty
  });

  btn.disabled = false; btn.textContent = 'Confirmer la commande';

  if (r.success) {
    sendEmail({ name:`${prenom} ${nom} (${email})`, time:new Date().toLocaleString('fr-FR'),
      message:`🛒 COMMANDE\nRéf: ${r.id}\nAlbum: ${_buyAlbum.titre} × ${qty}\nPrix: ${_buyAlbum.prix}\nTél: ${tel||'—'}\nVille: ${ville||'—'}` });
    closeModal('modalAchat');
    showOk('Commande confirmée !', `Référence : ${r.id}`, `${_buyAlbum.titre} × ${qty}`);
  } else {
    showMsg(msg, r.error||'Erreur. Réessayez.', 'error');
  }
}

/* ── SUBMIT TICKET ── */
async function submitTicket(e) {
  e.preventDefault();
  const prenom = document.getElementById('ticketPrenom').value.trim();
  const nom    = document.getElementById('ticketNom').value.trim();
  const email  = document.getElementById('ticketEmail').value.trim();
  const tel    = document.getElementById('ticketTel').value.trim();
  const qty    = Math.max(1, Math.min(10, parseInt(document.getElementById('ticketQty').value)||1));
  const msg    = document.getElementById('ticketMsg');
  const btn    = document.getElementById('ticketBtn');

  msg.className = 'form-msg';
  if (!prenom||!nom)   { showMsg(msg,'Prénom et nom obligatoires.','error'); return; }
  if (!isEmail(email)) { showMsg(msg,'Email invalide.','error'); return; }
  if (!tel)            { showMsg(msg,'Téléphone obligatoire.','error'); return; }
  if (!isPhone(tel))   { showMsg(msg,'Téléphone invalide.','error'); return; }
  if (!rateOk('ticket')){ showMsg(msg,'Trop de tentatives. Réessayez dans 10 min.','error'); return; }

  btn.disabled = true; btn.textContent = 'Envoi…';

  const r = await apiPost('/api/save-reservation', {
    prenom: esc(prenom), nom: esc(nom), email: esc(email), tel: esc(tel),
    evenement: _ticketEv.titre,
    date_event: `${_ticketEv.jour} ${_ticketEv.mois} ${_ticketEv.annee}`,
    lieu: _ticketEv.lieu, prix: _ticketEv.prix, quantite: qty
  });

  btn.disabled = false; btn.textContent = 'Confirmer la réservation';

  if (r.success) {
    sendEmail({ name:`${prenom} ${nom} (${email})`, time:new Date().toLocaleString('fr-FR'),
      message:`🎫 RÉSERVATION\nRéf: ${r.id}\nÉvénement: ${_ticketEv.titre}\nDate: ${_ticketEv.jour} ${_ticketEv.mois} ${_ticketEv.annee}\nLieu: ${_ticketEv.lieu}\nPlaces: ${qty} × ${_ticketEv.prix}\nTél: ${tel}` });
    closeModal('modalTicket');
    showOk('Réservation confirmée !', `Référence : ${r.id}`, `${_ticketEv.titre} · ${qty} place(s)`);
  } else {
    showMsg(msg, r.error||'Erreur. Réessayez.', 'error');
  }
}

/* ── NEWSLETTER ── */
async function submitNewsletter() {
  const input = document.getElementById('nlEmail');
  const btn   = document.getElementById('nlBtn');
  const email = input.value.trim();
  if (!isEmail(email)) {
    input.style.borderColor='rgba(255,255,255,.5)';
    setTimeout(()=>input.style.borderColor='',2000); return;
  }
  if (!rateOk('nl')) return;
  btn.disabled=true; btn.textContent='…';
  const r = await apiPost('/api/save-newsletter', { email });
  btn.textContent = r.success ? (r.alreadySubscribed?'Déjà inscrit !':'✓ Inscrit !') : 'Erreur';
  if (r.success) input.value='';
  setTimeout(()=>{ btn.textContent="S'inscrire"; btn.disabled=false; },3000);
}

/* ── CONTACT ── */
async function submitContact(e) {
  e.preventDefault();
  const prenom  = document.getElementById('cPrenom').value.trim();
  const nom     = document.getElementById('cNom').value.trim();
  const email   = document.getElementById('cEmail').value.trim();
  const sujet   = document.getElementById('cSujet').value;
  const message = document.getElementById('cMessage').value.trim();
  const msg     = document.getElementById('contactMsg');
  const btn     = document.getElementById('contactBtn');

  if (!prenom||!nom||!email||!message) { showMsg(msg,'Remplissez tous les champs obligatoires.','error'); return; }
  if (!isEmail(email)) { showMsg(msg,'Email invalide.','error'); return; }
  if (message.length<5){ showMsg(msg,'Message trop court.','error'); return; }
  if (!rateOk('contact')){ showMsg(msg,'Trop de tentatives. Réessayez dans 10 min.','error'); return; }

  btn.disabled=true; btn.textContent='Envoi…';
  const r = await apiPost('/api/save-message', {
    prenom:esc(prenom), nom:esc(nom), email:esc(email),
    sujet, message:esc(message,1000)
  });
  btn.disabled=false; btn.textContent='Envoyer le message';

  if (r.success) {
    sendEmail({ name:`${prenom} ${nom} (${email})`, time:new Date().toLocaleString('fr-FR'), message:`[${sujet}] ${message}` });
    document.getElementById('contactForm').reset();
    showMsg(msg,'Message envoyé ! Nous vous répondrons très prochainement.','success');
  } else {
    showMsg(msg, r.error||'Erreur. Réessayez.','error');
  }
}

/* ── HELPERS ── */
function showMsg(el,txt,type) { el.textContent=txt; el.className=`form-msg ${type}`; }
function showOk(title,ref,detail) {
  document.getElementById('okTitle').textContent  = title;
  document.getElementById('okRef').textContent    = ref;
  document.getElementById('okDetail').textContent = detail;
  openModal('modalOk');
}
function clearForm(id) {
  const f=document.getElementById(id);
  if(!f)return; f.reset();
  f.querySelectorAll('.form-msg').forEach(el=>{el.textContent='';el.className='form-msg';});
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  // EmailJS async
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  s.onload=()=>window.emailjs?.init(EJS.publicKey);
  document.head.appendChild(s);

  // Tout en parallèle
  Promise.all([
    loadPhoto(),
    loadSettings(),
    loadAlbums(),
    loadEvents(),
    loadGalerie()
  ]).finally(hideLoader);
});
