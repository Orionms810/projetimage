/* ===========================================================
   UNSEEN — catalogue partagé (accueil, boutique, fiche, panier)
   Les stocks sont des valeurs de démonstration : à brancher sur
   un vrai back-office le jour de la mise en vente.
   =========================================================== */
window.UNSEEN = {
  collection: 'Winter Arc 2026',
  produits: {
    hoodie: {
      ref: 'hoodie',
      nom: 'Hoodie Noir — Winter Arc 2026',
      court: 'Hoodie noir',
      prix: 89,
      badge: 'Édition limitée',
      resume: "Hoodie oversize en coton lourd, imprimé all-over : l'éclair doré qui déchire les sakura.",
      description: `Coupe oversize, épaules tombantes, capuche doublée à cordons.
        L'imprimé all-over est appliqué panneau par panneau avant assemblage : l'éclair
        traverse le dos, remonte sur les manches et vient mourir sur la poitrine.
        Poche kangourou, côtes épaisses aux poignets et à la base.`,
      specs: [
        ['Matière', 'Coton lourd 420 g/m²'],
        ['Coupe', 'Oversize — prendre sa taille'],
        ['Imprimé', 'All-over, numéroté à la main'],
        ['Entretien', '30°C à l\'envers, pas de sèche-linge'],
        ['Fabrication', 'Série de 60 pièces — Portugal']
      ],
      vues: [
        ['hoodie_front', 'Face'], ['hoodie_back', 'Dos'],
        ['hoodie_side1', 'Profil G'], ['hoodie_side2', 'Profil D']
      ],
      stock: { S: 4, M: 6, L: 3, XL: 0 }
    },
    tee: {
      ref: 'tee',
      nom: 'T-shirt compressé Noir — Winter Arc 2026',
      court: 'T-shirt noir',
      prix: 45,
      badge: 'Nouveau',
      resume: 'Compression seconde peau, panneaux nid d\'abeille sur les flancs, imprimé all-over.',
      description: `Maille technique compressive qui tient le corps sans gêner le mouvement.
        Panneaux alvéolés sous les bras et le long du dos pour l'aération, coutures plates,
        col renforcé. Le même imprimé que le hoodie, resserré sur la colonne et les flancs.`,
      specs: [
        ['Matière', 'Polyamide / élasthanne 230 g/m²'],
        ['Coupe', 'Compression — seconde peau'],
        ['Imprimé', 'Sublimation all-over'],
        ['Entretien', '30°C, séchage à l\'air libre'],
        ['Fabrication', 'Série de 80 pièces — Portugal']
      ],
      vues: [
        ['tee_front', 'Face'], ['tee_back', 'Dos'],
        ['tee_side1', 'Profil G'], ['tee_side2', 'Profil D']
      ],
      stock: { S: 5, M: 2, L: 7, XL: 4 }
    },
    hoodie_blanc: {
      ref: 'hoodie_blanc',
      nom: 'Hoodie Blanc — Winter Arc 2026',
      court: 'Hoodie blanc',
      prix: 89,
      badge: 'Nouveau coloris',
      resume: "Le même hoodie oversize, imprimé inversé : les sakura à l'encre noire sur coton blanc.",
      description: `Coupe oversize, épaules tombantes, capuche doublée à cordons.
        L'imprimé passe en négatif : branches et fleurs à l'encre noire sur un coton
        blanc cassé, avec 桜の力 au centre du dos. Poche kangourou, côtes épaisses aux
        poignets et à la base.`,
      specs: [
        ['Matière', 'Coton lourd 420 g/m²'],
        ['Coupe', 'Oversize — prendre sa taille'],
        ['Imprimé', 'All-over encre noire, numéroté à la main'],
        ['Entretien', 'Lavage séparé à 30°C, pas de sèche-linge'],
        ['Fabrication', 'Série de 40 pièces — Portugal']
      ],
      vues: [
        ['hoodie_blanc_front', 'Face'], ['hoodie_blanc_back', 'Dos'],
        ['hoodie_blanc_side1', 'Profil G'], ['hoodie_blanc_side2', 'Profil D']
      ],
      stock: { S: 3, M: 5, L: 4, XL: 2 }
    },
    tee_blanc: {
      ref: 'tee_blanc',
      nom: 'T-shirt compressé Blanc — Winter Arc 2026',
      court: 'T-shirt blanc',
      prix: 45,
      badge: 'Nouveau coloris',
      resume: 'Compression seconde peau en blanc, imprimé sakura noir et panneaux nid d\'abeille anthracite.',
      description: `Même maille technique compressive, en blanc. Les branches à l'encre
        noire courent le long de la colonne et des flancs, et les panneaux alvéolés
        anthracite tranchent sur le corps clair. Coutures plates, col renforcé.`,
      specs: [
        ['Matière', 'Polyamide / élasthanne 230 g/m²'],
        ['Coupe', 'Compression — seconde peau'],
        ['Imprimé', 'Sublimation all-over encre noire'],
        ['Entretien', 'Lavage séparé à 30°C, séchage à l\'air libre'],
        ['Fabrication', 'Série de 50 pièces — Portugal']
      ],
      vues: [
        ['tee_blanc_front', 'Face'], ['tee_blanc_back', 'Dos'],
        ['tee_blanc_side1', 'Profil G'], ['tee_blanc_side2', 'Profil D']
      ],
      stock: { S: 6, M: 4, L: 3, XL: 5 }
    }
  }
};
