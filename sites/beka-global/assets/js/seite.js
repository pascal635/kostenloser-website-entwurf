/* beka Startseite · Entwurf v2 · nur transform/opacity-Animationen */
(function(){
  var doc = document.documentElement;
  var hero = document.getElementById('top');
  var leiste = document.getElementById('leiste');
  var toastEl = document.querySelector('.toast'), toastT;
  function toast(t){ if(!toastEl) return; toastEl.textContent = t; toastEl.classList.add('ist-da'); clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('ist-da'); }, 2200); }

  /* Leiste oben: Desktop nach dem Hero, mobil schon nach wenigen Pixeln (mit Burger) */
  var sichtbar = null;
  function zustand(){
    if(!leiste) return;
    var mobilBreite = window.innerWidth < 1000;
    var schwelle = mobilBreite ? 72 : (hero ? hero.offsetHeight - 120 : 600);
    var an = (window.scrollY || 0) > schwelle;
    if(an === sichtbar) return; sichtbar = an;
    leiste.classList.toggle('ist-da', an); leiste.setAttribute('aria-hidden', !an);
    leiste.querySelectorAll('a,button').forEach(function(a){ a.tabIndex = an ? 0 : -1; });
  }
  window.addEventListener('scroll', zustand, { passive:true });
  window.addEventListener('resize', function(){ sichtbar = null; zustand(); });
  zustand();

  /* Mobil-Menü (Burger im Kopf und in der Scroll-Leiste) */
  var menue = document.getElementById('menue'), zu = document.getElementById('menue-zu');
  var burger = [document.getElementById('burger'), document.getElementById('burger-2')].filter(Boolean), ausloeser = null;
  function menueSetzen(offen, von){
    if(!menue) return;
    menue.classList.toggle('ist-offen', offen); menue.setAttribute('aria-hidden', !offen);
    burger.forEach(function(b){ b.setAttribute('aria-expanded', offen); });
    doc.style.overflow = offen ? 'hidden' : '';
    if(offen){ ausloeser = von || null; if(zu) zu.focus(); }
    else if(ausloeser){ ausloeser.focus({ preventScroll:true }); }
  }
  burger.forEach(function(b){ b.addEventListener('click', function(){ menueSetzen(true, b); }); });
  if(zu) zu.addEventListener('click', function(){ menueSetzen(false); });
  if(menue) menue.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menueSetzen(false); }); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && menue && menue.classList.contains('ist-offen')) menueSetzen(false); });

  /* FAQ: immer nur eine Frage offen (name="fragen" nativ, hier Rückfall für ältere Browser) */
  document.querySelectorAll('.zeilen details').forEach(function(d){
    d.addEventListener('toggle', function(){
      if(!d.open) return;
      document.querySelectorAll('.zeilen details[open]').forEach(function(o){ if(o !== d) o.open = false; });
    });
  });

  /* Karten-Spuren mit Pfeilen */
  document.querySelectorAll('[data-spur]').forEach(function(b){
    b.addEventListener('click', function(){
      var spur = document.getElementById(b.getAttribute('data-spur')); if(!spur) return;
      var karte = spur.firstElementChild; var schritt = karte ? karte.getBoundingClientRect().width + 8 : 300;
      spur.scrollBy({ left: schritt * parseInt(b.getAttribute('data-richtung'), 10), behavior:'smooth' });
    });
  });

  /* Einblenden */
  var rein = document.querySelectorAll('.rein');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('ist-da'); io.unobserve(e.target); } }); }, { rootMargin:'0px 0px -6% 0px', threshold:.06 });
    rein.forEach(function(e, i){ e.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(e); });
  } else rein.forEach(function(e){ e.classList.add('ist-da'); });

  /* Thema vorwählen, Hinweis bei Bewerbung */
  var hinweis = document.getElementById('hinweis-bewerbung');
  document.querySelectorAll('[data-thema]').forEach(function(a){
    a.addEventListener('click', function(){
      var r = document.querySelector('input[name="thema"][value="' + a.getAttribute('data-thema') + '"]');
      if(r){ r.checked = true; r.dispatchEvent(new Event('change', { bubbles:true })); }
    });
  });
  document.querySelectorAll('input[name="thema"]').forEach(function(r){
    r.addEventListener('change', function(){ if(hinweis && r.checked) hinweis.hidden = r.value !== 'Bewerbung'; });
  });

  /* Formular (Vorschau: prüft, sendet nichts) */
  var form = document.getElementById('formular'), danke = document.getElementById('danke');
  function fehler(el, t){ var f = el.closest('.feld'), h = f && f.querySelector('.hilfe'); if(f) f.classList.toggle('fehler', !!t); if(h) h.textContent = t || ''; el.setAttribute('aria-invalid', t ? 'true' : 'false'); }
  if(form){
    var name = form.querySelector('#f-name'), mail = form.querySelector('#f-mail'), check = form.querySelector('#f-check'), ch = document.getElementById('f-check-hilfe');
    [name, mail].forEach(function(el){ el.addEventListener('input', function(){ fehler(el, ''); }); });
    check.addEventListener('change', function(){ ch.textContent = ''; });
    form.addEventListener('submit', function(e){
      e.preventDefault(); var ok = true;
      if(!name.value.trim()){ fehler(name, 'Bitte tragen Sie Ihren Namen ein.'); ok = false; }
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())){ fehler(mail, 'Bitte prüfen Sie die E-Mail-Adresse, z. B. name@firma.de.'); ok = false; }
      if(!check.checked){ ch.textContent = 'Bitte bestätigen Sie den Datenschutz-Hinweis.'; ok = false; }
      if(!ok){ (form.querySelector('[aria-invalid="true"]') || check).focus(); return; }
      form.hidden = true; danke.hidden = false; danke.focus();
    });
  }

  /* Unterseiten sind nicht Teil des Entwurfs */
  document.querySelectorAll('a[href$="logistic/"],a[href$="one/"],a[href$="rail/"],a[href$="bau/"],a[href$="impressum/"],a[href$="datenschutz/"],#cookie-link').forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); toast('Diese Unterseite ist nicht Teil des Entwurfs.'); });
  });
})();
