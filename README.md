Descriptif et contenu:

L'objectif de ce projet est de créer un module Python dédié à la stéganographie, spécialement conçu pour dissimuler et retrouver des messages dans des images. Les images sont au format PNG, présentant une taille minimale de 500 x 500 pixels. de plus le module doit permettre à l'utilisateur de donner une image, et le message qu'il souhaite cacher.

Notre travail contient 3 méthodes et donc 3 programmes, il contient également un rapport et un journal de bord.



mode d'emploi:

pour chacune des méthodes, il vous faudra;
- Python
- Pillow
- de plus, assurez vous que le chemin de l'image est juste

La description des fonction ci-dessous est similaire pour chacune de nos 3 méthodes:

test_generer_nom_image_message : Une fonction de test qui vérifie la génération correcte du nom de l'image qui contient le message à partir du chemin de l'image d'origine.

generer_nom_image_message : Une fonction qui génère le nom par défaut de l'image contenant le message.

test_dissimuler_extraire_message : Une fonction de test qui crée une image, dissimule un message, puis ensuite, extrait le message et le vérifie.

dissimuler_message : Une fonction qui dissimule un message dans une image en modifiant les composantes RGB des pixels.

extraire_message : Une fonction qui extrait un message dissimulé à partir d'une image en récupérant les bits de poids faible des composantes RGB des pixels. (pas similaire pour chacun de nos programmes)

Fonctionnalité principale : il demande à l'utilisateur d'entrer un message, le chemin de l'image d'origine, et le chemin de sortie pour l'image contenant le message.

méthode1 (poids faible):

premièrement, pour la parti dissimulation, le message fourni est converti en une séquence binaire de bits. chaque lettre du message est représenté par 8 bits, ce qui signifie 1 octet. Ensuite, l'image d'origine est ouverte et pour chaque pixel, les bits de poids faibles des composantes RGB sont changés pour contenir les bits du message. tout cela se passe dans la fonction; dissimuler_message.

deuxièmement,pour la parti extraction, la fonction extraire_message parcourt tous les pixel et récupèr eles bits de poids faible qui sont ensuite, concaténés et forme la séquence binaire de notre message.
Le message binaire est ensuite divisé en groupes de 8bits, et chaque groupe est converti en un caractère ASCII, qui nous redonne le message original.

méthode2 (pair ou impair):

similaire à la méthode1, donc il modifie les bits de poids faible des composantes RGB des pixels de l'image pour encoder le message, mais cette fois-ci, il modifie chaque composante RGB pour être pair ou impair en fonction du bit du message donné.

méthode3 (multiple de 5):

Cette méthode parcourt chaque pixel de l'image et réduit les composantes RGB en multiples de 5 pour rendre les bits de poids faible divisibles par 5. Par la suite, les bits du message sont encodés dans les bits de poids faible des composantes RGB en ajoutant 5 si le bit est 1, et laissant la valeur, sans y toucher, si le bit est 0.




Descriptif technique de l'implémentation des algorithmes pour les programmes :

Programme 1 : Dissimulation et Extraction

generer_nom_image_message :

Structure de données : Utilisation de la bibliothèque PIL
Choix et utilisation : Utilisation de la fonction os.path.splitext pour obtenir le nom du fichier sans extension.
Granularité des fonctions : Fonction simple pour générer le nom, utilisée uniquement dans le contexte du programme.
dissimuler_extraire_message :

Structure de données : Utilisation des bibliothèques PIL
Choix et utilisation :
Chargement de l'image avec Image.open et manipulation des pixels avec getpixel et putpixel.
Le message est converti en binaire ('08b') et dissimulé dans les bits de poids faible des composantes RGB.
Pour l'extraction, les bits de poids faible sont récupérés et convertis en caractères ASCII.
Granularité des fonctions : Fonctions relativement petites avec des tâches spécifiques.
test_generer_nom_image_message et test_dissimuler_extraire_message:

Structure de données : Aucune structure de données particulière.
Choix et utilisation : Utilisation de l'assertion pour vérifier si les résultats attendus correspondent aux résultats réels.
Granularité des fonctions : Fonctions de test indépendantes, vérifiant des fonctionnalités spécifiques.
Choix globaux et organisation :

Les erreurs sont gérées par des messages d'erreur imprimés dans la console.
Utilisation de la bibliothèque PIL pour la manipulation des images.
Les noms des fonctions et des variables sont descriptifs pour une meilleure lisibilité.
Programme 2 : Cacher et Extraire

generer_nom_image_contenant_message:

Structure de données : Utilisation de la bibliothèque PIL
Choix et utilisation : Utilisation de la fonction os.path.splitext pour obtenir le nom du fichier sans extension. Construction du nouveau nom avec l'ajout "_message.png".
Granularité des fonctions : Fonction simple pour générer le nom, utilisée uniquement dans le contexte du programme.
cachermessage :

Structure de données : Utilisation des bibliothèques PIL
Choix et utilisation :
Chargement de l'image avec Image.open et modification des pixels pour dissimuler le message.
Les bits du message sont dissimulés en modifiant les valeurs RGB des pixels.
Granularité des fonctions : Fonction relativement petite avec une tâche spécifique.
message_out :

Structure de données : Utilisation des bibliothèques PIL
Choix et utilisation :
Chargement de l'image avec Image.open et extraction des bits de poids faible pour reconstituer le message.
Granularité des fonctions : Fonction relativement petite avec une tâche spécifique.
Choix globaux et organisation :

Les erreurs sont gérées par des messages d'erreur imprimés dans la console.
Utilisation de la bibliothèque PIL pour la manipulation des images.
Les noms des fonctions et des variables sont descriptifs pour une meilleure lisibilité.
Les fonctions de dissimulation et d'extraction sont séparées pour une meilleure modularité.

pour ce qui est du journal de bord:

Arthur-Louis:

- création de la 3e méthode
- parti descriptif du rapport
- parti contenu du rapport

Milos:

- création du projet sur Github
- création de la méthode 1 et 2
- parti mode d'emploi
- parti journal de bord









