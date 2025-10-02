// script.js
(function(){
  const yearEl = document.getElementById('year');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

  // Generar código QR para compartir la web (usa la librería QRCode del CDN)
  (function initQR(){
    const cvs = document.getElementById('qrCanvas');
    if(typeof QRCode === 'undefined' || !cvs) return;

    function sizeForViewport(){
      // Tamaño máximo: no salirse del banner (header)
      const header = document.querySelector('.site-header');
      const headerH = header ? header.clientHeight : 120;
      const maxByHeader = Math.max(96, Math.floor(headerH * 0.8)); // 80% de la altura del header

      // También limitamos por viewport para no romper en pantallas pequeñas
      const maxByViewport = 320; // límite suave adicional
      const byWidth = Math.floor(window.innerWidth * 0.22); // 22% del ancho del viewport
      const base = window.innerWidth >= 1280 ? 220 : window.innerWidth >= 1024 ? 200 : window.innerWidth >= 640 ? 150 : 110;

      const candidate = Math.max(96, Math.min(maxByViewport, Math.max(base, byWidth)));
      return Math.min(candidate, maxByHeader);
    }

    function render(){
      const sz = sizeForViewport();
      cvs.width = sz; cvs.height = sz;
      try{
        QRCode.toCanvas(cvs, window.location.href, { width: sz, margin: 1, color: { dark: '#083042', light: '#ffffff' } });
        cvs.title = 'Escanea este QR para abrir: ' + window.location.href;
      }catch(e){ /* noop */ }
    }

    // interacción: clic copia enlace
    cvs.style.cursor = 'pointer';
    cvs.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(window.location.href); }catch{} });

    // render inicial y en resize (con debounce)
    render();
    let t;
    window.addEventListener('resize', ()=>{ clearTimeout(t); t = setTimeout(render, 120); });
  })();

  // Simple search/filter across cards
  const search = document.getElementById('search');
  const cards = Array.from(document.querySelectorAll('.cards .card'));

  function normalize(str){
    return (str||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  }

  // Utilidad para habilitar galerías y cerrar otras al abrir una
  function resetAllGalleries(exceptGalId){
    const allGals = document.querySelectorAll('.gallery');
    const allBtns = document.querySelectorAll('button[id^="btn-galeria-"]');
    allGals.forEach(g=>{
      if(!exceptGalId || g.id !== exceptGalId){ g.setAttribute('hidden',''); }
    });
    allBtns.forEach(b=>{
      // si el botón controla la galería exceptuada y ésta quedará abierta, se actualiza más abajo
      b.setAttribute('aria-expanded','false');
      b.textContent = 'Ver imágenes';
    });
  }

  // Utilidad para habilitar galerías con botón y cerrar otras al abrir una
  function enableGallery(btnId, galId, files, altPrefix){
    const btn = document.getElementById(btnId);
    const gal = document.getElementById(galId);
    if(!(btn && gal)) return;
    let loaded = false;
    function build(){
      if(loaded) return;
      const frag = document.createDocumentFragment();
      files.forEach((src,i)=>{
        const fig = document.createElement('figure');
        const img = document.createElement('img');
        img.src = src;
        img.alt = `${altPrefix} imagen ${i+1}`;
        const cap = document.createElement('figcaption');
        cap.textContent = 'Imagen ' + (i+1);
        fig.appendChild(img);
        fig.appendChild(cap);
        frag.appendChild(fig);
      });
      gal.appendChild(frag);
      loaded = true;
    }
    btn.addEventListener('click', ()=>{
      const willOpen = gal.hasAttribute('hidden');
      if(willOpen){
        // cerrar todas las demás y abrir esta
        resetAllGalleries(galId);
        if(!loaded) build();
        gal.removeAttribute('hidden');
        btn.setAttribute('aria-expanded','true');
        btn.textContent = 'Ocultar imágenes';
        // Asegurar visibilidad al abrir
        try{ gal.scrollIntoView({ behavior:'smooth', block:'start' }); }catch{}
      } else {
        // cerrar todo (incluida esta)
        resetAllGalleries();
      }
    });
    // Cerrar con Escape cuando tiene foco alguno de sus hijos
    gal.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape'){
        gal.setAttribute('hidden','');
        btn.setAttribute('aria-expanded','false');
        btn.textContent = 'Ver imágenes';
        btn.focus();
      }
    });
  }

  // Activar galerías
  enableGallery('btn-galeria-est','galeria-est',[
    'img/Imagen2.png','img/Imagen4.png','img/Imagen5.png','img/Imagen6.png','img/Imagen7.png','img/Imagen8.png','img/Imagen9.png','img/Imagen10.png','img/Imagen11.png'
  ], 'Estiramientos');

  enableGallery('btn-galeria-gc','galeria-gc',[
    'img/Imagen12.png','img/Imagen13.png','img/Imagen14.png','img/Imagen15.png','img/Imagen16.png','img/Imagen17.png','img/Imagen18.png','img/Imagen19.png','img/Imagen20.png','img/Imagen21.png','img/Imagen22.png','img/Imagen23.png'
  ], 'Gimnasia cerebral');

  enableGallery('btn-galeria-dme','galeria-dme',[
    'img/Imagen24.jpg','img/Imagen25.png','img/Imagen26.png'
  ], 'Prevención DME');

  // Área de trabajo - galerías por sección
  enableGallery('btn-galeria-mouse','galeria-mouse',[
    'img/Imagen27.jpg','img/Imagen28.jpg','img/Imagen31.png'
  ], 'Manejo del mouse');

  enableGallery('btn-galeria-higiene','galeria-higiene',[
    'img/Imagen32.png','img/Imagen33.png','img/Imagen34.png'
  ], 'Higiene postural');

  enableGallery('btn-galeria-organizacion','galeria-organizacion',[
    'img/Imagen35.png','img/Imagen36.png','img/Imagen37.png','img/Imagen38.png','img/Imagen39.png','img/Imagen40.png'
  ], 'Organización del puesto de trabajo');

  function matches(card, q){
    if(!q) return true;
    const haystack = normalize(card.textContent + ' ' + (card.getAttribute('data-tags')||''));
    return haystack.includes(q);
  }

  function applyFilter(q){
    let visible = 0;
    cards.forEach(c=>{
      const ok = matches(c, q);
      c.style.display = ok ? '' : 'none';
      if(ok) visible++;
    });
    document.querySelector('.cards').setAttribute('aria-busy','false');
    document.querySelector('.cards').dataset.visible = visible;
  }

  if(search){
    let t;
    search.addEventListener('input', (e)=>{
      const q = normalize(e.target.value.trim());
      document.querySelector('.cards').setAttribute('aria-busy','true');
      clearTimeout(t);
      t = setTimeout(()=>applyFilter(q), 120);
    });
  }

  // Open external links safely in new tab already via HTML; ensure noopener for any dynamic links if added later
  // Galería de Estiramientos
  const btnGal = document.getElementById('btn-galeria-est');
  const gal = document.getElementById('galeria-est');
  if(btnGal && gal){
    const files = [
      'img/Imagen2.png',
      'img/Imagen4.png',
      'img/Imagen5.png',
      'img/Imagen6.png',
      'img/Imagen7.png',
      'img/Imagen8.png',
      'img/Imagen9.png',
      'img/Imagen10.png',
      'img/Imagen11.png'
    ];
    let loaded = false;
    function build(){
      if(loaded) return;
      const frag = document.createDocumentFragment();
      files.forEach((src,i)=>{
        const fig = document.createElement('figure');
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Estiramientos imagen ' + (i+1);
        const cap = document.createElement('figcaption');
        cap.textContent = 'Imagen ' + (i+1);
        fig.appendChild(img);
        fig.appendChild(cap);
        frag.appendChild(fig);
      });
      gal.appendChild(frag);
      loaded = true;
    }
    btnGal.addEventListener('click', ()=>{
      const willOpen = gal.hasAttribute('hidden');
      if(willOpen) build();
      gal.toggleAttribute('hidden');
      btnGal.setAttribute('aria-expanded', String(willOpen));
      btnGal.textContent = willOpen ? 'Ocultar imágenes' : 'Ver imágenes';
    });
  }
})();
