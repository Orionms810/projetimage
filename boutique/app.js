/* ═══════════════════════════════════════════════════════════════════════════
   UNSEEN — logique de la boutique
   Catalogue, filtres, panier persistant, aperçu rapide, et tous les effets
   de survol pilotés par la souris (projecteur, inclinaison 3D, magnétisme).
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const animationsReduites =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const survolFin = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

  /* ─────────────────────────────────────────────────────── catalogue ── */

  const TAILLES = ["XS", "S", "M", "L", "XL", "XXL"];

  const CATALOGUE = [
    {
      id: "hoodie-sakura-storm",
      nom: "Hoodie Sakura Storm",
      categorie: "hauts",
      typeLabel: "Hoodie — coton gratté 420 g",
      prix: 89,
      etiquette: "Best-seller",
      images: ["assets/hoodie-face.svg", "assets/hoodie-dos.svg"],
      tailles: ["S", "M", "L", "XL", "XXL"],
      rupture: ["XXL"],
      description:
        "La pièce maîtresse du drop 01. Impression pleine pièce : l'éclair " +
        "traverse le dos et se prolonge sur les manches. Capuche doublée, " +
        "poche kangourou, cordons blancs.",
    },
    {
      id: "tee-blossom",
      nom: "T-Shirt Compressé Blossom",
      categorie: "hauts",
      typeLabel: "T-shirt compressé — jersey 240 g",
      prix: 49,
      etiquette: null,
      images: ["assets/tee-face.svg", "assets/tee-dos.svg"],
      tailles: ["XS", "S", "M", "L", "XL"],
      rupture: [],
      description:
        "Coupe près du corps, jersey compressé qui tient le motif sans le " +
        "déformer. Le logo au cœur, 桜の力 dans le dos.",
    },
    {
      id: "crewneck-mienai",
      nom: "Crewneck 見えない力",
      categorie: "hauts",
      typeLabel: "Sweat col rond — molleton 400 g",
      prix: 79,
      etiquette: "Nouveau",
      images: ["assets/crew-face.svg", "assets/crew-dos.svg"],
      tailles: ["S", "M", "L", "XL"],
      rupture: ["S"],
      description:
        "Le hoodie sans la capuche : même motif, même densité d'impression, " +
        "une silhouette plus nette. Col côtelé renforcé.",
    },
    {
      id: "hoodie-ghost-petal",
      nom: "Hoodie Ghost Petal",
      categorie: "hauts",
      typeLabel: "Hoodie — impression clairsemée",
      prix: 85,
      etiquette: "Édition 60",
      images: ["assets/hoodie-alt-face.svg", "assets/hoodie-alt-dos.svg"],
      tailles: ["S", "M", "L", "XL"],
      rupture: [],
      description:
        "La version discrète : quelques branches seulement, le reste laissé " +
        "au noir. Soixante exemplaires, pas un de plus.",
    },
    {
      id: "tee-petal-fall",
      nom: "Tee Oversize Petal Fall",
      categorie: "hauts",
      typeLabel: "T-shirt oversize — coton 220 g",
      prix: 45,
      etiquette: null,
      images: ["assets/tee-alt-face.svg", "assets/tee-alt-dos.svg"],
      tailles: ["S", "M", "L", "XL", "XXL"],
      rupture: [],
      description:
        "Épaules tombantes, corps ample. Les pétales dérivent du col vers " +
        "l'ourlet comme s'ils tombaient vraiment.",
    },
    {
      id: "short-thunder",
      nom: "Short Thunder",
      categorie: "bas",
      typeLabel: "Short — taille élastiquée",
      prix: 55,
      etiquette: null,
      images: ["assets/short-face.svg", "assets/short-dos.svg"],
      tailles: ["S", "M", "L", "XL"],
      rupture: ["L"],
      description:
        "Coupe droite au-dessus du genou, ceinture large élastiquée, deux " +
        "poches latérales. L'éclair descend le long de la jambe gauche.",
    },
    {
      id: "casquette-sakura",
      nom: "Casquette Sakura",
      categorie: "accessoires",
      typeLabel: "Casquette 6 panneaux",
      prix: 35,
      etiquette: null,
      images: ["assets/cap-face.svg", "assets/cap-dos.svg"],
      tailles: ["Unique"],
      rupture: [],
      description:
        "Six panneaux, visière préformée, fermeture métal. Le motif court " +
        "sur les panneaux avant, le logo brodé au centre.",
    },
  ];

  /* ──────────────────────────────────────────────────────── panier ── */

  const CLE = "unseen:panier";
  let panier = [];

  function chargerPanier() {
    try {
      const brut = localStorage.getItem(CLE);
      const data = brut ? JSON.parse(brut) : [];
      // on ne garde que les lignes dont le produit existe encore
      panier = Array.isArray(data)
        ? data.filter((l) => CATALOGUE.some((p) => p.id === l.id) && l.qte > 0)
        : [];
    } catch {
      panier = [];
    }
  }

  function sauverPanier() {
    try { localStorage.setItem(CLE, JSON.stringify(panier)); } catch { /* mode privé */ }
  }

  const produitPar = (id) => CATALOGUE.find((p) => p.id === id);
  const totalArticles = () => panier.reduce((n, l) => n + l.qte, 0);
  const totalPrix = () =>
    panier.reduce((s, l) => s + (produitPar(l.id)?.prix ?? 0) * l.qte, 0);

  function ajouterAuPanier(id, taille) {
    const ligne = panier.find((l) => l.id === id && l.taille === taille);
    if (ligne) ligne.qte += 1;
    else panier.push({ id, taille, qte: 1 });
    sauverPanier();
    rendrePanier();
    const p = produitPar(id);
    toast(`${p.nom} · ${taille} ajouté`);
    pulserPastille();
  }

  function changerQte(id, taille, delta) {
    const ligne = panier.find((l) => l.id === id && l.taille === taille);
    if (!ligne) return;
    ligne.qte += delta;
    if (ligne.qte <= 0) panier = panier.filter((l) => l !== ligne);
    sauverPanier();
    rendrePanier();
  }

  function retirer(id, taille) {
    panier = panier.filter((l) => !(l.id === id && l.taille === taille));
    sauverPanier();
    rendrePanier();
    toast("Article retiré");
  }

  /* ─────────────────────────────────────────────── rendu du panier ── */

  const listePanier = $("[data-panier-liste]");
  const videPanier  = $("[data-panier-vide]");

  function rendrePanier() {
    const n = totalArticles();
    $$("[data-compteur-panier]").forEach((el) => { el.textContent = n; });
    $("[data-panier-total]").textContent = euros.format(totalPrix());

    listePanier.innerHTML = "";
    videPanier.hidden = panier.length > 0;

    panier.forEach((ligne) => {
      const p = produitPar(ligne.id);
      if (!p) return;
      const el = document.createElement("article");
      el.className = "ligne-panier";
      el.innerHTML = `
        <img src="${p.images[0]}" alt="">
        <div>
          <p class="ligne-panier__nom">${p.nom}</p>
          <p class="ligne-panier__meta">Taille ${ligne.taille}</p>
          <div class="qte">
            <button type="button" data-qte="-1" aria-label="Retirer un exemplaire">−</button>
            <span>${ligne.qte}</span>
            <button type="button" data-qte="1" aria-label="Ajouter un exemplaire">+</button>
          </div>
        </div>
        <span class="ligne-panier__prix">${euros.format(p.prix * ligne.qte)}</span>
        <button class="ligne-panier__suppr" type="button" data-suppr
                aria-label="Supprimer ${p.nom} taille ${ligne.taille}">✕</button>`;

      el.querySelector('[data-qte="-1"]').addEventListener("click", () => changerQte(p.id, ligne.taille, -1));
      el.querySelector('[data-qte="1"]').addEventListener("click", () => changerQte(p.id, ligne.taille, 1));
      el.querySelector("[data-suppr]").addEventListener("click", () => retirer(p.id, ligne.taille));
      listePanier.append(el);
    });
  }

  function pulserPastille() {
    $$("[data-compteur-panier]").forEach((el) => {
      el.classList.remove("pulse");
      void el.offsetWidth;          // force le redémarrage de l'animation
      el.classList.add("pulse");
    });
  }

  /* ────────────────────────────────────────────── grille produits ── */

  const grille = $("[data-grille]");
  const messageVide = $("[data-vide]");
  let filtreActif = "tout";
  let triActif = "defaut";

  function carteProduit(p, index) {
    const article = document.createElement("article");
    article.className = "produit";
    article.dataset.categorie = p.categorie;
    article.dataset.id = p.id;
    article.style.animationDelay = `${Math.min(index * 60, 420)}ms`;

    const petales = animationsReduites ? "" :
      Array.from({ length: 5 }, (_, i) => {
        const gauche = 12 + i * 18 + Math.round(Math.random() * 10);
        const delai = (i * 0.62).toFixed(2);
        const derive = Math.round(Math.random() * 60 - 30);
        return `<span class="produit__petale" style="left:${gauche}%;
                animation-delay:${delai}s;--derive:${derive}px"></span>`;
      }).join("");

    const tailles = p.tailles.map((t) => {
      const rupture = p.rupture.includes(t);
      return `<button class="taille" type="button" data-taille="${t}"
              ${rupture ? "disabled aria-label=\"Taille " + t + " épuisée\"" : ""}>${t}</button>`;
    }).join("");

    article.innerHTML = `
      <div class="produit__cadre">
        <button class="produit__media" type="button" data-apercu
                aria-label="Aperçu rapide : ${p.nom}">
          <img class="produit__img produit__img--face" src="${p.images[0]}"
               alt="${p.nom}, vue de face" loading="lazy">
          <img class="produit__img produit__img--dos" src="${p.images[1]}"
               alt="" aria-hidden="true" loading="lazy">
          <span class="produit__halo" aria-hidden="true"></span>
          <span class="produit__eclair" aria-hidden="true"></span>
          <span class="produit__petales" aria-hidden="true">${petales}</span>
          ${p.etiquette ? `<span class="produit__etiquette">${p.etiquette}</span>` : ""}
          <span class="produit__oeil" aria-hidden="true">Aperçu rapide</span>
        </button>
        <div class="produit__ajout">
          <p class="produit__ajout-titre">Ajout rapide</p>
          <div class="produit__tailles">${tailles}</div>
        </div>
      </div>
      <div class="produit__infos">
        <h3 class="produit__nom">${p.nom}</h3>
        <p class="produit__prix">${euros.format(p.prix)}</p>
        <p class="produit__meta">${p.typeLabel}</p>
      </div>`;

    article.querySelector("[data-apercu]").addEventListener("click", () => ouvrirApercu(p.id));
    $$("[data-taille]", article).forEach((btn) => {
      btn.addEventListener("click", () => ajouterAuPanier(p.id, btn.dataset.taille));
    });

    brancherProjecteur(article, article.querySelector(".produit__cadre"));
    return article;
  }

  function rendreGrille() {
    let liste = CATALOGUE.filter(
      (p) => filtreActif === "tout" || p.categorie === filtreActif
    );
    if (triActif === "prix-asc")  liste = [...liste].sort((a, b) => a.prix - b.prix);
    if (triActif === "prix-desc") liste = [...liste].sort((a, b) => b.prix - a.prix);
    if (triActif === "nom")       liste = [...liste].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

    grille.innerHTML = "";
    liste.forEach((p, i) => grille.append(carteProduit(p, i)));
    messageVide.hidden = liste.length > 0;
  }

  /* ───────────────────────────────────────────── aperçu rapide ── */

  const modale = $("[data-modale]");
  let produitOuvert = null;
  let tailleChoisie = null;
  let dernierFocus = null;

  function ouvrirApercu(id) {
    const p = produitPar(id);
    if (!p) return;
    produitOuvert = p;
    tailleChoisie = null;
    dernierFocus = document.activeElement;

    $("[data-modale-cat]").textContent = p.typeLabel;
    $("[data-modale-nom]").textContent = p.nom;
    $("[data-modale-prix]").textContent = euros.format(p.prix);
    $("[data-modale-desc]").textContent = p.description;

    const image = $("[data-modale-image]");
    image.src = p.images[0];
    image.alt = `${p.nom}, vue de face`;

    const vignettes = $("[data-modale-vignettes]");
    vignettes.innerHTML = "";
    p.images.forEach((src, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "vignette" + (i === 0 ? " est-actif" : "");
      b.setAttribute("aria-label", i === 0 ? "Voir la face" : "Voir le dos");
      b.innerHTML = `<img src="${src}" alt="">`;
      // la vignette change l'image principale au survol comme au clic
      const montrer = () => {
        image.src = src;
        $$(".vignette", vignettes).forEach((v) => v.classList.remove("est-actif"));
        b.classList.add("est-actif");
      };
      b.addEventListener("mouseenter", montrer);
      b.addEventListener("click", montrer);
      b.addEventListener("focus", montrer);
      vignettes.append(b);
    });

    const zoneTailles = $("[data-modale-tailles]");
    zoneTailles.innerHTML = "";
    p.tailles.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "taille";
      b.textContent = t;
      b.setAttribute("aria-pressed", "false");
      if (p.rupture.includes(t)) {
        b.disabled = true;
        b.setAttribute("aria-label", `Taille ${t} épuisée`);
      } else {
        b.addEventListener("click", () => {
          tailleChoisie = t;
          $$(".taille", zoneTailles).forEach((x) => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", "true");
        });
      }
      zoneTailles.append(b);
    });

    ouvrirCouche(modale, "est-ouvert");
    $("[data-fermer-modale]").focus();
  }

  function fermerApercu() {
    fermerCouche(modale, "est-ouvert");
    produitOuvert = null;
    dernierFocus?.focus();
  }

  /* ──────────────────────────────────── couches (tiroir + modale) ── */

  const fond = $("[data-fond]");
  const tiroir = $("[data-panier]");

  function ouvrirCouche(el, classe) {
    el.hidden = false;
    fond.hidden = false;
    void el.offsetWidth;
    el.classList.add(classe);
    fond.classList.add("est-visible");
    el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function fermerCouche(el, classe) {
    el.classList.remove(classe);
    fond.classList.remove("est-visible");
    el.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    const finir = () => { el.hidden = true; fond.hidden = true; };
    animationsReduites ? finir() : setTimeout(finir, 450);
  }

  const ouvrirPanier = () => { ouvrirCouche(tiroir, "est-ouvert"); $("[data-fermer-panier]").focus(); };
  const fermerPanier = () => fermerCouche(tiroir, "est-ouvert");

  function toutFermer() {
    if (tiroir.classList.contains("est-ouvert")) fermerPanier();
    if (modale.classList.contains("est-ouvert")) fermerApercu();
  }

  /* ───────────────────────────────────────────────────── toasts ── */

  const zoneToasts = $("[data-toasts]");

  function toast(message) {
    const el = document.createElement("p");
    el.className = "toast";
    el.textContent = message;
    zoneToasts.append(el);
    setTimeout(() => {
      el.classList.add("part");
      setTimeout(() => el.remove(), 350);
    }, 2600);
  }

  /* ══════════════════════════════════════════════════════════════════
     Effets de survol pilotés à la souris
     ══════════════════════════════════════════════════════════════════ */

  /* projecteur + inclinaison 3D : on ne touche qu'à des variables CSS,
     le reste du rendu est décrit dans styles.css */
  function brancherProjecteur(zone, cible = zone) {
    if (!survolFin || animationsReduites) return;

    zone.addEventListener("pointermove", (e) => {
      const r = zone.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      cible.style.setProperty("--sx", `${x * 100}%`);
      cible.style.setProperty("--sy", `${y * 100}%`);
      if (cible.classList.contains("produit__cadre")) {
        cible.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
        cible.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
      }
    });

    zone.addEventListener("pointerleave", () => {
      cible.style.setProperty("--rx", "0deg");
      cible.style.setProperty("--ry", "0deg");
    });
  }

  /* boutons magnétiques : le bouton vient vers le curseur */
  function brancherMagnetisme(btn) {
    if (!survolFin || animationsReduites) return;
    const force = 0.28;

    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${dx * force}px, ${dy * force * 1.4}px)`;
    });

    btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
  }

  /* curseur personnalisé : anneau amorti + point qui colle au pointeur */
  function brancherCurseur() {
    if (!survolFin || animationsReduites) return;
    const curseur = $(".curseur");
    const anneau = $(".curseur__anneau");
    const point = $(".curseur__point");
    let cx = 0, cy = 0, ax = 0, ay = 0;

    document.addEventListener("pointermove", (e) => {
      cx = e.clientX; cy = e.clientY;
      curseur.classList.add("est-actif");
      point.style.transform = `translate(${cx}px, ${cy}px)`;
    });
    document.addEventListener("pointerdown", () => curseur.classList.add("est-clic"));
    document.addEventListener("pointerup", () => curseur.classList.remove("est-clic"));
    document.addEventListener("pointerleave", () => curseur.classList.remove("est-actif"));

    const interactifs = "a, button, input, select, .produit, .tuile, .carte-info";
    document.addEventListener("pointerover", (e) => {
      curseur.classList.toggle("est-survol", !!e.target.closest(interactifs));
    });

    (function boucle() {
      ax += (cx - ax) * 0.18;           // amortissement : l'anneau traîne un peu
      ay += (cy - ay) * 0.18;
      anneau.style.transform = `translate(${ax}px, ${ay}px)`;
      requestAnimationFrame(boucle);
    })();
  }

  /* pétales qui tombent dans le hero */
  function semerPetales() {
    if (animationsReduites) return;
    const zone = $(".petales");
    for (let i = 0; i < 16; i++) {
      const p = document.createElement("span");
      const t = 5 + Math.random() * 9;
      p.className = "petale";
      p.style.left = `${Math.random() * 100}%`;
      p.style.width = `${t}px`;
      p.style.height = `${t}px`;
      p.style.animationDuration = `${9 + Math.random() * 12}s`;
      p.style.animationDelay = `${-Math.random() * 16}s`;
      p.style.setProperty("--derive", `${Math.random() * 180 - 90}px`);
      zone.append(p);
    }
  }

  /* ─────────────────────────────────────────────────── branchements ── */

  function init() {
    chargerPanier();
    rendreGrille();
    rendrePanier();
    semerPetales();
    brancherCurseur();

    $$("[data-projecteur]").forEach((el) => brancherProjecteur(el));
    $$(".btn--magnetique").forEach(brancherMagnetisme);

    // filtres
    $$("[data-filtre]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$("[data-filtre]").forEach((b) => b.classList.remove("est-actif"));
        btn.classList.add("est-actif");
        filtreActif = btn.dataset.filtre;
        rendreGrille();
      });
    });

    $("[data-tri]").addEventListener("change", (e) => {
      triActif = e.target.value;
      rendreGrille();
    });

    // panier
    $("[data-ouvrir-panier]").addEventListener("click", ouvrirPanier);
    $("[data-fermer-panier]").addEventListener("click", fermerPanier);
    fond.addEventListener("click", toutFermer);
    $("[data-fermer-modale]").addEventListener("click", fermerApercu);

    $("[data-commander]").addEventListener("click", () => {
      if (!panier.length) return toast("Votre panier est vide");
      toast(`Commande de ${euros.format(totalPrix())} — vitrine de démonstration`);
    });

    $("[data-modale-ajouter]").addEventListener("click", () => {
      if (!produitOuvert) return;
      if (!tailleChoisie) return toast("Choisissez une taille");
      ajouterAuPanier(produitOuvert.id, tailleChoisie);
      fermerApercu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") toutFermer();
    });

    // menu mobile
    const burger = $("[data-burger]");
    const nav = $(".nav");
    burger.addEventListener("click", () => {
      const ouvert = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!ouvert));
      nav.classList.toggle("est-ouvert", !ouvert);
    });
    $$(".lien-nav").forEach((a) => a.addEventListener("click", () => {
      burger.setAttribute("aria-expanded", "false");
      nav.classList.remove("est-ouvert");
    }));

    // en-tête qui se détache au défilement
    const entete = $("#entete");
    const surveiller = () => entete.classList.toggle("est-colle", window.scrollY > 12);
    surveiller();
    window.addEventListener("scroll", surveiller, { passive: true });

    // newsletter
    $("[data-newsletter]").addEventListener("submit", (e) => {
      e.preventDefault();
      const champ = $("#email");
      const note = $("[data-newsletter-note]");
      if (!champ.value || !champ.checkValidity()) {
        note.textContent = "Adresse invalide.";
        champ.focus();
        return;
      }
      note.textContent = "C'est noté — vous saurez avant les autres.";
      toast("Inscription enregistrée");
      champ.value = "";
    });

    $("[data-annee]").textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
