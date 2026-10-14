/* Nordview Media · Startseiten-Entwurf
   Nur transform/opacity werden animiert. Ohne JavaScript bleibt alles lesbar. */
(function(){
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function(s,c){return (c||document).querySelector(s)};
  var $$ = function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var clamp = function(v,a,b){return Math.max(a,Math.min(b,v))};
  document.documentElement.classList.add("js");

  /* ---------- Vorhang-Footer ---------- */
  var page = $(".page"), footer = $("#footer");
  function setFooter(){ if(page && footer){ page.style.setProperty("--footer-h", footer.offsetHeight + "px"); } }
  setFooter();
  window.addEventListener("resize", setFooter);
  window.addEventListener("load", setFooter);

  /* ---------- Navigation ---------- */
  var nav = $("#nav");
  var themed = $$("[data-nav-theme]");
  var links = $$(".nav__links .nav__link");
  var targets = links.map(function(a){ return $(a.getAttribute("href")); });
  function navUpdate(){
    var y = 40, theme = "light", i;
    for(i = themed.length - 1; i >= 0; i--){
      if(themed[i].hidden) continue;
      var r = themed[i].getBoundingClientRect();
      if(r.top <= y && r.bottom > y){ theme = themed[i].getAttribute("data-nav-theme"); break; }
    }
    if(nav.getAttribute("data-theme") !== theme){ nav.setAttribute("data-theme", theme); }
    var cur = -1, vh = window.innerHeight;
    targets.forEach(function(s, k){ if(s && !s.hidden){ var r = s.getBoundingClientRect(); if(r.top <= vh * 0.4 && r.bottom > vh * 0.2){ cur = k; } } });
    links.forEach(function(a, k){ if(k === cur){ a.setAttribute("aria-current","true"); } else { a.removeAttribute("aria-current"); } });
  }
  var burger = $(".nav__burger"), sheet = $("#sheet");
  function closeSheet(){ burger.setAttribute("aria-expanded","false"); burger.setAttribute("aria-label","Menü öffnen"); sheet.classList.remove("is-open"); }
  if(burger && sheet){
    burger.addEventListener("click", function(){
      var open = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      sheet.classList.toggle("is-open", open);
    });
    $$("a", sheet).forEach(function(a){ a.addEventListener("click", closeSheet); });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape"){ closeSheet(); } });
  }

  /* ---------- Hero: Drohnen-Sequenz ---------- */
  var canvas = $("#droneCanvas"), stage = $("#heroStage"), hero = $("#hero");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var imgs = [], playing = false, heroVisible = true, last = 0, idx = 0, dir = 1;
  function draw(i){ if(!ctx || !imgs[i]) return; ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(imgs[i],0,0,canvas.width,canvas.height); }
  function loop(t){
    if(heroVisible && t - last > 1000/24){
      last = t; idx += dir;
      if(idx >= imgs.length - 1){ idx = imgs.length - 1; dir = -1; }
      if(idx <= 0){ idx = 0; dir = 1; }
      draw(idx);
    }
    requestAnimationFrame(loop);
  }
  function startSequence(){
    if(!canvas || reduce) return;
    var dirName = window.innerWidth < 900 ? "hero-1000" : "hero-1400";
    var n = 48, loaded = 0, ok = true;
    for(var k = 0; k < n; k++){
      (function(k){
        var im = new Image();
        im.decoding = "async";
        im.onload = function(){
          loaded++;
          if(loaded === n && ok){ draw(0); stage.classList.add("is-live"); playing = true; requestAnimationFrame(loop); }
        };
        im.onerror = function(){ ok = false; };
        im.src = "assets/img/drohne/" + dirName + "/frame-" + String(k + 1).padStart(3, "0") + ".webp";
        imgs[k] = im;
      })(k);
    }
    if("IntersectionObserver" in window){
      new IntersectionObserver(function(es){ heroVisible = es[0].isIntersecting; }, {threshold:0}).observe(hero);
    }
  }
  window.addEventListener("load", function(){
    if("requestIdleCallback" in window){ requestIdleCallback(startSequence, {timeout:1500}); } else { setTimeout(startSequence, 300); }
  });

  /* ---------- Hero: Scroll-Kopplung ---------- */
  var mark = $("#heroMark"), stageInner = $("#heroStageInner"), spots = $("#heroSpots"), rail = $("#heroRail");
  function heroUpdate(){
    if(!hero) return;
    var r = hero.getBoundingClientRect();
    if(r.bottom < 0 || r.top > window.innerHeight) return;
    var p = clamp(-r.top / r.height, 0, 1);
    if(rail){ rail.style.transform = "scaleY(" + (0.18 + clamp((window.innerHeight - r.top) / (r.height + window.innerHeight), 0, 1) * 0.82).toFixed(3) + ")"; }
    if(reduce || window.innerWidth <= 860) return;
    if(mark){ mark.style.transform = "translate3d(0," + (p * 90).toFixed(1) + "px,0)"; }
    if(stageInner){ stageInner.style.transform = "translate3d(0," + (-p * 150).toFixed(1) + "px,0) scale(" + (1 - p * 0.1).toFixed(3) + ")"; }
    if(spots){ spots.style.opacity = clamp(1 - p * 2.6, 0, 1).toFixed(2); }
  }

  /* ---------- Text-Reveal wortweise ---------- */
  function splitWords(el){
    var text = el.textContent.trim(), words = text.split(/\s+/);
    el.textContent = "";
    var sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = text; el.appendChild(sr);
    var vis = document.createElement("span"); vis.setAttribute("aria-hidden","true"); el.appendChild(vis);
    words.forEach(function(w, i){
      var s = document.createElement("span"); s.className = "w"; s.textContent = w;
      vis.appendChild(s); if(i < words.length - 1){ vis.appendChild(document.createTextNode(" ")); }
    });
    return $$(".w", vis);
  }
  var rvs = $$("[data-rv]").map(function(el){ return {el:el, w:splitWords(el)}; });
  function rvUpdate(){
    var vh = window.innerHeight;
    rvs.forEach(function(it){
      var r = it.el.getBoundingClientRect();
      if(r.bottom < -vh || r.top > vh * 1.5) return;
      var p = reduce ? 1 : clamp((vh * 0.9 - r.top) / (vh * 0.55), 0, 1);
      var n = Math.round(p * it.w.length);
      it.w.forEach(function(s,i){ s.classList.toggle("on", i < n); });
    });
  }

  /* ---------- Timeline ---------- */
  var tl = $("#timeline"), tlLine = tl ? $(".tl__line i", tl) : null, steps = tl ? $$(".tl__step", tl) : [];
  function tlUpdate(){
    if(!tl) return;
    var vh = window.innerHeight, r = tl.getBoundingClientRect();
    if(window.innerWidth <= 1100){
      steps.forEach(function(s){ if(s.getBoundingClientRect().top < vh * 0.88){ s.classList.add("on"); } });
      return;
    }
    var p = reduce ? 1 : clamp((vh * 0.82 - r.top) / (vh * 0.5), 0, 1);
    if(tlLine){ tlLine.style.transform = "scaleX(" + p.toFixed(3) + ")"; }
    steps.forEach(function(s, i){ s.classList.toggle("on", p >= (i + 0.5) / steps.length - 0.02); });
  }

  /* ---------- Pakete (Tabs) ---------- */
  var tabs = $("#tabs");
  if(tabs){
    var tbtn = $$("[role=tab]", tabs);
    var select = function(k, focus){
      tbtn.forEach(function(b, i){
        var on = i === k;
        b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1;
        var p = document.getElementById(b.getAttribute("aria-controls"));
        if(p){ p.classList.toggle("on", on); p.setAttribute("aria-hidden", String(!on)); }
      });
      tabs.style.setProperty("--i", k);
      if(focus){ tbtn[k].focus(); }
    };
    tbtn.forEach(function(b, i){
      b.addEventListener("click", function(){ select(i); });
      b.addEventListener("keydown", function(e){
        if(e.key === "ArrowRight"){ e.preventDefault(); select((i + 1) % tbtn.length, true); }
        if(e.key === "ArrowLeft"){ e.preventDefault(); select((i - 1 + tbtn.length) % tbtn.length, true); }
      });
    });
    select(1);
  }
  /* Paket-Button wählt das Paket im Formular vor */
  $$("[data-paket]").forEach(function(a){
    a.addEventListener("click", function(){
      var v = a.getAttribute("data-paket"); var r = $('#leadForm input[name="paket"][value="' + v.charAt(0).toUpperCase() + v.slice(1) + '"]');
      if(r){ r.checked = true; }
    });
  });

  /* ---------- Einflug + Zähler ---------- */
  function countUp(el){
    var to = parseFloat(el.getAttribute("data-count")); if(reduce){ el.textContent = to; return; }
    var t0 = null, dur = 1300;
    var step = function(t){ if(!t0) t0 = t; var k = clamp((t - t0) / dur, 0, 1); var e = 1 - Math.pow(2, -10 * k); el.textContent = Math.round(to * (k === 1 ? 1 : e)); if(k < 1) requestAnimationFrame(step); };
    el.textContent = "0"; requestAnimationFrame(step);
  }
  if("IntersectionObserver" in window && !reduce){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var el = e.target;
        if(el.hasAttribute("data-count")){ countUp(el); }
        else { var sib = $$(".fadeup", el.parentNode), d = Math.max(0, sib.indexOf(el)) * 120; setTimeout(function(){ el.classList.add("in"); }, d); }
        io.unobserve(el);
      });
    }, {threshold:0.2, rootMargin:"0px 0px -8% 0px"});
    $$(".fadeup").forEach(function(el){ io.observe(el); });
    $$("[data-count]").forEach(function(el){ io.observe(el); });
  } else { $$(".fadeup").forEach(function(el){ el.classList.add("in"); }); }

  /* ---------- Beispiele: ohne Kundenfotos ausblenden ----------
     Prüft die Bilder vorab (unabhängig von lazy loading). Fehlen alle, verschwindet die Sektion. */
  (function(){
    var sec = $("#beispiele"); if(!sec) return;
    var pics = $$(".gallery img", sec);
    var checks = pics.map(function(im){
      return new Promise(function(res){
        var probe = new Image();
        probe.onload = function(){ res(true); };
        probe.onerror = function(){ res(false); };
        probe.src = im.getAttribute("src");
      }).then(function(ok){ if(!ok){ im.closest(".photo").classList.add("photo--ph"); im.remove(); } return ok; });
    });
    Promise.all(checks).then(function(r){
      if(r.indexOf(true) === -1){ sec.hidden = true; setFooter(); onScroll(); }
    });
  })();

  /* ---------- Anfrage: öffnet vorausgefüllte E-Mail ----------
     Für den Livegang an den Formular-Dienst des Kunden anbinden (data-mailto ersetzen). */
  var form = $("#leadForm"), note = $("#formNote");
  if(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var bad = null;
      ["name","email"].forEach(function(n){
        var f = form.elements[n], ok = f.value.trim() !== "" && (n !== "email" || /.+@.+\..+/.test(f.value));
        f.setAttribute("aria-invalid", ok ? "false" : "true"); if(!ok && !bad){ bad = f; }
      });
      var c = form.elements.dsgvo;
      if(!c.checked && !bad){ bad = c; }
      if(bad){ note.textContent = bad === c ? "Bitte bestätigen Sie den Hinweis zum Datenschutz." : "Bitte Name und eine gültige E-Mail-Adresse angeben."; note.classList.add("on"); bad.focus(); return; }
      var v = function(n){ var el = form.elements[n]; return el ? (el.value || "").trim() : ""; };
      var paket = (form.querySelector('input[name="paket"]:checked') || {}).value || "";
      var body = [
        "Name: " + v("name"), "E-Mail: " + v("email"), "Telefon: " + v("tel"),
        "Objekt: " + v("ort"), "Objektart: " + v("art"), "Wunschtermin: " + v("termin"),
        "Paket: " + paket, "", v("msg")
      ].join("\n");
      var to = form.getAttribute("data-mailto");
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent("Angebotsanfrage Drohnenaufnahmen: " + (v("ort") || v("name"))) + "&body=" + encodeURIComponent(body);
      note.textContent = "Danke. Ihr E-Mail-Programm öffnet sich mit der fertigen Anfrage. Sie bekommen innerhalb von 24 Stunden Ihr Angebot.";
      note.classList.add("on");
    });
    $$(".input", form).forEach(function(f){ f.addEventListener("input", function(){ if(f.getAttribute("aria-invalid") === "true"){ f.setAttribute("aria-invalid","false"); } }); });
  }

  /* ---------- Scroll-Schleife ---------- */
  var ticking = false;
  function onScroll(){ if(ticking) return; ticking = true; requestAnimationFrame(function(){ navUpdate(); heroUpdate(); rvUpdate(); tlUpdate(); ticking = false; }); }
  window.addEventListener("scroll", onScroll, {passive:true});
  window.addEventListener("resize", onScroll);
  onScroll();
})();
