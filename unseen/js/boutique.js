/* ===========================================================
   UNSEEN — page boutique
   =========================================================== */
(() => {
  'use strict';
  /* toujours arriver en haut de la page, même après un retour navigateur */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  addEventListener('load', () => scrollTo(0, 0));
  const grille = document.getElementById('shopGrid');
  if (!grille || !window.UNSEEN) return;

  const carte = p => {
    const total = Object.values(p.stock).reduce((a, b) => a + b, 0);
    return `
      <article class="shopcard">
        <a class="shopcard__media" href="produit.html?ref=${p.ref}">
          <img loading="lazy" decoding="async" src="assets/${p.vues[0][0]}.jpg" alt="${p.nom}">
          <span class="card__badge">${p.badge}</span>
          <span class="card__go">Voir la fiche</span>
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

  grille.innerHTML = Object.values(window.UNSEEN.produits).map(carte).join('');

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  [...grille.children].forEach(c => io.observe(c));
})();
