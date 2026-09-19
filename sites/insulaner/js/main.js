(function(){
  var head=document.querySelector('.site-head');
  function onScroll(){ if(window.scrollY>40){head.classList.add('scrolled')}else{head.classList.remove('scrolled')} }
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});

  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  }else{document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in')})}

  // Zimmerwunsch aus Kacheln/Cards in das Formular übernehmen
  document.querySelectorAll('[data-room]').forEach(function(a){
    a.addEventListener('click',function(){
      var sel=document.getElementById('f-zimmer'); if(!sel) return;
      var v=a.getAttribute('data-room'); for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===v){sel.selectedIndex=i} }
      var msg=document.getElementById('f-msg'); var m=a.getAttribute('data-msg'); if(msg&&m&&!msg.value){msg.value=m}
    });
  });

  // Formular: im Entwurf nur Demo. Beim Live-Gang Action auf Mail-Endpoint setzen.
  var form=document.getElementById('anfrage');
  if(form){form.addEventListener('submit',function(e){e.preventDefault(); if(!form.checkValidity()){form.reportValidity();return} form.classList.add('sent'); form.querySelector('button[type=submit]').setAttribute('disabled','disabled');});}
})();
