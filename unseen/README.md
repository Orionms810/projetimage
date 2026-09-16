# UNSEEN — site vitrine

Site one-page à défilement parallaxe pour la marque **UNSEEN** (collection *Japanese Blossom*),
inspiré des sites de campagne type Adidas × Foot Locker : fond noir, narration au scroll,
typo display, et les visuels produit comme héros de la page.

## Lancer le site

Aucun build, aucune dépendance. Un simple serveur statique suffit :

```bash
cd unseen
python3 -m http.server 8000
# puis http://localhost:8000
```

Mise en ligne : déposer le dossier `unseen/` tel quel sur Netlify, Vercel, GitHub Pages ou un FTP.

## Structure

```
unseen/
├── index.html          # toutes les sections
├── css/style.css       # design system + animations
├── js/main.js          # scroll, parallaxe, pins, pétales, panier (vanilla JS)
├── js/garment3d.js     # modèles 3D du hoodie et du t-shirt (Three.js)
├── js/vendor/          # Three.js r169 (licence MIT incluse)
├── fonts/              # Anton + Inter auto-hébergés (woff2)
└── assets/             # visuels découpés depuis les planches de la marque
```

## Sections

1. **Hero** — motif sakura/éclair en parallaxe, logo UNSEEN, *Strength Beyond Sight*
2. **Marquee** — bandeau défilant dont la vitesse suit le scroll
3. **Histoire** — section épinglée : 3 visuels + texte révélé mot à mot
4. **Manifeste** — 強さは目に見えない, image en parallaxe
5. **Collection** — hoodie 89 € / t-shirt compressé 45 €, survol face↔dos, tailles, ajout panier
6. **Vue 360** — le hoodie et le t-shirt sont **modélisés en 3D** (Three.js) et se font
   pivoter à la souris, au doigt, aux flèches ou au clavier
7. **Détails** — galerie à défilement horizontal piloté par le scroll vertical
8. **Personnalisation** — le visiteur tape son nom, il s'affiche en marquee géant (bouton Partager)
9. **Footer** — newsletter, navigation, mentions

Des pétales et fleurs de sakura dessinés au canvas volent en permanence par-dessus la page,
avec un effet de profondeur (taille, vitesse et opacité varient) et un vent qui suit le scroll.

## Personnaliser

- **Couleurs / typo** : variables `:root` en haut de `css/style.css` (`--pink`, `--black`, …)
- **Prix, noms, tailles** : directement dans les blocs `<article class="card">` de `index.html`
- **Visuels** : remplacer les fichiers de `assets/` en gardant les mêmes noms
- **Imprimé** : `assets/print.jpg` sert à la fois de texture 3D et de fond de page
- **Silhouettes 3D** : l'objet `SPECS` de `js/garment3d.js` (profils du corps, manches,
  capuche) ; `PRODUCTS` dans `js/main.js` ne sert plus qu'au repli photo sans WebGL
- **Textes de l'histoire** : les trois `<h2 class="reveal-words">` de la section `#story`
- **Densité des pétales** : `const want = cw < 700 ? 18 : 36;` dans le module 14

## La 3D

Le hoodie et le t-shirt ne sont pas des photos : leur géométrie est générée au chargement
(corps, manches, capuche, poche, côtes, col) et l'imprimé all-over y est appliqué en texture,
avec logo blanc en décalque sur la poitrine. Éclairage : clé blanche + contre-jour rose et or.
Sans WebGL, la section retombe automatiquement sur l'ancien carrousel de photos.

## Notes techniques

- Vanilla JS, une seule boucle `requestAnimationFrame` pour header, parallaxe, pins et marquees
- Sections épinglées en `position: sticky` (pas de scroll-jacking, le scroll natif reste intact)
- `prefers-reduced-motion` : animations et pins désactivés, la page devient un empilement classique
- Responsive testé de 390 px à 1440 px, pas de débordement horizontal
- La scène 3D ne tourne que lorsqu'elle est à l'écran et l'onglet actif (batterie)
- Le blanc de l'imprimé a été remplacé par du jaune d'or ; le logo UNSEEN reste blanc
- Le panier est une démo front (compteur + toast) : brancher un vrai back-office ou Shopify pour vendre
