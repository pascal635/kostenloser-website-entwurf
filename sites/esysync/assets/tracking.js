/* ============================================================
   ESYSYNC Landingpages · Tracking-Bootstrap
   Laeuft SYNCHRON im <head>, vor gtag.js. Reihenfolge ist Pflicht:
   erst Consent-Defaults (alles denied), dann gtag.js.
   ------------------------------------------------------------
   HIER EINTRAGEN, sonst laedt kein Tag:
   ============================================================ */
window.ESY = {
  ADS_ID:        "AW-792272931",           // Google-Ads-Conversion-ID
  ADS_LABEL:     "4-lKCOCI2ewcEKPA5PkC",   // Conversion "lp-likovo-form-send"
  GA4_ID:        "",                       // optional, z. B. "G-XXXXXXXXXX". Leer = GA4 aus.
  LEAD_ENDPOINT: "https://api.web3forms.com/submit",
  W3F_KEY:       "31267008-8b4b-486f-8cbd-e9713e405544", // Web3Forms, oeffentlich per Design
  CONSENT_KEY:   "esy_consent_v1"
};

(function () {
  "use strict";
  var E = window.ESY;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };

  /* 1) Defaults: ohne Einwilligung nichts speichern. */
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  });
  gtag("set", "ads_data_redaction", true);
  gtag("set", "url_passthrough", true);

  /* 2) Frueher Wiederholbesuch: gespeicherte Einwilligung sofort anwenden,
        damit granted-Nutzer nicht erst auf das Banner-Script warten. */
  E.readConsent = function () {
    try { return JSON.parse(localStorage.getItem(E.CONSENT_KEY) || "null"); }
    catch (e) { return null; }
  };
  E.applyConsent = function (c) {
    gtag("consent", "update", {
      ad_storage:         c.marketing ? "granted" : "denied",
      ad_user_data:       c.marketing ? "granted" : "denied",
      ad_personalization: c.marketing ? "granted" : "denied",
      analytics_storage:  c.statistik ? "granted" : "denied"
    });
  };
  var saved = E.readConsent();
  if (saved) E.applyConsent(saved);

  /* 3) Tags laden, aber nur mit echten IDs. Platzhalter bleiben stumm. */
  var hasAds = /^AW-\d{9,12}$/.test(E.ADS_ID);
  var hasGa4 = /^G-[A-Z0-9]{6,12}$/.test(E.GA4_ID);
  if (hasAds || hasGa4) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + (hasAds ? E.ADS_ID : E.GA4_ID);
    document.head.appendChild(s);
    gtag("js", new Date());
    if (hasAds) gtag("config", E.ADS_ID);
    if (hasGa4) gtag("config", E.GA4_ID, { send_page_view: true });
  } else if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    console.info("[ESY] Tracking-IDs noch Platzhalter, es wird kein Tag geladen.");
  }

  /* 4) Klick-IDs und Kampagnenparameter merken, damit sie am Lead haengen.
        Wichtig fuer den spaeteren Offline-Import echter Abschluesse. */
  try {
    var q = new URLSearchParams(location.search), store = {};
    ["gclid","gbraid","wbraid","utm_source","utm_medium","utm_campaign","utm_term","utm_content"]
      .forEach(function (k) { if (q.get(k)) store[k] = q.get(k); });
    if (Object.keys(store).length) {
      store._ts = new Date().toISOString();
      sessionStorage.setItem("esy_attr", JSON.stringify(store));
    }
  } catch (e) {}
})();
