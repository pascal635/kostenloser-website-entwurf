(function(){
  "use strict";

  /* Logos: Marquee + Logo-Wall aus einer Liste */
  var LOGOS = ["sparkasse-bielefeld","volksbank-hohenzollern-balingen","sparkasse-real-estate-bochum","vr-immobilien-wildeshauser-geest-gmbh","volksbank-stade-cuxhaven","meyerdierks-immobilien","sis-immobilien-thomas-hellweger","raiffeisen-immobilien-gmbh-waren","kreissparkasse-soltau","sparkasse-westmunsterland","sparkasse-mittelfranken-sud","volksbank-immobilien-gmbh","volksbank-immobilien-niederrhein","volksbank-niedersachsen-mitte","volksbank-rhein-erft-koln-eg","grafschafter-volksbank-eg","vr-genossenschaftsbank-unterallgau-eg","raiffeisenbank-altmuhl-jura-eg","raiffeisenbank-schwaben-mitte","vr-immobilien-volksbank-raiffeisenbank","vp-von-poll-immobilien","pflugfelder","baur-immobilien","gau-immobilien","hahn-keller","immobest","konigskinder-immobilien","konigzuhaus-immobilien-gmbh","adrimo-estate","bunz-und-co-real-estate","era-immobilien","fvb-immo-real-estate","immobilien-finanz-kanzlei","wilske","bocker","bechtle"];

  /* Basis-Pfad aus dem eigenen Script ableiten, damit die Datei auch aus
     Unterordnern (z. B. /leuchtrahmen-alternative/) korrekt auflöst. */
  var self = document.currentScript || document.querySelector('script[src$="app.js"]');
  var base = self ? self.src.replace(/assets\/app\.js.*$/, "") : "";

  function img(slug){
    var i = document.createElement("img");
    i.src = base + "assets/logos/esysync-referenz-" + slug + ".webp";
    i.alt = ""; i.loading = "lazy"; i.height = 30;
    return i;
  }
  var mqSet = LOGOS.slice(0, 18);
  ["mq1","mq2"].forEach(function(id){
    var row = document.getElementById(id);
    if(row) mqSet.forEach(function(s){ row.appendChild(img(s)); });
  });
  var wall = document.getElementById("logowall");
  if(wall) LOGOS.forEach(function(s){
    var d = document.createElement("div"); d.appendChild(img(s)); wall.appendChild(d);
  });


  /* Sticky CTA erst nach dem Hero, nicht über dem Formular */
  var sticky = document.getElementById("sticky"), demo = document.getElementById("demo");
  if(sticky && demo && "IntersectionObserver" in window){
    var onScreen = false;
    var toggle = function(){
      sticky.classList.toggle("is-on", window.scrollY > 620 && !onScreen);
    };
    new IntersectionObserver(function(e){ onScreen = e[0].isIntersecting; toggle(); },{threshold:0}).observe(demo);
    window.addEventListener("scroll", toggle, {passive:true});
    toggle();
  }

  /* ------------------------------------------------------------
     Formular: an den Endpoint senden, danach die Ads-Conversion.
     Ohne LEAD_ENDPOINT wird nichts verschickt, dann bleibt es beim
     Erfolgszustand und in der Konsole steht ein Hinweis.
     ------------------------------------------------------------ */
  var E = window.ESY || {};
  var form = document.getElementById("demoForm");

  function fireConversion(){
    if (typeof gtag !== "function") return;
    if (!/^AW-\d{9,12}$/.test(E.ADS_ID || "")) return;
    var label = E.ADS_LABEL || "";
    if (!label || /^X+$/.test(label)) {          // Platzhalter, noch kein echtes Label
      console.warn("[ESY] ADS_LABEL fehlt, Conversion wird nicht gesendet.");
      gtag("event", "generate_lead", { currency: "EUR", value: 1.0 });
      return;
    }
    gtag("event", "conversion", {
      send_to: E.ADS_ID + "/" + E.ADS_LABEL,
      value: 1.0,
      currency: "EUR",
      transaction_id: "lead-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8)
    });
    gtag("event", "generate_lead", { currency: "EUR", value: 1.0 });
  }

  function payload(f){
    var d = {};
    new FormData(f).forEach(function(v,k){ d[k] = v; });
    var attr = {};
    try { attr = JSON.parse(sessionStorage.getItem("esy_attr") || "{}"); } catch(e) {}
    d.attribution = attr;
    d.seite = /leuchtrahmen-alternative/.test(location.pathname) ? "leuchtrahmen-alternative" : "hauptseite";
    d.url = location.href;
    d.referrer = document.referrer || "";
    d.gesendet_am = new Date().toISOString();
    return d;
  }

  if (form) form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Wird gesendet …"; }

    var done = function (ok) {
      if (btn) { btn.disabled = false; btn.textContent = label; }
      if (ok) {
        fireConversion();
        form.classList.add("is-sent");
        form.scrollIntoView({ block: "center", behavior: "smooth" });
      } else {
        var err = form.querySelector(".form__err");
        if (!err) {
          err = document.createElement("p");
          err.className = "form__err";
          form.querySelector(".form__body").appendChild(err);
        }
        err.innerHTML = 'Das hat gerade nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie an <a href="mailto:support@avanto-vr.com">support@avanto-vr.com</a>.';
      }
    };

    if (!E.LEAD_ENDPOINT) {
      console.warn("[ESY] Kein LEAD_ENDPOINT gesetzt, der Lead wird nicht uebertragen.");
      done(true);
      return;
    }

    fetch(E.LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(form))
    })
    .then(function (r) { done(r.ok); })
    .catch(function () { done(false); });
  });
})();
