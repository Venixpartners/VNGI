/* VNGI cookie preferences and consent-gated Meta Pixel. */
(function () {
  'use strict';
  var KEY = 'vngi_cookie_preferences_v1';
  var PIXEL_ID = '29306401602343905';
  var pixelStarted = false;

  function getChoice() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY));
      if (value && typeof value.marketing === 'boolean') return value;
    } catch (error) {}
    return null;
  }

  function startMetaPixel() {
    if (pixelStarted) return;
    pixelStarted = true;
    !function(f,b,e,v,n,t,s) {
      if (f.fbq) return;
      n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if (!f._fbq) f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s);
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function setChoice(marketing) {
    var choice = { necessary: true, marketing: !!marketing, savedAt: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (error) {}
    if (choice.marketing) startMetaPixel();
    else if (pixelStarted) {
      // Meta may already have been loaded on this page; revoke permission
      // and reload so further page interactions cannot trigger new events.
      if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
      window.location.reload();
      return choice;
    }
    dismissBanner();
    return choice;
  }

  function dismissBanner() {
    var banner = document.getElementById('vngi-cookie-banner');
    if (banner) banner.hidden = true;
  }

  function showBanner() {
    var banner = document.getElementById('vngi-cookie-banner');
    if (banner) banner.hidden = false;
  }

  function addConsentUI() {
    var banner = document.createElement('section');
    banner.id = 'vngi-cookie-banner';
    banner.className = 'vngi-cookie-banner';
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.setAttribute('role', 'region');
    banner.hidden = true;
    banner.innerHTML =
      '<div class="vngi-cookie-copy"><strong>Your privacy choices</strong>' +
      '<p>We use essential website features and, only with your permission, the Meta Pixel to understand website visits and measure our outreach. You can decline marketing tracking and still use this site. Read our <a href="cookies">Cookie Policy</a>.</p></div>' +
      '<div class="vngi-cookie-actions"><button type="button" data-cookie-choice="reject">Reject marketing</button>' +
      '<button type="button" class="vngi-cookie-accept" data-cookie-choice="accept">Accept marketing</button></div>';
    document.body.appendChild(banner);

    var settings = document.createElement('button');
    settings.type = 'button';
    settings.id = 'vngi-cookie-settings';
    settings.className = 'vngi-cookie-settings';
    settings.textContent = 'Cookie settings';
    settings.setAttribute('aria-label','Change cookie preferences');
    document.body.appendChild(settings);
    settings.addEventListener('click', showBanner);

    banner.querySelector('[data-cookie-choice="reject"]').addEventListener('click', function() { setChoice(false); });
    banner.querySelector('[data-cookie-choice="accept"]').addEventListener('click', function() { setChoice(true); });

    var choice = getChoice();
    if (!choice) showBanner();
    else if (choice.marketing) startMetaPixel();
  }

  // Initialise after the page body is ready, before loading any marketing script.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addConsentUI);
  else addConsentUI();
})();
