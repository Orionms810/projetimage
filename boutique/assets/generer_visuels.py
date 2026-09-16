#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genere les visuels SVG de la boutique UNSEEN.

Tout est procedural : le motif sakura + eclairs, le logotype "UNSEEN" et les
rendus produits (hoodie, tee, crewneck, short, casquette) sont dessines a
partir de primitives vectorielles avec un generateur aleatoire graine, donc
le resultat est reproductible.

    python3 generer_visuels.py
"""

import math
import os
import random
import re

DOSSIER = os.path.dirname(os.path.abspath(__file__))

NOIR_TISSU = "#0a0a0a"
NOIR_OMBRE = "#000000"

# ---------------------------------------------------------------- primitives


def fmt(v):
    """Arrondit un nombre pour alleger le SVG."""
    return f"{v:.1f}".rstrip("0").rstrip(".") if isinstance(v, float) else str(v)


def polygone(points, **attrs):
    d = " ".join(f"{fmt(x)},{fmt(y)}" for x, y in points)
    a = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return f'<polygon points="{d}" {a}/>'


def normale(pts, i):
    n = len(pts)
    if i == 0:
        dx, dy = pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]
    elif i == n - 1:
        dx, dy = pts[-1][0] - pts[-2][0], pts[-1][1] - pts[-2][1]
    else:
        dx, dy = pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]
    lg = math.hypot(dx, dy) or 1.0
    return -dy / lg, dx / lg


def effiler(pts, w0, w1, rng=None, epines=0.0):
    """Transforme une polyligne en polygone effile, avec epines optionnelles."""
    gauche, droite = [], []
    n = len(pts)
    for i, (x, y) in enumerate(pts):
        t = i / max(n - 1, 1)
        demi = (w0 + (w1 - w0) * t) / 2
        nx, ny = normale(pts, i)
        eg = ed = 1.0
        if rng and epines and 0 < i < n - 1:
            if rng.random() < epines:
                eg = rng.uniform(1.8, 3.6)
            if rng.random() < epines:
                ed = rng.uniform(1.8, 3.6)
        gauche.append((x + nx * demi * eg, y + ny * demi * eg))
        droite.append((x - nx * demi * ed, y - ny * demi * ed))
    return gauche + droite[::-1]


def polyligne_brisee(x, y, angle, longueur, rng, pas=None, dispersion=0.45):
    """Genere une polyligne en zigzag (eclair, branche)."""
    pas = pas or rng.randint(6, 11)
    pts = [(x, y)]
    seg = longueur / pas
    for _ in range(pas):
        a = angle + rng.uniform(-dispersion, dispersion)
        x += math.cos(a) * seg * rng.uniform(0.65, 1.35)
        y += math.sin(a) * seg * rng.uniform(0.65, 1.35)
        pts.append((x, y))
    return pts


def subdiviser(p0, p1, n, rng, amplitude):
    """Segment droit subdivise avec un leger bruit lateral."""
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0
    lg = math.hypot(dx, dy) or 1.0
    nx, ny = -dy / lg, dx / lg
    pts = []
    for i in range(n + 1):
        t = i / n
        d = 0.0 if i in (0, n) else rng.uniform(-amplitude, amplitude)
        pts.append((x0 + dx * t + nx * d, y0 + dy * t + ny * d))
    return pts


# ------------------------------------------------------------------- sakura


def petale_d(longueur, largeur):
    """Petale de cerisier : pointe echancree, base effilee, oriente vers le haut."""
    L, W = longueur, largeur
    return (
        f"M0,0 "
        f"C{fmt(-W*0.60)},{fmt(-L*0.20)} {fmt(-W*0.72)},{fmt(-L*0.64)} {fmt(-W*0.32)},{fmt(-L*0.92)} "
        f"C{fmt(-W*0.21)},{fmt(-L*1.0)} {fmt(-W*0.11)},{fmt(-L*0.99)} 0,{fmt(-L*0.80)} "
        f"C{fmt(W*0.11)},{fmt(-L*0.99)} {fmt(W*0.21)},{fmt(-L*1.0)} {fmt(W*0.32)},{fmt(-L*0.92)} "
        f"C{fmt(W*0.72)},{fmt(-L*0.64)} {fmt(W*0.60)},{fmt(-L*0.20)} 0,0 Z"
    )


DEGRADES_PETALE = ["degPetaleVif", "degPetaleDoux", "degPetaleProfond"]


def _corps_fleur(rng, taille=100.0):
    """Dessin brut d'une fleur de sakura a cinq petales, centree sur l'origine."""
    deg = rng.choice(DEGRADES_PETALE)
    rot = rng.uniform(0, 72)
    out = []
    for i in range(5):
        a = rot + i * 72 + rng.uniform(-7, 7)
        s = rng.uniform(0.86, 1.10)
        out.append(
            f'<path d="{petale_d(taille*s, taille*0.80*s)}" '
            f'transform="rotate({fmt(a)})" fill="url(#{deg})"/>'
        )
    out.append(f'<circle r="{fmt(taille*0.13)}" fill="#fff2f7" opacity=".92"/>')
    for i in range(6):
        a = math.radians(rot + i * 60 + rng.uniform(-10, 10))
        lg = taille * rng.uniform(0.18, 0.30)
        out.append(
            f'<line x2="{fmt(math.cos(a)*lg)}" y2="{fmt(math.sin(a)*lg)}" '
            f'stroke="#fff7fa" stroke-width="{fmt(taille*0.045)}" '
            f'stroke-linecap="round" opacity=".8"/>'
        )
    return "".join(out)


def bibliotheque(prefixe, graine, n_fleurs=12, n_petales=6, taille=100.0):
    """Cree n variantes de fleurs et de petales a reutiliser via <use>.

    Un motif compte des centaines de fleurs : les dessiner toutes en entier
    ferait exploser le poids du fichier. On dessine donc quelques variantes
    une seule fois, puis on les instancie avec translate/rotate/scale.
    """
    rng = random.Random(graine)
    defs, fleurs, petales = [], [], []
    for i in range(n_fleurs):
        ident = f"{prefixe}f{i}"
        defs.append(f'<g id="{ident}">{_corps_fleur(rng, taille)}</g>')
        fleurs.append(ident)
    for i in range(n_petales):
        ident = f"{prefixe}p{i}"
        s = rng.uniform(0.85, 1.15)
        defs.append(
            f'<g id="{ident}"><path d="{petale_d(taille*s, taille*0.78*s)}" '
            f'fill="url(#{rng.choice(DEGRADES_PETALE)})"/></g>'
        )
        petales.append(ident)
    return "".join(defs), fleurs, petales


def instancier(ident, x, y, echelle, rot=0.0, opacite=1.0):
    """Place une variante de la bibliotheque."""
    op = "" if opacite >= 0.999 else f' opacity="{fmt(opacite)}"'
    r = "" if abs(rot) < 0.05 else f" rotate({fmt(rot)})"
    return (
        f'<use href="#{ident}" transform="translate({fmt(x)},{fmt(y)}){r} '
        f'scale({echelle:.3f})"{op}/>'
    )


# ------------------------------------------------------------------ eclairs


def eclair(x, y, angle, longueur, largeur, rng, profondeur=2):
    """Eclair ramifie : retourne (polygones, points de branche)."""
    polys, ancres = [], []
    pts = polyligne_brisee(x, y, angle, longueur, rng, dispersion=0.34)
    polys.append(effiler(pts, largeur, largeur * 0.18))
    ancres.extend(pts[1:])
    if profondeur > 0:
        for _ in range(rng.randint(2, 4)):
            i = rng.randint(1, len(pts) - 2)
            bx, by = pts[i]
            ba = angle + rng.choice([-1, 1]) * rng.uniform(0.45, 1.05)
            sp, sa = eclair(
                bx, by, ba, longueur * rng.uniform(0.32, 0.55),
                largeur * rng.uniform(0.40, 0.62), rng, profondeur - 1,
            )
            polys.extend(sp)
            ancres.extend(sa)
    return polys, ancres


def eclaircir(points, dmin, rng):
    """Ne garde que des points espaces d'au moins dmin (evite les paquets)."""
    rng.shuffle(points)
    grille, gardes = {}, []
    c = max(dmin, 1.0)
    for x, y in points:
        gx, gy = int(x // c), int(y // c)
        proche = False
        for i in (-1, 0, 1):
            for j in (-1, 0, 1):
                for px, py in grille.get((gx + i, gy + j), ()):
                    if (px - x) ** 2 + (py - y) ** 2 < dmin * dmin:
                        proche = True
                        break
                if proche:
                    break
            if proche:
                break
        if not proche:
            grille.setdefault((gx, gy), []).append((x, y))
            gardes.append((x, y))
    return gardes


# ------------------------------------------------- composition du motif brut


def motif(largeur, hauteur, graine, densite=1.0, echelle=1.0, prefixe="a"):
    """Compose l'artwork sakura + eclairs.

    Retourne (defs, contenu) : les defs contiennent la bibliotheque de fleurs,
    le contenu les eclairs et toutes les instances.
    """
    rng = random.Random(graine)
    polys, ancres = [], []

    troncs = max(3, int(4 * densite))
    for i in range(troncs):
        x = largeur * (i + 0.5) / troncs + rng.uniform(-largeur * 0.14, largeur * 0.14)
        p, a = eclair(
            x, -hauteur * 0.08, math.pi / 2 + rng.uniform(-0.28, 0.28),
            hauteur * rng.uniform(1.0, 1.3), 22 * echelle, rng, 2,
        )
        polys.extend(p)
        ancres.extend(a)

    # eclairs secondaires partant des bords, pour couvrir manches et flancs
    for i in range(int(5 * densite)):
        depuis_gauche = i % 2 == 0
        p, a = eclair(
            (-largeur * 0.05) if depuis_gauche else (largeur * 1.05),
            rng.uniform(0, hauteur * 0.75),
            rng.uniform(0.15, 1.05) if depuis_gauche else math.pi - rng.uniform(0.15, 1.05),
            largeur * rng.uniform(0.5, 0.95), 13 * echelle, rng, 1,
        )
        polys.extend(p)
        ancres.extend(a)

    defs, fleurs, petales = bibliotheque(prefixe, graine + 13)

    out = []
    halo = "".join(polygone(p, fill="#ffd9ea") for p in polys)
    corps = "".join(polygone(p, fill="#ffffff") for p in polys)
    out.append(f'<g filter="url(#lueur)" opacity=".5">{halo}</g>')
    out.append(f"<g>{corps}</g>")

    # fleurs accrochees aux ramifications, espacees pour rester lisibles
    for ax, ay in eclaircir(ancres, 58 * echelle, rng):
        t = rng.uniform(18, 38) * echelle
        out.append(instancier(
            rng.choice(fleurs), ax + rng.uniform(-22, 22) * echelle,
            ay + rng.uniform(-20, 20) * echelle, t / 100.0, rng.uniform(0, 360),
        ))

    # fleurs dispersees, hors branches
    libres = [(rng.uniform(0, largeur), rng.uniform(0, hauteur))
              for _ in range(int(26 * densite))]
    for fx, fy in eclaircir(libres, 96 * echelle, rng):
        t = rng.uniform(14, 28) * echelle
        out.append(instancier(
            rng.choice(fleurs), fx, fy, t / 100.0,
            rng.uniform(0, 360), rng.uniform(0.6, 1.0),
        ))

    # petales qui tombent
    for _ in range(int(42 * densite)):
        t = rng.uniform(8, 18) * echelle
        out.append(instancier(
            rng.choice(petales), rng.uniform(0, largeur), rng.uniform(0, hauteur),
            t / 100.0, rng.uniform(0, 360), rng.uniform(0.45, 0.95),
        ))
    return defs, "".join(out)


DEFS_COMMUNES = """
<radialGradient id="degPetaleVif" cx="50%" cy="92%" r="88%">
  <stop offset="0" stop-color="#ffe3ef"/><stop offset="0.35" stop-color="#ff77b4"/>
  <stop offset="1" stop-color="#d70f61"/>
</radialGradient>
<radialGradient id="degPetaleDoux" cx="50%" cy="92%" r="88%">
  <stop offset="0" stop-color="#fffafc"/><stop offset="0.45" stop-color="#ffc0da"/>
  <stop offset="1" stop-color="#ff6aa9"/>
</radialGradient>
<radialGradient id="degPetaleProfond" cx="50%" cy="92%" r="88%">
  <stop offset="0" stop-color="#ffc7de"/><stop offset="0.3" stop-color="#f43a86"/>
  <stop offset="1" stop-color="#a80b48"/>
</radialGradient>
<filter id="lueur" x="-30%" y="-30%" width="160%" height="160%">
  <feGaussianBlur stdDeviation="7"/>
</filter>
<filter id="flou" x="-30%" y="-30%" width="160%" height="160%">
  <feGaussianBlur stdDeviation="9"/>
</filter>
"""


# ----------------------------------------------------------------- logotype


def trait_metal(p0, p1, w0, w1, rng, epines=0.34, pas=9, bruit=None):
    """Trait de lettre style black metal : effile, bruite, herisse d'epines."""
    bruit = w0 * 0.22 if bruit is None else bruit
    pts = subdiviser(p0, p1, pas, rng, bruit)
    return polygone(effiler(pts, w0, w1, rng, epines), fill="currentColor")


def lettre(nom, x, y, W, H, rng):
    """Dessine une lettre a partir de son squelette de traits."""
    def P(u, v):
        return (x + u * W, y + v * H)

    e = W * 0.20   # epaisseur de base
    t = []
    if nom == "U":
        t += [(P(0.10, -0.24), P(0.24, 0.84), e * 0.55, e),
              (P(0.22, 0.82), P(0.78, 0.86), e, e),
              (P(0.76, 0.84), P(0.92, -0.28), e, e * 0.5),
              (P(0.12, 0.02), P(-0.06, -0.55), e * 0.5, 2)]
    elif nom == "N":
        t += [(P(0.06, 1.02), P(0.16, -0.26), e, e * 0.5),
              (P(0.15, 0.00), P(0.86, 1.00), e * 0.85, e * 0.85),
              (P(0.84, 1.04), P(0.94, -0.22), e, e * 0.5),
              (P(0.90, 0.00), P(1.10, -0.52), e * 0.5, 2)]
    elif nom == "S":
        t += [(P(0.92, 0.10), P(0.26, 0.02), e * 0.6, e),
              (P(0.24, 0.03), P(0.14, 0.44), e, e * 0.9),
              (P(0.14, 0.42), P(0.84, 0.58), e * 0.9, e * 0.9),
              (P(0.84, 0.56), P(0.90, 0.92), e * 0.9, e),
              (P(0.90, 0.92), P(0.10, 1.00), e, e * 0.55),
              (P(0.90, 0.08), P(1.14, -0.42), e * 0.5, 2)]
    elif nom == "E":
        t += [(P(0.16, -0.10), P(0.26, 1.04), e * 0.6, e),
              (P(0.18, 0.02), P(0.94, -0.06), e, e * 0.5),
              (P(0.22, 0.47), P(0.74, 0.52), e * 0.85, e * 0.5),
              (P(0.25, 0.97), P(0.98, 1.06), e, e * 0.5)]
    return "".join(trait_metal(a, b, w0, w1, rng) for a, b, w0, w1 in t)


def logotype(graine=7):
    """Retourne (contenu SVG, largeur, hauteur) du mot UNSEEN."""
    rng = random.Random(graine)
    W, H = 168.0, 200.0
    gap = 26.0
    mot = "UNSEEN"
    x0, y0 = 60.0, 90.0
    corps = "".join(
        lettre(c, x0 + i * (W + gap), y0, W, H, rng) for i, c in enumerate(mot)
    )
    total_w = x0 * 2 + len(mot) * W + (len(mot) - 1) * gap
    return corps, total_w, 400.0


# ------------------------------------------------------------------ produits

# Silhouettes : chaque vetement est une union de chemins, dans une boite 900x1000.
SILHOUETTES = {
    "hoodie": {
        "corps": "M286,258 C286,238 304,228 324,228 L576,228 C596,228 614,238 614,258 "
                 "L646,844 C648,872 636,886 612,886 L288,886 C264,886 252,872 254,844 Z",
        "manches": [
            "M304,240 C244,256 198,296 178,352 L104,620 C95,652 108,672 139,680 "
            "L216,700 C246,708 262,694 266,664 L322,396 Z",
            "M596,240 C656,256 702,296 722,352 L796,620 C805,652 792,672 761,680 "
            "L684,700 C654,708 638,694 634,664 L578,396 Z",
        ],
        "sup": ["M330,246 C332,150 374,92 450,92 C526,92 568,150 570,246 "
                "C528,214 486,202 450,202 C414,202 372,214 330,246 Z"],
        "trou": None,
        "cotes": [(254, 844, 392, 42), (104, 620, 162, 60), (722, 620, 162, 60)],
    },
    "crew": {
        "corps": "M292,250 C292,232 308,222 326,222 L574,222 C592,222 608,232 608,250 "
                 "L640,842 C642,870 630,884 606,884 L294,884 C270,884 258,870 260,842 Z",
        "manches": [
            "M308,234 C250,250 206,290 186,346 L114,618 C105,650 118,670 149,678 "
            "L224,698 C254,706 270,692 274,662 L328,392 Z",
            "M592,234 C650,250 694,290 714,346 L786,618 C795,650 782,670 751,678 "
            "L676,698 C646,706 630,692 626,662 L572,392 Z",
        ],
        "sup": [],
        "trou": ("ellipse", 450, 224, 86, 34),
        "cotes": [(260, 842, 380, 42), (114, 618, 160, 60), (714, 618, 160, 60)],
    },
    "tee": {
        "corps": "M300,248 C300,230 316,220 334,220 L566,220 C584,220 600,230 600,248 "
                 "L620,796 C622,820 610,832 588,832 L312,832 C290,832 278,820 280,796 Z",
        "manches": [
            "M314,232 C272,246 240,270 224,306 L186,410 C177,434 189,450 213,454 "
            "L302,470 C322,474 334,462 336,442 L344,318 Z",
            "M586,232 C628,246 660,270 676,306 L714,410 C723,434 711,450 687,454 "
            "L598,470 C578,474 566,462 564,442 L556,318 Z",
        ],
        "sup": [],
        "trou": ("ellipse", 450, 222, 80, 30),
        "cotes": [],
    },
    "short": {
        "corps": "M246,250 C246,232 262,222 280,222 L620,222 C638,222 654,232 654,250 "
                 "L648,438 L468,438 L444,760 C442,786 426,798 400,798 L272,798 "
                 "C246,798 232,786 234,760 Z",
        "manches": [
            "M468,438 L648,438 L636,760 C634,786 620,798 594,798 L466,798 "
            "C440,798 426,786 428,760 Z",
        ],
        "sup": [],
        "trou": None,
        "cotes": [(246, 222, 408, 52)],
    },
    "cap": {
        # vue de profil : calotte + visiere qui part vers la droite
        "corps": "M188,566 C188,392 282,292 432,292 C582,292 668,394 668,566 "
                 "C668,588 654,600 628,600 L226,600 C200,600 188,588 188,566 Z",
        "manches": [
            "M596,562 C706,562 796,590 820,622 C836,644 820,664 780,666 "
            "C696,670 610,650 572,616 C552,598 560,562 596,562 Z",
        ],
        "sup": [],
        "trou": None,
        "cotes": [],
    },
}


def garment_svg(genre, face, graine, densite=1.0):
    """Construit le SVG complet d'un produit."""
    s = SILHOUETTES[genre]
    rng = random.Random(graine)
    mid = f"m{genre}{face}{graine}"

    formes = [f'<path d="{s["corps"]}" fill="#fff"/>']
    formes += [f'<path d="{m}" fill="#fff"/>' for m in s["manches"]]
    formes += [f'<path d="{m}" fill="#fff"/>' for m in s["sup"]]
    trou = ""
    if s["trou"]:
        _, cx, cy, rx, ry = s["trou"]
        trou = f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#000"/>'

    masque = (
        f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="1000">'
        f'<rect width="900" height="1000" fill="#000"/>'
        f'{"".join(formes)}{trou}</mask>'
    )

    art_defs, art = motif(1100, 1200, graine + 91, densite=densite,
                          echelle=0.72, prefixe=mid)

    # relief : cotes, coutures, plis, ombres laterales
    relief = []
    for cx, cy, w, h in s["cotes"]:
        relief.append(
            f'<rect x="{cx}" y="{cy}" width="{w}" height="{h}" fill="#000" opacity="0.5"/>'
        )
        for i in range(0, int(w), 11):
            relief.append(
                f'<line x1="{cx+i}" y1="{cy}" x2="{cx+i}" y2="{cy+h}" '
                f'stroke="#fff" stroke-opacity="0.07" stroke-width="3"/>'
            )
    for _ in range(7):
        x = rng.uniform(280, 620)
        relief.append(
            f'<path d="M{fmt(x)},{fmt(rng.uniform(300,420))} '
            f'C{fmt(x+rng.uniform(-70,70))},{fmt(rng.uniform(500,600))} '
            f'{fmt(x+rng.uniform(-80,80))},{fmt(rng.uniform(620,720))} '
            f'{fmt(x+rng.uniform(-60,60))},{fmt(rng.uniform(800,880))}" '
            f'fill="none" stroke="#000" stroke-opacity="0.34" stroke-width="{fmt(rng.uniform(8,18))}" '
            f'filter="url(#flou)"/>'
        )

    extras = []
    if genre == "hoodie":
        if face == "face":
            extras.append(
                '<path d="M352,214 C380,268 414,292 450,292 C486,292 520,268 548,214" '
                'fill="none" stroke="#000" stroke-opacity="0.75" stroke-width="26"/>'
            )
            extras.append(
                '<path d="M404,272 C400,360 398,430 402,470" fill="none" stroke="#e8e8e8" '
                'stroke-width="7" stroke-linecap="round" opacity="0.9"/>'
                '<path d="M496,272 C500,360 502,430 498,470" fill="none" stroke="#e8e8e8" '
                'stroke-width="7" stroke-linecap="round" opacity="0.9"/>'
                '<circle cx="402" cy="474" r="7" fill="#d8d8d8"/><circle cx="498" cy="474" r="7" fill="#d8d8d8"/>'
            )
            extras.append(
                '<path d="M318,606 L582,606 L566,772 L334,772 Z" fill="#000" opacity="0.45"/>'
                '<path d="M318,606 L582,606 L566,772 L334,772 Z" fill="none" '
                'stroke="#000" stroke-opacity="0.8" stroke-width="5"/>'
            )
        else:
            extras.append(
                '<path d="M330,246 C332,150 374,92 450,92 C526,92 568,150 570,246" '
                'fill="none" stroke="#000" stroke-opacity="0.55" stroke-width="16"/>'
            )
    if genre in ("tee", "crew") and face == "face":
        _, cx, cy, rx, ry = s["trou"]
        extras.append(
            f'<ellipse cx="{cx}" cy="{cy}" rx="{rx+13}" ry="{ry+11}" fill="none" '
            f'stroke="#000" stroke-opacity="0.85" stroke-width="20"/>'
        )
    if genre == "cap":
        extras.append(
            '<path d="M432,296 C384,400 372,500 380,596" fill="none" stroke="#000" '
            'stroke-opacity="0.45" stroke-width="6"/>'
            '<path d="M540,306 C568,412 572,512 562,598" fill="none" stroke="#000" '
            'stroke-opacity="0.4" stroke-width="6"/>'
            '<path d="M196,572 L660,572" stroke="#000" stroke-opacity="0.55" stroke-width="16"/>'
            '<path d="M572,616 C630,652 712,668 790,664" fill="none" stroke="#000" '
            'stroke-opacity="0.45" stroke-width="7"/>'
            '<circle cx="432" cy="300" r="12" fill="#141414" stroke="#000" stroke-width="3"/>'
        )

    # marquage textile
    marque = ""
    corps_logo, logo_w, logo_h = logotype(graine + 3)
    if face == "face" and genre != "cap":
        ech = 0.16 if genre != "short" else 0.11
        px = 450 - logo_w * ech / 2
        py = 320 if genre in ("hoodie", "crew") else 300
        if genre == "short":
            px, py = 320, 300
        halo_x = px + logo_w * ech / 2
        marque = (
            f'<ellipse cx="{fmt(halo_x)}" cy="{fmt(py + logo_h*ech*0.45)}" '
            f'rx="{fmt(logo_w*ech*0.72)}" ry="{fmt(logo_h*ech*0.62)}" fill="#000" '
            f'opacity="0.55" filter="url(#flou)"/>'
            f'<g transform="translate({fmt(px)},{fmt(py)}) scale({ech})" '
            f'color="#ffffff">{corps_logo}</g>'
        )
    elif genre == "cap":
        ech = 0.11
        marque = (
            f'<g transform="translate({fmt(450-logo_w*ech/2)},370) scale({ech})" '
            f'color="#ffffff">{corps_logo}</g>'
        )
    else:
        marque = (
            '<text x="600" y="330" fill="#ffffff" font-size="46" font-weight="700" '
            'font-family="serif" letter-spacing="6" writing-mode="tb" opacity="0.95">'
            '桜の力</text>'
        )

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1000" width="900" height="1000" role="img">
<defs>{DEFS_COMMUNES}
<linearGradient id="bords{mid}" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#000" stop-opacity="0.6"/>
  <stop offset="0.16" stop-color="#000" stop-opacity="0"/>
  <stop offset="0.84" stop-color="#000" stop-opacity="0"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.6"/>
</linearGradient>
<linearGradient id="haut{mid}" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#fff" stop-opacity="0.09"/>
  <stop offset="0.45" stop-color="#fff" stop-opacity="0"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
</linearGradient>
{art_defs}
{masque}
</defs>
<g mask="url(#{mid})">
  <rect width="900" height="1000" fill="{NOIR_TISSU}"/>
  <g transform="translate(-100,-120)">{art}</g>
  {''.join(relief)}
  {''.join(extras)}
  {marque}
  <rect width="900" height="1000" fill="url(#bords{mid})"/>
  <rect width="900" height="1000" fill="url(#haut{mid})"/>
</g>
</svg>"""


# ---------------------------------------------------------------------- main


def injecter_logo(corps, largeur, hauteur):
    """Insere le logotype en <symbol> dans index.html.

    Le logo doit etre inline (et non dans un <img>) pour que le CSS puisse
    le recolorer au survol via currentColor.
    """
    page = os.path.join(os.path.dirname(DOSSIER), "index.html")
    if not os.path.exists(page):
        return
    html = open(page, encoding="utf-8").read()
    vb = f"0 0 {fmt(largeur)} {fmt(hauteur)}"
    bloc = (
        '<!--LOGO:DEBUT-->\n'
        '<svg class="sprite" aria-hidden="true" focusable="false" '
        'style="position:absolute;width:0;height:0;overflow:hidden">'
        f'<symbol id="uLogo" viewBox="{vb}">{corps}</symbol></svg>\n'
        '<!--LOGO:FIN-->'
    )
    debut, fin = html.index("<!--LOGO:DEBUT-->"), html.index("<!--LOGO:FIN-->") + len("<!--LOGO:FIN-->")
    html = html[:debut] + bloc + html[fin:]
    html = re.sub(r'(class="logo__mot[^"]*" )viewBox="[^"]*"', r'\1viewBox="' + vb + '"', html)
    open(page, "w", encoding="utf-8").write(html)
    print(f"  index.html  (logotype injecte, viewBox {vb})")


def ecrire(nom, contenu):
    chemin = os.path.join(DOSSIER, nom)
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(contenu)
    print(f"  {nom}  ({len(contenu)//1024} Ko)")


def main():
    print("Generation des visuels UNSEEN :")

    # logotype
    corps, w, h = logotype()
    ecrire(
        "logo-unseen.svg",
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" '
        f'width="{fmt(w)}" height="{fmt(h)}" role="img" aria-label="UNSEEN" '
        f'color="currentColor" fill="currentColor">{corps}</svg>',
    )
    injecter_logo(corps, w, h)

    # motif seul (fond de section / tuile)
    mot_defs, mot_art = motif(1200, 1500, 21, densite=0.9, prefixe="mo")
    ecrire(
        "motif-sakura.svg",
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" '
        f'height="1500" role="img"><defs>{DEFS_COMMUNES}{mot_defs}</defs>'
        f'<rect width="1200" height="1500" fill="{NOIR_TISSU}"/>'
        f'{mot_art}</svg>',
    )

    # bandeau lookbook large
    lb_defs, lb_art = motif(1600, 900, 55, densite=0.85, echelle=1.15, prefixe="lb")
    ecrire(
        "lookbook-large.svg",
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" '
        f'height="900" role="img"><defs>{DEFS_COMMUNES}{lb_defs}</defs>'
        f'<rect width="1600" height="900" fill="{NOIR_TISSU}"/>'
        f'{lb_art}</svg>',
    )

    # fond du hero : motif plus fin et plus dense que le lookbook, pour rester
    # lisible une fois etale sur toute la largeur de l'ecran
    h_defs, h_art = motif(1600, 900, 77, densite=1.5, echelle=0.62, prefixe="he")
    ecrire(
        "hero-art.svg",
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" '
        f'height="900" role="img" preserveAspectRatio="xMidYMid slice">'
        f'<defs>{DEFS_COMMUNES}{h_defs}</defs>'
        f'<rect width="1600" height="900" fill="{NOIR_TISSU}"/>{h_art}</svg>',
    )

    # favicon
    ecrire(
        "favicon.svg",
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
        f'<defs>{DEFS_COMMUNES}</defs>'
        '<rect width="64" height="64" rx="14" fill="#0b0b0b"/>'
        f'<g transform="translate(32,34) scale(.24)">'
        f'{_corps_fleur(random.Random(4))}</g></svg>',
    )

    produits = [
        ("hoodie", "face", 101, 0.85), ("hoodie", "dos", 102, 1.0),
        ("tee", "face", 203, 0.75), ("tee", "dos", 204, 0.9),
        ("crew", "face", 305, 0.7), ("crew", "dos", 306, 0.85),
        ("short", "face", 407, 0.6), ("short", "dos", 408, 0.6),
        ("cap", "face", 509, 0.5), ("cap", "dos", 510, 0.5),
    ]
    for genre, face, graine, dens in produits:
        ecrire(f"{genre}-{face}.svg", garment_svg(genre, face, graine, dens))

    # deuxieme colorway (motif plus clairseme) pour deux produits
    ecrire("tee-alt-face.svg", garment_svg("tee", "face", 777, 0.4))
    ecrire("tee-alt-dos.svg", garment_svg("tee", "dos", 778, 0.45))
    ecrire("hoodie-alt-face.svg", garment_svg("hoodie", "face", 881, 0.42))
    ecrire("hoodie-alt-dos.svg", garment_svg("hoodie", "dos", 882, 0.48))

    print("Termine.")


if __name__ == "__main__":
    main()
