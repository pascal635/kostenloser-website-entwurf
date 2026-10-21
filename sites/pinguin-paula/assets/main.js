/* Pinguin Paula · Entwurf B · kleine Helfer ohne Abhängigkeiten, keine schwebenden Kaufleisten */
(function () {
  /* Navigation: Schatten, sobald die Seite scrollt */
  var hdr = document.querySelector('.hdr');
  if (hdr) { var onS = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 8); }; onS(); window.addEventListener('scroll', onS, { passive: true }); }
  var burger = document.querySelector('.burger'), mnav = document.getElementById('mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = mnav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) { mnav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); } });
  }
  var lb = document.getElementById('lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var img = lb.querySelector('img'), cap = lb.querySelector('p');
    document.querySelectorAll('[data-full]').forEach(function (b) {
      b.addEventListener('click', function () { img.src = b.dataset.full; img.alt = b.dataset.cap || ''; cap.textContent = b.dataset.cap || ''; lb.showModal(); });
    });
    lb.querySelector('button').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }
  /* Mobil: Formular eingeklappt, erster Tipp auf den Button klappt es auf */
  var cf = document.querySelector('form[data-collapse]');
  if (cf && window.matchMedia('(max-width: 760px)').matches) {
    cf.classList.add('is-collapsed');
  }
  /* Schul-Paket: Entwurf öffnet eine vorbereitete E-Mail (vor Livegang an Formular-Dienst anbinden) */
  var form = document.getElementById('anfrage');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.classList.contains('is-collapsed')) { form.classList.remove('is-collapsed'); form.querySelector('#f-art').focus(); return; }
    var q = function (s) { return form.querySelector(s); }, v = function (s) { return (q(s).value || '').trim(); };
    var mail = q('#f-mail'), ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim()), st = q('#f-status');
    mail.classList.toggle('is-error', !ok); mail.setAttribute('aria-invalid', ok ? 'false' : 'true'); q('#f-mail-err').hidden = ok;
    if (!ok) { mail.focus(); return; }
    if (!q('#f-ok').checked) { st.hidden = false; st.textContent = 'Bitte bestätige noch kurz den Datenschutz-Hinweis.'; return; }
    var body = 'Einrichtung: ' + v('#f-art') + '\nAnzahl Kinder: ' + v('#f-anzahl') + '\nName: ' + v('#f-name') + '\nE-Mail: ' + v('#f-mail') + '\n\n' + v('#f-msg');
    location.href = 'mailto:fallersimone@googlemail.com?subject=' + encodeURIComponent('Schul-Paket Pinguin Paula: ' + v('#f-art')) + '&body=' + encodeURIComponent(body);
    st.hidden = false; st.textContent = 'Danke! Dein E-Mail-Programm öffnet sich mit der fertigen Anfrage.';
  });
})();
