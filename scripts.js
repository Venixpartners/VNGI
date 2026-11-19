var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyAvEtBhBnrywigIl9QT-_nqUKaybaNSdCkQDVzV14OJQ1fDz3WhoJQdGGRB7dlej_M/exec';

const cur = document.getElementById('cur');
const ring = document.getElementById('cur-ring');
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

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 60));

const hamburger = document.getElementById('nav-hamburger');
const mobileNav = document.getElementById('mobile-nav');

function closeMobileNav() {
  if (!hamburger || !mobileNav) return;
  hamburger.classList.remove('open');
  mobileNav.classList.remove('open');
  hamburger.setAttribute('aria-expanded', false);
  document.body.style.overflow = '';
}

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMobileNav());
  });
}

const pageLoader = document.getElementById('page-loader');

function showPageLoader() {
  if (!pageLoader) return;
  pageLoader.classList.add('active');
  pageLoader.classList.remove('hidden');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('a, button');
  if (!target) return;

  if (target.tagName.toLowerCase() === 'a') {
    const href = target.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || target.target === '_blank') return;
    event.preventDefault();
    closeMobileNav();
    showPageLoader();
    window.location.href = href;
    return;
  }

  if (target.disabled) return;
  if (target === hamburger || target.closest('#vngi-cookie-banner') || target.id === 'vngi-cookie-settings') return;
  if (target.type === 'submit') return; // form submits are handled by their own handler (AJAX), not a page navigation — don't show the full-page loader for these
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

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('form-msg');
  const btn = form.querySelector('button[type="submit"]');

  const get = (name) => (form.querySelector('[name="' + name + '"]')?.value || '').trim();

  const payload = {
    firstName : get('firstName'),
    lastName  : get('lastName'),
    email     : get('email'),
    phone     : get('phone'),
    ageRange  : get('ageRange'),
    address   : get('address'),
    state     : get('state'),
    country   : get('country') || 'Nigeria',
  };

  // Loading state
  btn.disabled = true;
  btn.innerHTML =
    '<span style="display:inline-flex;align-items:center;gap:0.6rem;">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
    'style="animation:spin 0.8s linear infinite;flex-shrink:0;">' +
    '<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>' +
    'Submitting\u2026</span>';

  msg.style.display = 'none';
  msg.className = '';

  try {
    // Use no-cors + FormData trick to avoid CORS preflight with Apps Script
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData,
    });

    // no-cors means we can't read the response — but if fetch didn't throw, it worked
    msg.style.display = 'block';
    msg.classList.add('form-msg-success');
    msg.textContent = '\u2713 Application received! Check your inbox \u2014 we\'ve sent you a confirmation email.';
    form.reset();

  } catch (err) {
    msg.style.display = 'block';
    msg.classList.add('form-msg-error');
    msg.textContent = '\u2717 Submission failed. Please email us directly at stephenfemikingsley@gmail.com';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Application \u2192';
    setTimeout(() => { msg.style.display = 'none'; msg.className = ''; }, 8000);
  }
}