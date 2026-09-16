# UNSEEN — boutique

Vitrine e-commerce statique pour la marque **UNSEEN** (*Strength Beyond Sight — 見えない力*),
construite autour de la collection **Japanese Blossom** : cerisier rose et éclair blanc sur noir.

Aucune dépendance, aucun build, aucun tracker : HTML + CSS + un fichier JS.

## Lancer

```bash
# ouvrir directement
xdg-open index.html          # (ou open index.html sur macOS)

# ou servir localement
python3 -m http.server 8000 --directory .
```

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de la page (le logotype est inline pour pouvoir changer de couleur) |
| `styles.css` | Jetons de design + **tous les effets au survol** |
| `app.js` | Catalogue, filtres, tri, panier persistant, aperçu rapide, effets pilotés à la souris |
| `assets/generer_visuels.py` | Générateur des visuels SVG (motif, logotype, produits) |
| `assets/*.svg` | Visuels produits par le générateur |

## Le système graphique

Repris de la référence **Three** : canvas quasi noir, élévation obtenue **uniquement** par
variation de surface (`#111` → `#181818` → `#2b2a2a` → `#343434`, jamais d'ombre portée),
graisse **700 exclusive**, interlettrage négatif serré (−0.056em à 68 px), rayons 15 px
(boutons) / 20–25 px (cartes) / 50 px (champs) / 999 px (pilules).

**Un seul écart assumé :** la couleur d'action n'est pas l'orange ember `#ff4300` mais le rose
sakura `#ff2d78`. La règle « une seule couleur chromatique » est le cœur du système ; or les
visuels produits sont roses. Garder l'orange aurait introduit une deuxième couleur et cassé
précisément ce que la règle protège. Le rose joue donc exactement le rôle de l'ember : boutons
principaux, état sélectionné, accents décoratifs — et rien d'autre.

```css
--sakura: #ff2d78;   /* seule couleur chromatique */
--void:   #111111;   /* canvas */
--obsidienne: #181818;  --charbon: #2b2a2a;  --graphite: #343434;
```

## Les effets au survol

Presque tout est en CSS. Le JavaScript ne fait que poser des variables
(`--sx`, `--sy`, `--rx`, `--ry`) : le rendu reste décrit dans la feuille de style.

**Carte produit** — sept effets simultanés :
1. bascule **recto → verso** du visuel (fondu croisé + léger zoom) ;
2. **projecteur rose** qui suit le curseur (`radial-gradient` sur `--sx/--sy`) ;
3. **inclinaison 3D** de la carte vers le curseur (`rotateX/rotateY`, ±6°/±9°) ;
4. **éclair** qui balaie la carte en diagonale, en écho au motif imprimé ;
5. **pétales** qui remontent — l'animation est en pause et ne démarre qu'au survol ;
6. barre **« ajout rapide »** qui glisse depuis le bas, tailles cliquables directement ;
7. bordure, étiquette et prix qui passent au rose, et le titre qui desserre son interlettrage.

**Ailleurs :**
- **boutons** — remplissage qui monte depuis le bas, flèche qui avance ; les CTA du hero sont
  **magnétiques** (ils viennent vers le curseur) ;
- **liens de nav** — le mot glisse vers le haut, sa doublure rose prend sa place, soulignement
  qui se dessine de gauche à droite ;
- **liens de pied** — deux exemplaires empilés, l'un chasse l'autre ;
- **tuiles lookbook** — désaturées par défaut, la couleur ne revient que sur la tuile survolée,
  la légende remonte et sa ligne secondaire apparaît ;
- **bandeau défilant** — s'arrête et passe au rose au survol ;
- **puces de filtre** — se remplissent depuis le centre ;
- **tailles** — remplissage qui monte, léger décollement ;
- **lignes du panier** — la corbeille n'apparaît qu'au survol de la ligne ;
- **vignettes de l'aperçu** — changent l'image principale au survol, sans clic ;
- **curseur personnalisé** — anneau amorti qui enfle et s'encre de rose sur les éléments
  interactifs, se resserre au clic.

## Accessibilité

- chaque effet au survol a son équivalent `:focus-visible` / `:focus-within` : la boutique
  s'utilise entièrement au clavier ;
- `@media (hover: none)` neutralise les effets qui resteraient « collés » au doigt (la barre
  d'ajout rapide devient permanente, le curseur personnalisé disparaît) ;
- `@media (prefers-reduced-motion: reduce)` coupe animations, inclinaison 3D et pétales ;
- tiroir et modale piégeant `Échap`, libellés ARIA sur les contrôles, lien d'évitement.

## Régénérer les visuels

Les SVG sont générés, pas dessinés à la main : motif sakura + éclairs ramifiés, logotype
« UNSEEN » construit trait par trait, et dix silhouettes de vêtements (hoodie, tee, crewneck,
short, casquette — face et dos) masquées sur le motif.

```bash
python3 assets/generer_visuels.py
```

Le script réécrit aussi le `<symbol id="uLogo">` dans `index.html`. Chaque visuel part d'une
graine fixe : à paramètres identiques, le résultat est identique. Pour varier un motif, changer la graine ou la
densité dans la liste `produits` de `main()`.

## Ajouter un produit

Tout le catalogue tient dans la constante `CATALOGUE` de `app.js` :

```js
{
  id: "mon-produit",            // identifiant unique (clé du panier)
  nom: "Nom affiché",
  categorie: "hauts",           // hauts | bas | accessoires — pilote les filtres
  typeLabel: "Hoodie — 420 g",
  prix: 89,                     // en euros, nombre
  etiquette: "Nouveau",         // ou null
  images: ["assets/x-face.svg", "assets/x-dos.svg"],  // [recto, verso]
  tailles: ["S", "M", "L"],
  rupture: ["S"],               // tailles grisées
  description: "…",
}
```

Le panier est conservé dans `localStorage` (clé `unseen:panier`) et ignore silencieusement les
lignes dont le produit a disparu du catalogue.

> Vitrine de démonstration : le bouton « Passer commande » n'appelle aucun service de paiement.
