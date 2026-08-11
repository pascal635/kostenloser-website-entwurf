/* CS International · Startseiten-Entwurf
   Drei Dinge, keine Bibliothek. Nichts hier ist fuer den Inhalt notwendig:
   ohne JavaScript ist die Seite vollstaendig lesbar und bedienbar. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1 · Kopfzeile verdichtet sich beim Scrollen */
  var nav = document.querySelector('.nav');
  if (nav) {
    var stick = function () { nav.classList.toggle('is-stuck', window.scrollY > 24); };
    stick();
    addEventListener('scroll', stick, { passive: true });
  }

  /* 2 · Spotlight folgt dem Zeiger im Panel. Rein dekorativ. */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.panel--hover').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* 3 · Fortschrittsbalken. Fallback nur, wenn animation-timeline fehlt. */
  var pb = document.querySelector('.progress');
  if (pb && !(window.CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()'))) {
    addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      pb.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
    }, { passive: true });
  }

  /* FAQ: exklusives Akkordeon, nur eine Frage gleichzeitig offen.
     Geloest ueber das name-Attribut auf <details>, das ist native HTML-
     Funktionalitaet und braucht kein JavaScript. Der Block hier ist nur
     der Ersatz fuer aeltere Browser, die name auf details noch nicht
     kennen. Wo es unterstuetzt wird, laeuft nichts davon. */
  if (!('name' in document.createElement('details'))) {
    var groups = {};
    document.querySelectorAll('details[name]').forEach(function (d) {
      var g = d.getAttribute('name');
      (groups[g] = groups[g] || []).push(d);
    });
    Object.keys(groups).forEach(function (g) {
      groups[g].forEach(function (d) {
        d.addEventListener('toggle', function () {
          if (!d.open) return;
          groups[g].forEach(function (o) { if (o !== d) o.open = false; });
        });
      });
    });
  }

  /* YouTube: Klick-zum-Laden. Vor dem Klick geht kein Request an Google.
     Erst der Klick tauscht die Vorschau gegen den Player, und zwar von
     youtube-nocookie.com. Ohne JavaScript bleibt der Link zu YouTube
     bestehen, die Seite verliert also keine Funktion. */
  document.querySelectorAll('.yt[data-yt]').forEach(function (fig) {
    var facade = fig.querySelector('.yt__frame');
    var id = fig.getAttribute('data-yt');
    if (!facade || !id || !/^[\w-]{11}$/.test(id)) return;
    facade.addEventListener('click', function (e) {
      e.preventDefault();
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id +
              '?autoplay=1&rel=0&modestbranding=1';
      f.title = facade.getAttribute('aria-label') || 'Video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.allowFullscreen = true;
      f.setAttribute('loading', 'lazy');
      facade.replaceWith(f);
      f.focus({ preventScroll: true });
    });
  });

  /* Videos: bei reduzierter Bewegung anhalten, sonst erst abspielen,
     wenn sie im Blickfeld sind. Spart Akku und Bandbreite. */
  var vids = document.querySelectorAll('video[data-loop]');
  if (reduce) {
    vids.forEach(function (v) { v.pause(); v.removeAttribute('autoplay'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.play().catch(function () {}); }
        else { en.target.pause(); }
      });
    }, { rootMargin: '200px' });
    vids.forEach(function (v) { io.observe(v); });
  }
})();
