#!/usr/bin/env python3
"""
Importe une planche produit UNSEEN (grille de vues sur fond noir) et en fait
les visuels du site.

    python3 tools/import-planche.py ma-planche.png            # imprimé en jaune (défaut)
    python3 tools/import-planche.py ma-planche.png --tel-quel # garde les couleurs d'origine

Le script repère les blocs clairs sur le fond noir pour découper les vues, les
agrandit, les réaffûte, puis écrit dans assets/ :

    hoodie_front  hoodie_back  hoodie_side1  hoodie_side2
    tee_front     tee_back     tee_side1     tee_side2

Les éclairs de l'imprimé étant blancs comme le logo, la protection du logo ne
peut pas être automatique : sa position est déclarée dans LOGOS, en proportions
de la vue (x0, y0, x1, y1). À ajuster si le cadrage de la planche change.
"""
import sys, os
from PIL import Image, ImageFilter
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets')
SCALE = 2.4
NOMS = [['hoodie_front', 'hoodie_back', 'hoodie_side1', 'hoodie_side2'],
        ['tee_front',    'tee_back',    'tee_side1',    'tee_side2']]
LOGOS = {'hoodie_front': (.41, .32, .61, .42),
         'tee_front':    (.43, .24, .64, .35)}


def bandes(masque, axe, seuil=0.004):
    """Repère les blocs occupés le long d'un axe (colonnes ou lignes)."""
    proj = masque.mean(axis=axe)
    plein = proj > seuil
    blocs, debut = [], None
    for i, v in enumerate(plein):
        if v and debut is None:
            debut = i
        elif not v and debut is not None:
            if i - debut > len(plein) * .04:
                blocs.append((debut, i))
            debut = None
    if debut is not None:
        blocs.append((debut, len(plein)))
    return blocs


def en_jaune(im):
    """Le blanc de l'imprimé (clair et peu saturé) devient jaune d'or."""
    a = np.asarray(im).astype(np.float32) / 255
    mx, mn = a.max(2), a.min(2)
    v = mx
    s = np.where(mx > 1e-5, (mx - mn) / np.maximum(mx, 1e-5), 0)
    sm = lambda x, e0, e1: (lambda k: k * k * (3 - 2 * k))(np.clip((x - e0) / (e1 - e0), 0, 1))
    w = (sm(v, .42, .72) * (1 - sm(s, .16, .46)))[..., None]
    jaune = np.stack([v, v * .867, v * .30], 2)          # teinte 48°, saturation .70
    return Image.fromarray((np.clip(a * (1 - w) + jaune * w, 0, 1) * 255).astype(np.uint8))


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    src, jaune = sys.argv[1], '--tel-quel' not in sys.argv

    planche = Image.open(src).convert('RGB')
    clair = (np.asarray(planche).astype(np.float32).max(2) / 255 > .07).astype(np.float32)

    lignes = bandes(clair, 1)
    if len(lignes) != 2:
        print(f'! {len(lignes)} ligne(s) détectée(s) au lieu de 2 — vérifie la planche')

    for li, (y0, y1) in enumerate(lignes[:2]):
        cols = bandes(clair[y0:y1], 0)
        print(f'ligne {li + 1} : {len(cols)} vue(s)')
        for ci, (x0, x1) in enumerate(cols[:4]):
            mx, my = int((x1 - x0) * .04), int((y1 - y0) * .04)
            vue = planche.crop((max(0, x0 - mx), max(0, y0 - my),
                                min(planche.width, x1 + mx), min(planche.height, y1 + my)))
            nom = NOMS[li][ci] if li < len(NOMS) and ci < 4 else f'vue_{li}_{ci}'

            if jaune:
                recolore = en_jaune(vue)
                boite = LOGOS.get(nom)
                if boite:                                # on remet le logo d'origine
                    bx0, by0 = int(boite[0] * vue.width), int(boite[1] * vue.height)
                    bx1, by1 = int(boite[2] * vue.width), int(boite[3] * vue.height)
                    recolore.paste(vue.crop((bx0, by0, bx1, by1)), (bx0, by0))
                vue = recolore

            w, h = int(vue.width * SCALE), int(vue.height * SCALE)
            vue = vue.resize((w, h), Image.LANCZOS).filter(
                ImageFilter.UnsharpMask(radius=1.7, percent=115, threshold=2))
            vue.save(os.path.join(OUT, nom + '.jpg'), quality=88, subsampling=0, optimize=True)
            print(f'  {nom:14} {w}x{h}')


if __name__ == '__main__':
    main()
