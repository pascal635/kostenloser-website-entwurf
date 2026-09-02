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
     Formular: Lead an Web3Forms, danach die Ads-Conversion.
     Drei Sperren gegen Mehrfach-Conversions:
       1. laeuft      verhindert parallele Absendungen (Doppelklick)
       2. abgeschickt verhindert eine zweite Absendung auf dieser Seite
       3. sessionStorage verhindert ein erneutes Feuern nach Reload
     Google Ads zaehlt zusaetzlich serverseitig "Einmalig" pro Klick.
     ------------------------------------------------------------ */
  var E = window.ESY || {};
  var form = document.getElementById("demoForm");
  var CONV_KEY = "esy_conv_sent";
  var laeuft = false, abgeschickt = false;

  function conversionSchonGefeuert(){
    if (abgeschickt) return true;
    try { return sessionStorage.getItem(CONV_KEY) === "1"; } catch (e) { return false; }
  }
  function conversionMerken(){
    abgeschickt = true;
    try { sessionStorage.setItem(CONV_KEY, "1"); } catch (e) {}
  }

  function fireConversion(txId){
    if (conversionSchonGefeuert()) return;
    conversionMerken();
    if (typeof gtag !== "function") return;
    if (!/^AW-\d{9,12}$/.test(E.ADS_ID || "")) return;
    var label = E.ADS_LABEL || "";
    if (!label || /^X+$/.test(label)) {
      console.warn("[ESY] ADS_LABEL fehlt, Conversion wird nicht gesendet.");
      return;
    }
    gtag("event", "conversion", {
      send_to: E.ADS_ID + "/" + label,
      value: 1.0,
      currency: "EUR",
      transaction_id: txId          // stabile ID, damit Ads sicher dedupliziert
    });
    gtag("event", "generate_lead", { currency: "EUR", value: 1.0 });
  }

  function payload(f, txId){
    var v = {};
    new FormData(f).forEach(function (val, k) { v[k] = val; });
    var a = {};
    try { a = JSON.parse(sessionStorage.getItem("esy_attr") || "{}"); } catch (e) {}
    var seite = /leuchtrahmen-alternative/.test(location.pathname) ? "Leuchtrahmen-Alternative" : "Hauptseite";
    return {
      access_key: E.W3F_KEY,
      subject: "Neue Demo-Anfrage über die Landingpage (" + seite + ")",
      from_name: "ESYSYNC Landingpage",
      replyto: v.email || "",
      botcheck: v.botcheck || "",
      "Name": v.name || "",
      "E-Mail": v.email || "",
      "Maklerbüro oder Filiale": v.org || "",
      "Anzahl Standorte": v.standorte || "",
      "Seite": seite,
      "URL": location.href,
      "Google Klick-ID": a.gclid || a.gbraid || a.wbraid || "kein Anzeigenklick",
      "Kampagne": a.utm_campaign || "",
      "Quelle": a.utm_source || "",
      "Medium": a.utm_medium || "",
      "Keyword": a.utm_term || "",
      "Referrer": document.referrer || "",
      "Vorgangsnummer": txId
    };
  }

  function fehlerZeigen(f, text){
    var err = f.querySelector(".form__err");
    if (!err) {
      err = document.createElement("p");
      err.className = "form__err";
      f.querySelector(".form__body").appendChild(err);
    }
    err.innerHTML = text;
  }

  if (form) form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (laeuft || abgeschickt) return;                 // Doppelklick und Zweitversand
    if (!form.checkValidity()) { form.reportValidity(); return; }

    laeuft = true;
    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn.textContent = "Wird gesendet …"; }

    var txId = "esy-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

    var fertig = function (ok, meldung) {
      laeuft = false;
      if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = label; }
      if (ok) {
        fireConversion(txId);
        form.classList.add("is-sent");
        form.scrollIntoView({ block: "center", behavior: "smooth" });
      } else {
        fehlerZeigen(form, meldung || 'Das hat gerade nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie an <a href="mailto:support@avanto-vr.com">support@avanto-vr.com</a>.');
      }
    };

    if (!E.LEAD_ENDPOINT || !E.W3F_KEY) {
      console.warn("[ESY] Kein Endpoint konfiguriert, der Lead wird nicht uebertragen.");
      fertig(true);
      return;
    }

    fetch(E.LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload(form, txId))
    })
    .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
    .then(function (d) { fertig(!!d.success); })
    .catch(function () { fertig(false); });
  });
})();
