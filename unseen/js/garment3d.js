/* ===========================================================
   UNSEEN — garment3d.js
   Scène 3D de la section « Vue 360 » : éclairage de studio,
   ombre portée, rotation à la main.
   =========================================================== */
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { buildGarment, makeMaterials } from './garment-model.js';

const stage  = document.getElementById('spinStage');
const canvas = document.getElementById('spinCanvas');
const hint   = document.getElementById('spinHint');
if (stage && canvas && !matchMedia('(prefers-reduced-motion: reduce)').matches) boot();

function boot() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (_) { return; }                        // pas de WebGL : on garde le repli photo
  if (!renderer.getContext()) return;

  window.__unseen3d = true;
  document.documentElement.classList.add('has-3d');

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
  camera.position.set(0, .02, 3.45);

  /* lumière d'ambiance réaliste (studio) */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .20;

  /* trois points : clé blanche, contres rose et or */
  const key = new THREE.DirectionalLight(0xfff2f6, 2.4);
  key.position.set(2.4, 3.4, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = .5; key.shadow.camera.far = 12;
  key.shadow.camera.left = -2; key.shadow.camera.right = 2;
  key.shadow.camera.top = 2; key.shadow.camera.bottom = -2;
  key.shadow.bias = -.0012; key.shadow.radius = 3;
  const rimP = new THREE.DirectionalLight(0xff2d78, 3.2); rimP.position.set(-3.4, 1.1, -2.2);
  const rimY = new THREE.DirectionalLight(0xffc400, 1.8); rimY.position.set(3.1, -.2, -2.8);
  const fill = new THREE.DirectionalLight(0xa79cc4, .85); fill.position.set(-1.7, -1.1, 2.6);
  const front = new THREE.DirectionalLight(0xffffff, .55); front.position.set(-.4, .6, 4);
  scene.add(key, rimP, rimY, fill, front, new THREE.AmbientLight(0x181220, .45));

  /* textures */
  const loader = new THREE.TextureLoader();
  const print = loader.load('assets/print.jpg');
  print.wrapS = print.wrapT = THREE.RepeatWrapping;
  print.colorSpace = THREE.SRGBColorSpace;
  print.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const logoTex = loader.load('assets/wordmark.png');
  logoTex.colorSpace = THREE.SRGBColorSpace;
  logoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const mats = makeMaterials(print, logoTex);

  /* sol : reçoit l'ombre + halo rose */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.ShadowMaterial({ opacity: .45 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.92;
  ground.receiveShadow = true;
  scene.add(ground);

  const glow = (() => {
    const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,45,120,.5)'); gr.addColorStop(1, 'rgba(255,45,120,0)');
    x.fillStyle = gr; x.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  })();
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8),
    new THREE.MeshBasicMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5, toneMapped: false }));
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -.915;
  scene.add(halo);

  /* le vêtement */
  let garment = null;
  const build = key2 => {
    if (garment) { scene.remove(garment); garment.traverse(o => o.geometry?.dispose()); }
    garment = buildGarment(key2, mats);
    scene.add(garment);
  };

  /* ---------- interaction ---------- */
  let angle = .42, spinV = 0, targetA = null, tilt = 0, tiltT = 0,
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
    tiltT = Math.max(-.28, Math.min(.28, tiltT + dy * .004));
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
    spinV = .085; touched = true;
  }));

  /* ---------- taille + boucle ---------- */
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 640 ? 40 : 32;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize, { passive: true });

  let visible = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '150px' }).observe(stage);

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
      else { spinV = 0; if (!touched) angle += .0032; }
    }
    tilt += (tiltT - tilt) * .08;
    tiltT *= .96;
    garment.rotation.y = angle;
    garment.rotation.x = tilt;
    garment.position.y = Math.sin(performance.now() * .0006) * .01;
    renderer.render(scene, camera);
  };
  tick();
}
