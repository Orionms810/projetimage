from PIL import Image
import os

def test_generer_nom_image_message():
    image_path = "path/vers/votre/image.png"
    generated_name = generer_nom_image_message(image_path)
    assert generated_name == "image_message.png"

def generer_nom_image_message(image_path):
    """
    Génère le nom par défaut de l'image contenant le message

    Parametre:
    image_path : Le chemin de l'image d'origine

    Returns:
    nom généré de l'image contenant le message
    """
    base_name, extension = os.path.splitext(os.path.basename(image_path))
    message_image_name = f"{base_name}_message{extension}"
    return message_image_name


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
    
def dissimuler_message(image_path, message, message_image_path=None):
    """
    cache un message dans une image en modifiant les composantes RGB

    Parametre:
    image_path : Le chemin de l'image d'origine
    message (str): Le message à dissimuler
    message_image_path (str, optional): Le chemin de sortie pour l'image contenant le message
    Si rien, un nom sera généré automatiquement

    Returns:
    Le chemin de l'image contenant le message ou None en cas d'erreur
    """
    try:
        original_image = Image.open(image_path)
    except FileNotFoundError:
        print(f"Fichier non trouvé : {image_path}")
        return None
    except Exception as e:
        print(f"Erreur lors de l'ouverture de l'image : {e}")
        return None

    largeur, hauteur = original_image.size

    binary_message = ''.join(format(ord(char), '08b') for char in message)

    copie_image = original_image.copy()

    index = 0

    for y in range(hauteur):
        for x in range(largeur):
            try:
                pixel = list(copie_image.getpixel((x, y)))
            except Exception as e:
                print(f"Erreur lors de la récupération des pixels : {e}")
                return None

            for i in range(3): 
                if index < len(binary_message):
                    pixel[i] = int(format(pixel[i], '08b')[:-1] + binary_message[index], 2)
                    index += 1

            copie_image.putpixel((x, y), tuple(pixel))

    if message_image_path is None:
        message_image_path = generer_nom_image_message(image_path)

    try:
        copie_image.save(message_image_path)
    except Exception as e:
        print(f"Erreur lors de l'enregistrement de l'image : {e}")
        return None

    return message_image_path


def extraire_message(image_path):
    """
    Extrait un message dissimulé d'une image en récupérant les bits de poids faible des composantes RGB

    Parametre:
    image_path : Le chemin de l'image contenant le message

    Returns:
    Le message extrait
    """
    copie_image = Image.open(image_path)
    largeur, hauteur = copie_image.size

    binary_message = ''
    for y in range(hauteur):
        for x in range(largeur):
            pixel = list(copie_image.getpixel((x, y)))
            if not isinstance(pixel, (tuple, list)):
                pixel = [pixel]
            for i in range(3):
                binary_message += format(pixel[i], '08b')[-1]
    extracted_message = ''.join(chr(int(binary_message[i:i + 8], 2)) for i in range(0, len(binary_message), 8))

    return extracted_message

if __name__ == "__main__":
    user_message = input("Entrez le message à dissimuler : ")
    user_image_path = input("Entrez le chemin de l'image d'origine : ")
    user_output_path = input("Entrez le chemin de sortie pour l'image contenant le message : ")

    # Ajout de l'extension si le chemin de sortie ne la spécifie pas
    if not user_output_path.endswith(".png"):
        user_output_path = os.path.join(user_output_path, generer_nom_image_message(user_image_path))

    message_image_path = dissimuler_message(user_image_path, user_message, user_output_path)
    print(f"Message dissimulé dans l'image : {message_image_path}")

    extracted_message = extraire_message(message_image_path)
    print(f"Message extrait : {extracted_message}")
