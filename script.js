/* ═══════════════════════════════════════════════════
   M.A.C JAMAIS ASSEZ — script.js
   Vercel · Supabase · EmailJS
═══════════════════════════════════════════════════ */
'use strict';

/* ── EMAILJS ── */
const EJS = {
  publicKey:  'C6F_StHUlgq2eIluh',
  serviceId:  'service_ezxfwzg',
  templateId: 'template_c0yitid'
};

/* ── UTILS SÉCURITÉ ── */
// clean() : échappe le HTML pour l'affichage (jamais sur les URLs)
const clean = s => typeof s !== 'string' ? '' : s.trim()
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#x27;')
  .substring(0, 300);

// safeUrl() : n'accepte que les URLs HTTPS dans le DOM
const safeUrl = s => {
  try { const u = new URL(s); return u.protocol === 'https:' ? s : ''; }
  catch { return ''; }
};

const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e));
const isPhone = p => /^[\d\s+\-()\x20]{7,20}$/.test(String(p));

// Rate-limit : 3 soumissions / 10 min / action
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
    return await r.json();
  } catch (e) { return { error: String(e) }; }
};

/* ── EMAIL ── */
function sendEmail(p) {
  if (!window.emailjs) return;
  emailjs.send(EJS.serviceId, EJS.templateId, p, EJS.publicKey).catch(() => {});
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

/* ── NAV ── */
function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMenu()  { document.getElementById('mobileMenu').classList.remove('open'); }
window.addEventListener('scroll', () =>
  document.getElementById('nav')?.classList.toggle('scrolled', scrollY > 60),
  { passive: true });
document.querySelectorAll('a[href^="#"]').forEach(a =>
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); closeMenu(); t.scrollIntoView({ behavior: 'smooth' }); }
  })
);

/* ── PHOTO ARTISTE ── */
async function loadPhoto() {
  const wrap = document.getElementById('heroPhoto');
  if (!wrap) return;
  try {
    const { photo } = await fetch('/api/save-photo').then(r => r.json());
    if (photo?.startsWith('data:image/')) {
      wrap.querySelector('.hero-photo-mono')?.remove();
      const img = document.createElement('img');
      img.src = photo;
      img.alt = 'M.A.C Jamais Assez';
      wrap.appendChild(img);
    }
  } catch {}
}

/* ── SETTINGS (bio, citation, stats) ── */
async function loadSettings() {
  const items = await apiGet('settings_public');
  const get = k => items.find(i => i.key === k)?.value ?? null;

  const bio = get('bio');
  const bioEl = document.getElementById('bioText');
  if (bioEl) {
    bioEl.innerHTML = bio
      ? bio.split('\n').filter(Boolean).map(p => `<p>${clean(p)}</p>`).join('')
      : '<p style="color:var(--gris)">Biographie à renseigner depuis l\'admin.</p>';
  }

  const quote = get('hero_quote');
  const quoteEl = document.getElementById('heroQuote');
  if (quoteEl && quote) quoteEl.textContent = `"${quote}"`;

  const stats = get('stats');
  if (stats) {
    try {
      const s = JSON.parse(stats);
      const els = { statAlbums: s.albums, statConcerts: s.concerts, statAnnees: s.annees };
      Object.entries(els).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '—';
      });
    } catch {}
  }
}

/* ── ALBUMS ── */
let _albums = [];
let _albumsAbort = null;

async function loadAlbums() {
  const grid = document.getElementById('albumsGrid');
  if (!grid) return;

  _albumsAbort?.abort();
  _albumsAbort = new AbortController();

  const items = await apiGet('albums');
  _albums = items.filter(a => a.visible);

  if (!_albums.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🎵</div>
      <div class="empty-state-txt">Aucun album disponible pour le moment.</div>
    </div>`;
    return;
  }

  grid.innerHTML = _albums.map(a => {
    const cover = safeUrl(a.cover_url || '');
    const badge = a.badge ? `<span class="album-badge badge-${a.badge}">${clean(a.badge_label || a.badge)}</span>` : '';
    return `<div class="album-card">
      <div class="album-cover theme-${a.theme || 'terra'}">
        ${cover
          ? `<img src="${cover}" alt="${clean(a.titre)}" loading="lazy">`
          : `<span class="album-cover-mono">${clean(a.code || a.titre.slice(0,3).toUpperCase())}</span>`}
        <div class="album-cover-overlay">
          <button class="btn-primary" data-id="${a.id}" data-action="buy"
            style="font-size:.7rem;padding:.6rem 1.2rem;">Acheter</button>
        </div>
        ${badge}
      </div>
      <div class="album-info">
        <div class="album-titre">${clean(a.titre)}</div>
        <div class="album-meta">${clean(a.annee)}${a.genre ? ' · ' + clean(a.genre) : ''}</div>
        <div class="album-prix">${clean(a.prix || '—')}</div>
        <button class="btn-ghost album-btn" data-id="${a.id}" data-action="buy">Commander</button>
      </div>
    </div>`;
  }).join('');

  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="buy"]');
    if (btn) openBuyModal(parseInt(btn.dataset.id, 10));
  }, { signal: _albumsAbort.signal });
}

/* ── ÉVÉNEMENTS ── */
let _events = [];
let _eventsAbort = null;

async function loadEvents() {
  const list = document.getElementById('eventsList');
  if (!list) return;

  _eventsAbort?.abort();
  _eventsAbort = new AbortController();

  const items = await apiGet('events');
  _events = items.filter(e => e.visible);

  if (!_events.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🎭</div>
      <div class="empty-state-txt">Aucun événement à venir pour le moment.</div>
    </div>`;
    return;
  }

  list.innerHTML = _events.map(ev => {
    const complet = ev.statut === 'complet';
    return `<div class="event-card">
      <div class="event-date-box">
        <div class="event-day">${clean(ev.jour)}</div>
        <div class="event-month">${clean(ev.mois)}</div>
        <div class="event-year">${clean(ev.annee)}</div>
      </div>
      <div class="event-info">
        <div class="event-titre">${clean(ev.titre)}</div>
        <div class="event-lieu">📍 ${clean(ev.lieu)}</div>
        <div class="event-tags">
          <span class="event-type-tag ${ev.type}">${clean(ev.type_label || ev.type)}</span>
          ${complet ? '<span class="event-type-tag" style="border-color:rgba(196,48,48,.4);color:var(--rouge2)">Complet</span>' : ''}
        </div>
      </div>
      <div class="event-action">
        <div class="event-prix">${clean(ev.prix || '—')}</div>
        ${complet
          ? '<span class="btn-complet">Complet</span>'
          : `<button class="btn-ghost" data-id="${ev.id}" data-action="ticket">Réserver</button>`}
      </div>
    </div>`;
  }).join('');

  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="ticket"]');
    if (btn) openTicketModal(parseInt(btn.dataset.id, 10));
  }, { signal: _eventsAbort.signal });
}

/* ── GALERIE ── */
let _galerieAbort = null;

async function loadGalerie() {
  const grid = document.getElementById('galerieGrid');
  if (!grid) return;

  _galerieAbort?.abort();
  _galerieAbort = new AbortController();

  const items = await apiGet('galerie');
  const photos = items.filter(p => p.visible && safeUrl(p.url));

  if (!photos.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">📷</div>
      <div class="empty-state-txt">Aucune photo disponible pour le moment.</div>
    </div>`;
    return;
  }

  grid.innerHTML = photos.map(p => {
    const url     = safeUrl(p.url);
    const legende = clean(p.legende || '');
    return `<div class="galerie-item" data-url="${url}" data-caption="${legende}">
      <img src="${url}" alt="${legende || 'Photo'}" loading="lazy">
      <div class="galerie-item-overlay">
        ${legende ? `<div class="galerie-item-caption">${legende}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  grid.addEventListener('click', e => {
    const item = e.target.closest('.galerie-item');
    if (item) openPhotoModal(item.dataset.url, item.dataset.caption);
  }, { signal: _galerieAbort.signal });
}

/* ── MODAL PHOTO ── */
function openPhotoModal(url, caption) {
  document.getElementById('modalPhotoImg').src = url;
  document.getElementById('modalPhotoCaption').textContent = caption;
  openModal('modalPhoto');
}

/* ── MODAL ACHAT ── */
let _buyAlbum = null;

function openBuyModal(id) {
  _buyAlbum = _albums.find(x => x.id === id || String(x.id) === String(id));
  if (!_buyAlbum) return;
  document.getElementById('buyAlbumTitle').textContent = _buyAlbum.titre;
  document.getElementById('buyAlbumMeta').textContent =
    [_buyAlbum.annee, _buyAlbum.genre].filter(Boolean).join(' · ');
  document.getElementById('buyAlbumPrix').textContent = _buyAlbum.prix || '—';
  clearForm('buyForm');
  openModal('modalAchat');
}

async function submitAchat(e) {
  e.preventDefault();
  const prenom = document.getElementById('buyPrenom').value.trim();
  const nom    = document.getElementById('buyNom').value.trim();
  const email  = document.getElementById('buyEmail').value.trim();
  const tel    = document.getElementById('buyTel').value.trim();
  const ville  = document.getElementById('buyVille').value.trim();
  const qty    = Math.max(1, Math.min(10, parseInt(document.getElementById('buyQty').value) || 1));
  const msgEl  = document.getElementById('buyMsg');
  const btn    = document.getElementById('buyBtn');

  msgEl.className = 'form-msg';
  if (!prenom || !nom)      { showMsg(msgEl, 'Prénom et nom obligatoires.', 'error'); return; }
  if (!isEmail(email))      { showMsg(msgEl, 'Email invalide.', 'error'); return; }
  if (tel && !isPhone(tel)) { showMsg(msgEl, 'Téléphone invalide.', 'error'); return; }
  if (!rateOk('achat'))     { showMsg(msgEl, 'Trop de tentatives. Réessayez dans 10 min.', 'error'); return; }

  btn.disabled = true; btn.textContent = 'Envoi…';

  const r = await apiPost('/api/save-commande', {
    nom: clean(nom), prenom: clean(prenom),
    email: clean(email), tel: clean(tel), ville: clean(ville),
    album: _buyAlbum.titre, prix: _buyAlbum.prix, quantite: qty
  });

  btn.disabled = false; btn.textContent = 'Confirmer la commande';

  if (r.success) {
    sendEmail({
      name: `${prenom} ${nom} (${email})`,
      time: new Date().toLocaleString('fr-FR'),
      message: `🛒 COMMANDE\nRéf: ${r.id}\nAlbum: ${_buyAlbum.titre} × ${qty}\nPrix: ${_buyAlbum.prix}\nTél: ${tel || '—'}\nVille: ${ville || '—'}`
    });
    closeModal('modalAchat');
    showSuccess('Commande confirmée !', `Référence : ${r.id}`, `${_buyAlbum.titre} × ${qty}`);
  } else {
    showMsg(msgEl, r.error || 'Erreur. Réessayez.', 'error');
  }
}

/* ── MODAL RÉSERVATION ── */
let _ticketEv = null;

function openTicketModal(id) {
  _ticketEv = _events.find(x => x.id === id || String(x.id) === String(id));
  if (!_ticketEv) return;
  document.getElementById('ticketEvTitle').textContent = _ticketEv.titre;
  document.getElementById('ticketEvMeta').textContent =
    `${_ticketEv.jour} ${_ticketEv.mois} ${_ticketEv.annee} · ${_ticketEv.lieu}`;
  document.getElementById('ticketEvPrix').textContent = _ticketEv.prix || '—';
  clearForm('ticketForm');
  openModal('modalTicket');
}

async function submitTicket(e) {
  e.preventDefault();
  const prenom = document.getElementById('ticketPrenom').value.trim();
  const nom    = document.getElementById('ticketNom').value.trim();
  const email  = document.getElementById('ticketEmail').value.trim();
  const tel    = document.getElementById('ticketTel').value.trim();
  const qty    = Math.max(1, Math.min(10, parseInt(document.getElementById('ticketQty').value) || 1));
  const msgEl  = document.getElementById('ticketMsg');
  const btn    = document.getElementById('ticketBtn');

  msgEl.className = 'form-msg';
  if (!prenom || !nom)   { showMsg(msgEl, 'Prénom et nom obligatoires.', 'error'); return; }
  if (!isEmail(email))   { showMsg(msgEl, 'Email invalide.', 'error'); return; }
  if (!tel)              { showMsg(msgEl, 'Téléphone obligatoire.', 'error'); return; }
  if (!isPhone(tel))     { showMsg(msgEl, 'Téléphone invalide.', 'error'); return; }
  if (!rateOk('ticket')) { showMsg(msgEl, 'Trop de tentatives. Réessayez dans 10 min.', 'error'); return; }

  btn.disabled = true; btn.textContent = 'Envoi…';

  const r = await apiPost('/api/save-reservation', {
    nom: clean(nom), prenom: clean(prenom),
    email: clean(email), tel: clean(tel),
    evenement:  _ticketEv.titre,
    date_event: `${_ticketEv.jour} ${_ticketEv.mois} ${_ticketEv.annee}`,
    lieu:       _ticketEv.lieu,
    prix:       _ticketEv.prix,
    quantite:   qty
  });

  btn.disabled = false; btn.textContent = 'Confirmer la réservation';

  if (r.success) {
    sendEmail({
      name: `${prenom} ${nom} (${email})`,
      time: new Date().toLocaleString('fr-FR'),
      message: `🎫 RÉSERVATION\nRéf: ${r.id}\nÉvénement: ${_ticketEv.titre}\nDate: ${_ticketEv.jour} ${_ticketEv.mois} ${_ticketEv.annee}\nLieu: ${_ticketEv.lieu}\nPlaces: ${qty} × ${_ticketEv.prix}\nTél: ${tel}`
    });
    closeModal('modalTicket');
    showSuccess('Réservation confirmée !', `Référence : ${r.id}`, `${_ticketEv.titre} · ${qty} place(s)`);
  } else {
    showMsg(msgEl, r.error || 'Erreur. Réessayez.', 'error');
  }
}

/* ── NEWSLETTER ── */
async function submitNewsletter() {
  const input = document.getElementById('nlEmail');
  const btn   = document.getElementById('nlBtn');
  const email = input.value.trim();

  if (!isEmail(email)) {
    input.style.borderColor = 'rgba(255,255,255,.5)';
    setTimeout(() => input.style.borderColor = '', 2000);
    return;
  }
  if (!rateOk('nl')) return;

  btn.disabled = true; btn.textContent = '…';
  const r = await apiPost('/api/save-newsletter', { email });

  if (r.success) {
    input.value = '';
    btn.textContent = r.alreadySubscribed ? 'Déjà inscrit !' : '✓ Inscrit !';
  } else {
    btn.textContent = 'Erreur';
  }
  setTimeout(() => { btn.textContent = "S'inscrire"; btn.disabled = false; }, 3000);
}

/* ── CONTACT ── */
async function submitContact(e) {
  e.preventDefault();
  const prenom  = document.getElementById('cPrenom').value.trim();
  const nom     = document.getElementById('cNom').value.trim();
  const email   = document.getElementById('cEmail').value.trim();
  const sujet   = document.getElementById('cSujet').value;
  const message = document.getElementById('cMessage').value.trim();
  const msgEl   = document.getElementById('contactMsg');
  const btn     = document.getElementById('contactBtn');

  if (!prenom || !nom || !email || !message) {
    showMsg(msgEl, 'Remplissez tous les champs obligatoires.', 'error'); return;
  }
  if (!isEmail(email)) { showMsg(msgEl, 'Email invalide.', 'error'); return; }
  if (message.length < 5) { showMsg(msgEl, 'Message trop court.', 'error'); return; }
  if (!rateOk('contact')) { showMsg(msgEl, 'Trop de tentatives. Réessayez dans 10 min.', 'error'); return; }

  btn.disabled = true; btn.textContent = 'Envoi en cours…';

  const r = await apiPost('/api/save-message', {
    nom:     clean(`${prenom} ${nom}`),
    email:   clean(email),
    message: clean(`[${sujet}] ${message}`, 1000)
  });

  btn.disabled = false; btn.textContent = 'Envoyer le message';

  if (r.success) {
    sendEmail({
      name: `${prenom} ${nom} (${email})`,
      time: new Date().toLocaleString('fr-FR'),
      message: `[${sujet}] ${message}`
    });
    document.getElementById('contactForm').reset();
    showMsg(msgEl, 'Message envoyé ! Nous vous répondrons très prochainement.', 'success');
  } else {
    showMsg(msgEl, r.error || 'Erreur. Réessayez.', 'error');
  }
}

/* ── HELPERS ── */
function showMsg(el, txt, type) {
  el.textContent = txt;
  el.className = `form-msg ${type}`;
}
function showSuccess(title, ref, detail) {
  document.getElementById('successTitle').textContent  = title;
  document.getElementById('successRef').textContent    = ref;
  document.getElementById('successDetail').textContent = detail;
  openModal('modalSuccess');
}
function clearForm(id) {
  const f = document.getElementById(id);
  if (!f) return;
  f.reset();
  f.querySelectorAll('.form-msg').forEach(el => {
    el.textContent = '';
    el.className   = 'form-msg';
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  // Charge EmailJS en async — ne bloque pas le rendu
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  s.onload = () => window.emailjs?.init(EJS.publicKey);
  document.head.appendChild(s);

  // Chargement parallèle de tout le contenu
  Promise.all([
    loadPhoto(),
    loadSettings(),
    loadAlbums(),
    loadEvents(),
    loadGalerie()
  ]);
});
