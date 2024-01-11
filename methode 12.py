from PIL import Image
import os

# Fonction de test pour vérifier la génération du nom de l'image
def test_generer_nom_image_message():
    image_path = "path/vers/votre/image.png"
    generated_name = generer_nom_image_message(image_path)
    assert generated_name == "image_message.png"

# Fonction pour générer le nom de l'image contenant le message
def generer_nom_image_message(image_path):
    base_name, extension = os.path.splitext(os.path.basename(image_path))
    message_image_name = f"{base_name}_message{extension}"
    return message_image_name

# Fonction de test pour vérifier la dissimulation et l'extraction du message
def test_dissimuler_extraire_message():
    original_image_path = "path/vers/votre/image_temporaire.png"
    Image.new("RGB", (500, 500)).save(original_image_path)

    message = "dissimulation et extraction du message."

    message_image_path = dissimuler_message(original_image_path, message)

    assert os.path.isfile(message_image_path)

    extracted_message = extraire_message(message_image_path)
    assert extracted_message == message
    
    os.remove(original_image_path)
    os.remove(message_image_path)

# Fonction pour dissimuler un message dans une image
def dissimuler_message(image_path, message, message_image_path=None):
    try:
        # Ouvre l'image d'origine
        original_image = Image.open(image_path)
    except FileNotFoundError:
        print(f"Fichier non trouvé : {image_path}")
        return None
    except Exception as e:
        print(f"Erreur lors de l'ouverture de l'image : {e}")
        return None

    # Obtient la largeur et la hauteur de l'image
    largeur, hauteur = original_image.size

    # Convertit le message en binaire
    binary_message = ''.join(format(ord(char), '08b') for char in message)

    # Crée une copie de l'image originale
    copie_image = original_image.copy()

    # Initialise l'index du message
    index = 0

    # Parcourt chaque pixel de l'image
    for y in range(hauteur):
        for x in range(largeur):
            try:
                # Récupère les composantes RGB du pixel
                pixel = list(copie_image.getpixel((x, y)))
            except Exception as e:
                print(f"Erreur lors de la récupération des pixels : {e}")
                return None

            # Modifie les bits de poids faible des composantes RGB avec les bits du message
            for i in range(3): 
                if index < len(binary_message):
                    pixel[i] = int(format(pixel[i], '08b')[:-1] + binary_message[index], 2)
                    index += 1

            # Applique les modifications au pixel
            copie_image.putpixel((x, y), tuple(pixel))

    # Génère un nom par défaut pour l'image contenant le message si aucun n'est spécifié
    if message_image_path is None:
        message_image_path = generer_nom_image_message(image_path)

    try:
        # Enregistre l'image modifiée
        copie_image.save(message_image_path)
    except Exception as e:
        print(f"Erreur lors de l'enregistrement de l'image : {e}")
        return None

    return message_image_path

# Fonction pour extraire un message dissimulé d'une image
def extraire_message(image_path):
    copie_image = Image.open(image_path)
    largeur, hauteur = copie_image.size

    # Récupère les bits de poids faible des composantes RGB pour reconstruire le message
    binary_message = ''
    for y in range(hauteur):
        for x in range(largeur):
            pixel = list(copie_image.getpixel((x, y)))
            if not isinstance(pixel, (tuple, list)):
                pixel = [pixel]
            for i in range(3):
                binary_message += format(pixel[i], '08b')[-1]
    # Convertit les bits binaires en caractères ASCII pour obtenir le message
    extracted_message = ''.join(chr(int(binary_message[i:i + 8], 2)) for i in range(0, len(binary_message), 8))

    return extracted_message

# Bloc principal pour tester le code en entrée utilisateur
if __name__ == "__main__":
    user_message = input("Entrez le message à dissimuler : ")
    user_image_path = input("Entrez le chemin de l'image d'origine : ")
    user_output_path = input("Entrez le chemin de sortie pour l'image contenant le message : ")

    # Ajout de l'extension si le chemin de sortie ne la spécifie pas
    if not user_output_path.endswith(".png"):
        user_output_path = os.path.join(user_output_path, generer_nom_image_message(user_image_path))

    # Dissimule le message dans l'image et l'enregistre
    message_image_path = dissimuler_message(user_image_path, user_message, user_output_path)
    print(f"Message dissimulé dans l'image : {message_image_path}")

    # Extrait le message dissimulé de l'image
    extracted_message = extraire_message(message_image_path)
    print(f"Message extrait : {extracted_message}")