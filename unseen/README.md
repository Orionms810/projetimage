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
├── fonts/              # Anton + Inter auto-hébergés (woff2)
└── assets/             # visuels de la marque + imprimé de fond
```

## Sections

1. **Hero** — motif sakura/éclair en parallaxe, logo UNSEEN, *Strength Beyond Sight*
2. **Marquee** — bandeau défilant dont la vitesse suit le scroll
3. **Manifeste** — 強さは目に見えない, image en parallaxe
4. **Collection** — hoodie 89 € / t-shirt compressé 45 €, survol face↔dos, tailles, ajout panier
5. **Détails** — carrousel horizontal : flèches cliquables, glisser, flèches du clavier
6. **Personnalisation** — le visiteur tape son nom, il s'affiche en marquee géant (bouton Partager)
7. **Footer** — newsletter, navigation, mentions

Des pétales et fleurs de sakura dessinés au canvas volent en permanence par-dessus la page,
avec un effet de profondeur (taille, vitesse et opacité varient) et un vent qui suit le scroll.

## Personnaliser

- **Couleurs / typo** : variables `:root` en haut de `css/style.css` (`--pink`, `--black`, …)
- **Prix, noms, tailles** : directement dans les blocs `<article class="card">` de `index.html`
- **Visuels** : remplacer les fichiers de `assets/` en gardant les mêmes noms
- **Imprimé de fond** : `assets/print.jpg`
- **Textes de l'histoire** : les trois `<h2 class="reveal-words">` de la section `#story`
- **Densité des pétales** : `const want = cw < 700 ? 18 : 36;` dans le module 12

## Notes techniques

- Vanilla JS, une seule boucle `requestAnimationFrame` pour header, parallaxe, pins et marquees
- Sections épinglées en `position: sticky` (pas de scroll-jacking, le scroll natif reste intact)
- `prefers-reduced-motion` : animations et pins désactivés, la page devient un empilement classique
- Responsive testé de 390 px à 1440 px, pas de débordement horizontal
- Repères de défilement : barre de progression verticale en haut de page pour le scroll
  vertical, flèches + barre de progression dédiées pour le défilement horizontal
- Le blanc de l'imprimé a été remplacé par du jaune d'or ; les logos UNSEEN restent blancs
- Les images sous la ligne de flottaison se chargent à la demande
- Le panier est fonctionnel côté front : tiroir avec quantités, total, seuil de livraison
  offerte et sauvegarde dans `localStorage`. Le bouton « Commander » reste à brancher sur
  un vrai paiement (Shopify, Stripe…)
