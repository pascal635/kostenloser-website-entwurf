/* HenriCreates · Startseiten-Entwurf
   Kein Framework, keine externen Abhaengigkeiten.
   Alles was Bandbreite kostet, startet erst bei Sichtbarkeit oder Interaktion. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = (navigator.connection && navigator.connection.saveData) === true;

  /* ---------- 1 · Scroll-Reveal mit Stagger ----------
     Ausfallsicherung: was nach 1,4 Sekunden noch versteckt ist, wird
     hart eingeblendet. Ohne das bleibt die Seite in Umgebungen, die JS
     ausfuehren aber keinen IntersectionObserver feuern (Screenshot-Dienste,
     manche Crawler, Preview-Renderer), dauerhaft leer. */
  var reveals = document.querySelectorAll('.reveal');
  window.setTimeout(function () {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.style.transition = 'none';
      el.style.transitionDelay = '0s';
      el.classList.add('in');
    });
    var pg = document.querySelector('.process-grid');
    if (pg) pg.classList.add('in');
  }, 1600);

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    /* Die Staffelung wird bei 5 Stufen gekappt. Ohne die Kappung waechst der
       Versatz mit jedem sichtbaren Element weiter, und auf hohen Viewports
       (oder wenn viele Sektionen gleichzeitig in den Blick kommen) bekaeme
       das letzte Element mehrere Sekunden Verzoegerung. Die Seite sieht dann
       leer aus, obwohl alles da ist. */
    var MAX_STEPS = 5;
    var revealObserver = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = (i % MAX_STEPS) * 70;
        el.style.transition =
          'opacity 0.6s cubic-bezier(0.33,0,0.2,1) ' + delay + 'ms, ' +
          'translate 0.6s cubic-bezier(0.33,0,0.2,1) ' + delay + 'ms';
        el.classList.add('in');
        i++;
        el.addEventListener('transitionend', function () { el.style.transition = ''; }, { once: true });
        revealObserver.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 1b · Timeline-Verbindungslinie ---------- */
  var procGrid = document.querySelector('.process-grid');
  if (procGrid && 'IntersectionObserver' in window) {
    var procObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        procObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    procObserver.observe(procGrid);
  } else if (procGrid) {
    procGrid.classList.add('in');
  }

  /* ---------- 1c · Glow folgt dem Zeiger, nur auf echten Maus-Geraeten ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    document.querySelectorAll('.plan, .service, .problem-card, .quote').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- 2 · Navigation ---------- */
  var navWrap = document.getElementById('navWrap');
  var burger = document.getElementById('navBurger');

  var onScroll = function () {
    if (navWrap) navWrap.classList.toggle('scrolled', window.scrollY > 20);
    var sticky = document.getElementById('stickyCta');
    if (sticky) sticky.classList.toggle('in', window.scrollY > 700);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && navWrap) {
    burger.addEventListener('click', function () {
      var open = navWrap.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });
    navWrap.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        navWrap.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 3 · Hero-Showreel ----------
     Der stumme Loop laedt und startet erst, wenn die Karte im Bild ist.
     Damit bleibt der LCP das 3-KB-Poster und nicht ein Video. */
  var reelVideo = document.getElementById('reelVideo');
  if (reelVideo && !reduce && !saveData && 'IntersectionObserver' in window) {
    var reelObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (reelVideo.preload !== 'auto') {
            reelVideo.preload = 'auto';
            reelVideo.load();
          }
          var p = reelVideo.play();
          if (p && p.catch) p.catch(function () { /* Autoplay blockiert, Poster bleibt */ });
        } else {
          reelVideo.pause();
        }
      });
    }, { threshold: 0.25 });
    reelObserver.observe(reelVideo);
  }

  /* ---------- 4 · Showreel-Lightbox mit Ton ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxVideo = document.getElementById('lightboxVideo');
  var lastFocus = null;

  function openReel() {
    if (!lightbox || !lightboxVideo) return;
    lastFocus = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { lightbox.classList.add('in'); });
    if (lightboxVideo.preload !== 'auto') {
      lightboxVideo.preload = 'auto';
      lightboxVideo.load();
    }
    var p = lightboxVideo.play();
    if (p && p.catch) p.catch(function () {});
    var close = document.getElementById('lightboxClose');
    if (close) close.focus();
  }

  function closeReel() {
    if (!lightbox || !lightboxVideo) return;
    lightbox.classList.remove('in');
    lightboxVideo.pause();
    document.body.classList.remove('no-scroll');
    window.setTimeout(function () { lightbox.hidden = true; }, 280);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll('[data-reel-open]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); openReel(); });
  });
  var closeBtn = document.getElementById('lightboxClose');
  if (closeBtn) closeBtn.addEventListener('click', closeReel);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeReel();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) closeReel();
  });

  /* ---------- 4b · Videos, die laufen sobald sie im Bild sind ----------
     Fuer das Case-Video. Laedt erst bei Sichtbarkeit, pausiert beim
     Verlassen, damit im Hintergrund nichts dekodiert wird. */
  var inviewVideos = document.querySelectorAll('.js-inview-video');
  if (inviewVideos.length && !reduce && !saveData && 'IntersectionObserver' in window) {
    var vidObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.25 });
    inviewVideos.forEach(function (v) { vidObserver.observe(v); });
  }

  /* ---------- 5 · Projektkarten: Video laeuft, sobald die Karte im Bild ist ----------
     Das ist die Seite eines Motion Designers, also soll sich das Raster
     bewegen und nicht auf einen Hover warten. Das Video wird erst beim
     Sichtbarwerden erzeugt, wer nie hinscrollt laedt kein Byte. Ausserhalb
     des Blickfelds wird pausiert, damit nie mehr als die sichtbaren Clips
     gleichzeitig dekodiert werden. */
  var workCards = document.querySelectorAll('.work[data-video]');

  function setupWork(card) {
    var media = card.querySelector('.work-media');
    var src = card.getAttribute('data-video');
    var video = null;

    function build() {
      if (video || !media || reduce || saveData) return;
      video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('aria-hidden', 'true');
      video.setAttribute('tabindex', '-1');
      video.preload = 'auto';
      video.src = src;
      media.appendChild(video);
    }

    card._start = function () {
      build();
      if (!video) return;
      card.classList.add('is-playing');
      var p = video.play();
      if (p && p.catch) p.catch(function () { card.classList.remove('is-playing'); });
    };
    card._stop = function () {
      if (!video) return;
      card.classList.remove('is-playing');
      video.pause();
    };

    /* Hover bleibt als zusaetzlicher Ausloeser, damit die Karte auch dann
       laeuft, wenn sie beim Laden schon halb im Bild stand. */
    card.addEventListener('mouseenter', card._start);
    card.addEventListener('focusin', card._start);
  }

  workCards.forEach(setupWork);

  if (workCards.length && !reduce && !saveData && 'IntersectionObserver' in window) {
    var workObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var card = entry.target;
        if (entry.isIntersecting) card._start();
        else card._stop();
      });
    }, { threshold: 0.4 });
    workCards.forEach(function (c) { workObserver.observe(c); });
  }

  /* ---------- 6 · FAQ-Akkordeon ----------
     Die Antworten stehen vollstaendig im HTML, nur die Hoehe wird animiert.
     Nachgeladene Antworten waeren fuer KI-Suchen unsichtbar. */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    var panel = btn.parentElement.nextElementSibling;
    if (!panel) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.style.maxHeight = open ? '0px' : panel.scrollHeight + 'px';
    });
  });
  window.addEventListener('resize', function () {
    document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(function (btn) {
      var panel = btn.parentElement.nextElementSibling;
      if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
    });
  });

  /* ---------- 7 · Zahlen-Counter ---------- */
  var nums = document.querySelectorAll('.stat-num[data-count]');
  if (nums.length && !reduce && 'IntersectionObserver' in window) {
    var numObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var start = performance.now();
        var dur = 1100;
        (function tick(now) {
          var t = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        })(start);
        numObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { numObserver.observe(el); });
  }

  /* ---------- 8 · Zweistufiges Anfrageformular ----------
     Schritt 1 hat vier Felder. Jedes Feld darueber hinaus halbiert laut
     Recherche die Conversion, deshalb kommt der Rest erst nach dem Absenden. */
  var form = document.getElementById('reqForm');
  if (form) {
    var step1 = form.querySelector('[data-step="1"]');
    var step2 = form.querySelector('[data-step="2"]');
    var status = document.getElementById('formStatus');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        status.textContent = 'Bitte fülle Name, E-Mail, Budget und die Projektbeschreibung aus.';
        status.classList.add('is-error');
        var firstBad = form.querySelector(':invalid');
        if (firstBad && firstBad.focus) firstBad.focus();
        return;
      }

      status.classList.remove('is-error');
      status.textContent = '';

      /* ENTWURF: hier wird nichts verschickt. Live gehoert an diese Stelle
         der POST an Formspree oder einen eigenen Endpunkt. */
      step1.hidden = true;
      step2.hidden = false;
      step2.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });

    var step2Send = document.getElementById('step2Send');
    if (step2Send) {
      step2Send.addEventListener('click', function () {
        status.textContent = 'Danke, ich habe alles. Du hörst innerhalb von 24 Stunden von mir.';
        step2Send.disabled = true;
        step2Send.textContent = 'Angaben übermittelt';
      });
    }
  }
})();
