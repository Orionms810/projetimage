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
  const imgs = $$('img:not([loading="lazy"])');   // le préchargeur n'attend que le haut de page
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

  /* ---------- 4. Progression verticale de la page ---------- */
  const pBar = $('#progress span');
  const progressBar = y => {
    if (!pBar) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    pBar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  };

  /* ---------- 5. Parallaxe ---------- */
  const paras = $$('[data-speed]').map(el => ({ el, sp: parseFloat(el.dataset.speed) }));
  const parallax = () => {
    if (reduced) return;
    paras.forEach(({ el, sp }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      el.style.transform = `translate3d(0,${(r.top + r.height / 2 - innerHeight / 2) * -sp}px,0)`;
    });
  };

  /* ---------- 6. Marquee (vitesse liée au scroll) ---------- */
  const mq = $('#marquee1');
  let mqX = 0, vel = 0;
  const marquee = () => {
    if (!mq || reduced) return;
    const w = mq.scrollWidth / 2;
    mqX = (mqX - (0.6 + Math.abs(vel) * .06)) % w;
    mq.style.transform = `translate3d(${mqX}px,0,0)`;
  };

  /* ---------- 7. Galerie horizontale (flèches + glisser) ---------- */
  const scroller = $('#galScroller'), galBar = $('#galBar'),
        galPrev = $('#galPrev'), galNext = $('#galNext');

  const galStep = () => {
    const item = $('.gal__item', scroller);
    const gap = parseFloat(getComputedStyle(scroller).columnGap || 24) || 24;
    return item ? item.offsetWidth + gap : scroller.clientWidth * .8;
  };
  const galSync = () => {
    if (!scroller) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const p = max > 2 ? scroller.scrollLeft / max : 0;
    const ratio = Math.min(1, scroller.clientWidth / Math.max(scroller.scrollWidth, 1));
    galBar.style.width = (ratio * 100).toFixed(2) + '%';
    galBar.style.transform = `translateX(${(ratio < 1 ? p * (1 - ratio) / ratio * 100 : 0).toFixed(2)}%)`;
    galPrev.disabled = scroller.scrollLeft < 8;
    galNext.disabled = scroller.scrollLeft > max - 8;
  };
  if (scroller) {
    scroller.addEventListener('scroll', galSync, { passive: true });
    addEventListener('resize', galSync, { passive: true });
    galPrev.addEventListener('click', () => scroller.scrollBy({ left: -galStep(), behavior: 'smooth' }));
    galNext.addEventListener('click', () => scroller.scrollBy({ left:  galStep(), behavior: 'smooth' }));
    scroller.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { scroller.scrollBy({ left: -galStep(), behavior: 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowRight') { scroller.scrollBy({ left:  galStep(), behavior: 'smooth' }); e.preventDefault(); }
    });
    /* glisser à la souris (le tactile utilise le défilement natif) */
    let down = false, startX = 0, startL = 0, moved = 0;
    scroller.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return;
      down = true; moved = 0; startX = e.clientX; startL = scroller.scrollLeft;
      scroller.classList.add('is-grab'); scroller.setPointerCapture?.(e.pointerId);
    });
    scroller.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      scroller.scrollLeft = startL - dx;
    });
    const release = () => { down = false; scroller.classList.remove('is-grab'); };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => scroller.addEventListener(ev, release));
    scroller.addEventListener('click', e => { if (moved > 6) e.preventDefault(); }, true);
    $$('img', scroller).forEach(im => im.addEventListener('load', galSync));
    galSync();
  }

  /* ---------- 8. Boucle de rendu ---------- */
  const frame = () => {
    const y = scrollY;
    vel = lerp(vel, y - (frame.prev ?? y), .2); frame.prev = y;
    header(y); parallax(); marquee(); petalsTick(); progressBar(y);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  /* ---------- 9. Révélations ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .18 });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- 10. Tailles et ajout au panier ---------- */
  $$('.card__sizes').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    $$('button', g).forEach(x => x.classList.remove('is-sel'));
    b.classList.add('is-sel');
  }));

  $$('.card__add').forEach(btn => btn.addEventListener('click', () => {
    const card = btn.closest('.card');
    const size = $('.card__sizes .is-sel', card);
    if (!size) {
      window.PANIER?.message('Choisis une taille');
      $('.card__sizes', card).animate(
        [{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }],
        { duration: 260, iterations: 2 });
      return;
    }
    window.PANIER?.ajouter({
      name: btn.dataset.name, size: size.textContent, price: +btn.dataset.price,
      img: $('.card__main', card).getAttribute('src')
    });
  }));

  /* ---------- 11. Vues produit : vignettes + flèches ---------- */
  const existe = src => new Promise(res => {
    const im = new Image();
    im.onload = () => res(true);
    im.onerror = () => res(false);
    im.src = src;
  });

  $$('.card__views').forEach(async box => {
    const card = box.closest('.card');
    const main = $('.card__main', card);
    const vues = box.dataset.views.split(',').map(v => {
      const [nom, label] = v.split(':');
      return { src: `assets/${nom}.jpg`, label };
    });
    const dispo = [];
    for (const v of vues) if (await existe(v.src)) dispo.push(v);
    if (dispo.length < 2) return;

    let i = Math.max(0, dispo.findIndex(v => v.src === main.getAttribute('src')));
    const vignettes = dispo.map(v => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Voir : ${v.label}`);
      b.innerHTML = `<img src="${v.src}" alt=""><span>${v.label}</span>`;
      b.addEventListener('click', () => montrer(dispo.indexOf(v)));
      box.appendChild(b);
      return b;
    });

    const montrer = k => {
      i = (k + dispo.length) % dispo.length;
      const v = dispo[i];
      vignettes.forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
      if (main.getAttribute('src') === v.src) return;
      main.classList.add('is-swap');
      const pre = new Image();
      pre.onload = () => { main.src = v.src; main.classList.remove('is-swap'); };
      pre.src = v.src;
    };

    /* flèches par-dessus l'image */
    const media = $('.card__media', card);
    [['prev', '←', -1], ['next', '→', 1]].forEach(([cls, txt, pas]) => {
      const a = document.createElement('button');
      a.type = 'button';
      a.className = `card__arrow card__arrow--${cls}`;
      a.innerHTML = txt;
      a.setAttribute('aria-label', pas < 0 ? 'Vue précédente' : 'Vue suivante');
      a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); montrer(i + pas); });
      media.appendChild(a);
    });
    media.insertAdjacentHTML('beforeend',
      `<span class="card__count" aria-hidden="true">${dispo.length} vues</span>`);

    montrer(i);
  });

  /* ---------- 12. Personnalisation du nom ---------- */
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
  const shareBtn = $('#shareBtn');
  shareBtn?.addEventListener('click', async () => {
    const txt = `${(nameInput.value || 'UNSEEN').toUpperCase()} — UNSEEN · Strength Beyond Sight`;
    const say = t => {
      const old = shareBtn.dataset.label || shareBtn.textContent;
      shareBtn.dataset.label = old;
      shareBtn.textContent = t;
      clearTimeout(shareBtn.t);
      shareBtn.t = setTimeout(() => { shareBtn.textContent = old; }, 2200);
    };
    try {
      if (navigator.share) { await navigator.share({ title: 'UNSEEN', text: txt, url: location.href }); say('Partagé'); }
      else { await navigator.clipboard.writeText(`${txt} ${location.href}`); say('Lien copié'); }
    } catch (_) { say('Partage annulé'); }
  });

  /* ---------- 13. Newsletter ---------- */
  const form = $('#newsForm'), msg = $('#newsMsg');
  const flash = t => { msg.textContent = t; clearTimeout(flash.t); flash.t = setTimeout(() => msg.textContent = '', 4000); };
  form?.addEventListener('submit', e => {
    e.preventDefault();
    flash('Bienvenue dans l\'ombre. 見えない力');
    form.reset();
  });

  /* ---------- 14. Pétales de sakura ---------- */
  const cvs = $('#petals'), ctx = cvs?.getContext('2d');
  let petals = [], cw = 0, ch = 0;

  const makeSprite = (kind, top, bottom) => {
    const S = 110, s = document.createElement('canvas');
    s.width = s.height = S;
    const c = s.getContext('2d');
    c.translate(S / 2, S / 2);
    const g = c.createLinearGradient(0, -S / 2, 0, S / 2);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    c.fillStyle = g;
    const petal = r => {
      c.beginPath(); c.moveTo(0, 0);
      c.bezierCurveTo(r * .38, -r * .30, r * .44, -r * .82, r * .13, -r * .99);
      c.quadraticCurveTo(0, -r * .78, -r * .13, -r * .99);
      c.bezierCurveTo(-r * .44, -r * .82, -r * .38, -r * .30, 0, 0);
      c.closePath(); c.fill();
    };
    if (kind === 'blossom') {
      for (let i = 0; i < 5; i++) { c.rotate(Math.PI * 2 / 5); petal(S * .42); }
      c.fillStyle = 'rgba(255,255,255,.9)';
      c.beginPath(); c.arc(0, 0, S * .05, 0, 7); c.fill();
    } else petal(S * .46);
    return s;
  };
  const SPRITES = ctx ? [
    makeSprite('blossom', '#ff5c9d', '#e0175f'),
    makeSprite('blossom', '#ffd3e6', '#ff6aa8'),
    makeSprite('petal',   '#ff8fc0', '#ff2d78'),
    makeSprite('petal',   '#ffffff', '#ff9ec9')
  ] : [];

  const seed = (p, top) => {
    p.z = .35 + Math.random() * .65;                       // profondeur
    p.x = Math.random() * cw;
    p.y = top ? -80 - Math.random() * ch * .4 : Math.random() * ch;
    p.size = (26 + Math.random() * 34) * p.z;
    p.vy = (.35 + Math.random() * .8) * p.z;
    p.rot = Math.random() * 7; p.rotV = (Math.random() - .5) * .022;
    p.spin = Math.random() * 7; p.spinV = (Math.random() - .5) * .05;
    p.sway = Math.random() * 7; p.swayV = .008 + Math.random() * .016;
    p.amp = .4 + Math.random() * 1.2;
    p.sprite = SPRITES[Math.random() < .62 ? (Math.random() * 2) | 0 : 2 + ((Math.random() * 2) | 0)];
    p.alpha = .3 + p.z * .55;
    return p;
  };
  const sizeCanvas = () => {
    if (!ctx) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cw = innerWidth; ch = innerHeight;
    cvs.width = cw * dpr; cvs.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const want = cw < 700 ? 18 : 36;
    while (petals.length < want) petals.push(seed({}, false));
    petals.length = want;
  };
  if (ctx && !reduced) { sizeCanvas(); addEventListener('resize', sizeCanvas, { passive: true }); }

  const petalsTick = () => {
    if (!ctx || reduced) return;
    const wind = clamp(vel * .06, -6, 6);
    ctx.clearRect(0, 0, cw, ch);
    for (const p of petals) {
      p.y += p.vy; p.sway += p.swayV; p.rot += p.rotV; p.spin += p.spinV;
      p.x += Math.sin(p.sway) * p.amp + wind * p.z;
      if (p.y > ch + 90) seed(p, true);
      if (p.x < -120) p.x = cw + 100; else if (p.x > cw + 120) p.x = -100;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const sx = Math.cos(p.spin) || 1;                     // bascule 3D du pétale
      ctx.scale(Math.sign(sx) * (.32 + .68 * Math.abs(sx)), 1);
      ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  };

  /* ---------- 15. Cube produit (section 01) : rotation continue ---------- */
  const cube = $('#cube');
  if (cube && !reduced) {
    const faces = $$('.cube__face', cube);
    let ang = -28;
    const tourner = () => {
      ang += .18;
      cube.style.transform = `rotateX(-8deg) rotateY(${ang}deg)`;
      faces.forEach((f, k) => {
        const c = Math.cos((ang + k * 90) * Math.PI / 180);
        f.style.filter = `brightness(${(.45 + .55 * Math.max(0, c)).toFixed(3)})`;
      });
      requestAnimationFrame(tourner);
    };
    tourner();
  }

  /* ---------- 16. Inclinaison 3D des cartes + du logo ---------- */
  if (!reduced && matchMedia('(hover:hover)').matches) {
    $$('.card').forEach(card => {
      const media = $('.card__media', card);
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        media.style.transform = `rotateY(${px * 13}deg) rotateX(${-py * 13}deg) translateZ(18px)`;
      });
      card.addEventListener('pointerleave', () => { media.style.transform = ''; });
    });
    const mark = $('.hero__mark');
    addEventListener('mousemove', e => {
      if (scrollY > innerHeight || !mark) return;
      const px = e.clientX / innerWidth - .5, py = e.clientY / innerHeight - .5;
      mark.style.transform = `perspective(900px) rotateY(${px * 9}deg) rotateX(${-py * 7}deg) translateZ(30px)`;
    }, { passive: true });
  }
})();
