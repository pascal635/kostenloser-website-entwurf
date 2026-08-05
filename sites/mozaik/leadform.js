/* Mehrstufiges Lead-Formular.
   Ohne JavaScript bleiben alle Schritte sichtbar und das Formular funktioniert
   als normales Formular. Erst hier wird daraus der Schritt-für-Schritt-Ablauf. */
(function(){
  var f = document.getElementById('angebot');
  if(!f) return;
  f.classList.add('lf-js');

  var schritte  = [].slice.call(f.querySelectorAll('.lf-schritt')),
      gesamt    = schritte.length,
      fortschr  = f.querySelector('[data-lf-fortschritt]'),
      fuellung  = f.querySelector('[data-lf-fuellung]'),
      jetztAus  = f.querySelector('[data-lf-jetzt]'),
      gesamtAus = f.querySelector('[data-lf-gesamt]'),
      zusammen  = f.querySelector('[data-lf-zusammenfassung]'),
      danke     = f.querySelector('[data-lf-danke]'),
      kopf      = f.querySelector('.lf-kopf'),
      jetzt     = 1,
      antworten = {};

  /* Die Beschriftung für die Zusammenfassung steht als data-bezeichnung am Schritt.
     So funktioniert dieselbe Datei auch auf Seiten mit anderen Fragen. */
  var beschriftung = {};
  schritte.forEach(function(s){
    if(s.dataset.bezeichnung){
      var k = s.querySelector('.lf-kachel');
      if(k) beschriftung[k.dataset.feld] = s.dataset.bezeichnung;
    }
  });

  fortschr.hidden = false;
  gesamtAus.textContent = gesamt;

  function zeige(n, fokus){
    jetzt = Math.min(Math.max(n,1), gesamt);
    schritte.forEach(function(s){
      s.classList.toggle('aktiv', +s.dataset.schritt === jetzt);
    });
    fuellung.style.width = (jetzt/gesamt*100) + '%';
    jetztAus.textContent = jetzt;
    if(jetzt === gesamt) zusammenfassen();
    if(fokus){
      var z = f.querySelector('.lf-schritt.aktiv .lf-kachel, .lf-schritt.aktiv input');
      if(z) z.focus({preventScroll:true});
    }
  }

  function zusammenfassen(){
    var teile = Object.keys(antworten).map(function(k){
      return '<b>' + (beschriftung[k] || k) + ':</b> ' + antworten[k];
    });
    if(teile.length){ zusammen.innerHTML = teile.join(' · '); zusammen.hidden = false; }
  }

  f.addEventListener('click', function(e){
    var k = e.target.closest('.lf-kachel');
    if(k){
      var feld = k.dataset.feld;
      antworten[feld] = k.dataset.wert;
      f.querySelector('[data-wert-' + feld + ']').value = k.dataset.wert;
      // Auswahl im aktuellen Schritt markieren
      k.closest('.lf-schritt').querySelectorAll('.lf-kachel').forEach(function(b){
        b.setAttribute('aria-pressed', b === k ? 'true' : 'false');
      });
      setTimeout(function(){ zeige(jetzt + 1, true); }, 160);
      return;
    }
    if(e.target.closest('[data-lf-zurueck]')) zeige(jetzt - 1, true);
  });

  f.addEventListener('submit', function(e){
    e.preventDefault();
    var name = f.querySelector('#lf-name'), kontakt = f.querySelector('#lf-kontakt');
    [name, kontakt].forEach(function(i){
      i.closest('.feld').classList.toggle('hat-fehler', !i.value.trim());
    });
    if(!name.value.trim() || !kontakt.value.trim()){
      (!name.value.trim() ? name : kontakt).focus();
      return;
    }
    /* Hier wird im Livebetrieb versendet. Im Entwurf nur die Bestätigung. */
    schritte.forEach(function(s){ s.classList.remove('aktiv'); });
    fortschr.hidden = true; kopf.hidden = true; danke.hidden = false;
    danke.setAttribute('role','status');
  });

  zeige(1, false);
})();
