/* Bavarian MMA Center · Entwurf Variante C · LIKOVO */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 820px)');
  root.classList.add('js');

  /* Wörter einzeln animieren, Keywords (.hl) behalten ihre Akzentfarbe */
  function split(el) {
    var words = [], brk = ((mobile.matches && el.dataset.breakM) || el.dataset.break || '').split(',').map(Number);
    Array.prototype.forEach.call(el.childNodes, function (n) {
      var hl = n.nodeType === 1 && n.classList.contains('hl');
      (n.textContent || '').split(/\s+/).forEach(function (w) { if (w) words.push({ t: w, hl: hl }); });
    });
    el.textContent = '';
    words.forEach(function (o, i) {
      var s = document.createElement('span'); s.className = o.hl ? 'w hl' : 'w'; s.textContent = o.t; s.style.setProperty('--i', i); el.appendChild(s);
      if (i < words.length - 1) el.appendChild(brk.indexOf(i + 1) > -1 ? document.createElement('br') : document.createTextNode(' '));
    });
    return el.querySelectorAll('.w');
  }
  document.querySelectorAll('[data-words]').forEach(function (el) { el.setAttribute('aria-label', el.textContent.trim()); split(el); });
  var scrubs = [];
  document.querySelectorAll('[data-scrub]').forEach(function (el) { scrubs.push({ el: el, w: split(el) }); });
  document.querySelectorAll('[data-stagger]').forEach(function (g) {
    var n = 0; Array.prototype.forEach.call(g.children, function (c) { if (c.hasAttribute('data-r')) c.style.setProperty('--i', n++); });
  });

  /* Einblenden + Zähler */
  function count(el) {
    var t = parseFloat(el.dataset.count), d = parseInt(el.dataset.dec || '0', 10);
    var f = function (v) { return v.toFixed(d).replace('.', ','); };
    if (reduce) { el.textContent = f(t); return; }
    var t0 = null;
    (function tick(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1600); el.textContent = f(t * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(tick); })(performance.now());
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

  /* Hero + Header */
  var hero = document.querySelector('[data-hero]'), hdr = document.querySelector('[data-hdr]');
  if (hero) {
    requestAnimationFrame(function () { hero.classList.add('is-in'); hero.querySelectorAll('[data-words]').forEach(function (w) { w.classList.add('in'); }); });
    new IntersectionObserver(function (es) {
      var over = es[0].isIntersecting;
      hdr.classList.toggle('is-over', over); hdr.classList.toggle('is-solid', !over);
    }, { rootMargin: '-80px 0px 0px 0px' }).observe(hero.querySelector('.hero__in'));
  }

  /* Menü */
  var burger = document.querySelector('[data-burger]'), menu = document.querySelector('[data-menu]');
  function setMenu(o) {
    menu.classList.toggle('is-open', o); document.body.classList.toggle('menu-open', o);
    burger.setAttribute('aria-expanded', String(o)); burger.setAttribute('aria-label', o ? 'Menü schließen' : 'Menü öffnen');
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Statement färbt sich beim Scrollen */
  var ticking = false;
  function onScroll() {
    var vh = window.innerHeight;
    scrubs.forEach(function (s) {
      var r = s.el.getBoundingClientRect(), p = Math.max(0, Math.min(1, (vh * .92 - r.top) / (r.height * .8 + vh * .22)));
      var on = reduce ? s.w.length : Math.round(p * s.w.length);
      s.w.forEach(function (w, i) { w.classList.toggle('on', i < on); });
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll); onScroll();

  /* Ablauf: Schritte mit Fortschrittsbalken, Bild wechselt mit */
  document.querySelectorAll('[data-steps]').forEach(function (box) {
    var st = box.querySelectorAll('.jstep'), ims = box.querySelectorAll('.join__media img'), cur = 0, tm = null, DUR = 6000, seen = false;
    box.style.setProperty('--dur', DUR + 'ms');
    function show(n) {
      cur = (n + st.length) % st.length;
      st.forEach(function (s, k) {
        var on = k === cur; s.classList.toggle('on', on); s.querySelector('.jstep__btn').setAttribute('aria-expanded', String(on));
        var bar = s.querySelector('.jstep__bar'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      });
      ims.forEach(function (im, k) { im.classList.toggle('on', k === cur); });
    }
    function stop() { if (tm) clearInterval(tm); tm = null; }
    function start() { if (reduce) return; stop(); tm = setInterval(function () { show(cur + 1); }, DUR); }
    st.forEach(function (s, k) { s.querySelector('.jstep__btn').addEventListener('click', function () { show(k); start(); }); });
    box.addEventListener('mouseenter', function () { st[cur].classList.add('paused'); stop(); });
    box.addEventListener('mouseleave', function () { st.forEach(function (s) { s.classList.remove('paused'); }); show(cur); start(); });
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !seen) { seen = true; show(0); start(); }
      else if (!es[0].isIntersecting) stop();
      else if (seen && !tm) start();
    }, { threshold: 0.35 }).observe(box);
    if (reduce) st.forEach(function (s) { s.classList.remove('paused'); });
  });

  /* Trainer: Foto + Karte wechseln (Pfeile, Namen) */
  document.querySelectorAll('[data-trainers]').forEach(function (box) {
    var data = JSON.parse(box.getAttribute('data-trainers')), ims = box.querySelectorAll('.tphoto > img'), chips = box.querySelectorAll('.tchip'), cur = 0;
    var n = box.querySelector('[data-t-n]'), r = box.querySelector('[data-t-r]'), t = box.querySelector('[data-t-t]'), i = box.querySelector('[data-t-i]');
    function show(k) {
      cur = (k + data.length) % data.length;
      ims.forEach(function (im, j) { im.classList.toggle('on', j === cur); });
      chips.forEach(function (c, j) { c.classList.toggle('on', j === cur); c.setAttribute('aria-selected', String(j === cur)); });
      n.textContent = data[cur].n; r.textContent = data[cur].r; t.textContent = data[cur].t; i.textContent = cur + 1;
    }
    box.querySelector('[data-t-prev]').addEventListener('click', function () { show(cur - 1); });
    box.querySelector('[data-t-next]').addEventListener('click', function () { show(cur + 1); });
    chips.forEach(function (c, j) { c.addEventListener('click', function () { show(j); }); });
    var x0 = null, ph = box.querySelector('.tphoto');
    ph.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    ph.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
  });

  /* Stimmen: Bild + Zitat, Pfeile, Zähler, Vorschau des nächsten Bildes */
  document.querySelectorAll('[data-voices]').forEach(function (v) {
    var qs = v.querySelectorAll('.vq'), ims = v.querySelectorAll('.voices__img img'), nexts = JSON.parse(v.getAttribute('data-next'));
    var idx = v.querySelector('[data-v-i]'), nimg = v.querySelector('[data-v-nextimg]'), cur = 0, tm = null;
    function show(k) {
      cur = (k + qs.length) % qs.length;
      qs.forEach(function (q, j) { q.classList.toggle('on', j === cur); });
      ims.forEach(function (im, j) { im.classList.toggle('on', j === cur); });
      idx.textContent = cur + 1; nimg.src = nexts[(cur + 1) % nexts.length];
    }
    function stop() { if (tm) clearInterval(tm); }
    function start() { if (reduce) return; stop(); tm = setInterval(function () { show(cur + 1); }, 7000); }
    v.querySelector('[data-v-prev]').addEventListener('click', function () { show(cur - 1); start(); });
    v.querySelector('[data-v-next]').addEventListener('click', function () { show(cur + 1); start(); });
    v.querySelector('[data-v-thumb]').addEventListener('click', function () { show(cur + 1); start(); });
    v.addEventListener('mouseenter', stop); v.addEventListener('mouseleave', start);
    v.addEventListener('focusin', stop); v.addEventListener('focusout', start);
    var x0 = null, st = v.querySelector('.voices__grid');
    st.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    st.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { show(cur + (dx < 0 ? 1 : -1)); start(); } x0 = null; });
    show(0); start();
  });

  /* Wischreihen: Punkte zeigen, wie viele Karten es gibt */
  document.querySelectorAll('.swipe').forEach(function (row) {
    var items = Array.prototype.filter.call(row.children, function (c) { return c.nodeType === 1; });
    if (items.length < 2) return;
    var dots = document.createElement('div'); dots.className = 'swipe-dots'; dots.setAttribute('aria-hidden', 'true');
    items.forEach(function (it, k) {
      var b = document.createElement('button'); b.type = 'button'; b.tabIndex = -1;
      b.addEventListener('click', function () { row.scrollTo({ left: it.offsetLeft - row.offsetLeft - (row.clientWidth - it.clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' }); });
      dots.appendChild(b);
    });
    row.after(dots);
    var bs = dots.querySelectorAll('button');
    function upd() {
      var mid = row.scrollLeft + row.clientWidth / 2, best = 0, bd = Infinity;
      items.forEach(function (it, k) { var c = it.offsetLeft - row.offsetLeft + it.clientWidth / 2, d = Math.abs(c - mid); if (d < bd) { bd = d; best = k; } });
      bs.forEach(function (b, k) { b.classList.toggle('on', k === best); });
    }
    row.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true });
    window.addEventListener('resize', upd); upd();
  });

  /* FAQ */
  document.querySelectorAll('.faq__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var it = q.closest('.faq__i'), o = !it.classList.contains('open');
      it.classList.toggle('open', o); q.setAttribute('aria-expanded', String(o));
    });
  });

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
    document.querySelectorAll('[data-fuer]').forEach(function (a) {
      a.addEventListener('click', function () { var r = form.querySelector('input[value="' + a.dataset.fuer + '"]'); if (r) { r.checked = true; sync(); } });
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
