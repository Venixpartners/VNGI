var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyAvEtBhBnrywigIl9QT-_nqUKaybaNSdCkQDVzV14OJQ1fDz3WhoJQdGGRB7dlej_M/exec';

/* Custom cursor: only on devices with a precise pointer that can hover.
   Touch screens and people using their own system cursor keep the normal one. */
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const cur = document.getElementById('cur');
const ring = document.getElementById('cur-ring');

if (cur && ring && finePointer.matches && !reduceMotion.matches) {
  document.documentElement.classList.add('has-custom-cursor');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  document.querySelectorAll('a,button,.aud-card,.pw-item,.gallery-item').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('big'));
    el.addEventListener('mouseleave', () => ring.classList.remove('big'));
  });

  (function tick() {
    cur.style.left = mx + 'px';
    cur.style.top = my + 'px';
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(tick);
  })();
}

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 60));

const hamburger = document.getElementById('nav-hamburger');
const mobileNav = document.getElementById('mobile-nav');

function closeMobileNav() {
  if (!hamburger || !mobileNav) return;
  hamburger.classList.remove('open');
  mobileNav.classList.remove('open');
  document.documentElement.classList.remove('menu-open');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Open menu');
  document.body.style.overflow = '';
}

function openMobileNav() {
  hamburger.classList.add('open');
  mobileNav.classList.add('open');
  document.documentElement.classList.add('menu-open');
  hamburger.setAttribute('aria-expanded', 'true');
  hamburger.setAttribute('aria-label', 'Close menu');
  document.body.style.overflow = 'hidden';
}

if (hamburger && mobileNav) {
  hamburger.setAttribute('aria-controls', 'mobile-nav');
  hamburger.addEventListener('click', () => {
    if (mobileNav.classList.contains('open')) closeMobileNav();
    else openMobileNav();
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMobileNav());
  });
  // Tapping the empty space around the links also closes the menu.
  mobileNav.addEventListener('click', (e) => {
    if (e.target === mobileNav) closeMobileNav();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
      closeMobileNav();
      hamburger.focus();
    }
  });
  // If the window grows past the mobile breakpoint, never leave the page locked.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && mobileNav.classList.contains('open')) closeMobileNav();
  });
}

const pageLoader = document.getElementById('page-loader');

function showPageLoader() {
  if (!pageLoader) return;
  pageLoader.classList.add('active');
  pageLoader.classList.remove('hidden');
}

document.addEventListener('click', (event) => {
  // Leave new tab, new window and download clicks to the browser.
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const target = event.target.closest('a, button');
  if (!target) return;

  if (target.tagName.toLowerCase() === 'a') {
    const href = target.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || target.target === '_blank' || target.hasAttribute('download')) return;
    // Same page anchors such as programme#weeks when already on that page.
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;
    event.preventDefault();
    closeMobileNav();
    showPageLoader();
    window.location.href = href;
    return;
  }

  if (target.disabled) return;
  if (target === hamburger || target.closest('#vngi-cookie-banner') || target.id === 'vngi-cookie-settings') return;
  if (target.type === 'submit' || target.type === 'button') return;
  showPageLoader();
});

// Safety net: if a page is restored from the browser's back/forward cache
// with the loader still marked active, clear it so it never gets stuck.
window.addEventListener('pageshow', () => {
  if (!pageLoader) return;
  pageLoader.classList.remove('active');
  pageLoader.classList.add('hidden');
});

const obs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((r) => obs.observe(r));

/* Application form */

const UNDER_18 = '14 to 17';
const SUBMITTED_KEY = 'vngi_application_submitted_v1';

function setupApplyForm() {
  const form = document.getElementById('apply-form');
  if (!form) return;
  const age = form.querySelector('[name="ageRange"]');
  const block = document.getElementById('guardian-block');
  const guardianFields = block ? block.querySelectorAll('input') : [];

  function syncGuardian() {
    const minor = age && age.value === UNDER_18;
    if (block) block.hidden = !minor;
    guardianFields.forEach((input) => {
      // Name, consent and at least a phone number are required for minors.
      if (input.name === 'guardianEmail') return;
      input.required = minor;
    });
  }
  if (age) age.addEventListener('change', syncGuardian);
  syncGuardian();

  // Any edit after a duplicate warning means the next click is a deliberate resubmission.
  form.addEventListener('input', () => { delete form.dataset.dupeWarned; });
}
setupApplyForm();

function esc(v) {
  return String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function showFormMessage(msg, type, html) {
  msg.className = type === 'error' ? 'form-msg-error' : (type === 'warn' ? 'form-msg-warn' : 'form-msg-success');
  msg.innerHTML = html;
  msg.style.display = 'block';
  msg.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
}

function readSubmitted() {
  try { return JSON.parse(localStorage.getItem(SUBMITTED_KEY)) || {}; } catch (err) { return {}; }
}

function rememberSubmitted(email) {
  try {
    const all = readSubmitted();
    all[email.toLowerCase()] = new Date().toISOString();
    localStorage.setItem(SUBMITTED_KEY, JSON.stringify(all));
  } catch (err) {}
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('form-msg');
  const btn = form.querySelector('button[type="submit"]');
  const contact = '<a href="mailto:programme@venixnextgen.org">programme@venixnextgen.org</a>';

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const get = (name) => (form.querySelector('[name="' + name + '"]')?.value || '').trim();
  const checked = (name) => !!form.querySelector('[name="' + name + '"]')?.checked;

  // Bots fill every field, people never see this one.
  if (get('website')) return;

  const minor = get('ageRange') === UNDER_18;
  const payload = {
    firstName : get('firstName'),
    lastName  : get('lastName'),
    email     : get('email'),
    phone     : get('phone'),
    ageRange  : get('ageRange'),
    address   : get('address'),
    state     : get('state'),
    country   : get('country') || 'Nigeria',
    privacyConsent : checked('privacyConsent') ? 'yes' : 'no',
    isMinor        : minor ? 'yes' : 'no',
    guardianName   : minor ? get('guardianName') : '',
    guardianPhone  : minor ? get('guardianPhone') : '',
    guardianEmail  : minor ? get('guardianEmail') : '',
    guardianConsent: minor && checked('guardianConsent') ? 'yes' : 'no',
    sourcePage     : window.location.pathname,
    submittedAt    : new Date().toISOString(),
  };

  // Gentle duplicate check for people who submit twice from the same browser.
  const previous = readSubmitted()[payload.email.toLowerCase()];
  if (previous && !form.dataset.dupeWarned) {
    form.dataset.dupeWarned = '1';
    const when = new Date(previous).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    showFormMessage(msg, 'warn', 'We already received an application from ' + esc(payload.email) + ' on ' + when + '. You only need to apply once. If your details have changed, press Submit again and we will update your record.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML =
    '<span style="display:inline-flex;align-items:center;gap:0.6rem;">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
    'style="animation:spin 0.8s linear infinite;flex-shrink:0;">' +
    '<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>' +
    'Submitting…</span>';
  msg.style.display = 'none';
  msg.className = '';

  let outcome = 'unknown';
  try {
    // FormData is a simple request for CORS, so there is no preflight, and Apps Script
    // answers from script.googleusercontent.com with an open CORS header we can read.
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));
    const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData, redirect: 'follow' });
    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch (err) {}
    const status = body && String(body.status || body.result || '').toLowerCase();
    if (res.ok && body && (status === 'success' || status === 'ok' || body.ok === true)) outcome = 'ok';
    else if (!res.ok || (body && (status === 'error' || body.ok === false))) outcome = 'error';
  } catch (err) {
    // Network failure or a response we are not allowed to read.
    outcome = 'unknown';
  }

  btn.disabled = false;
  btn.textContent = 'Submit Application →';

  if (outcome === 'ok') {
    rememberSubmitted(payload.email);
    delete form.dataset.dupeWarned;
    form.reset();
    const ageSelect = form.querySelector('[name="ageRange"]');
    if (ageSelect) ageSelect.dispatchEvent(new Event('change'));
    showFormMessage(msg, 'ok', 'Thank you, ' + esc(payload.firstName) + '. Your application has been received. We will be in touch at ' + esc(payload.email) + ' with next steps' + (minor ? ', and we will contact your parent or guardian before you are enrolled' : '') + '.');
  } else if (outcome === 'error') {
    showFormMessage(msg, 'error', 'Sorry, your application did not go through. Please try again in a minute, or email your details to ' + contact + '.');
  } else {
    showFormMessage(msg, 'warn', 'We could not confirm that your application arrived. Please check your connection and try again. If this keeps happening, email your details to ' + contact + '.');
  }
}
