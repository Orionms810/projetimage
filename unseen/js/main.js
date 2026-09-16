/* ===========================================================
   UNSEEN — main.js  (vanilla, sans dépendance)
   =========================================================== */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Préloader ---------- */
  const loader = $('#loader'), bar = $('#loaderBar'), num = $('#loaderNum');
  const imgs = $$('img');
  let loaded = 0, shown = 0;

  const bump = () => {
    loaded++;
    const target = Math.round((loaded / Math.max(imgs.length, 1)) * 100);
    const tick = () => {
      shown = Math.min(shown + 2, target);
      bar.style.width = shown + '%';
      num.textContent = shown;
      if (shown < target) requestAnimationFrame(tick);
      else if (shown >= 100) setTimeout(() => loader.classList.add('is-done'), 450);
    };
    tick();
  };
  imgs.forEach(im => im.complete ? bump() : (im.addEventListener('load', bump), im.addEventListener('error', bump)));
  setTimeout(() => loader.classList.add('is-done'), 6000); // filet de sécurité

  /* ---------- 2. Curseur + magnétisme ---------- */
  const cur = $('#cursor');
  if (cur && matchMedia('(hover:hover)').matches) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    (function ride() {
      cx = lerp(cx, tx, .18); cy = lerp(cy, ty, .18);
      cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(ride);
    })();
    $$('a,button,input').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('is-big'));
      el.addEventListener('mouseleave', () => cur.classList.remove('is-big'));
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- 3. Header ---------- */
  const hdr = $('#hdr'), legal = $('.legal');
  let lastY = 0;
  const header = y => {
    legal?.classList.toggle('is-out', y > innerHeight * .75);
    hdr.classList.toggle('is-stuck', y > 60);
    hdr.classList.toggle('is-hidden', y > lastY && y > 420);
    lastY = y;
  };

  /* ---------- 4. Parallaxe ---------- */
  const paras = $$('[data-speed]').map(el => ({ el, sp: parseFloat(el.dataset.speed) }));
  const parallax = () => {
    if (reduced) return;
    paras.forEach(({ el, sp }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      el.style.transform = `translate3d(0,${(r.top + r.height / 2 - innerHeight / 2) * -sp}px,0)`;
    });
  };

  /* ---------- 5. Marquee (vitesse liée au scroll) ---------- */
  const mq = $('#marquee1');
  let mqX = 0, vel = 0;
  const marquee = () => {
    if (!mq || reduced) return;
    const w = mq.scrollWidth / 2;
    mqX = (mqX - (0.6 + Math.abs(vel) * .06)) % w;
    mq.style.transform = `translate3d(${mqX}px,0,0)`;
  };

  /* ---------- 6. Story épinglée ---------- */
  const story = $('#story'), stIdx = $('#storyIdx');
  const heads = $$('.story__copy h2'), shots = $$('.story__img');
  heads.forEach(h => {
    h.innerHTML = h.textContent.trim().split(' ')
      .map(w => `<span class="w">${w}</span>`).join(' ');
  });
  heads[0]?.classList.add('is-on');

  const runStory = () => {
    if (!story || reduced) return;
    const r = story.getBoundingClientRect();
    const p = clamp(-r.top / (story.offsetHeight - innerHeight));
    const step = Math.min(heads.length - 1, Math.floor(p * heads.length));
    stIdx.textContent = String(step + 1).padStart(2, '0');
    heads.forEach((h, i) => h.classList.toggle('is-on', i === step));
    shots.forEach((s, i) => s.classList.toggle('is-active', i === step));

    const local = clamp(p * heads.length - step);
    const words = $$('.w', heads[step]);
    words.forEach((w, i) => w.classList.toggle('is-lit', local * words.length * 1.35 > i));
  };

  /* ---------- 7. Galerie horizontale ---------- */
  const gal = $('#gal'), track = $('#galTrack');
  const runGal = () => {
    if (!gal || reduced) return;
    const r = gal.getBoundingClientRect();
    const p = clamp(-r.top / (gal.offsetHeight - innerHeight));
    const dist = Math.max(0, track.scrollWidth - innerWidth + 40);
    track.style.transform = `translate3d(${-p * dist}px,0,0)`;
  };

  /* ---------- 8. Boucle de rendu ---------- */
  const frame = () => {
    const y = scrollY;
    vel = lerp(vel, y - (frame.prev ?? y), .2); frame.prev = y;
    header(y); parallax(); runStory(); runGal(); marquee();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  addEventListener('resize', () => { runStory(); runGal(); }, { passive: true });

  /* ---------- 9. Révélations ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .18 });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- 10. Tailles + panier ---------- */
  const bag = $('#bag'), bagTxt = $('#bagTxt');
  let count = 0, toast;
  $$('.card__sizes').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', g).forEach(x => x.classList.remove('is-sel'));
    b.classList.add('is-sel');
  }));
  $$('.card__add').forEach(btn => btn.addEventListener('click', () => {
    const card = btn.closest('.card');
    const size = $('.card__sizes .is-sel', card);
    if (!size) {
      bagTxt.textContent = 'Choisis une taille';
    } else {
      count++;
      bagTxt.textContent = `${btn.dataset.name} · ${size.textContent} — panier (${count})`;
    }
    bag.classList.add('is-on');
    clearTimeout(toast);
    toast = setTimeout(() => bag.classList.remove('is-on'), 3200);
  }));

  /* ---------- 11. Personnalisation du nom ---------- */
  const nameTrack = $('#nameTrack'), nameInput = $('#nameInput');
  let nx = 0;
  const paint = () => {
    const v = (nameInput.value || 'UNSEEN').toUpperCase();
    nameTrack.innerHTML = Array.from({ length: 8 }, () => `<span>${v}</span>`).join('');
  };
  if (nameTrack) {
    paint();
    nameInput.addEventListener('input', paint);
    if (!reduced) (function slide() {
      const w = nameTrack.scrollWidth / 2 || 1;
      nx = (nx - 1.1) % w;
      nameTrack.style.transform = `translate3d(${nx}px,0,0)`;
      requestAnimationFrame(slide);
    })();
  }
  $('#shareBtn')?.addEventListener('click', async () => {
    const txt = `${(nameInput.value || 'UNSEEN').toUpperCase()} — UNSEEN · Strength Beyond Sight`;
    try {
      if (navigator.share) await navigator.share({ title: 'UNSEEN', text: txt, url: location.href });
      else { await navigator.clipboard.writeText(`${txt} ${location.href}`); flash('Lien copié'); }
    } catch (_) { /* partage annulé */ }
  });

  /* ---------- 12. Newsletter ---------- */
  const form = $('#newsForm'), msg = $('#newsMsg');
  const flash = t => { msg.textContent = t; clearTimeout(flash.t); flash.t = setTimeout(() => msg.textContent = '', 4000); };
  form?.addEventListener('submit', e => {
    e.preventDefault();
    flash('Bienvenue dans l\'ombre. 見えない力');
    form.reset();
  });
})();
