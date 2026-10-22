/* Main-Energiekreis · Entwurf 2 · Runde 5 · Interaktionen
   Vanilla JS, keine Abhängigkeiten. Animiert nur transform/opacity (plus Blur beim Einblenden).
   Respektiert prefers-reduced-motion und Datensparmodus. */
(function () {
  'use strict';

  /* Alpha-Videos (Envato, freigestellt). Bis die Dateien da sind: aus.
     webm = VP9 mit Alpha (Chrome, Edge, Firefox), hevc = HEVC mit Alpha (Safari). */
  var ALPHA = {
    enabled: true,
    base: 'assets/video/alpha/',
    clips: {
      grass: { webm: 'gras.webm', hevc: null, media: '(min-width: 720px)' }
    }
  };

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- Text in Wörter zerlegen ----------
     Akzent-Spans (.hl) werden mitzerlegt, jedes Wort behält die Akzentfarbe.
     Bild-Kacheln (.inline) und Umbrüche bleiben eigenständig. */
  function splitWords(el, cls, innerCls) {
    var i = 0, cur = null, frag = document.createDocumentFragment();
    function open() {
      var w = document.createElement('span'); w.className = cls; w.style.setProperty('--i', i);
      var target = w;
      if (innerCls) { target = document.createElement('span'); target.className = innerCls; target.style.setProperty('--i', i); w.appendChild(target); }
      i++; frag.appendChild(w); cur = target;
    }
    function walk(node, accent) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { cur = null; frag.appendChild(document.createTextNode(part)); return; }
            if (!cur) open();
            if (accent) { var h = document.createElement('span'); h.className = 'hl'; h.textContent = part; cur.appendChild(h); }
            else cur.appendChild(document.createTextNode(part));
          });
        } else if (n.nodeType === 1) {
          if (n.tagName === 'BR' || n.classList.contains('inline')) {
            cur = null; if (n.classList.contains('inline')) n.style.setProperty('--i', i);
            frag.appendChild(n);
          } else if (n.classList.contains('hl')) walk(n, true);
          else { if (!cur) open(); cur.appendChild(n); }
        }
      });
    }
    walk(el, false);
    el.textContent = ''; el.appendChild(frag);
    return i;
  }
  function splitChars(el, wrapInner) {
    var out = [], k = 0;
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      var soft = node.nodeType === 1 && node.classList.contains('soft');
      Array.from(node.textContent).forEach(function (ch) {
        var s = document.createElement('span');
        if (wrapInner) { var i = document.createElement('i'); i.textContent = ch; i.style.setProperty('--i', k); if (soft) i.className = 'soft'; s.appendChild(i); }
        else { s.textContent = ch; s.style.setProperty('--i', k); if (soft) s.className = 'soft'; }
        k++; out.push(s);
      });
    });
    el.textContent = ''; out.forEach(function (s) { el.appendChild(s); });
  }
  $$('.split-w').forEach(function (el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    splitWords(el, 'w', 'wi');
    $$('.w', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
  });
  $$('.blur-w').forEach(function (el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    splitWords(el, 'bw');
    $$('.bw', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
  });
  var word = $('[data-word]'); if (word) splitChars(word, false);

  /* ---------- Intro (Terrava: Wortmarke steigt auf, fährt nach oben raus) ---------- */
  var intro = $('.intro'), hero = $('[data-hero]');
  function startHero() {
    if (!hero) return;
    hero.classList.add('is-in');
    $$('.blur-w, .wipe', hero).forEach(function (el) { el.classList.add('is-in'); });
  }
  if (intro && !doc.classList.contains('no-intro')) {
    splitChars($('[data-intro-word]', intro), true);
    requestAnimationFrame(function () { requestAnimationFrame(function () { intro.classList.add('is-run'); }); });
    setTimeout(function () { intro.classList.add('is-done'); }, 1150);
    setTimeout(startHero, 1250);
    setTimeout(function () { intro.classList.add('is-gone'); }, 2100);
    try { sessionStorage.setItem('mek2-intro', '1'); } catch (e) {}
  } else requestAnimationFrame(startHero);

  /* ---------- Reveal ---------- */
  var reveals = $$('[data-reveal], .split-w, [data-word]').filter(function (el) { return !el.closest('[data-hero]'); });
  var io = null;
  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(function (es) {
      var j = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (!e.target.style.getPropertyValue('--i')) e.target.style.setProperty('--i', j);
        j++; e.target.classList.add('is-in'); io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add('is-in'); });
  /* Sicherheitsnetz, falls der Observer bei schnellem Scrollen etwas auslässt */
  var pending = reveals.slice();
  function sweep() {
    if (!pending.length) return;
    var lim = window.innerHeight * 0.96;
    pending = pending.filter(function (el) {
      if (el.classList.contains('is-in')) return false;
      if (el.getBoundingClientRect().top < lim) { el.classList.add('is-in'); return false; }
      return true;
    });
  }

  /* ---------- Sticky-Leiste nach dem Hero ---------- */
  var topbar = $('[data-topbar]');
  if (topbar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var past = !es[0].isIntersecting;
      topbar.classList.toggle('is-visible', past);
      topbar.setAttribute('aria-hidden', past ? 'false' : 'true');
      $$('a,button', topbar).forEach(function (a) { a.tabIndex = past ? 0 : -1; });
    }, { rootMargin: '-30% 0px 0px 0px' }).observe($('.hero__frame', hero));
  }

  /* ---------- Menü ---------- */
  var menu = $('#menu');
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('is-open', open); menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    $$('[data-menu-open]').forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('[data-menu-close]').focus();
  }
  if (menu) {
    $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { setMenu(true); }); });
    $('[data-menu-close]').addEventListener('click', function () { setMenu(false); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });
  }

  /* ---------- Ebenen am Horizont ausrichten ----------
     Hero: Die Headline sitzt so, dass die Hügelkante (44,7 % der Bildhöhe) ihren Fuß knapp verdeckt.
     Footer: Der Solarpark steht hinter der Hügelkante des Freistellers, egal wie das Bild beschnitten wird. */
  function coverBox(bw, bh, nw, nh, px, py) {
    var s = Math.max(bw / nw, bh / nh), dw = nw * s, dh = nh * s;
    return { s: s, x: (bw - dw) * px, y: (bh - dh) * py, w: dw, h: dh };
  }
  var heroFrame = hero && $('.hero__frame', hero), heroTitle = hero && $('.hero__title', hero);
  function layoutHero() {
    if (!heroFrame || !heroTitle || !$('.hero__land', hero)) return;
    var fw = heroFrame.clientWidth, fh = heroFrame.clientHeight, lt = -0.06 * fh, lh = 1.16 * fh;
    var b = coverBox(fw, lh, 2400, 1209, 0.5, 0.46);
    var ridge = lt + b.y + 0.447 * b.h;
    ridge = lt + lh / 2 + (ridge - lt - lh / 2) * 1.02; /* Endzustand scale(1.02) */
    var top = Math.max(96, ridge - heroTitle.offsetHeight * 1.02); /* ruht knapp über der Kante, sinkt beim Scrollen dahinter */
    heroTitle.style.top = top.toFixed(0) + 'px';
  }
  var endFrame = $('.end__frame'), hills = $('.end__hills'), turbs = $$('.ridge-obj'), ctaBox = $('.end__cta');
  var ridgePts = hills && hills.dataset.ridge ? hills.dataset.ridge.split(',').map(Number) : null;
  function layoutEnd() {
    if (!endFrame || !hills) return;
    for (var pass = 0; pass < 2; pass++) {
      var fw = hills.clientWidth, fh = hills.clientHeight, b = coverBox(fw, fh, 2400, 1500, 0.5, 0);
      if (ridgePts && ctaBox) {
        /* tiefste Stelle der Kante im Bereich der Headline: dort muss der weiße Text schon auf Grün liegen */
        var cw = Math.min(fw, ctaBox.querySelector('.h2').offsetWidth + 40), x0 = (fw - cw) / 2, low = 0;
        for (var k = 0; k < ridgePts.length; k++) {
          var x = b.x + k * 80 * b.s; if (x >= x0 && x <= x0 + cw) low = Math.max(low, ridgePts[k]);
        }
        var min = window.innerWidth < 720 ? 150 : 180;
        endFrame.style.paddingTop = Math.max(min, Math.round(low * b.s + 28)) + 'px';
        endFrame.style.setProperty('--ridge', Math.round(low * b.s) + 'px');
      }
    }
    turbs.forEach(function (t) {
      t.style.setProperty('--x', (b.x + parseFloat(t.dataset.ix) * b.s).toFixed(1) + 'px');
      t.style.setProperty('--y', (b.y + parseFloat(t.dataset.iy) * b.s).toFixed(1) + 'px');
      t.style.setProperty('--w', (parseFloat(t.dataset.iw) * b.s).toFixed(1) + 'px');
    });
  }
  var regionFrame = $('.region__frame'), refbox = $('.refbox');
  function layoutRegion() {
    if (!regionFrame || !refbox) return;
    /* Weiß läuft ab knapp der Hälfte der Referenz-Box in den Drohnenflug */
    var wrap = refbox.parentElement, y = wrap.offsetTop + refbox.offsetTop + refbox.offsetHeight * 0.46;
    /* mobil liegt die Szene nur im unteren Teil: Weiß reicht bis in ihren Himmel */
    var media = $('.region__media', regionFrame), fh = regionFrame.offsetHeight;
    if (media && window.innerWidth < 720) {
      media.style.top = '';
      y = Math.max(y, fh - media.offsetHeight + media.offsetHeight * 0.12);
      regionFrame.style.setProperty('--fg-b', '');
    } else if (media) {
      /* Desktop: Szene so legen, dass Hügelkante, Fluss und Ort knapp unter dem Ende des Weiß liegen */
      var fadeLen = Math.min(220, Math.max(120, window.innerWidth * 0.14)), mh = fh;
      var top = clamp(y + fadeLen - 0.42 * mh, 0, fh - 0.6 * mh);
      media.style.top = Math.round(top) + 'px';
      /* Vordergrund (Solarmodule, Nebel) bleibt am unteren Rand des Rahmens */
      regionFrame.style.setProperty('--fg-b', Math.round(top + mh - fh - 0.03 * mh) + 'px');
    }
    regionFrame.style.setProperty('--fade-y', Math.round(y) + 'px');
  }
  function layout() { layoutHero(); layoutEnd(); layoutRegion(); }
  /* Fallback für Browser ohne overflow: clip: Rahmen nie intern verschieben */
  $$('.hero__frame, .region__frame, .end__frame').forEach(function (f) { f.addEventListener('scroll', function () { if (f.scrollTop || f.scrollLeft) { f.scrollTop = 0; f.scrollLeft = 0; } }); });
  if (refbox && 'ResizeObserver' in window) new ResizeObserver(layoutRegion).observe(refbox);
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('load', layout);
  var rzT; window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(layout, 120); });

  /* ---------- Ebenen und Parallax ----------
     data-depth: Hero-Ebenen, wandern beim Scrollen unterschiedlich schnell (Himmel langsam, Land fest),
                 dadurch sinkt die Headline hinter die Hügel.
     data-py:    Bild im Rahmen läuft etwas langsamer als die Seite (Spielraum laut CSS).
     data-sink:  Solarpark und Hügel im Footer steigen beim Hereinscrollen auf. */
  var depth = $$('[data-depth]', hero || document);
  var py = $$('[data-py]').map(function (el) { return { el: el, k: parseFloat(el.dataset.py), max: parseFloat(el.dataset.pyMax || '4') / 100 }; });
  var sinkers = $$('[data-sink]').map(function (el) { return { el: el, k: parseFloat(el.dataset.sink) }; });
  /* data-scene / data-par: Ebenen einer Szene, Versatz = (Fortschritt - from) * k * Viewport-Höhe.
     Fortschritt läuft von 1 (Szene kommt von unten) bis -1 (Szene verlässt oben). */
  var scenes = $$('[data-scene]').map(function (sc) {
    return { el: sc, items: $$('[data-par]', sc).map(function (el) { return { el: el, k: parseFloat(el.dataset.par) || 0, from: parseFloat(el.dataset.parFrom || '0') }; }) };
  });
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight, y = window.scrollY;
    if (!reduce) {
      if (y < vh * 1.4) depth.forEach(function (el) { el.style.transform = 'translate3d(0,' + (y * parseFloat(el.dataset.depth)).toFixed(1) + 'px,0)'; });
      py.forEach(function (o) {
        var r = o.el.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
        var lim = r.height * o.max, v = clamp((vh / 2 - (r.top + r.height / 2)) * o.k, -lim, lim);
        o.el.style.setProperty('--py', v.toFixed(1) + 'px');
      });
      scenes.forEach(function (sc) {
        var r = sc.el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
        var pr = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
        sc.items.forEach(function (o) { if (!o.k) return; var ty = clamp((pr - o.from) * o.k * vh, -0.22 * vh, 0.22 * vh); o.el.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0)'; });
      });
      sinkers.forEach(function (o) {
        var host = o.el.parentElement.getBoundingClientRect(); if (host.bottom < -100 || host.top > vh + 100) return;
        var v = Math.max(0, (host.top + Math.min(host.height, vh) * 0.5 - vh * 0.5) * o.k);
        o.el.style.setProperty('--py', v.toFixed(1) + 'px');
      });
    }
    sweep();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* ---------- Gemeinsam: Pause bei Hover, Fokus und außerhalb des Bildschirms ---------- */
  function autoPause(root, box) {
    var st = { hover: false, focus: false, off: true };
    function upd() { root.classList.toggle('is-paused', st.hover || st.focus || st.off); }
    box.addEventListener('mouseenter', function () { st.hover = true; upd(); });
    box.addEventListener('mouseleave', function () { st.hover = false; upd(); });
    root.addEventListener('focusin', function () { st.focus = true; upd(); });
    root.addEventListener('focusout', function () { st.focus = false; upd(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { st.off = !e[0].isIntersecting; upd(); }, { threshold: 0.3 }).observe(root);
    else st.off = false;
    upd();
  }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function floatLoop(els, amp, speed) {
    if (reduce || !els.length) return;
    (function loop(t) { var v = (Math.sin(t / speed) * amp).toFixed(2) + 'px'; els.forEach(function (el) { el.style.setProperty('--float', v); }); requestAnimationFrame(loop); })(0);
  }

  /* Mobil (unter 720 px): keine Karussells, alle Karten stehen untereinander */
  var mqMob = window.matchMedia('(max-width: 719px)');
  var isMob = function () { return mqMob.matches; };
  var onMode = function (fn) { if (mqMob.addEventListener) mqMob.addEventListener('change', fn); else if (mqMob.addListener) mqMob.addListener(fn); };

  /* ---------- Stromspeicher: Bühne mit Glas-Tabs, Fortschritt und Auto-Wechsel ---------- */
  var stageRoot = $('[data-stage]');
  if (stageRoot) {
    var stabs = $$('.stab', stageRoot), sImg = $('[data-stage-img]', stageRoot), bars = $$('.stage__progress i', stageRoot);
    var sCount = $('[data-stage-count]', stageRoot), si = 0, SDUR = 6000, swapT = null;
    stageRoot.style.setProperty('--dur', SDUR + 'ms');
    var stageStatic = function () {
      stabs.forEach(function (b) { var p = document.getElementById(b.getAttribute('aria-controls')); if (p) p.hidden = false; });
      bars.forEach(function (bar) { bar.classList.remove('is-run', 'is-done'); });
      var main = stabs[1] || stabs[0];
      if (sImg) { clearTimeout(swapT); sImg.src = main.dataset.img; sImg.alt = main.dataset.alt || ''; sImg.classList.toggle('is-wide', main.hasAttribute('data-wide')); sImg.classList.remove('is-out'); }
    };
    var stageSel = function (k, focus) {
      si = (k + stabs.length) % stabs.length;
      if (isMob()) { stageStatic(); return; }
      stabs.forEach(function (b, j) {
        var on = j === si, panel = document.getElementById(b.getAttribute('aria-controls'));
        b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        if (panel) { if (on) { panel.hidden = false; restart(panel, 'is-enter'); } else panel.hidden = true; }
      });
      if (focus) stabs[si].focus();
      var b = stabs[si];
      if (sImg && sImg.getAttribute('src') !== b.dataset.img) {
        sImg.classList.add('is-out'); clearTimeout(swapT);
        swapT = setTimeout(function () {
          sImg.src = b.dataset.img; sImg.alt = b.dataset.alt || ''; sImg.classList.toggle('is-wide', b.hasAttribute('data-wide'));
          var show = function () { sImg.classList.remove('is-out'); };
          if (sImg.decode) sImg.decode().then(show, show); else show();
        }, 260);
      }
      if (sCount) sCount.textContent = String(si + 1).padStart(2, '0');
      bars.forEach(function (bar, j) {
        bar.classList.remove('is-run');
        bar.classList.toggle('is-done', j < si || (reduce && j === si));
      });
      if (!reduce) restart(bars[si], 'is-run');
    };
    bars.forEach(function (bar) { bar.addEventListener('animationend', function () { if (bar.classList.contains('is-run') && !isMob()) stageSel(si + 1); }); });
    onMode(function () { stageSel(si); });
    stabs.forEach(function (b, k) {
      b.addEventListener('click', function () { stageSel(k); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); stageSel(k + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); stageSel(k - 1, true); }
      });
    });
    $('[data-stage-prev]', stageRoot).addEventListener('click', function () { stageSel(si - 1); });
    $('[data-stage-next]', stageRoot).addEventListener('click', function () { stageSel(si + 1); });
    stabs.forEach(function (b) { var im = new Image(); im.src = b.dataset.img; });
    autoPause(stageRoot, $('.stage', stageRoot));
    stageSel(0);
    floatLoop($$('[data-float]', stageRoot).concat(sImg ? [sImg] : []), 5, 1500);
  }

  /* ---------- Ablauf: aktiver Schritt breit und hoch, läuft automatisch weiter ---------- */
  var flow = $('[data-flow]');
  if (flow) {
    var fView = $('.flow__view', flow), fTrack = $('[data-flow-track]', flow), fSteps = $$('.step', fTrack);
    var fCount = $('[data-count]', flow), fNow = $('[data-now]', flow), fBar = $('[data-flow-bar]', flow), fi = 0, FDUR = 5500, GAP = 10;
    flow.style.setProperty('--dur', FDUR + 'ms');
    var flowLayout = function () {
      if (isMob()) { fTrack.style.transform = ''; return; }
      var W = fView.clientWidth, n = fSteps.length, wOn, wOff;
      if (window.innerWidth < 720) { wOn = Math.min(400, W * 0.74); wOff = W * 0.3; }
      else { var R = 3.4; wOff = (W - GAP * (n - 1)) / (n - 1 + R); wOn = wOff * R; }
      fSteps.forEach(function (s, j) { s.style.setProperty('--w', (j === fi ? wOn : wOff).toFixed(1) + 'px'); });
      fTrack.style.setProperty('--w-on', wOn.toFixed(0) + 'px');
      var total = wOn + (n - 1) * (wOff + GAP), max = Math.max(0, total - W), x = clamp(fi * (wOff + GAP), 0, max);
      fTrack.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
    };
    var flowSel = function (k) {
      fi = (k + fSteps.length) % fSteps.length;
      fSteps.forEach(function (s, j) { var on = j === fi; s.classList.toggle('is-on', on); if (on) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current'); });
      fCount.textContent = String(fi + 1).padStart(2, '0'); if (fNow) fNow.textContent = fSteps[fi].dataset.text;
      /* Grafik des neuen Schritts noch einmal aufbauen (nur Desktop, wenn schon gesehen) */
      if (!isMob() && !reduce && fSteps[fi].classList.contains('is-drawn')) restart(fSteps[fi], 'is-drawn');
      if (fBar) { if (reduce) fBar.style.transform = 'scaleX(1)'; else if (isMob()) fBar.classList.remove('is-run'); else restart(fBar, 'is-run'); }
      flowLayout();
    };
    if (fBar) fBar.addEventListener('animationend', function () { if (!isMob()) flowSel(fi + 1); });
    onMode(function () { flowSel(fi); });
    fSteps.forEach(function (s, j) {
      s.addEventListener('click', function () { if (j !== fi) flowSel(j); });
      s.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && j !== fi) { e.preventDefault(); flowSel(j); } });
    });
    fTrack.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); flowSel(fi + 1); fSteps[fi].focus({ preventScroll: true }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); flowSel(fi - 1); fSteps[fi].focus({ preventScroll: true }); }
    });
    $('[data-prev]', flow).addEventListener('click', function () { flowSel(fi - 1); });
    $('[data-next]', flow).addEventListener('click', function () { flowSel(fi + 1); });
    var fx = null, fy = null;
    fTrack.addEventListener('touchstart', function (e) { fx = e.touches[0].clientX; fy = e.touches[0].clientY; }, { passive: true });
    fTrack.addEventListener('touchend', function (e) {
      if (fx === null || isMob()) return;
      var dx = e.changedTouches[0].clientX - fx, dy = e.changedTouches[0].clientY - fy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) flowSel(fi + (dx < 0 ? 1 : -1));
      fx = null;
    });
    /* Grafiken bauen sich auf, sobald die Karte ins Bild kommt */
    if ('IntersectionObserver' in window && !reduce) {
      var dio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-drawn'); dio.unobserve(e.target); } }); }, { threshold: 0.3 });
      fSteps.forEach(function (s) { dio.observe(s); });
    } else fSteps.forEach(function (s) { s.classList.add('is-drawn'); });
    autoPause(flow, fView);
    window.addEventListener('resize', flowLayout);
    flowSel(0);
  }

  /* ---------- Preise: Tabs zum Vergleichen, Karte behält ihre Höhe ---------- */
  var price = $('[data-price]');
  if (price) {
    var ptabs = $$('.ptab', price), ppanels = ptabs.map(function (b) { return document.getElementById(b.getAttribute('aria-controls')); });
    ppanels.forEach(function (p) { p.hidden = false; });
    var pcur = 0;
    var psel = function (k, focus) {
      k = (k + ptabs.length) % ptabs.length; pcur = k;
      if (isMob()) { ppanels.forEach(function (p) { p.classList.remove('is-off'); p.classList.add('is-on'); p.setAttribute('aria-hidden', 'false'); p.inert = false; }); return; }
      ptabs.forEach(function (b, j) {
        var on = j === k, p = ppanels[j];
        b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        p.classList.toggle('is-on', on); p.classList.toggle('is-off', !on);
        p.setAttribute('aria-hidden', on ? 'false' : 'true'); p.inert = !on;
      });
      if (focus) ptabs[k].focus();
      var t = ptabs[k], box = t.parentElement;
      if (box.scrollWidth > box.clientWidth) box.scrollTo({ left: t.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
    };
    ptabs.forEach(function (b, k) {
      b.addEventListener('click', function () { psel(k); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); psel(k + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); psel(k - 1, true); }
      });
    });
    onMode(function () { psel(pcur); });
    psel(0);
  }

  /* ---------- Referenzen: Karten in der Glas-Box ---------- */
  var refs = $('[data-refs]');
  if (refs) {
    var rt = $('[data-refs-track]', refs), rslides = $$('.rcard', rt), rcount = $('[data-refs-count]', refs), ri = 0;
    var rgo = function (k) {
      ri = (k + rslides.length) % rslides.length;
      if (isMob()) { rt.style.transform = ''; rslides.forEach(function (s) { s.removeAttribute('aria-hidden'); }); return; }
      rt.style.transform = 'translate3d(' + (-100 * ri) + '%,0,0)';
      rslides.forEach(function (s, j) { s.setAttribute('aria-hidden', j === ri ? 'false' : 'true'); });
      rcount.innerHTML = String(ri + 1).padStart(2, '0') + '<small>/' + String(rslides.length).padStart(2, '0') + '</small>';
    };
    $('[data-refs-prev]', refs).addEventListener('click', function () { rgo(ri - 1); });
    $('[data-refs-next]', refs).addEventListener('click', function () { rgo(ri + 1); });
    refs.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); rgo(ri + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); rgo(ri - 1); }
    });
    var rx = null, ry = null;
    rt.addEventListener('touchstart', function (e) { rx = e.touches[0].clientX; ry = e.touches[0].clientY; }, { passive: true });
    rt.addEventListener('touchend', function (e) {
      if (rx === null || isMob()) return;
      var dx = e.changedTouches[0].clientX - rx, dy = e.changedTouches[0].clientY - ry;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) rgo(ri + (dx < 0 ? 1 : -1));
      rx = null;
    });
    onMode(function () { rgo(ri); });
    rgo(0);
  }

  /* ---------- FAQ: immer genau eine Antwort offen, mit Höhen-Animation ---------- */
  var qas = $$('.qa');
  var qaSet = function (q, open) {
    var body = $('.qa__body', q);
    if (q._anim) { q._anim.cancel(); q._anim = null; }
    var animate = !reduce && body && body.animate;
    if (open) {
      var from = q.open ? body.offsetHeight : 0;
      q.open = true; q.classList.add('is-open');
      if (!animate) return;
      body.style.height = 'auto'; var to = body.offsetHeight;
      q._anim = body.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' });
      q._anim.onfinish = function () { q._anim = null; body.style.height = ''; };
    } else {
      q.classList.remove('is-open');
      if (!animate) { q.open = false; return; }
      var h = body.offsetHeight;
      q._anim = body.animate([{ height: h + 'px' }, { height: '0px' }], { duration: 460, easing: 'cubic-bezier(.33,0,.2,1)' });
      q._anim.onfinish = function () { q._anim = null; q.open = false; };
    }
  };
  qas.forEach(function (q) {
    if (q.open) q.classList.add('is-open');
    $('summary', q).addEventListener('click', function (e) {
      e.preventDefault();
      var willOpen = !q.classList.contains('is-open');
      if (willOpen) qas.forEach(function (o) { if (o !== q && o.classList.contains('is-open')) qaSet(o, false); });
      qaSet(q, willOpen);
    });
    q.addEventListener('pointermove', function (e) {
      var r = q.getBoundingClientRect();
      q.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px'); q.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    });
  });
  /* Links auf eine Frage öffnen diese */
  $$('a[href^="#faq-"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var q = document.getElementById(a.getAttribute('href').slice(1));
      if (q && q.classList.contains('qa') && !q.classList.contains('is-open')) { qas.forEach(function (o) { if (o !== q && o.classList.contains('is-open')) qaSet(o, false); }); qaSet(q, true); }
    });
  });
  var more = $('[data-faq-more]');
  if (more) more.addEventListener('click', function () {
    var list = $('.faq__list'); list.classList.add('is-all'); more.hidden = true;
    var q = $$('.qa', list)[6]; if (q) $('summary', q).focus();
  });

  /* ---------- Alpha-Videos (Envato, freigestellt) ----------
     Chrome, Edge, Firefox: WebM VP9 mit Alpha. Safari: HEVC mit Alpha, sobald vorhanden, sonst bleibt das Standbild.
     Videos laden erst in Sichtweite und pausieren außerhalb. */
  if (ALPHA.enabled && !reduce && !saveData && 'IntersectionObserver' in window) {
    /* Safari und alle Browser auf iPhone und iPad (WebKit) können kein VP9 mit Alpha, dafür HEVC mit Alpha */
    var ua = navigator.userAgent;
    var webkitOnly = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) || /^((?!chrome|chromium|android|crios|fxios|edg|opr).)*safari/i.test(ua);
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        (e.target._vids || []).forEach(function (v) {
          if (e.isIntersecting) { if (!v.getAttribute('src')) { v.src = v.dataset.src; v.load(); } var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else if (v.getAttribute('src')) v.pause();
        });
      });
    }, { rootMargin: '150px 0px', threshold: 0 });
    $$('[data-alpha]').forEach(function (host) {
      var name = host.dataset.alpha, clip = ALPHA.clips[name]; if (!clip) return;
      if (clip.media && !window.matchMedia(clip.media).matches) return;
      if (webkitOnly && clip.hevcMedia && !window.matchMedia(clip.hevcMedia).matches) return;
      var file = webkitOnly ? clip.hevc : clip.webm; if (!file) return;
      var v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true'); v.setAttribute('disablepictureinpicture', '');
      v.preload = 'none'; v.dataset.src = ALPHA.base + file; v.className = 'fx-video fx-video--' + name;
      var box = host.tagName === 'IMG' ? host.parentElement : host;
      if (clip.jitter) v.addEventListener('loadedmetadata', function () { try { v.currentTime = Math.random() * (v.duration || 1); v.playbackRate = 0.8 + Math.random() * 0.35; } catch (e) {} }, { once: true });
      v.addEventListener('playing', function () { v.classList.add('is-playing'); box.classList.add('is-video'); }, { once: true });
      if (host.tagName === 'IMG') host.insertAdjacentElement('afterend', v); else host.appendChild(v);
      var obs = host.closest('[data-hero], section, .end__frame, .pano__frame') || box;
      if (!obs._vids) { obs._vids = []; vio.observe(obs); }
      obs._vids.push(v);
    });
  }

  /* ---------- Hero: Drohnenflug ----------
     Startet nach dem Laden der Seite (das Standbild ist das LCP-Bild), mobil die Hochformat-Fassung,
     pausiert außerhalb des Bildschirms, Pause-Knopf für Nutzer. Bei Datensparmodus und "Bewegung reduzieren" bleibt das Standbild. */
  var hv = $('[data-hero-video]'), hpause = $('[data-hero-pause]');
  if (hv && !reduce && !saveData && 'IntersectionObserver' in window) {
    var hSmall = window.matchMedia('(max-width: 719px)').matches;
    var hWebm = hv.canPlayType('video/webm; codecs="vp9"') ? hv.dataset[hSmall ? 'webmMobil' : 'webm'] : null;
    var hSrc = hWebm || hv.dataset[hSmall ? 'mp4Mobil' : 'mp4'], hUser = false, hVis = true;
    var hPlay = function () {
      if (hUser || !hVis) return;
      if (!hv.getAttribute('src')) { hv.src = hSrc; hv.load(); }
      var pr = hv.play(); if (pr && pr.catch) pr.catch(function () {});
    };
    hv.addEventListener('playing', function () { hv.classList.add('is-playing'); if (hpause) hpause.hidden = false; }, { once: true });
    var hStart = function () {
      new IntersectionObserver(function (es) { hVis = es[0].isIntersecting; if (hVis) hPlay(); else if (hv.getAttribute('src')) hv.pause(); }, { threshold: 0.05 }).observe(hv.closest('.hero__frame'));
    };
    if (document.readyState === 'complete') setTimeout(hStart, 200); else window.addEventListener('load', function () { setTimeout(hStart, 200); });
    if (hpause) hpause.addEventListener('click', function () {
      hUser = !hv.paused;
      if (hUser) { hv.pause(); hpause.setAttribute('aria-pressed', 'true'); hpause.setAttribute('aria-label', 'Video abspielen'); }
      else { hpause.setAttribute('aria-pressed', 'false'); hpause.setAttribute('aria-label', 'Video anhalten'); hPlay(); }
    });
  }

  /* ---------- Formular als Dialog ---------- */
  var dlg = $('[data-dialog]'), form = $('[data-form]');
  if (dlg && typeof dlg.showModal === 'function') {
    var opener = null;
    $$('[data-open-form]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); opener = a;
        if (menu && menu.classList.contains('is-open')) setMenu(false);
        dlg.showModal(); var f = $('input[type=text]', dlg); if (f) f.focus();
      });
    });
    $$('[data-close-form]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (opener && document.contains(opener)) opener.focus(); });
    if (location.hash === '#dach-check') dlg.showModal();
  }
  if (form) {
    var file = $('input[type=file]', form), fname = $('[data-filename]', form);
    if (file && fname) file.addEventListener('change', function () { fname.textContent = file.files.length ? file.files[0].name : 'Optional: Foto vom Dach hochladen'; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      $$('[data-field]', form).forEach(function (f) {
        var inp = $('input', f), bad = !inp.value.trim();
        f.classList.toggle('is-error', bad); inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) { ok = false; first = first || inp; }
      });
      var c = $('input[name=datenschutz]', form);
      if (c) { c.parentElement.classList.toggle('is-error', !c.checked); if (!c.checked) { ok = false; first = first || c; } }
      if (!ok) { if (first) first.focus(); return; }
      // TODO Livegang: Versand an ein Formular-Backend mit AV-Vertrag
      form.classList.add('is-sent');
    });
    $$('input', form).forEach(function (inp) { inp.addEventListener('input', function () { var f = inp.closest('[data-field]'); if (f && inp.value.trim()) { f.classList.remove('is-error'); inp.setAttribute('aria-invalid', 'false'); } }); });
  }
})();
