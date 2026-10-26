/* Bavarian MMA Center · Entwurf Variante D · LIKOVO */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* Einblenden + Zähler */
  document.querySelectorAll('[data-stagger]').forEach(function (g) {
    var n = 0; Array.prototype.forEach.call(g.children, function (c) { if (c.hasAttribute('data-r')) c.style.setProperty('--i', n++); });
  });
  function count(el) {
    var t = parseFloat(el.dataset.count), d = parseInt(el.dataset.dec || '0', 10);
    var f = function (v) { return v.toFixed(d).replace('.', ','); };
    if (reduce) { el.textContent = f(t); return; }
    var t0 = null;
    (function tick(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1500); el.textContent = f(t * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(tick); })(performance.now());
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.hasAttribute('data-count')) count(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  document.querySelectorAll('[data-r], [data-count]').forEach(function (el) { io.observe(el); });

  var mqM = window.matchMedia('(max-width: 820px)');
  function pad(v) { return (v < 10 ? '0' : '') + v; }
  function ctrlUpd(box, cur, n) {
    var c = box.querySelector('.ctrl'); if (!c) return;
    c.querySelector('[data-cur]').textContent = pad(cur + 1);
    c.querySelector('[data-tot]').textContent = pad(n);
    c.querySelector('[data-bar]').style.setProperty('--p', ((cur + 1) / n * 100) + '%');
  }

  var hero = document.querySelector('[data-hero]');

  /* Eigener Cursor (nur Maus): im Hero der Kreis mit Text wie im Vorbild, sonst ein Punkt,
     der mit Links und Buttons verschmilzt (nimmt Größe und Rundung des Elements an). */
  var cuArea = document.querySelector('[data-cursor-area]'), hc = document.querySelector('[data-cursor]');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    root.classList.add('cur-on');
    var dc = document.createElement('div'); dc.className = 'dcur'; dc.setAttribute('aria-hidden', 'true'); document.body.appendChild(dc);
    var SEL = 'a, button, select, summary, label.consent input, .segf label, [role="tab"]';
    var TXT = 'input:not([type="checkbox"]):not([type="radio"]), textarea';
    var mx = -100, my = -100, cx = -100, cy = -100, cw = 12, ch = 12, cr = 6, hx = -300, hy = -300;
    var hov = null, under = null, raf = null, live = false, down = false;
    var k = reduce ? 1 : .22, kz = reduce ? 1 : .2;
    function pick(t) {
      under = t;
      var el = t && t.closest ? t.closest(SEL) : null;
      if (el && el.closest('[inert], [aria-hidden="true"]')) el = null;
      hov = el;
    }
    function rad(el, w, h) {
      var v = getComputedStyle(el).borderTopLeftRadius;
      return v.indexOf('%') > -1 ? Math.min(w, h) / 2 : (parseFloat(v) || 0);
    }
    function frame() {
      var tx = mx, ty = my, tw = 12, th = 12, tr = 6, mode = 'dot';
      var inHero = cuArea && under && cuArea.contains(under);
      if (hov) {
        var r = hov.getBoundingClientRect();
        var big = r.width > 680 || r.height > 160 || (hov.querySelector('img') && (r.width > 260 || r.height > 120));
        if (big) { tw = th = 54; tr = 27; mode = 'ring'; }
        else {
          var c1 = r.left + r.width / 2, c2 = r.top + r.height / 2;
          tx = c1 + (mx - c1) * .1; ty = c2 + (my - c2) * .1;
          tw = r.width + 8; th = r.height + 8; tr = rad(hov, r.width, r.height) + 4; mode = 'merge';
        }
      } else if (under && under.closest && under.closest(TXT)) mode = 'off';
      else if (inHero) mode = 'hero';
      if (down && mode !== 'merge') { tw *= .7; th *= .7; tr *= .7; }
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      cw += (tw - cw) * kz; ch += (th - ch) * kz; cr += (tr - cr) * kz;
      hx += (mx - hx) * (reduce ? 1 : .2); hy += (my - hy) * (reduce ? 1 : .2);
      dc.style.transform = 'translate3d(' + (cx - cw / 2).toFixed(1) + 'px,' + (cy - ch / 2).toFixed(1) + 'px,0)';
      dc.style.width = cw.toFixed(1) + 'px'; dc.style.height = ch.toFixed(1) + 'px'; dc.style.borderRadius = cr.toFixed(1) + 'px';
      dc.className = 'dcur' + (live && mode !== 'off' && mode !== 'hero' ? ' on' : '') + (mode === 'ring' ? ' ring' : '') + (mode === 'merge' ? ' merge' : '');
      if (hc) {
        hc.style.setProperty('--x', hx.toFixed(1) + 'px'); hc.style.setProperty('--y', hy.toFixed(1) + 'px');
        hc.classList.toggle('on', live && mode === 'hero');
      }
      var moving = Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(tw - cw) + Math.abs(th - ch) + Math.abs(mx - hx) + Math.abs(my - hy) > .4;
      raf = (moving || mode === 'merge') ? requestAnimationFrame(frame) : null;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!live) { live = true; cx = hx = mx; cy = hy = my; }
      pick(e.target); kick();
    }, { passive: true });
    document.addEventListener('mouseover', function (e) { pick(e.target); kick(); }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { live = false; kick(); });
    document.addEventListener('mousedown', function () { down = true; kick(); });
    document.addEventListener('mouseup', function () { down = false; kick(); });
    window.addEventListener('scroll', function () { if (live) { pick(document.elementFromPoint(mx, my)); kick(); } }, { passive: true });
    if (cuArea) cuArea.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) return;
      var t = document.getElementById('anfrage'); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  }
  if (hero) requestAnimationFrame(function () { hero.classList.add('is-in'); });

  /* Laufbänder: Inhalt verdoppeln für eine nahtlose Schleife */
  document.querySelectorAll('[data-mq]').forEach(function (m) {
    var t = m.firstElementChild; for (var k = 0; k < 2; k++) { var c = t.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.querySelectorAll('a,button').forEach(function (a) { a.tabIndex = -1; }); m.appendChild(c); }
  });

  /* Menü */
  var burger = document.querySelector('[data-burger]'), menu = document.querySelector('[data-menu]');
  function setMenu(o) {
    menu.classList.toggle('is-open', o); document.body.classList.toggle('menu-open', o);
    burger.setAttribute('aria-expanded', String(o)); burger.setAttribute('aria-label', o ? 'Menü schließen' : 'Menü öffnen');
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Ablauf: Bilder, Schritt-Reiter und Text gekoppelt */
  document.querySelectorAll('[data-steps]').forEach(function (box) {
    var vis = box.querySelectorAll('.sv'), tabs = box.querySelectorAll('.stab'), txt = box.querySelectorAll('.stxt'), bar = box.querySelector('.stabs__bar');
    var prev = box.querySelector('[data-prev]'), next = box.querySelector('[data-next]'), cur = 0, n = vis.length, tm = null;
    txt.forEach(function (t, k) { t.style.setProperty('--k', k); });
    function show(k) {
      cur = Math.max(0, Math.min(n - 1, k));
      vis.forEach(function (v, j) { v.classList.toggle('on', j === cur); });
      tabs.forEach(function (t, j) { t.classList.toggle('on', j === cur); t.setAttribute('aria-selected', String(j === cur)); });
      txt.forEach(function (t, j) { t.classList.toggle('on', j === cur); });
      bar.style.setProperty('--k', cur);
      ctrlUpd(box, cur, n);
    }
    function stop() { if (tm) clearInterval(tm); tm = null; }
    function auto() { if (reduce || mqM.matches) return; stop(); tm = setInterval(function () { show(cur === n - 1 ? 0 : cur + 1); }, 5200); }
    vis.forEach(function (v, j) { v.addEventListener('click', function () { show(j); stop(); }); });
    tabs.forEach(function (t, j) { t.addEventListener('click', function () { show(j); stop(); }); });
    prev.addEventListener('click', function () { show(cur === 0 ? n - 1 : cur - 1); stop(); });
    next.addEventListener('click', function () { show(cur === n - 1 ? 0 : cur + 1); stop(); });
    function mob() { vis.forEach(function (v) { v.tabIndex = mqM.matches ? -1 : 0; v.setAttribute('aria-hidden', mqM.matches ? 'true' : 'false'); }); if (mqM.matches) stop(); }
    if (mqM.addEventListener) mqM.addEventListener('change', mob); else mqM.addListener(mob);
    mob();
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) { if (!tm) auto(); } else stop(); }, { threshold: .4 }).observe(box);
    show(0);
  });

  /* Warum BMC: Reiter klappen auf, Bild wechselt */
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var items = box.querySelectorAll('.wtab'), ims = box.querySelectorAll('.why__media > img');
    items.forEach(function (it, k) {
      it.querySelector('.wtab__b').addEventListener('click', function () {
        items.forEach(function (x, j) { x.classList.toggle('on', j === k); x.querySelector('.wtab__b').setAttribute('aria-expanded', String(j === k)); });
        ims.forEach(function (im, j) { im.classList.toggle('on', j === k); });
      });
    });
  });

  /* Karussells: aktive Karte immer mittig, die übrigen laufen endlos im Kreis.
     Kopien der Karten füllen die Ränder, Wischen und Ziehen, Pfeile, Pfeiltasten, Klick auf eine Karte. */
  function mod(a, b) { return ((a % b) + b) % b; }
  document.querySelectorAll('[data-car]').forEach(function (box) {
    var rail = box.querySelector('[data-rail]'), prev = box.querySelector('[data-prev]'), next = box.querySelector('[data-next]');
    if (!rail || !prev) return;
    var orig = Array.prototype.slice.call(rail.children), n = orig.length, items = orig.slice(), v = 0, on = false, offs = [];
    var sx = null, sy = 0, dx = 0, moved = false, pid = null;
    function step() { return orig[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(rail).columnGap) || 0); }
    function fill() {
      var st = step(), copies = Math.max(2, Math.round(items.length / n));
      while ((Math.ceil(n * copies / 2) - 1.5) * st <= window.innerWidth / 2 && copies < 8) copies++;
      for (var c = Math.round(items.length / n); c < copies; c++) {
        orig.forEach(function (o) {
          var k = o.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.classList.add('is-clone');
          k.querySelectorAll('a, button, input, select, [tabindex]').forEach(function (f) { f.tabIndex = -1; });
          rail.appendChild(k);
        });
      }
      items = Array.prototype.slice.call(rail.children);
    }
    function place(jump) {
      var m = items.length;
      items.forEach(function (el, j) {
        var d = mod(j - v, m); if (d > m / 2) d -= m;
        var wrap = offs[j] !== undefined && Math.abs(d - offs[j]) > m / 2;
        if (wrap || jump) el.classList.add('no-tr');
        el.style.setProperty('--d', d); el.classList.toggle('is-cur', j === v); offs[j] = d;
      });
      void rail.offsetWidth;
      items.forEach(function (el) { el.classList.remove('no-tr'); });
      ctrlUpd(box, mod(v, n), n);
    }
    function go(k) { if (!on) return; v = mod(k, items.length); place(false); }
    function enable() {
      if (on) return; on = true;
      rail.classList.add('loop', 'has-cur'); fill(); offs = []; place(true);
    }
    function disable() {
      if (!on) return; on = false;
      rail.classList.remove('loop', 'has-cur', 'is-drag');
      items.forEach(function (el) { if (el.classList.contains('is-clone')) el.remove(); else { el.classList.remove('is-cur', 'no-tr'); el.style.removeProperty('--d'); } });
      items = orig.slice(); v = 0; offs = [];
    }
    function sync() { if (box.getAttribute('data-car-m') === 'off' && mqM.matches) disable(); else enable(); }
    prev.addEventListener('click', function () { go(v - 1); });
    next.addEventListener('click', function () { go(v + 1); });
    rail.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); return; }
      if (!on) return;
      var el = e.target.closest('[data-rail] > *'); if (!el) return;
      var j = items.indexOf(el);
      if (j !== v && !e.target.closest('a, button')) go(j);
    }, true);
    rail.addEventListener('keydown', function (e) {
      if (!on) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(v + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(v - 1); }
    });
    rail.addEventListener('dragstart', function (e) { if (on) e.preventDefault(); });
    rail.addEventListener('pointerdown', function (e) {
      if (!on || (e.pointerType === 'mouse' && e.button !== 0)) return;
      sx = e.clientX; sy = e.clientY; dx = 0; moved = false; pid = e.pointerId;
    });
    rail.addEventListener('pointermove', function (e) {
      if (sx === null || e.pointerId !== pid) return;
      dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - sy)) {
        moved = true; rail.classList.add('is-drag');
        try { rail.setPointerCapture(pid); } catch (x) {}
      }
      if (moved) rail.style.setProperty('--drag', dx.toFixed(1) + 'px');
    });
    function end() {
      if (sx === null) return;
      sx = null; rail.classList.remove('is-drag'); rail.style.setProperty('--drag', '0px');
      if (moved) {
        var k = Math.round(-dx / step());
        if (k === 0 && Math.abs(dx) > 40) k = dx < 0 ? 1 : -1;
        if (k) go(v + k);
        setTimeout(function () { moved = false; }, 0);
      }
    }
    rail.addEventListener('pointerup', end);
    rail.addEventListener('pointercancel', end);
    var rt = null;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (on) { fill(); place(true); } }, 150); });
    if (mqM.addEventListener) mqM.addEventListener('change', sync); else mqM.addListener(sync);
    sync();
  });

  /* Akkordeons: Trainingsplan und Checkliste (eins offen), FAQ (frei) */
  function acc(sel, btnSel, single) {
    document.querySelectorAll(sel).forEach(function (it) {
      var b = it.querySelector(btnSel);
      b.addEventListener('click', function () {
        if (it.classList.contains('chk') && mqM.matches) return;
        var o = !it.classList.contains('open');
        if (single && o) it.parentElement.querySelectorAll(sel).forEach(function (x) { if (x !== it) { x.classList.remove('open'); x.querySelector(btnSel).setAttribute('aria-expanded', 'false'); } });
        it.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o));
      });
    });
  }
  acc('.acc', '.acc__b', true); acc('.chk', '.chk__b', true); acc('.fq', '.fq__b', false);

  /* Kindertraining: auf Mobil alle Punkte aufgeklappt */
  var chks = document.querySelectorAll('.chk');
  function kidsMob() {
    chks.forEach(function (c, k) {
      var o = mqM.matches || k === 0;
      c.classList.toggle('open', o); c.querySelector('.chk__b').setAttribute('aria-expanded', String(o));
    });
  }
  if (mqM.addEventListener) mqM.addEventListener('change', kidsMob); else mqM.addListener(kidsMob);
  kidsMob();

  /* Widget „Heute": nächstes Training laut Trainingsplan */
  var plan = {
    1: [['15:00', 'Minis'], ['15:40', 'Kinder'], ['16:30', 'Jugend'], ['17:30', 'Thai-Kickboxen'], ['18:35', 'Boxen'], ['19:40', 'NoGi'], ['20:45', 'MMA Advanced']],
    2: [['9:30', 'Thai-Kickboxen'], ['15:40', 'Minis'], ['16:30', 'Kinder'], ['17:30', 'Boxen'], ['19:40', 'NoGi']],
    3: [['15:00', 'Minis'], ['15:40', 'Kinder'], ['16:30', 'Jugend'], ['17:30', 'Fitness Kickboxen'], ['18:35', 'Boxen'], ['19:40', 'MMA']],
    4: [['9:30', 'Thai-Kickboxen'], ['15:40', 'Minis'], ['16:30', 'Kinder'], ['17:30', 'Boxen'], ['19:40', 'NoGi']],
    5: [['15:40', 'Kinder'], ['16:30', 'Jugend'], ['17:30', 'Thai-Kickboxen'], ['19:40', 'NoGi'], ['20:45', 'MMA Advanced']],
    6: [['12:00', 'Strength und Conditioning']],
    0: [['12:00', 'Open Mat']]
  };
  var today = document.querySelector('[data-today]');
  if (today) {
    var d = new Date(), mins = d.getHours() * 60 + d.getMinutes(), list = plan[d.getDay()] || [], hit = null;
    list.forEach(function (s) { var p = s[0].split(':'), m = +p[0] * 60 + +p[1]; if (!hit && m >= mins - 15) hit = s; });
    today.textContent = hit ? hit[0] + ' ' + hit[1] : 'Morgen wieder ab ' + ((plan[(d.getDay() + 1) % 7] || [['', '']])[0][0]);
  }

  /* Formular */
  var form = document.querySelector('[data-form]');
  if (form) {
    var age = form.querySelector('[data-age]'), kurs = form.querySelector('#f-kurs'), err = form.querySelector('[data-err]');
    var sync = function () {
      var kind = form.querySelector('input[name="fuer"]:checked').value === 'kind';
      age.hidden = !kind;
      if (kind) kurs.value = 'Kindertraining'; else if (kurs.value === 'Kindertraining') kurs.value = 'Weiß ich noch nicht';
    };
    form.querySelectorAll('input[name="fuer"]').forEach(function (r) { r.addEventListener('change', sync); });
    sync();
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-fuer]'); if (!a) return;
      var r = form.querySelector('input[value="' + a.dataset.fuer + '"]'); if (r) { r.checked = true; sync(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['name', 'kontakt'].forEach(function (n) { var f = form.elements[n], bad = !f.value.trim(); f.classList.toggle('err', bad); f.setAttribute('aria-invalid', String(bad)); if (bad) ok = false; });
      if (!form.elements.dsgvo.checked) ok = false;
      err.hidden = ok;
      if (!ok) return;
      form.classList.add('sent');
      var s = form.querySelector('.form__ok'); s.setAttribute('tabindex', '-1'); s.focus();
    });
  }
})();
