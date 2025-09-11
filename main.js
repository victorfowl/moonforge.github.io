const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

async function bustCss() {
    const link = $('#site-css'); if (!link) return;
    const base = link.getAttribute('href').split('?')[0];
    try {
        const r = await fetch(base, { method: 'HEAD', cache: 'no-cache' });
        const etag = r.headers.get('ETag') || '';
        const lm = r.headers.get('Last-Modified') || '';
        const v = (etag || lm).replace(/[^a-zA-Z0-9._-]/g, '') || Date.now();
        const cur = new URL(link.href, location.origin);
        if (cur.searchParams.get('v') === String(v)) return;
        const fresh = link.cloneNode(true);
        fresh.href = base + '?v=' + v;
        fresh.addEventListener('load', () => link.remove());
        link.after(fresh);
    } catch { /* sin ruido */ }
}

function initHeroCarousel() {
    const root = $('#heroCarousel'); if (!root) return;
    const track = $('.hero-track', root), dotsWrap = $('.hero-dots', root);
    const slides = $$('.hero-slide', track); let idx = 0, timer = null;

    function paint() {
        const n = slides.length;
        slides.forEach((sl, i) => {
            let p = 'off';
            if (i === idx) p = 'current';
            else if (i === (idx + 1) % n) p = 'next';
            else if (i === (idx + 2) % n) p = 'tail';
            sl.setAttribute('data-pos', p);
        });
        $$('.hero-dot', dotsWrap).forEach((d, k) => d.classList.toggle('active', k === idx));
    }
    function go(i) { const n = slides.length; idx = (i + n) % n; paint(); }
    function start() { stop(); timer = setInterval(() => go(idx + 1), 5000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    const isInteractive = el => !!el.closest && el.closest('a,button,[role="button"],input,textarea,select,label');

    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.className = 'hero-dot'; b.type = 'button';
        b.onclick = () => { go(i); start(); };
        dotsWrap.appendChild(b);
    });

    let down = false, sx = 0, dx = 0, drag = false;
    const onDown = e => { if (isInteractive(e.target)) return; down = true; drag = false; sx = (e.touches ? e.touches[0].clientX : e.clientX); dx = 0; stop(); };
    const onMove = e => { if (!down) return; const x = (e.touches ? e.touches[0].clientX : e.clientX); dx = x - sx; if (Math.abs(dx) > 8) drag = true; };
    const onUp = () => { if (!down) return; down = false; if (drag && Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); start(); };

    track.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    track.addEventListener('touchstart', onDown, { passive: true });
    track.addEventListener('touchmove', onMove, { passive: true });
    track.addEventListener('touchend', onUp);

    paint(); start();
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', async () => {
    await bustCss();
    initHeroCarousel();
});
