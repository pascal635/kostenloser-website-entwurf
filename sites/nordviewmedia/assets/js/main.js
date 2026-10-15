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

  /* ---------- Drohnen-Sequenzen (Alpha, Canvas, Ping-Pong 24 fps) ----------
     Jede Sequenz lädt erst, wenn ein Element mit data-seq in die Nähe kommt,
     und wird von allen Elementen geteilt, die dieselbe Sequenz zeigen. */
  var hero = $("#hero");
  var SEQ = {}, FRAMES = 48, pageLoaded = false;
  function seqDir(name){ return name === "hero" ? (window.innerWidth < 900 ? "hero-1000" : "hero-1400") : name; }
  $$(".seq[data-seq]").forEach(function(el){
    var name = el.getAttribute("data-seq"), cv = $(".seq__canvas", el);
    if(!cv) return;
    var s = SEQ[name] || (SEQ[name] = {name:name, imgs:[], state:0, idx:0, dir:1, users:[]});
    s.users.push({el:el, cv:cv, ctx:cv.getContext("2d"), near:false});
  });
  function seqLoad(s){
    if(s.state || reduce) return;
    s.state = 1;
    var dir = seqDir(s.name), done = 0, ok = true;
    for(var k = 0; k < FRAMES; k++){
      (function(k){
        var im = new Image(); im.decoding = "async";
        im.onload = function(){
          done++;
          if(k === 0){ s.users.forEach(function(u){ if(u.cv.width !== im.naturalWidth){ u.cv.width = im.naturalWidth; u.cv.height = im.naturalHeight; } }); }
          if(done === FRAMES && ok){ s.state = 2; s.users.forEach(function(u){ seqDraw(u, s.imgs[0]); u.el.classList.add("is-live"); }); }
        };
        im.onerror = function(){ ok = false; };
        im.src = "assets/img/drohne/" + dir + "/frame-" + String(k + 1).padStart(3, "0") + ".webp";
        s.imgs[k] = im;
      })(k);
    }
  }
  function seqDraw(u, im){ u.ctx.clearRect(0, 0, u.cv.width, u.cv.height); u.ctx.drawImage(im, 0, 0, u.cv.width, u.cv.height); }
  function seqWake(){
    pageLoaded = true;
    Object.keys(SEQ).forEach(function(n){ var s = SEQ[n]; if(s.users.some(function(u){ return u.near; })){ seqLoad(s); } });
  }
  if(!reduce && "IntersectionObserver" in window){
    var seqIO = new IntersectionObserver(function(es){
      es.forEach(function(e){
        var el = e.target, s = SEQ[el.getAttribute("data-seq")]; if(!s) return;
        s.users.forEach(function(u){ if(u.el === el){ u.near = e.isIntersecting; } });
        if(e.isIntersecting && pageLoaded){ seqLoad(s); }
      });
    }, {rootMargin:"400px 0px"});
    Object.keys(SEQ).forEach(function(n){ SEQ[n].users.forEach(function(u){ seqIO.observe(u.el); }); });
    var lastT = 0;
    var tick = function(t){
      if(t - lastT > 1000 / 24){
        lastT = t;
        Object.keys(SEQ).forEach(function(n){
          var s = SEQ[n]; if(s.state !== 2) return;
          var vis = s.users.filter(function(u){ return u.near && !u.el.closest(".panel:not(.on)"); });
          if(!vis.length) return;
          s.idx += s.dir;
          if(s.idx >= FRAMES - 1){ s.idx = FRAMES - 1; s.dir = -1; }
          if(s.idx <= 0){ s.idx = 0; s.dir = 1; }
          vis.forEach(function(u){ seqDraw(u, s.imgs[s.idx]); });
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.addEventListener("load", function(){
      if("requestIdleCallback" in window){ requestIdleCallback(seqWake, {timeout:1500}); } else { setTimeout(seqWake, 300); }
    });
  }

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
  /* Akzent-Wörter (span.ac) behalten ihre Farbe, Satzzeichen bleiben am Wort. */
  function splitWords(el){
    var text = el.textContent.replace(/\s+/g, " ").trim(), nodes = Array.prototype.slice.call(el.childNodes);
    el.textContent = "";
    var sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = text; el.appendChild(sr);
    var vis = document.createElement("span"); vis.setAttribute("aria-hidden","true"); el.appendChild(vis);
    var started = false;
    nodes.forEach(function(n){
      var ac = n.nodeType === 1 && n.classList.contains("ac");
      (n.textContent || "").split(/(\s+)/).forEach(function(chunk){
        if(!chunk) return;
        if(/^\s+$/.test(chunk)){ if(started){ vis.appendChild(document.createTextNode(" ")); } return; }
        var s = document.createElement("span"); s.className = ac ? "w ac" : "w"; s.textContent = chunk;
        vis.appendChild(s); started = true;
      });
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

  /* ---------- Pakete: Tabs + Scrollstrecke ----------
     Gepinnt (wenn der Viewer in den Bildschirm passt): Die Sektion bleibt stehen,
     Scrollen schaltet Basic, Pro, Premium durch, danach geht es weiter. */
  var tabs = $("#tabs"), pk = $("#pakete"), pkTrack = $("#pkTrack"), pkLine = $("#pkLine"), pkNum = $("#pkNum");
  var tbtn = tabs ? $$("[role=tab]", tabs) : [], pkCur = -1, pkPinned = false;
  function pkSelect(k, focus){
    if(k === pkCur && !focus) return;
    pkCur = k;
    tbtn.forEach(function(b, i){
      var on = i === k;
      b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1;
      var p = document.getElementById(b.getAttribute("aria-controls"));
      if(p){ p.classList.toggle("on", on); p.setAttribute("aria-hidden", String(!on)); }
    });
    tabs.style.setProperty("--i", k);
    if(pkNum){ pkNum.textContent = "0" + (k + 1); }
    if(focus){ tbtn[k].focus({preventScroll:true}); }
  }
  function pkTotal(){ return pkTrack.offsetHeight - window.innerHeight; }
  function pkGo(k, focus){
    if(pkPinned){
      var top = pkTrack.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({top: top + ((k + 0.5) / 3) * pkTotal(), behavior: reduce ? "auto" : "smooth"});
      pkSelect(k, focus);
    } else { pkSelect(k, focus); }
  }
  function pkLayout(){
    if(!pk) return;
    pk.classList.add("is-pinned");
    var nav = window.innerWidth <= 860 ? 80 : 96 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--zk")) || 1);
    var need = $(".pk__sticky > .wrap", pk).getBoundingClientRect().height + nav;
    pkPinned = !reduce && need <= window.innerHeight;
    pk.classList.toggle("is-pinned", pkPinned);
  }
  function pkUpdate(){
    if(!pkPinned) return;
    var r = pkTrack.getBoundingClientRect(), t = pkTotal();
    var p = clamp(-r.top / t, 0, 1);
    if(pkLine){ pkLine.style.transform = "scaleX(" + p.toFixed(3) + ")"; }
    pkSelect(Math.min(2, Math.floor(p * 3)));
  }
  if(tabs){
    tbtn.forEach(function(b, i){
      b.addEventListener("click", function(){ pkGo(i); });
      b.addEventListener("keydown", function(e){
        if(e.key === "ArrowRight"){ e.preventDefault(); pkGo((i + 1) % 3, true); }
        if(e.key === "ArrowLeft"){ e.preventDefault(); pkGo((i + 2) % 3, true); }
      });
    });
    pkLayout();
    pkSelect(pkPinned ? 0 : 1);
    window.addEventListener("resize", function(){ pkLayout(); pkUpdate(); });
    window.addEventListener("load", function(){ pkLayout(); pkUpdate(); });
  }
  /* Paket-Button wählt das Paket im Formular vor */
  $$("[data-paket]").forEach(function(a){
    a.addEventListener("click", function(){
      var v = a.getAttribute("data-paket"); var r = $('#leadForm input[name="paket"][value="' + v.charAt(0).toUpperCase() + v.slice(1) + '"]');
      if(r){ r.checked = true; }
    });
  });

  /* ---------- Hero-Video (Luftbild) + Reel in der Leistungs-Karte ---------- */
  var hv = $("#heroVideo"), hToggle = $("#heroToggle"), heroUserPaused = false, heroInView = true;
  function heroSetPaused(paused){
    hero.classList.toggle("is-paused", paused);
    hToggle.setAttribute("aria-pressed", String(paused));
    hToggle.setAttribute("aria-label", paused ? "Hintergrundvideo abspielen" : "Hintergrundvideo pausieren");
  }
  if(hv && hToggle){
    window.addEventListener("load", function(){
      var tall = window.innerWidth / window.innerHeight < 0.8;
      if(tall && hv.getAttribute("data-poster-tall")){ hv.poster = hv.getAttribute("data-poster-tall"); }
      var xl = !tall && window.innerWidth > 1700 && hv.getAttribute("data-xl");
      hv.src = hv.getAttribute(tall ? "data-tall" : (xl ? "data-xl" : "data-wide"));
      if(reduce){ heroUserPaused = true; heroSetPaused(true); return; }
      var pr = hv.play(); if(pr && pr.catch){ pr.catch(function(){ heroSetPaused(true); }); }
    });
    hToggle.addEventListener("click", function(){
      if(hv.paused){ heroUserPaused = false; if(!hv.getAttribute("src")){ hv.src = hv.getAttribute("data-wide"); } hv.play(); heroSetPaused(false); }
      else { heroUserPaused = true; hv.pause(); heroSetPaused(true); }
    });
    if("IntersectionObserver" in window){
      new IntersectionObserver(function(es){
        heroInView = es[0].isIntersecting;
        if(!heroInView){ hv.pause(); } else if(!heroUserPaused && hv.getAttribute("src")){ hv.play(); }
      }, {threshold:0.05}).observe(hero);
    }
  }
  if("IntersectionObserver" in window && !reduce){
    var vio = new IntersectionObserver(function(es){
      es.forEach(function(e){ var v = e.target; if(e.isIntersecting){ var pr = v.play(); if(pr && pr.catch){ pr.catch(function(){}); } } else { v.pause(); } });
    }, {threshold:0.25});
    $$("video[data-lazy-video]").forEach(function(v){ vio.observe(v); });
  }

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

  /* ---------- FAQ: immer nur eine Antwort offen ----------
     Moderne Browser regeln das über name="faq", hier die Absicherung für ältere. */
  var faqs = $$(".faq__item");
  faqs.forEach(function(d){
    d.addEventListener("toggle", function(){
      if(!d.open) return;
      faqs.forEach(function(o){ if(o !== d && o.open){ o.open = false; } });
    });
  });

  /* ---------- Beispiele: Parallaxe im Bildrahmen ---------- */
  var plx = $$("[data-parallax]");
  function plxUpdate(){
    if(reduce) return;
    var vh = window.innerHeight;
    plx.forEach(function(m){
      var r = m.parentNode.getBoundingClientRect();
      if(r.bottom < 0 || r.top > vh) return;
      var p = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
      m.style.transform = "translate3d(0," + (p * -3.2).toFixed(2) + "%,0) scale(1.08)";
    });
  }

  /* ---------- Lightbox ---------- */
  var lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
  var shots = $$("#beispiele .show").map(function(f){
    var im = $("img", f);
    var cap = $(".t-h3", f);
    return {src: (im.getAttribute("src") || ""), alt: im.alt, cap: (cap ? cap.textContent + ". " : "") + im.alt};
  });
  var lbIdx = 0, lbOpener = null;
  function lbShow(k){ lbIdx = (k + shots.length) % shots.length; var s = shots[lbIdx]; lbImg.src = s.src; lbImg.alt = s.alt; lbCap.textContent = s.cap; }
  if(lb && lb.showModal){
    $$("[data-lightbox]").forEach(function(b){
      b.addEventListener("click", function(){ lbOpener = b; lbShow(parseInt(b.getAttribute("data-lightbox"), 10)); lb.showModal(); });
    });
    $$("#beispiele .show__frame").forEach(function(fr){
      fr.addEventListener("click", function(e){ if(e.target.closest("button")) return; var b = $("[data-lightbox]", fr); if(b){ b.click(); } });
    });
    $(".lightbox__prev", lb).addEventListener("click", function(){ lbShow(lbIdx - 1); });
    $(".lightbox__next", lb).addEventListener("click", function(){ lbShow(lbIdx + 1); });
    $(".lightbox__close", lb).addEventListener("click", function(){ lb.close(); });
    lb.addEventListener("click", function(e){ if(e.target === lb){ lb.close(); } });
    lb.addEventListener("keydown", function(e){ if(e.key === "ArrowRight"){ lbShow(lbIdx + 1); } if(e.key === "ArrowLeft"){ lbShow(lbIdx - 1); } });
    lb.addEventListener("close", function(){ if(lbOpener){ lbOpener.focus(); } });
  } else { $$("[data-lightbox]").forEach(function(b){ b.hidden = true; }); }

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
  function onScroll(){ if(ticking) return; ticking = true; requestAnimationFrame(function(){ navUpdate(); heroUpdate(); rvUpdate(); tlUpdate(); plxUpdate(); pkUpdate(); ticking = false; }); }
  window.addEventListener("scroll", onScroll, {passive:true});
  window.addEventListener("resize", onScroll);
  onScroll();
})();
