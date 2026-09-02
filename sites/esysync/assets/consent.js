/* ============================================================
   ESYSYNC · Consent-Banner (DSGVO / TDDDG, Consent Mode v2)
   Ablehnen ist genauso prominent wie Akzeptieren, nichts ist
   vorausgewaehlt, die Wahl ist jederzeit widerrufbar.
   ============================================================ */
(function () {
  "use strict";
  var E = window.ESY || {};
  var KEY = E.CONSENT_KEY || "esy_consent_v1";
  var PRIVACY = "https://www.esysync.com/datenschutz";
  var IMPRINT = "https://www.esysync.com/impressum";

  function save(c) {
    c._ts = new Date().toISOString(); c._v = 1;
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    if (E.applyConsent) E.applyConsent(c);
  }

  var el = null;
  function close() { if (el) { el.remove(); el = null; } }

  function render(openSettings) {
    close();
    var saved = (E.readConsent && E.readConsent()) || { statistik: false, marketing: false };
    el = document.createElement("div");
    el.className = "cc";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "false");
    el.setAttribute("aria-label", "Hinweis zu Cookies");
    el.innerHTML =
      '<div class="cc__box">' +
        '<div class="cc__main">' +
          '<h2 class="cc__h">Wir verwenden Cookies</h2>' +
          '<p class="cc__t">Technisch notwendige Cookies brauchen wir, damit die Seite funktioniert. ' +
          'Zusätzlich möchten wir messen, wie die Seite genutzt wird, und den Erfolg unserer Anzeigen auswerten. ' +
          'Das passiert nur mit Ihrer Einwilligung. Sie können sie jederzeit widerrufen. ' +
          'Mehr dazu in unserer <a href="' + PRIVACY + '" target="_blank" rel="noopener">Datenschutzerklärung</a> ' +
          'und im <a href="' + IMPRINT + '" target="_blank" rel="noopener">Impressum</a>.</p>' +
          '<div class="cc__opts"' + (openSettings ? "" : " hidden") + '>' +
            '<label class="cc__opt"><input type="checkbox" checked disabled>' +
              '<span><b>Notwendig</b>Für Betrieb und Sicherheit der Seite. Immer aktiv.</span></label>' +
            '<label class="cc__opt"><input type="checkbox" id="ccStat"' + (saved.statistik ? " checked" : "") + '>' +
              '<span><b>Statistik</b>Anonyme Auswertung der Seitennutzung, damit wir die Seite verbessern können.</span></label>' +
            '<label class="cc__opt"><input type="checkbox" id="ccMark"' + (saved.marketing ? " checked" : "") + '>' +
              '<span><b>Marketing</b>Messung unserer Anzeigen bei Google, damit wir Budget sinnvoll einsetzen.</span></label>' +
          '</div>' +
        '</div>' +
        '<div class="cc__btns">' +
          '<button class="btn btn--primary" data-cc="all">Alle akzeptieren</button>' +
          '<button class="btn btn--secondary" data-cc="necessary">Nur notwendige</button>' +
          '<button class="cc__link" data-cc="' + (openSettings ? "save" : "settings") + '">' +
            (openSettings ? "Auswahl speichern" : "Einstellungen") + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    el.addEventListener("click", function (ev) {
      var a = ev.target.closest("[data-cc]"); if (!a) return;
      var what = a.getAttribute("data-cc");
      if (what === "settings") { render(true); return; }
      if (what === "all")       { save({ statistik: true,  marketing: true  }); close(); return; }
      if (what === "necessary") { save({ statistik: false, marketing: false }); close(); return; }
      if (what === "save") {
        save({
          statistik: !!el.querySelector("#ccStat").checked,
          marketing: !!el.querySelector("#ccMark").checked
        });
        close();
      }
    });
  }

  /* Banner nur zeigen, wenn noch keine Wahl getroffen wurde */
  if (!(E.readConsent && E.readConsent())) render(false);

  /* Widerruf: Fusszeilen-Link */
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest('[data-consent-open]');
    if (t) { ev.preventDefault(); render(true); }
  });
})();
