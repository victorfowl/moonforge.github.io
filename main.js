// ---------- Utilidades ----------
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

// Rutas de i18n y datos
const dicts = {
    es: 'data/i18n.es.json',
    ca: 'data/i18n.ca.json',
    en: 'data/i18n.en.json'
};
const servicesData = {
    es: 'data/services.es.json',
    ca: 'data/services.ca.json',
    en: 'data/services.en.json'
};
const portfolioData = {
    es: 'data/projects.es.json',
    ca: 'data/projects.ca.json',
    en: 'data/projects.en.json'
};

// Idioma guardado
let LANG = localStorage.getItem('lang') || 'es';
function setLang(lang) {
    LANG = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
}

// Fetch JSON con control de error
async function loadJSON(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load: ' + path);
    return res.json();
}

// Aplica i18n a elementos con data-i18n="a.b.c"
function applyI18n(dict) {
    $$('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = key.split('.').reduce((a, k) => a && a[k], dict);
        if (typeof val === 'string') el.textContent = val;
    });
}

// ---------- Servicios (render + filtro robusto) ----------

// Normaliza texto para comparar categorías con y sin acentos
function normalizeCat(txt) {
    return (txt || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')                 // separa acentos
        .replace(/\p{Diacritic}/gu, '')    // quita acentos
        .replace(/\s+/g, ' ');             // colapsa espacios
}

function renderServices(items) {
    const grid = $('#servicesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    items.forEach(s => {
        const el = document.createElement('article');
        el.className = 'card service-card';
        // Guardamos la categoría normalizada para el filtro
        el.dataset.category = normalizeCat(s.category);
        el.innerHTML = `
      <h3>${s.title}</h3>
      <p>${s.description}</p>
      <p class="muted" style="margin-top:8px">${s.category || ''}</p>
    `;
        grid.appendChild(el);
    });
}

function initServiceFilter(items) {
    const select = $('#serviceFilter');
    const grid = $('#servicesGrid');
    if (!select || !grid) return;

    // Reconstruye opciones (comenzando por "Todas")
    select.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = 'all';
    // Etiqueta "Todas" desde i18n si está renderizada en la página
    const allLabel = $('[data-i18n="services.all"]')?.textContent || 'Todas';
    optAll.textContent = allLabel;
    select.appendChild(optAll);

    // Mapa de categorías: valor normalizado -> etiqueta original (evita duplicados)
    const map = new Map();
    items.forEach(i => {
        const val = normalizeCat(i.category);
        const label = (i.category || '').toString().trim();
        if (val) map.set(val, label || val);
    });

    // Añade opciones ordenadas por etiqueta visible
    [...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .forEach(([val, label]) => {
            const o = document.createElement('option');
            o.value = val;
            o.textContent = label;
            select.appendChild(o);
        });

    // Función de filtrado
    function applyFilter() {
        const val = select.value;
        $$('.service-card', grid).forEach(card => {
            const match = (val === 'all') || (card.dataset.category === val);
            card.classList.toggle('is-hidden', !match);
        });
    }

    // Inicial y en cambios
    select.onchange = applyFilter;
    applyFilter();
}

// ---------- Portfolio (filas media + texto) ----------

function renderPortfolioList(items) {
    const list = $('#portfolioList');
    if (!list) return;
    list.innerHTML = '';

    // featured primero, más recientes primero
    items
        .filter(p => p.featured)
        .sort((a, b) => (b.year || 0) - (a.year || 0))
        .forEach(p => {
            const row = document.createElement('div');
            row.className = 'project';

            // Media (vídeo con póster, o imagen)
            const media = document.createElement('div');
            media.className = 'video-container';
            if (p.video) {
                media.innerHTML = `
          <video controls ${p.poster ? `poster="${p.poster}"` : ''}>
            <source src="${p.video}" type="video/mp4">
            Your browser does not support HTML5 video.
          </video>`;
            } else {
                media.innerHTML = `<img class="thumb" src="${p.thumb || ''}" alt="${p.title}">`;
            }

            // Info
            const info = document.createElement('div');
            info.className = 'project-info';
            info.innerHTML = `
        <h2>${p.title}</h2>
        <p class="muted">${p.subtitle || ''}</p>
        <div class="tags">${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
        ${p.url ? `<p><a class="more" href="${p.url}">Leer más</a></p>` : ''}
      `;

            row.appendChild(media);
            row.appendChild(info);
            list.appendChild(row);
        });
}

// ---------- Hydrate (i18n + páginas) ----------

async function hydrate() {
    // Idioma selector
    const picker = $('#lang-select');
    if (picker) {
        picker.value = LANG;
        picker.addEventListener('change', e => { setLang(e.target.value); hydrate(); });
    }

    // Año en footer
    if ($('#year')) $('#year').textContent = new Date().getFullYear();

    // i18n
    const dict = await loadJSON(dicts[LANG]);
    applyI18n(dict);

    // Servicios
    if ($('#servicesGrid')) {
        const items = await loadJSON(servicesData[LANG]);
        renderServices(items);
        initServiceFilter(items);
    }

    // Portfolio
    if ($('#portfolioList')) {
        const items = await loadJSON(portfolioData[LANG]);
        renderPortfolioList(items);
    }
}

document.addEventListener('DOMContentLoaded', hydrate);
