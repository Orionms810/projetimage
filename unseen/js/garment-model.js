/* ===========================================================
   UNSEEN — garment-model.js
   Construction des vêtements en 3D : corps, manches, capuche,
   poche, côtes, plis de tissu. Utilisé par le site et par le
   rendu haute définition des visuels.
   =========================================================== */
import * as THREE from './vendor/three.module.min.js';
import { SimplexNoise } from './vendor/SimplexNoise.js';

const noise = new SimplexNoise({ random: (() => { let s = 12345; return () => (s = s * 16807 % 2147483647) / 2147483647; })() });
const fbm = (x, y, z) => noise.noise3d(x, y, z) + .5 * noise.noise3d(x * 2.1, y * 2.1, z * 2.1)
                       + .25 * noise.noise3d(x * 4.3, y * 4.3, z * 4.3);

/* interpolation douce sur des points de contrôle [t, valeur] */
export const curveAt = (pts, t) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i], [t1, v1] = pts[i + 1];
    if (t <= t1 || i === pts.length - 2) {
      const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
      return v0 + (v1 - v0) * (k * k * (3 - 2 * k));
    }
  }
  return pts[pts.length - 1][1];
};

/* section en super-ellipse : le tissu est plat devant/derrière, arrondi sur les côtés */
const sect = (a, rx, rz, n = 2.5) => {
  const c = Math.cos(a), s = Math.sin(a);
  const f = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), -1 / n);
  return [c * f * rx, s * f * rz];
};

/* grille paramétrique -> BufferGeometry, avec couleurs de sommet (creux = plus sombre) */
function surface(rows, cols, fn, uRep = 1, vRep = 1, closed = true) {
  const pos = [], uv = [], col = [], idx = [];
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const t = i / rows, u = j / cols;
      const p = fn(t, u);
      pos.push(p[0], p[1], p[2]);
      uv.push(u * uRep, t * vRep);
      const sh = p[3] === undefined ? 1 : p[3];
      col.push(sh, sh, sh);
      idx.length;
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
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export const SPECS = {
  hoodie: {
    hemY: -.80, topY: .66, neckR: .175, hood: true, pocket: true, drape: 1,
    rx: [[0, .505], [.18, .495], [.45, .487], [.70, .497], [.88, .525], [1, .50]],
    rz: [[0, .275], [.18, .272], [.45, .268], [.70, .282], [.88, .305], [1, .29]],
    sleeve: [[.10, .50, 0], [.44, .45, .02], [.66, .16, .05], [.72, -.20, .06], [.70, -.46, .05]],
    sleeveR: [[0, .255], [.18, .215], [.55, .165], [.86, .128], [1, .118]],
    logoY: [.735, .80], logoW: .70, print: [1.05, 1.15]
  },
  tee: {
    hemY: -.70, topY: .62, neckR: .155, hood: false, pocket: false, drape: .42,
    rx: [[0, .375], [.16, .365], [.42, .372], [.62, .405], [.86, .455], [1, .43]],
    rz: [[0, .195], [.16, .19], [.42, .196], [.62, .215], [.86, .245], [1, .235]],
    sleeve: [[.08, .46, 0], [.38, .40, .02], [.54, .22, .04], [.60, .02, .05]],
    sleeveR: [[0, .225], [.25, .175], [.7, .145], [1, .132]],
    logoY: [.70, .765], logoW: .58, print: [.95, 1.05]
  }
};

/* plis du tissu : bruit multi-échelle + drapé vertical, plus marqué en bas */
const wrinkle = (S, x, y, z, a, t) => {
  const d = S.drape;
  const big   = fbm(x * 2.6, y * 2.2, z * 2.6) * .021 * d;
  const fine  = noise.noise3d(x * 9, y * 8, z * 9) * .005 * d;
  const drape = Math.sin(a * 9 + fbm(x, y * .6, z) * 2.4) * .013 * d * Math.pow(1 - t, 1.2);
  return big + fine + drape;
};

export function buildGarment(key, mats) {
  const S = SPECS[key];
  const g = new THREE.Group();
  const H = S.topY - S.hemY;

  /* ---------- corps ---------- */
  const bodyPt = (t, u) => {
    const a = u * Math.PI * 2;
    /* épaules : large jusqu'à 0.88 puis pente vers l'encolure */
    let k = 1, lift = 0;
    if (t > .86) {
      const s = (t - .86) / .14;
      k = 1 - Math.pow(s, 1.7) * (1 - S.neckR / curveAt(S.rx, 1));
      lift = Math.pow(s, .8) * .03;
    }
    const rx = curveAt(S.rx, t) * k, rz = curveAt(S.rz, t) * k;
    let [x, z] = sect(a, rx, rz);
    const y = S.hemY + H * t + lift;
    const w = wrinkle(S, x, y, z, a, t);
    const nrm = Math.hypot(x, z) || 1;
    x += x / nrm * w; z += z / nrm * w;
    /* ombrage : creux + coutures latérales + dessous des épaules */
    const seam = Math.exp(-Math.pow(Math.min(Math.abs(Math.sin(a)), 1) * 9, 2)) * .22;
    const sh = Math.min(1.12, 1 + w * 14) * (1 - seam) * (t > .9 ? .94 : 1);
    return [x, y, z, sh];
  };
  const body = new THREE.Mesh(surface(96, 112, bodyPt, S.print[0], S.print[1]), mats.printed);
  body.castShadow = body.receiveShadow = true;
  g.add(body);

  /* ---------- manches ---------- */
  [1, -1].forEach(side => {
    const path = new THREE.CatmullRomCurve3(S.sleeve.map(([x, y, z]) => new THREE.Vector3(x * side, y, z)));
    const fr = path.computeFrenetFrames(40, false);
    const at = (t, u, rMul = 1, dy = 0) => {
      const i = Math.min(Math.round(t * 40), 40);
      const P = path.getPointAt(Math.min(Math.max(t, 0), 1));
      const N = fr.normals[i], B = fr.binormals[i], a = u * Math.PI * 2;
      const r = curveAt(S.sleeveR, t) * rMul;
      const c = Math.cos(a), s = Math.sin(a);
      let x = P.x + (N.x * c + B.x * s) * r;
      let y = P.y + (N.y * c + B.y * s) * r + dy;
      let z = P.z + (N.z * c + B.z * s) * r;
      return [x, y, z, a, P];
    };
    const sleeve = surface(56, 46, (t, u) => {
      const [x, y, z, a, P] = at(t, u);
      const w = wrinkle(S, x, y, z, a + t * 6, .5 - t * .5) * (t < .12 ? .3 : 1.25);
      const dx = x - P.x, dy = y - P.y, dz = z - P.z, n = Math.hypot(dx, dy, dz) || 1;
      const sh = Math.min(1.1, 1 + w * 15) * (t < .1 ? .82 : 1);   // emmanchure dans l'ombre
      return [x + dx / n * w, y + dy / n * w, z + dz / n * w, sh];
    }, .8, 1.15);
    const m = new THREE.Mesh(sleeve, mats.printed);
    m.castShadow = m.receiveShadow = true;
    g.add(m);

    /* poignet côtelé */
    const cuff = surface(12, 46, (t, u) => {
      const tt = .93 + t * .075;
      const [x, y, z, a] = at(Math.min(tt, 1), u, 1.035 + Math.sin(u * Math.PI * 2 * 30) * .013);
      return [x, y, z, .86 + Math.sin(u * Math.PI * 2 * 30) * .14];
    });
    const cm = new THREE.Mesh(cuff, mats.rib); cm.castShadow = true; g.add(cm);
  });

  /* ---------- bas côtelé + fond ---------- */
  const hem = surface(12, 112, (t, u) => {
    const a = u * Math.PI * 2;
    const rr = 1.004 + Math.sin(a * 46) * .011;
    const [x, z] = sect(a, curveAt(S.rx, 0) * rr, curveAt(S.rz, 0) * rr);
    return [x, S.hemY - .055 + t * .075, z, .8 + Math.sin(a * 46) * .14];
  });
  const hm = new THREE.Mesh(hem, mats.rib); hm.castShadow = hm.receiveShadow = true; g.add(hm);

  const bottom = surface(8, 112, (t, u) => {
    const a = u * Math.PI * 2;
    const [x, z] = sect(a, curveAt(S.rx, 0) * (1 - t) * 1.004, curveAt(S.rz, 0) * (1 - t) * 1.004);
    return [x, S.hemY - .055 - t * .02, z, .5];
  });
  g.add(new THREE.Mesh(bottom, mats.rib));

  /* ---------- encolure ---------- */
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(S.neckR + .03, .028, 16, 64), mats.rib);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = S.topY + .030;
  collar.castShadow = true;
  g.add(collar);

  /* ---------- capuche : rouleau posé sur les épaules ---------- */
  if (S.hood) {
    const arc = u => {                      // de l'épaule gauche, derrière la tête, à l'épaule droite
      const th = Math.PI * (.12 + u * .76);
      return new THREE.Vector3(
        Math.cos(th) * .365,
        S.topY - .055 + Math.sin(Math.PI * u) * .315,
        -.02 - Math.sin(Math.PI * u) * .245
      );
    };
    const hood = surface(46, 40, (t, u) => {
      const P = arc(t);
      const nxt = arc(Math.min(t + .02, 1)), prv = arc(Math.max(t - .02, 0));
      const T = nxt.clone().sub(prv).normalize();
      const N = new THREE.Vector3(0, 1, 0).cross(T).normalize();
      const B = T.clone().cross(N).normalize();
      const r = (.085 + Math.pow(Math.sin(Math.PI * t), .6) * .105);
      const a = u * Math.PI * 2;
      const x = P.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r;
      const y = P.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r;
      const z = P.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r;
      const w = wrinkle(S, x, y, z, a, .5) * 1.1;
      const sh = Math.min(1.1, 1 + w * 14) * (Math.sin(a) < -.2 ? .55 : 1);   // intérieur sombre
      return [x, y, z, sh];
    }, 1.5, 1);
    const hm2 = new THREE.Mesh(hood, mats.printed);
    hm2.castShadow = hm2.receiveShadow = true;
    g.add(hm2);

    /* cordons */
    [-.075, .075].forEach(x => {
      const zFront = curveAt(S.rz, .88) * 1.05;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(.0095, .0105, .30, 10), mats.cord);
      c.position.set(x, S.topY - .085, zFront);
      c.rotation.set(-.16, 0, x > 0 ? -.05 : .05);
      c.castShadow = true;
      g.add(c);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .032, 10), mats.rib);
      tip.position.set(x * 1.05, S.topY - .238, zFront + .022);
      tip.castShadow = true;
      g.add(tip);
    });

    /* poche kangourou */
    const pocket = surface(26, 46, (t, u) => {
      const taper = .55 + .45 * Math.pow(t, .5);            // plus étroite vers le bas
      const a = Math.PI * .5 + (u - .5) * 1.85 * taper;
      const tt = .085 + t * .235;
      const lip = t > .93 ? (t - .93) / .07 * .014 : 0;      // lèvre d'ouverture
      const b = bodyPt(tt, a / (Math.PI * 2));
      const k = 1.042 + lip;
      const edge = Math.min(1, Math.min(t, 1 - t) * 10, Math.min(u, 1 - u) * 8);
      return [b[0] * k, b[1], b[2] * (k + .012), .72 + edge * .26];
    });
    const pm = new THREE.Mesh(pocket, mats.rib);
    pm.castShadow = pm.receiveShadow = true;
    g.add(pm);
  }

  /* ---------- logo poitrine (blanc, jamais recoloré) ---------- */
  const logo = surface(10, 36, (t, u) => {
    const a = Math.PI * .5 - (u - .5) * S.logoW;
    const tt = S.logoY[0] + t * (S.logoY[1] - S.logoY[0]);
    const b = bodyPt(tt, a / (Math.PI * 2));
    return [b[0] * 1.022, b[1], b[2] * 1.035, 1];
  });
  const lm = new THREE.Mesh(logo, mats.logo);
  lm.renderOrder = 3;
  g.add(lm);

  return g;
}

/* ---------- matériaux ---------- */
export function makeMaterials(print, logoTex) {
  const fabric = fabricNormal();
  const printed = new THREE.MeshPhysicalMaterial({
    map: print, color: new THREE.Color(0x8c8c8c),
    normalMap: fabric, normalScale: new THREE.Vector2(.5, .5),
    roughness: .96, metalness: 0, vertexColors: true,
    sheen: .75, sheenRoughness: .95, sheenColor: new THREE.Color(0x4a4258),
    envMapIntensity: .22
  });
  const rib = new THREE.MeshPhysicalMaterial({
    color: 0x08080b, normalMap: fabric, normalScale: new THREE.Vector2(.8, .8),
    roughness: .98, metalness: 0, vertexColors: true,
    sheen: .6, sheenRoughness: .98, sheenColor: new THREE.Color(0x3a3444),
    envMapIntensity: .18
  });
  const cord = new THREE.MeshPhysicalMaterial({ color: 0x141418, roughness: .8, sheen: .8 });
  const logo = new THREE.MeshBasicMaterial({
    map: logoTex, transparent: true, depthWrite: false, toneMapped: false,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6
  });
  return { printed, rib, cord, logo };
}

/* normal map de tissu générée en mémoire */
function fabricNormal() {
  const S = 512, h = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const weave = Math.sin(x * Math.PI / 2.4) * Math.sin(y * Math.PI / 2.4) * .45;
      h[y * S + x] = weave + noise.noise(x * .06, y * .06) * .55 + noise.noise(x * .22, y * .22) * .22;
    }
  }
  const c = document.createElement('canvas'); c.width = c.height = S;
  const ctx = c.getContext('2d'), img = ctx.createImageData(S, S);
  const at = (x, y) => h[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = at(x + 1, y) - at(x - 1, y), dy = at(x, y + 1) - at(x, y - 1);
      const nx = -dx, ny = -dy, nz = 1;
      const l = Math.hypot(nx, ny, nz), i = (y * S + x) * 4;
      img.data[i]     = (nx / l * .5 + .5) * 255;
      img.data[i + 1] = (ny / l * .5 + .5) * 255;
      img.data[i + 2] = (nz / l * .5 + .5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  return t;
}
