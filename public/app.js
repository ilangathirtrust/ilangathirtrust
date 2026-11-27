const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// Footer year
$('#year').textContent = new Date().getFullYear();

// Navigation toggle
const menu = $('.menu-toggle'), nav = $('.nav');
if (menu && nav) {
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? '×' : '☰';
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.textContent = '☰';
  }));
}

// Language Management
let currentLang = 'en';
try {
  currentLang = localStorage.getItem('ilangathir_lang') || 'en';
} catch (e) {}

function getTranslationsDict() {
  if (typeof translations !== 'undefined' && translations) return translations;
  if (typeof window !== 'undefined' && window.translations) return window.translations;
  return null;
}

function setLanguage(lang) {
  if (!lang || (lang !== 'en' && lang !== 'ta')) {
    lang = 'en';
  }

  const dict = getTranslationsDict();
  if (!dict || !dict[lang]) {
    // If translations script hasn't finished loading, retry on DOM ready / load
    setTimeout(() => {
      const retryDict = getTranslationsDict();
      if (retryDict && retryDict[lang]) setLanguage(lang);
    }, 50);
    return;
  }

  currentLang = lang;
  try {
    localStorage.setItem('ilangathir_lang', lang);
  } catch (e) {}

  document.documentElement.lang = lang;

  // Update active state on all toggle buttons (supporting both .active and .on)
  const allLangButtons = document.querySelectorAll(
    '.lang-btn, .top-lang-btn, [data-lang], [data-l], .lang button, .lang-switch button, .top-lang-switch button'
  );

  allLangButtons.forEach(btn => {
    const btnLang = btn.getAttribute('data-lang') || 
                    btn.getAttribute('data-l') || 
                    (btn.textContent.trim().includes('தமிழ்') ? 'ta' : (btn.textContent.trim().toUpperCase() === 'EN' ? 'en' : ''));
    const isActive = btnLang === lang;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('on', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  const t = dict[lang];

  // Update elements with data-i18n (HTML support for <em>, <span>, etc.)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = t[key];
      } else if (el.tagName === 'OPTION') {
        el.textContent = t[key];
      } else {
        el.innerHTML = t[key];
      }
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) {
      el.setAttribute('placeholder', t[key]);
    }
  });

  // Document title
  document.title = lang === 'ta'
    ? 'இளங்கதிர் அறக்கட்டளை | ஒளிரும் நாளைக்காக ஒன்றிணைவோம்'
    : 'Ilangathir Arakattalai | Together for a Brighter Tomorrow';

  // Refresh dynamic content for current language
  if (typeof loadPublicContent === 'function') {
    loadPublicContent();
  }
}

// Global delegated event listener for language toggles
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.lang-btn, .top-lang-btn, [data-lang], [data-l], .lang button, .lang-switch button, .top-lang-switch button');
  if (btn) {
    const targetLang = btn.getAttribute('data-lang') || 
                       btn.getAttribute('data-l') || 
                       (btn.textContent.trim().includes('தமிழ்') ? 'ta' : 'en');
    if (targetLang && (targetLang === 'en' || targetLang === 'ta')) {
      e.preventDefault();
      setLanguage(targetLang);
    }
  }
});

// Expose globally
if (typeof window !== 'undefined') {
  window.setLanguage = setLanguage;
  window.currentLang = () => currentLang;
}

const API_BASE = (location.port === '3000' || (location.protocol === 'https:' && !location.port))
  ? ''
  : 'http://localhost:3000';

async function getJSON(url) {
  const r = await fetch(API_BASE + url);
  if (!r.ok) throw new Error('Request failed');
  return r.json();
}

function safeText(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function safeImg(path) {
  if (!path) return '';
  const s = String(path).trim();
  if (s.startsWith('/uploads/') || s.startsWith('uploads/')) {
    const norm = s.startsWith('/') ? s : '/' + s;
    return API_BASE ? API_BASE + norm : norm;
  }
  if (s.startsWith('/assets/') || s.startsWith('assets/')) return s.startsWith('/') ? s : '/' + s;
  if (/^https?:\/\//i.test(s) || s.startsWith('data:image/')) return s;
  return s.startsWith('/') ? s : '/' + s;
}

function formatEventDate(dateStr, isTa) {
  if (!dateStr) return { day: '15', month: isTa ? 'டிச' : 'DEC' };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { day: dateStr.slice(-2), month: 'DATE' };
    const day = String(d.getDate()).padStart(2, '0');
    const monthsEn = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthsTa = ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'];
    const month = (isTa ? monthsTa : monthsEn)[d.getMonth()];
    return { day, month };
  } catch (e) {
    return { day: '✦', month: 'EVENT' };
  }
}

function getPreviewStoreFallback(key) {
  try {
    const raw = localStorage.getItem('ilangathir_preview_store');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed[key] || null;
    }
  } catch { }
  return null;
}

async function loadPublicContent() {
  try {
    const s = await getJSON('/api/public/settings');
    if (s.founder_name) $('#founder-name').textContent = s.founder_name;
    if (s.founder_bio) $('#founder-bio').textContent = s.founder_bio;
    if (s.phone) {
      $('#contact-phone').textContent = s.phone;
      $('#contact-phone').href = 'tel:' + s.phone.replace(/[^\d+]/g, '');
    }
    if (s.email) {
      $('#contact-email').textContent = s.email;
      $('#contact-email').href = 'mailto:' + s.email;
    }
    if (s.address) $('#contact-address').textContent = s.address;
  } catch (e) {
    console.info('Using local display content until database is configured.');
  }

  // 1. Activities
  try {
    let items = [];
    try {
      items = await getJSON('/api/public/activities');
    } catch {
      const localActs = getPreviewStoreFallback('activities');
      if (localActs) items = localActs.filter(a => a.status === 'published');
    }
    if (items && items.length) {
      $('#activity-list').innerHTML = items.map((a, i) => {
        const imgSrc = safeImg(a.image_path);
        return `
          <article class="activity-card">
            <div class="activity-art ${['art-blue', 'art-green', 'art-orange'][i % 3]}">
              ${imgSrc ? `<img src="${imgSrc}" alt="${safeText(a.title)}">` : ['♡', '✳', '⌂'][i % 3]}
            </div>
            <div class="card-body">
              <span class="card-label">${safeText(a.location || (currentLang === 'ta' ? 'அறக்கட்டளை பணி' : 'TRUST ACTIVITY'))}</span>
              <h3>${safeText(a.title)}</h3>
              <p>${safeText(a.description)}</p>
              ${a.activity_date ? `<small>${safeText(a.activity_date)}</small>` : ''}
            </div>
          </article>
        `;
      }).join('');
    }
  } catch { }

  // 2. Events & Banner
  const eventsList = $('#events-list');
  if (eventsList) {
    const isTa = currentLang === 'ta';
    let newsItems = [];
    try {
      newsItems = await getJSON('/api/public/news');
    } catch {
      const localNews = getPreviewStoreFallback('news');
      if (localNews) newsItems = localNews.filter(n => n.status === 'published');
    }

    const itemsToRender = (newsItems && newsItems.length > 0) ? newsItems : [
      {
        title: isTa ? "ஆண்டு இலவச மருத்துவ & கண் சிகிச்சை முகாம்" : "Annual Community Health & Eye Care Camp",
        body: isTa ? "இளங்கதிர் அறக்கட்டளையின் இலவச மருத்துவ மற்றும் கண் பரிசோதனை முகாம். மருத்துவர் ஆலோசனை, கண் பரிசோதனை மற்றும் மருந்து விநியோகம் இலவசமாக வழங்கப்படும்." : "Join Ilangathir Arakattalai for our upcoming comprehensive health and eye screening camp. Free consultations with doctors, vision tests, and medicine distribution will be provided for all community members.",
        event_date: "2026-12-20",
        location: isTa ? "சமூக நலக்கூடம், V. கல்லுப்பட்டி" : "Community Hall, V. Kallupatti",
        cover_image: "/assets/hero-healthcamp.jpg"
      },
      {
        title: isTa ? "குளிர்கால நிவாரணம் & மாணவர் கல்வி ஆதரவு" : "Winter Relief & Student Support Drive",
        body: isTa ? "கிராமப்புற அரசுப் பள்ளி மாணவர்களுக்கு புத்தகங்கள், எழுதுபொருட்கள் மற்றும் குளிர்கால உதவிப் பொருட்கள் வழங்கும் தன்னார்வ முன்முயற்சி." : "A special volunteer initiative to distribute winter essentials and educational aid to deserving school children across rural schools.",
        event_date: "2027-01-10",
        location: isTa ? "அரசு மேல்நிலைப் பள்ளி, திண்டுக்கல்" : "Government High School, Dindigul",
        cover_image: "/assets/hero-relief.jpg"
      }
    ];

    eventsList.innerHTML = itemsToRender.map(n => {
      const bannerSrc = safeImg(n.cover_image) || '/assets/hero-healthcamp.jpg';
      const dateInfo = formatEventDate(n.event_date, isTa);
      const locText = safeText(n.location || (isTa ? 'தமிழ்நாடு, இந்தியா' : 'Tamil Nadu, India'));
      const btnText = isTa ? 'பங்கேற்க' : 'Participate';

      return `
        <article class="event-card">
          <div class="event-banner-wrap">
            <img class="event-banner-img" src="${bannerSrc}" alt="${safeText(n.title)}" onerror="this.src='/assets/hero-healthcamp.jpg'">
            <div class="event-date-badge">
              <span class="event-date-day">${dateInfo.day}</span>
              <span class="event-date-month">${dateInfo.month}</span>
            </div>
          </div>
          <div class="event-card-body">
            <div class="event-meta">
              <span class="event-location-pill">📍 ${locText}</span>
            </div>
            <h3 class="event-title">${safeText(n.title)}</h3>
            <p class="event-details">${safeText(n.body)}</p>
            <div class="event-card-footer">
              <a href="#join" class="btn primary small">${btnText} <span>↗</span></a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // 3. Gallery
  try {
    let items = [];
    try {
      items = await getJSON('/api/public/gallery');
    } catch {
      const localGallery = getPreviewStoreFallback('gallery');
      if (localGallery) items = localGallery;
    }
    if (items && items.length) {
      $('#gallery-list').innerHTML = items.map(a => {
        const imgSrc = safeImg(a.image_path) || '/assets/hero-healthcamp.jpg';
        return `
          <a class="gallery-placeholder" style="padding:0;overflow:hidden;position:relative" href="${imgSrc}" target="_blank" rel="noopener">
            <img style="width:100%;height:230px;object-fit:cover" src="${imgSrc}" alt="${safeText(a.caption)}">
            <b style="padding:12px;display:block">${safeText(a.caption || a.category || 'Trust Moment')}</b>
          </a>
        `;
      }).join('');
    }
  } catch { }
}

async function submitForm(form, url, transform) {
  const message = $('.form-message', form);
  const button = $('button[type=submit]', form);
  message.textContent = '';
  message.classList.remove('error');
  button.disabled = true;
  button.style.opacity = '.7';

  let data = Object.fromEntries(new FormData(form).entries());
  if (transform) data = transform(data);

  try {
    const r = await fetch(API_BASE + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await r.json();
    if (!r.ok) throw new Error(result.error || 'Could not submit form.');
    message.textContent = result.message;
    form.reset();
  } catch (e) {
    const offlineMsg = (typeof translations !== 'undefined' && translations[currentLang]?.msg_service_offline)
      ? translations[currentLang].msg_service_offline
      : 'The form service is not connected yet. Please contact the trust by phone or email.';
    message.textContent = e.message === 'Failed to fetch' ? offlineMsg : e.message;
    message.classList.add('error');
  } finally {
    button.disabled = false;
    button.style.opacity = '1';
  }
}

$('#contact-form')?.addEventListener('submit', e => {
  e.preventDefault();
  submitForm(e.currentTarget, '/api/contact');
});

$('#volunteer-form')?.addEventListener('submit', e => {
  e.preventDefault();
  submitForm(e.currentTarget, '/api/volunteer', d => ({ ...d, consent: !!d.consent }));
});

async function checkDbStatus() {
  const badge = $('#db-status-badge');
  if (!badge) return;
  try {
    const r = await fetch(API_BASE + '/api/health');
    const data = await r.json();
    if (r.ok && data.status === 'ok') {
      if (data.database === 'connected') {
        badge.innerHTML = '<span class="status-dot green"></span> MySQL: Connected';
        badge.className = 'db-badge connected';
      } else {
        badge.innerHTML = '<span class="status-dot green"></span> API: Active (Local Store)';
        badge.className = 'db-badge connected';
      }
    } else {
      badge.innerHTML = '<span class="status-dot orange"></span> MySQL: Offline (Start in XAMPP)';
      badge.className = 'db-badge disconnected';
    }
  } catch {
    badge.innerHTML = '<span class="status-dot gray"></span> Local Preview Mode';
    badge.className = 'db-badge';
  }
}

// Initialize on page load
setLanguage(currentLang);
loadPublicContent();
checkDbStatus();
