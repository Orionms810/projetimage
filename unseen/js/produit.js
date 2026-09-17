/* ===========================================================
   UNSEEN — fiche produit
   =========================================================== */
(() => {
  'use strict';
  /* toujours arriver en haut de la page : le navigateur restaure sinon la
     position précédente, et le défilement doux de la feuille de style
     transformerait le saut en animation */
  const enHaut = () => {
    try { scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (_) { scrollTo(0, 0); }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    try { parent !== window && parent.scrollTo(0, 0); } catch (_) { /* cadre d'une autre origine */ }
  };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  enHaut();
  addEventListener('DOMContentLoaded', enHaut);
  addEventListener('load', enHaut);
  addEventListener('pageshow', enHaut);
  const $ = (s, r = document) => r.querySelector(s);
  if (!window.UNSEEN) return;

  const ref = new URLSearchParams(location.search).get('ref') || 'hoodie';
  const p = window.UNSEEN.produits[ref];
  if (!p) { location.replace('boutique.html'); return; }

  document.title = `${p.nom} — UNSEEN`;
  $('#prodFil').textContent = p.court;
  $('#prodBadge').textContent = `${p.badge} — ${window.UNSEEN.collection}`;
  $('#prodNom').textContent = p.nom;
  $('#prodPrix').textContent = p.prix + ' €';
  $('#prodResume').textContent = p.resume;
  $('#prodDesc').textContent = p.description.replace(/\s+/g, ' ').trim();
  $('#prodSpecs').innerHTML = p.specs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

  /* ---------- visuels : flèches + vignettes ---------- */
  const img = $('#prodImg'), thumbs = $('#prodThumbs'), compte = $('#prodCount');
  let i = 0;
  const montrer = k => {
    i = (k + p.vues.length) % p.vues.length;
    const [nom, label] = p.vues[i];
    img.classList.add('is-swap');
    const pre = new Image();
    pre.onload = () => { img.src = pre.src; img.alt = `${p.nom} — ${label}`; img.classList.remove('is-swap'); };
    pre.src = `assets/${nom}.jpg`;
    [...thumbs.children].forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
    compte.textContent = `${i + 1} / ${p.vues.length}`;
  };
  thumbs.innerHTML = p.vues.map(([nom, label], k) =>
    `<button type="button" aria-label="Voir : ${label}" data-k="${k}">
       <img src="assets/${nom}.jpg" alt=""></button>`).join('');
  thumbs.addEventListener('click', e => {
    const b = e.target.closest('button[data-k]'); if (b) montrer(+b.dataset.k);
  });
  $('#prodPrev').addEventListener('click', () => montrer(i - 1));
  $('#prodNext').addEventListener('click', () => montrer(i + 1));
  addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowLeft')  montrer(i - 1);
    if (e.key === 'ArrowRight') montrer(i + 1);
  });
  img.src = `assets/${p.vues[0][0]}.jpg`;
  montrer(0);

  /* ---------- tailles, stock, quantité ---------- */
  const sizes = $('#prodSizes'), stockTxt = $('#prodStock'),
        qtyVal = $('#qtyVal'), msg = $('#prodMsg');
  let taille = null, qty = 1;

  sizes.innerHTML = Object.entries(p.stock).map(([t, n]) =>
    `<button type="button" data-t="${t}" ${n ? '' : 'disabled'}
       aria-label="Taille ${t}${n ? '' : ' — épuisée'}">${t}${n ? '' : '<i>×</i>'}</button>`).join('');

  const maxQty = () => taille ? p.stock[taille] : 1;
  const majStock = () => {
    if (!taille) {
      const total = Object.values(p.stock).reduce((a, b) => a + b, 0);
      stockTxt.textContent = `— ${total} pièces en stock`;
      stockTxt.className = 'prod__stockline';
      return;
    }
    const n = p.stock[taille];
    stockTxt.textContent = n > 4 ? `— ${n} en stock en ${taille}` : `— plus que ${n} en ${taille}`;
    stockTxt.className = 'prod__stockline' + (n <= 4 ? ' is-low' : '');
  };
  const majQty = () => {
    qty = Math.max(1, Math.min(qty, maxQty()));
    qtyVal.textContent = qty;
    $('#qtyPlus').disabled = qty >= maxQty();
    $('#qtyMinus').disabled = qty <= 1;
  };

  sizes.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    [...sizes.children].forEach(x => x.classList.remove('is-sel'));
    b.classList.add('is-sel');
    taille = b.dataset.t; qty = 1;
    majStock(); majQty(); msg.textContent = '';
  });
  $('#qtyPlus').addEventListener('click', () => { qty++; majQty(); });
  $('#qtyMinus').addEventListener('click', () => { qty--; majQty(); });

  $('#prodAdd').addEventListener('click', () => {
    if (!taille) {
      msg.textContent = 'Choisis une taille avant d\'ajouter.';
      sizes.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }],
        { duration: 260, iterations: 2 });
      return;
    }
    window.PANIER?.ajouter({
      name: p.nom, size: taille, price: p.prix, qty,
      img: `assets/${p.vues[0][0]}.jpg`
    });
    msg.textContent = `${qty} × ${p.court} en ${taille} ajouté${qty > 1 ? 's' : ''}.`;
  });

  majStock(); majQty();

  /* ---------- les autres pièces ---------- */
  const autres = Object.values(window.UNSEEN.produits).filter(a => a.ref !== ref);
  $('#prodAutres').innerHTML = autres.map(a => `
    <article class="shopcard is-in">
      <a class="shopcard__media" href="produit.html?ref=${a.ref}">
        <img loading="lazy" decoding="async" src="assets/${a.vues[0][0]}.jpg" alt="${a.nom}">
      </a>
      <div class="shopcard__body">
        <h3><a href="produit.html?ref=${a.ref}">${a.nom}</a></h3>
        <p class="shopcard__bas"><span class="card__price">${a.prix} €</span></p>
      </div>
    </article>`).join('');
})();
