// ---------- Utilidades ----------
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

// Datos (absolutos)
const dicts = { es:'/data/i18n.es.json', ca:'/data/i18n.ca.json', en:'/data/i18n.en.json' };
const servicesData = { es:'/data/services.es.json', ca:'/data/services.ca.json', en:'/data/services.en.json' };
const portfolioData = { es:'/data/projects.es.json', ca:'/data/projects.ca.json', en:'/data/projects.en.json' };

// Idioma
let LANG = localStorage.getItem('lang') || 'es';
function setLang(lang){ LANG=lang; localStorage.setItem('lang', lang); document.documentElement.lang = lang; }

// Fetch JSON
async function loadJSON(path){
  const res = await fetch(path, {cache:'no-store'});
  if(!res.ok) throw new Error('Failed to load: '+path);
  return res.json();
}

// i18n
function applyI18n(dict){
  $$('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    const val = key.split('.').reduce((a,k)=>a&&a[k], dict);
    if(typeof val==='string') el.textContent = val;
  });
}

// Rutas assets
function assetUrl(p){
  if(!p) return '';
  if(p.startsWith('http://')||p.startsWith('https://')) return p;
  if(p.startsWith('/')) return p;
  return '/'+p.replace(/^\.?\//,'');
}

// Normalizar categorías
function normalizeCat(txt){
  return (txt||'').toString().trim().toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,' ');
}

// ---------- Mega menú Servicios ----------
async function buildMegaMenu(){
  const mega = $('#mega-services'); if(!mega) return;
  const items = await loadJSON(servicesData[LANG]);

  const groups = { 'digitalizacion': [], 'transformacion digital': [], 'experiencias xr': [] };
  items.forEach(s=>{
    const cat = normalizeCat(s.category);
    if(cat.includes('digital')) groups['digitalizacion'].push(s);
    else if(cat.includes('transform')) groups['transformacion digital'].push(s);
    else if(cat.includes('xr')) groups['experiencias xr'].push(s);
  });

  const colMap = [
    {key:'digitalizacion',        title:'Digitalización'},
    {key:'transformacion digital',title:'Transformación digital'},
    {key:'experiencias xr',       title:'Experiencias XR'}
  ];

  const grid = $('.mega-grid', mega);
  grid.innerHTML = '';
  colMap.forEach(({key,title})=>{
    const col = document.createElement('div');
    col.className='mega-col';
    col.innerHTML = `<h4>${title}</h4><div class="mega-list"></div>`;
    const list = $('.mega-list', col);

    groups[key].forEach(s=>{
      const it = document.createElement('div');
      it.className='mega-item';
      it.textContent = s.title;
      list.appendChild(it);
    });

    // Onda expansiva
    list.addEventListener('mouseover', e=>{
      const t = e.target.closest('.mega-item'); if(!t) return;
      list.classList.add('hovering');
      const itemsEls = $$('.mega-item', list);
      const iHover = itemsEls.indexOf(t);
      itemsEls.forEach((el, idx)=>{
        el.classList.toggle('is-hover', el===t);
        if(el===t){ el.style.setProperty('--shift','0px'); return; }
        const dist = idx - iHover;
        const dir = Math.sign(dist);
        const magnitude = Math.min(Math.abs(dist), 4);
        const px = 6 + magnitude*4;
        el.style.setProperty('--shift', `${dir*px}px`);
      });
    });
    list.addEventListener('mouseleave', ()=>{
      list.classList.remove('hovering');
      $$('.mega-item', list).forEach(el=>{
        el.classList.remove('is-hover'); el.style.removeProperty('--shift');
      });
    });

    grid.appendChild(col);
  });
}

// ---------- Servicios (página) ----------
function renderServices(items){
  const grid = $('#servicesGrid'); if(!grid) return;
  grid.innerHTML='';
  items.forEach(s=>{
    const el=document.createElement('article');
    el.className='card service-card';
    el.dataset.category = normalizeCat(s.category);
    el.innerHTML = `<h3>${s.title}</h3><p>${s.description}</p><p class="muted" style="margin-top:8px">${s.category||''}</p>`;
    grid.appendChild(el);
  });
}
function initServiceFilter(items){
  const select=$('#serviceFilter'); const grid=$('#servicesGrid'); if(!select||!grid) return;
  select.innerHTML='';
  const optAll=document.createElement('option'); optAll.value='all'; optAll.textContent='Todas'; select.appendChild(optAll);
  const map=new Map();
  items.forEach(i=>{ const v=normalizeCat(i.category); const label=(i.category||'').toString().trim(); if(v) map.set(v, label||v); });
  [...map.entries()].sort((a,b)=>a[1].localeCompare(b[1])).forEach(([v,l])=>{ const o=document.createElement('option'); o.value=v; o.textContent=l; select.appendChild(o); });
  function apply(){ const val=select.value; $$('.service-card',grid).forEach(card=>{ const match=(val==='all')||(card.dataset.category===val); card.classList.toggle('is-hidden', !match); }); }
  select.onchange=apply; apply();
}

// ---------- Portfolio (todos + alterno) ----------
function renderPortfolioListAll(items){
  const list=$('#portfolioList'); if(!list) return;
  list.innerHTML='';
  items.forEach((p,idx)=>{
    const row=document.createElement('div'); row.className='project'+(idx%2===1?' even':'');
    const media=document.createElement('div'); media.className='video-container';
    if(p.video){
      const v=document.createElement('video');
      if(p.poster) v.setAttribute('poster', assetUrl(p.poster));
      v.controls=true; v.innerHTML=`<source src="${assetUrl(p.video)}" type="video/mp4">`;
      v.addEventListener('loadeddata',()=>v.classList.add('loaded')); media.appendChild(v);
    }else{
      const img=document.createElement('img'); img.className='thumb'; img.alt=p.title; img.src=assetUrl(p.thumb||''); img.addEventListener('load',()=>img.classList.add('loaded')); media.appendChild(img);
    }
    const info=document.createElement('div'); info.className='project-info';
    info.innerHTML = `<h2>${p.title}</h2><p class="muted">${p.subtitle||''}</p><div class="tags">${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div><p><a class="more" href="/projects/${p.slug}.html">Ver detalles</a></p>`;
    row.appendChild(media); row.appendChild(info); list.appendChild(row);
  });
}

// ---------- Carrusel detalle ----------
function renderCarousel(root, media=[], legacyThumb, legacyVideo, legacyPoster){
  root.innerHTML=''; const slides=[];
  if(legacyVideo) media=[{type:'video',src:legacyVideo,poster:legacyPoster},...media];
  else if(legacyThumb) media=[{type:'image',src:legacyThumb},...media];
  const track=document.createElement('div'); track.className='carousel-track';
  media.forEach(m=>{
    const slide=document.createElement('div'); slide.className='carousel-slide';
    if(m.type==='video'&&m.src){
      const v=document.createElement('video'); if(m.poster) v.setAttribute('poster', assetUrl(m.poster));
      v.controls=true; v.style='width:100%;height:auto;display:block;max-height:70vh;object-fit:contain';
      v.innerHTML=`<source src="${assetUrl(m.src)}" type="video/mp4">`; v.addEventListener('loadeddata',()=>v.classList.add('loaded')); slide.appendChild(v);
    }else if(m.type==='image'&&m.src){
      const img=document.createElement('img'); img.src=assetUrl(m.src); img.alt=m.alt||'';
      img.style='width:100%;height:auto;display:block;max-height:70vh;object-fit:contain'; img.addEventListener('load',()=>img.classList.add('loaded')); slide.appendChild(img);
    }
    track.appendChild(slide); slides.push(slide);
  });
  const nav=document.createElement('div'); nav.className='carousel-nav';
  const prev=document.createElement('button'); prev.className='carousel-btn'; prev.textContent='‹';
  const next=document.createElement('button'); next.className='carousel-btn'; next.textContent='›';
  nav.append(prev,next);
  let idx=0; function update(){ track.style.transform=`translateX(-${idx*100}%)`; }
  prev.onclick=()=>{ idx=(idx-1+slides.length)%slides.length; update(); };
  next.onclick=()=>{ idx=(idx+1)%slides.length; update(); };
  root.appendChild(track); if(slides.length>1) root.appendChild(nav); update();
}

// ---------- Carrusel Home ----------
function initHeroCarousel() {
    const root = $('#heroCarousel'); if (!root) return;
    const track = $('.hero-track', root);
    const dotsWrap = $('.hero-dots', root) || (() => {
        const d = document.createElement('div'); d.className = 'hero-dots'; root.appendChild(d); return d;
    })();
    const slides = $$('.hero-slide', track);
    let idx = 0, timer = null;
    const isCard = root.classList.contains('is-cardstack');

    function paint() {
        const n = slides.length;
        slides.forEach((sl, i) => {
            let pos = 'off';
            if (i === idx) pos = 'current';
            else if (i === (idx + 1) % n) pos = 'next';
            else if (i === (idx + 2) % n) pos = 'tail';
            sl.setAttribute('data-pos', pos);
        });
        $$('.hero-dot', dotsWrap).forEach((d, k) => d.classList.toggle('active', k === idx));
    }

    function go(i) {
        const n = slides.length;
        idx = (i + n) % n;                 // 2→1, 1→última, 3→medio
        if (isCard) paint();
        else track.style.transform = `translateX(-${idx * 100}%)`;
    }

    function start() { stop(); timer = setInterval(() => go(idx + 1), 5000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    const isInteractive = el => !!el.closest && el.closest('a,button,[role="button"],input,textarea,select,label');

    // Dots
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.className = 'hero-dot'; b.type = 'button';
        b.onclick = () => { go(i); start(); };
        dotsWrap.appendChild(b);
    });

    // Gestos drag/swipe (una sola vez)
    if (isCard) {
        let down = false, sx = 0, dx = 0, drag = false;

        const onDown = e => {
            if (isInteractive(e.target)) return; // no interceptar clics en CTA
            down = true; drag = false; stop();
            sx = (e.touches ? e.touches[0].clientX : e.clientX); dx = 0;
        };
        const onMove = e => {
            if (!down) return;
            const x = (e.touches ? e.touches[0].clientX : e.clientX);
            dx = x - sx;
            if (Math.abs(dx) > 8) drag = true;
        };
        const onUp = () => {
            if (!down) return; down = false;
            if (drag && Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
            start();
        };

        track.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        track.addEventListener('touchstart', onDown, { passive: true });
        track.addEventListener('touchmove', onMove, { passive: true });
        track.addEventListener('touchend', onUp);
    }

    if (isCard) paint(); else go(0);
    start();
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
}


// ---------- Hydrate ----------
async function hydrate(){
  const picker=$('#lang-select');
  if(picker){ picker.value=LANG; picker.addEventListener('change', e=>{ setLang(e.target.value); location.reload(); }); }
  if($('#year')) $('#year').textContent=new Date().getFullYear();
  try{ const dict=await loadJSON(dicts[LANG]); applyI18n(dict); }catch(e){ console.warn(e); }
  try{ await buildMegaMenu(); }catch(e){ console.warn(e); }

  if($('#servicesGrid')){
    const items=await loadJSON(servicesData[LANG]);
    renderServices(items); initServiceFilter(items);
  }
  if($('#portfolioList')){
    const items=await loadJSON(portfolioData[LANG]);
    renderPortfolioListAll(items);
  }
  initHeroCarousel();
}

document.addEventListener('DOMContentLoaded', hydrate);
