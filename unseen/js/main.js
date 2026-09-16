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
    header(y); parallax(); runStory(); runGal(); marquee(); renderSpin(); petalsTick();
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

  /* ---------- 13. Vue 360 : rotation 3D à la main ---------- */
  const PRODUCTS = {
    hoodie: [
      ['assets/hoodie_front.jpg', 'Face'],
      ['assets/detail1.jpg',      'Capuche'],
      ['assets/hoodie_back.jpg',  'Dos'],
      ['assets/detail2.jpg',      'Imprimé éclair'],
      ['assets/detail3.jpg',      'Col brodé']
    ],
    tee: [
      ['assets/tee_front.jpg',    'Face'],
      ['assets/detail2.jpg',      'Imprimé éclair'],
      ['assets/tee_back.jpg',     'Dos — 桜の力'],
      ['assets/detail3.jpg',      'Col brodé'],
      ['assets/detail1.jpg',      'Tissu']
    ]
  };
  const stage = $('#spinStage'), ring = $('#spinRing'), hint = $('#spinHint');
  let faces = [], radius = 0, angle = 0, spinV = 0, target = null, dragging = false, touched = false;

  const layout = () => {
    if (!faces.length) return;
    const w = faces[0].offsetWidth, n = faces.length;
    radius = (w / 2) / Math.tan(Math.PI / n) * 1.08;
  };
  const build = key => {
    ring.innerHTML = '';
    faces = PRODUCTS[key].map(([src, cap]) => {
      const f = document.createElement('figure');
      f.className = 'spin__face';
      f.innerHTML = `<img src="${src}" alt="${cap}" draggable="false"><figcaption>${cap}</figcaption>`;
      ring.appendChild(f);
      return f;
    });
    layout();
    angle = 0; spinV = 0; target = null;
  };
  const renderSpin = () => {
    if (!faces.length || reduced || window.__unseen3d) return;
    if (target !== null && !dragging) {
      angle = lerp(angle, target, .12);
      if (Math.abs(target - angle) < .15) { angle = target; target = null; }
    } else if (!dragging) {
      if (Math.abs(spinV) > .02) { angle += spinV; spinV *= .94; }
      else { spinV = 0; if (!touched) angle += .09; }   // rotation douce tant qu'on n'y a pas touché
    }
    const n = faces.length, step = 360 / n;
    ring.style.transform = `translateZ(${-radius * .55}px) rotateY(${angle}deg)`;
    faces.forEach((f, i) => {
      const c = Math.cos((angle + i * step) * Math.PI / 180);
      f.style.transform = `translate(-50%,-50%) rotateY(${i * step}deg) translateZ(${radius}px)`;
      f.style.filter = `brightness(${(.42 + .58 * Math.max(0, c)).toFixed(3)})`;
      f.style.opacity = (.35 + .65 * Math.max(0, c)).toFixed(3);
    });
  };

  if (stage) {
    build('hoodie');
    addEventListener('resize', layout, { passive: true });

    let lastX = 0;
    const grab = e => {
      if (window.__unseen3d) return;
      dragging = true; touched = true; target = null; lastX = e.clientX;
      stage.classList.add('is-grab'); stage.setPointerCapture?.(e.pointerId);
      if (hint) hint.textContent = 'Continue de glisser';
    };
    const move = e => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      angle += dx * .38; spinV = dx * .38;
    };
    const drop = () => { dragging = false; stage.classList.remove('is-grab'); };
    stage.addEventListener('pointerdown', grab);
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerup', drop);
    stage.addEventListener('pointercancel', drop);
    stage.addEventListener('pointerleave', drop);

    const nudge = dir => {
      if (window.__unseen3d) return;
      touched = true; spinV = 0;
      const step = 360 / Math.max(faces.length, 1);
      target = Math.round(angle / step) * step + dir * step;
    };
    $('#spinLeft') ?.addEventListener('click', () => nudge(1));
    $('#spinRight')?.addEventListener('click', () => nudge(-1));
    stage.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { nudge(1);  e.preventDefault(); }
      if (e.key === 'ArrowRight') { nudge(-1); e.preventDefault(); }
    });

    $$('.spin__tabs button').forEach(tab => tab.addEventListener('click', () => {
      if (window.__unseen3d) return;
      $$('.spin__tabs button').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      build(tab.dataset.prod);
      spinV = 14; touched = true;                 // petit élan à chaque changement de pièce
    }));
  }

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

  /* ---------- 15. Inclinaison 3D des cartes + du logo ---------- */
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
