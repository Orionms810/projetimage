/* ===========================================================
   UNSEEN — page boutique
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
  const grille = document.getElementById('shopGrid');
  if (!grille || !window.UNSEEN) return;

  const carte = p => {
    const total = Object.values(p.stock).reduce((a, b) => a + b, 0);
    return `
      <article class="shopcard">
        <a class="shopcard__media" href="produit.html?ref=${p.ref}">
          <img loading="lazy" decoding="async" src="assets/${p.vues[0][0]}.jpg" alt="${p.nom}">
          <span class="card__badge">${p.badge}</span>
        </a>
        <div class="shopcard__body">
          <h2><a href="produit.html?ref=${p.ref}">${p.nom}</a></h2>
          <p class="shopcard__resume">${p.resume}</p>
          <p class="shopcard__bas">
            <span class="card__price">${p.prix} €</span>
            <span class="shopcard__stock ${total < 6 ? 'is-low' : ''}">${
              total ? `${total} en stock` : 'Épuisé'}</span>
          </p>
          <a class="btn btn--fill shopcard__cta" href="produit.html?ref=${p.ref}">Choisir sa taille</a>
        </div>
      </article>`;
  };

  const produits = Object.values(window.UNSEEN.produits);
  grille.innerHTML = produits.map(carte).join('');

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  [...grille.children].forEach(c => io.observe(c));

  /* ---------- recherche ---------- */
  const champ = document.getElementById('shopSearch'),
        vider = document.getElementById('shopClear'),
        compte = document.getElementById('shopCount'),
        vide = document.getElementById('shopVide');

  /* accents et casse ignorés : « compresse » trouve « compressé » */
  const plat = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  /* deux niveaux : on cherche d'abord dans les noms, et on n'élargit au texte
     que si rien ne sort — sinon « hoodie » remonterait un t-shirt dont la
     description cite le hoodie */
  const titres = produits.map(p => plat([p.nom, p.court, p.ref, p.badge,
                                         window.UNSEEN.collection].join(' ')));
  const textes = produits.map((p, i) => titres[i] + ' ' + plat([
    p.resume, p.description, ...p.specs.map(s => s.join(' '))].join(' ')));

  const filtrer = () => {
    const q = plat(champ.value.trim());
    const mots = q ? q.split(/\s+/) : [];
    /* début de mot plutôt que sous-chaîne : « tee » ne doit pas trouver
       « édition limitée » une fois les accents retirés */
    const motifs = mots.map(m => new RegExp('\\b' + m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const colle = liste => liste.map(t => motifs.every(r => r.test(t)));
    let trouve = colle(titres);
    if (mots.length && !trouve.some(Boolean)) trouve = colle(textes);
    let n = 0;
    [...grille.children].forEach((carte, i) => {
      carte.hidden = !trouve[i];
      if (trouve[i]) n++;
    });
    vider.hidden = !champ.value;
    vide.hidden = n > 0;
    compte.textContent = mots.length
      ? `${n} pièce${n > 1 ? 's' : ''} sur ${produits.length}`
      : `${produits.length} pièces`;
  };

  champ.addEventListener('input', filtrer);
  champ.addEventListener('keydown', e => {
    if (e.key === 'Escape') { champ.value = ''; filtrer(); }
  });
  vider.addEventListener('click', () => { champ.value = ''; filtrer(); champ.focus(); });

  /* ?q=hoodie dans l'URL pré-remplit la recherche */
  const q0 = new URLSearchParams(location.search).get('q');
  if (q0) champ.value = q0;
  filtrer();
})();
