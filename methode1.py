from PIL import Image
import os

def generer_nom_image_contenant_message(image_path):
    """
    Génère le nom par défaut de l'image contenant le message en lien avec le nom de l'image d'origine.

    Parameters:
    image_path (str): Le chemin de l'image d'origine.

    Returns:
    str: Le nom généré de l'image contenant le message.
    """
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    message_image_name = f"{base_name}_message.png"
    return message_image_name

def dissimuler_message(image_path, message, message_image_path=None):
    """
    Dissimule un message dans une image en modifiant les composantes RGB des pixels avec des nombres pairs et impairs.

    Parameters:
    image_path (str): Le chemin de l'image d'origine.
    message (str): Le message à dissimuler.
    message_image_path (str, optional): Le chemin de sortie pour l'image contenant le message.
                                       Si None, un nom par défaut sera généré.

    Returns:
    str: Le chemin de l'image contenant le message.
    """
    original_image = Image.open(image_path)
    width, height = original_image.size

    # Convertir le message en une séquence binaire
    binary_message = ''.join(format(ord(char), '08b') for char in message)

    # Créer une copie de l'image d'origine pour y appliquer les modifications
    steg_image = original_image.copy()

    index = 0  # Index pour parcourir les bits du message

    # Modifier les composantes RGB des pixels avec des nombres pairs et impairs
    for y in range(height):
        for x in range(width):
            pixel = list(steg_image.getpixel((x, y)))

            # Remplacer chaque composante RGB par un nombre pair ou impair en fonction du bit du message
            for i in range(3):
                if index < len(binary_message):
                    if int(binary_message[index]):
                        pixel[i] = pixel[i] // 2 * 2 + 1  # Nombre impair
                    else:
                        pixel[i] = pixel[i] // 2 * 2  # Nombre pair
                    index += 1

            steg_image.putpixel((x, y), tuple(pixel))

    # Générer le nom de l'image contenant le message si nécessaire
    if message_image_path is None:
        message_image_path = generer_nom_image_contenant_message(image_path)

    # Enregistrer l'image résultante
    steg_image.save(message_image_path)

    return message_image_path

def extraire_message(image_path):
    """
    Extrait un message dissimulé dans une image en récupérant les bits du message à partir des composantes RGB des pixels.

    Parameters:
    image_path (str): Le chemin de l'image contenant le message.

    Returns:
    str: Le message extrait.
    """
    steg_image = Image.open(image_path)
    width, height = steg_image.size

    binary_message = ''  # Initialise le message binaire extrait

    # Extraire les bits du message à partir des composantes RGB des pixels
    for y in range(height):
        for x in range(width):
            pixel = steg_image.getpixel((x, y))

            # Ajouter le bit du message en fonction de la parité de chaque composante RGB
            for i in range(3):  # R, G, B
                binary_message += str(pixel[i] % 2)

    # Convertir le message binaire en une séquence de caractères ASCII
    extracted_message = ''.join(chr(int(binary_message[i:i + 8], 2)) for i in range(0, len(binary_message), 8))

    return extracted_message

# Exemple d'utilisation du module en tant que script
if __name__ == "__main__":
    user_message = input("Entrez le message à dissimuler : ")
    user_image_path = input("Entrez le chemin de l'image d'origine : ")
    user_output_path = input("Entrez le chemin de sortie pour l'image contenant le message (laissez vide pour générer un nom par défaut) : ")

    message_image_path = dissimuler_message(user_image_path, user_message, user_output_path)
    print(f"Message dissimulé avec succès dans l'image : {message_image_path}")

    extracted_message = extraire_message(message_image_path)
    print(f"Message extrait : {extracted_message}")