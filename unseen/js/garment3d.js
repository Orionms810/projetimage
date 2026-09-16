/* ===========================================================
   UNSEEN — garment3d.js
   Hoodie et t-shirt compressé modélisés en 3D (Three.js),
   imprimé all-over appliqué, pivotables à la main.
   =========================================================== */
import * as THREE from './vendor/three.module.min.js';

const stage  = document.getElementById('spinStage');
const canvas = document.getElementById('spinCanvas');
const hint   = document.getElementById('spinHint');
if (stage && canvas && !matchMedia('(prefers-reduced-motion: reduce)').matches) boot();

function boot() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (_) { return; }                       // pas de WebGL : on garde la version photo
  if (!renderer.getContext()) return;

  window.__unseen3d = true;
  document.documentElement.classList.add('has-3d');

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 50);
  camera.position.set(0, .06, 3.5);

  /* ---------- lumières : clé blanche, contres rose et or ---------- */
  scene.add(new THREE.AmbientLight(0x2a2030, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.2, 3, 3.4);
  const rimP = new THREE.DirectionalLight(0xff2d78, 3.4); rimP.position.set(-3.2, .8, -2.2);
  const rimY = new THREE.DirectionalLight(0xffc400, 2.0); rimY.position.set(3, -.4, -2.6);
  const fill = new THREE.DirectionalLight(0x8a7fa8, .7);  fill.position.set(-1.4, -1.8, 2.2);
  scene.add(key, rimP, rimY, fill);

  /* ---------- textures ---------- */
  const loader = new THREE.TextureLoader();
  const print = loader.load('assets/print.jpg');
  print.wrapS = print.wrapT = THREE.RepeatWrapping;
  print.colorSpace = THREE.SRGBColorSpace;
  print.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const logoTex = loader.load('assets/wordmark.png');
  logoTex.colorSpace = THREE.SRGBColorSpace;

  const bump = (() => {                          // grain de tissu
    const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d'), img = x.createImageData(s, s);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = 120 + Math.random() * 70;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14);
    return t;
  })();

  const printed = new THREE.MeshStandardMaterial({
    map: print, bumpMap: bump, bumpScale: .012,
    roughness: .93, metalness: 0,
    emissiveMap: print, emissive: 0x2a2012, emissiveIntensity: .3
  });
  const rib = new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: .96, bumpMap: bump, bumpScale: .02 });
  const logoMat = new THREE.MeshBasicMaterial({
    map: logoTex, transparent: true, depthWrite: false, toneMapped: false,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4
  });

  /* ---------- outils de géométrie ---------- */
  const curveAt = (pts, t) => {                  // interpolation douce sur des points de contrôle
    for (let i = 0; i < pts.length - 1; i++) {
      const [t0, v0] = pts[i], [t1, v1] = pts[i + 1];
      if (t <= t1 || i === pts.length - 2) {
        const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
        return v0 + (v1 - v0) * (k * k * (3 - 2 * k));
      }
    }
    return pts[pts.length - 1][1];
  };
  const surface = (rows, cols, fn, uRep = 1, vRep = 1) => {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= rows; i++) {
      for (let j = 0; j <= cols; j++) {
        const p = fn(i / rows, j / cols);
        pos.push(p.x, p.y, p.z);
        uv.push((j / cols) * uRep, (i / rows) * vRep);
      }
    }
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const a = i * (cols + 1) + j, b = a + cols + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const fold = (a, t) => 1 + .016 * Math.sin(a * 7 + t * 6) + .011 * Math.sin(a * 13 - t * 9);

  /* ---------- le vêtement ---------- */
  const SPECS = {
    hoodie: {
      hemY: -.78, topY: .70, hood: true, pocket: true,
      rx: [[0, .455], [.14, .445], [.42, .435], [.72, .455], [.90, .495], [1, .27]],
      rz: [[0, .27], [.14, .265], [.42, .255], [.72, .275], [.90, .30], [1, .17]],
      sleeve: [[.38, .52, .01], [.60, .30, .04], [.70, -.04, .06], [.68, -.36, .05]],
      sleeveR: [[0, .175], [.55, .145], [.86, .115], [1, .105]]
    },
    tee: {
      hemY: -.72, topY: .66, hood: false, pocket: false,
      rx: [[0, .43], [.18, .41], [.45, .415], [.74, .455], [.91, .495], [1, .27]],
      rz: [[0, .215], [.18, .205], [.45, .205], [.74, .225], [.91, .25], [1, .15]],
      sleeve: [[.30, .48, .01], [.52, .36, .03], [.63, .18, .05]],
      sleeveR: [[0, .155], [.6, .135], [1, .125]]
    }
  };

  const garment = new THREE.Group();
  scene.add(garment);

  const build = key => {
    while (garment.children.length) {
      const c = garment.children.pop();
      c.geometry?.dispose();
    }
    const S = SPECS[key];

    /* corps */
    const body = surface(74, 84, (t, u) => {
      const a = u * Math.PI * 2;
      const y = S.hemY + (S.topY - S.hemY) * t;
      const f = fold(a, t);
      const cap = t > .93 ? (t - .93) / .07 : 0;            // épaules qui se referment
      const k = 1 - cap * cap * .55;
      return new THREE.Vector3(
        Math.cos(a) * curveAt(S.rx, t) * f * k,
        y + cap * .05,
        Math.sin(a) * curveAt(S.rz, t) * f * k
      );
    }, 1.1, 1.15);
    garment.add(new THREE.Mesh(body, printed));

    /* manches */
    [1, -1].forEach(side => {
      const pts = S.sleeve.map(([x, y, z]) => new THREE.Vector3(x * side, y, z));
      const path = new THREE.CatmullRomCurve3(pts);
      const frames = path.computeFrenetFrames(30, false);
      const sl = surface(30, 26, (t, u) => {
        const i = Math.round(t * 30), a = u * Math.PI * 2;
        const P = path.getPointAt(Math.min(t, 1));
        const N = frames.normals[Math.min(i, 30)], B = frames.binormals[Math.min(i, 30)];
        const r = curveAt(S.sleeveR, t) * fold(a, t);
        return new THREE.Vector3(
          P.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r,
          P.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r,
          P.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r
        );
      }, .85, 1.1);
      garment.add(new THREE.Mesh(sl, printed));

      /* poignet côtelé */
      const cuff = surface(6, 26, (t, u) => {
        const a = u * Math.PI * 2, tt = .92 + t * .09;
        const P = path.getPointAt(Math.min(tt, 1));
        const i = Math.min(Math.round(tt * 30), 30);
        const N = frames.normals[i], B = frames.binormals[i];
        const r = curveAt(S.sleeveR, tt) * 1.02;
        return new THREE.Vector3(
          P.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r,
          P.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r - t * .02,
          P.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r
        );
      });
      garment.add(new THREE.Mesh(cuff, rib));
    });

    /* bas côtelé */
    const hem = surface(7, 84, (t, u) => {
      const a = u * Math.PI * 2, tt = t * .055;
      return new THREE.Vector3(
        Math.cos(a) * curveAt(S.rx, tt) * 1.005,
        S.hemY + t * .055 * (S.topY - S.hemY) - .045,
        Math.sin(a) * curveAt(S.rz, tt) * 1.005
      );
    });
    garment.add(new THREE.Mesh(hem, rib));

    /* fond fermé */
    const bottom = surface(6, 84, (t, u) => {
      const a = u * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(a) * curveAt(S.rx, 0) * (1 - t) * 1.005,
        S.hemY - .045 - t * .012,
        Math.sin(a) * curveAt(S.rz, 0) * (1 - t) * 1.005
      );
    });
    garment.add(new THREE.Mesh(bottom, rib));

    /* col */
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(S.hood ? .215 : .19, .034, 14, 46),
      rib
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = S.topY + .045;
    garment.add(collar);

    /* capuche */
    if (S.hood) {
      const TH = .74, HR = .355, LEAN = -1.02;                 // coque, rayon, inclinaison arrière
      const hoodPt = (t, u) => {
        const th = t * Math.PI * TH, ph = u * Math.PI * 2;
        const x = Math.sin(th) * Math.cos(ph) * HR * 1.02;
        const y = Math.cos(th) * HR * 1.04;
        const z = Math.sin(th) * Math.sin(ph) * HR * .92;
        return new THREE.Vector3(
          x,
          S.topY - .03 + y * Math.cos(LEAN) - z * Math.sin(LEAN),
          -.17 + y * Math.sin(LEAN) + z * Math.cos(LEAN)
        );
      };
      garment.add(new THREE.Mesh(surface(30, 60, hoodPt, 1.3, 1), printed));

      const edge = new THREE.Mesh(
        new THREE.TorusGeometry(Math.sin(Math.PI * TH) * HR, .021, 10, 44), rib);
      edge.rotation.x = Math.PI / 2 + LEAN;
      edge.position.copy(hoodPt(1, .25)).setX(0);
      edge.position.z += Math.sin(Math.PI * TH) * HR * .0;
      garment.add(edge);

      /* cordons */
      [-.11, .11].forEach(x => {
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .30, 8), rib);
        cord.position.set(x, S.topY - .10, .21);
        cord.rotation.z = x > 0 ? -.06 : .06;
        garment.add(cord);
      });

      /* poche kangourou */
      const pocket = surface(16, 34, (t, u) => {
        const a = Math.PI * .5 + (u - .5) * 1.75;
        const tt = .075 + t * .225;
        return new THREE.Vector3(
          Math.cos(a) * curveAt(S.rx, tt) * 1.05,
          S.hemY + (S.topY - S.hemY) * tt,
          Math.sin(a) * curveAt(S.rz, tt) * 1.055
        );
      });
      garment.add(new THREE.Mesh(pocket, rib));
    }

    /* logo poitrine (toujours blanc) */
    const logo = surface(6, 22, (t, u) => {
      const a = Math.PI * .5 - (u - .5) * .74;
      const tt = (S.hood ? .70 : .72) + t * .105;
      return new THREE.Vector3(
        Math.cos(a) * curveAt(S.rx, tt) * 1.05,
        S.hemY + (S.topY - S.hemY) * tt,
        Math.sin(a) * curveAt(S.rz, tt) * 1.07
      );
    });
    const logoMesh = new THREE.Mesh(logo, logoMat);
    logoMesh.renderOrder = 2;
    garment.add(logoMesh);
  };

  /* ---------- halo au sol ---------- */
  const glowTex = (() => {
    const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,45,120,.55)'); g.addColorStop(1, 'rgba(255,45,120,0)');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  })();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: .55, toneMapped: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.92;
  scene.add(floor);

  /* ---------- interaction ---------- */
  let angle = .35, spinV = 0, targetA = null, tilt = 0, tiltT = 0,
      dragging = false, touched = false, lastX = 0, lastY = 0;

  const grab = e => {
    dragging = true; touched = true; targetA = null;
    lastX = e.clientX; lastY = e.clientY;
    stage.classList.add('is-grab'); stage.setPointerCapture?.(e.pointerId);
    if (hint) hint.textContent = 'Continue de glisser';
  };
  const move = e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    angle += dx * .009; spinV = dx * .009;
    tiltT = Math.max(-.3, Math.min(.3, tiltT + dy * .004));
  };
  const drop = () => { dragging = false; stage.classList.remove('is-grab'); };
  stage.addEventListener('pointerdown', grab);
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerup', drop);
  stage.addEventListener('pointercancel', drop);
  stage.addEventListener('pointerleave', drop);

  const nudge = dir => {
    touched = true; spinV = 0;
    const q = Math.PI / 2;
    targetA = Math.round(angle / q) * q + dir * q;
  };
  document.getElementById('spinLeft') ?.addEventListener('click', () => nudge(1));
  document.getElementById('spinRight')?.addEventListener('click', () => nudge(-1));
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { nudge(1);  e.preventDefault(); }
    if (e.key === 'ArrowRight') { nudge(-1); e.preventDefault(); }
  });
  document.querySelectorAll('.spin__tabs button').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.spin__tabs button').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    build(tab.dataset.prod);
    spinV = .09; touched = true;
  }));

  /* ---------- taille + boucle ---------- */
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 640 ? 42 : 34;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize, { passive: true });

  let visible = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; },
    { rootMargin: '120px' }).observe(stage);

  build('hoodie');
  resize();

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    if (targetA !== null && !dragging) {
      angle += (targetA - angle) * .1;
      if (Math.abs(targetA - angle) < .002) { angle = targetA; targetA = null; }
    } else if (!dragging) {
      if (Math.abs(spinV) > .0004) { angle += spinV; spinV *= .945; }
      else { spinV = 0; if (!touched) angle += .0035; }
    }
    tilt += (tiltT - tilt) * .08;
    tiltT *= .96;
    garment.rotation.y = angle;
    garment.rotation.x = tilt;
    garment.position.y = Math.sin(performance.now() * .0006) * .012;   // respiration
    renderer.render(scene, camera);
  };
  tick();
}
