(function(){
  "use strict";

  /* Logos: Marquee + Logo-Wall aus einer Liste */
  var LOGOS = ["sparkasse-bielefeld","volksbank-hohenzollern-balingen","sparkasse-real-estate-bochum","vr-immobilien-wildeshauser-geest-gmbh","volksbank-stade-cuxhaven","meyerdierks-immobilien","sis-immobilien-thomas-hellweger","raiffeisen-immobilien-gmbh-waren","kreissparkasse-soltau","sparkasse-westmunsterland","sparkasse-mittelfranken-sud","volksbank-immobilien-gmbh","volksbank-immobilien-niederrhein","volksbank-niedersachsen-mitte","volksbank-rhein-erft-koln-eg","grafschafter-volksbank-eg","vr-genossenschaftsbank-unterallgau-eg","raiffeisenbank-altmuhl-jura-eg","raiffeisenbank-schwaben-mitte","vr-immobilien-volksbank-raiffeisenbank","vp-von-poll-immobilien","pflugfelder","baur-immobilien","gau-immobilien","hahn-keller","immobest","konigskinder-immobilien","konigzuhaus-immobilien-gmbh","adrimo-estate","bunz-und-co-real-estate","era-immobilien","fvb-immo-real-estate","immobilien-finanz-kanzlei","wilske","bocker","bechtle"];

  /* Basis-Pfad aus dem eigenen Script ableiten, damit die Datei auch aus
     Unterordnern (z. B. /leuchtrahmen-alternative/) korrekt auflöst. */
  var self = document.currentScript || document.querySelector('script[src$="app.js"]');
  var base = self ? self.src.replace(/assets\/app\.js.*$/, "") : "";

  function img(slug){
    var i = document.createElement("img");
    i.src = base + "assets/logos/esysync-referenz-" + slug + ".webp";
    i.alt = ""; i.loading = "lazy"; i.height = 30;
    return i;
  }
  var mqSet = LOGOS.slice(0, 18);
  ["mq1","mq2"].forEach(function(id){
    var row = document.getElementById(id);
    if(row) mqSet.forEach(function(s){ row.appendChild(img(s)); });
  });
  var wall = document.getElementById("logowall");
  if(wall) LOGOS.forEach(function(s){
    var d = document.createElement("div"); d.appendChild(img(s)); wall.appendChild(d);
  });

  /* Vorher / Nachher */
  var ba = document.getElementById("ba"), range = document.getElementById("baRange");
  if(ba && range){
    var set = function(){ ba.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", set);
    set();
  }

  /* Sticky CTA erst nach dem Hero, nicht über dem Formular */
  var sticky = document.getElementById("sticky"), demo = document.getElementById("demo");
  if(sticky && demo && "IntersectionObserver" in window){
    var onScreen = false;
    var toggle = function(){
      sticky.classList.toggle("is-on", window.scrollY > 620 && !onScreen);
    };
    new IntersectionObserver(function(e){ onScreen = e[0].isIntersecting; toggle(); },{threshold:0}).observe(demo);
    window.addEventListener("scroll", toggle, {passive:true});
    toggle();
  }

  /* Formular: Demo-Verhalten. Vor Go-Live an CRM/n8n anbinden. */
  var form = document.getElementById("demoForm");
  if(form) form.addEventListener("submit", function(ev){
    ev.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }
    form.classList.add("is-sent");
    form.scrollIntoView({block:"center", behavior:"smooth"});
  });
})();
