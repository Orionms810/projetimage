from PIL import Image
import os

def generer_nom_image_contenant_message(image_path):
    """
    Génère le nom par défaut de l'image contenant le message

    Parametre:
    image_path : Le chemin de l'image d'origine

    Returns:
    Le nom généré de l'image contenant le message
    """
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    message_image_name = f"{base_name}_message.png"
    return message_image_name

def dissimuler_message(image_path, message, message_image_path=None):
    """
    Dissimule un message dans une image en modifiant les composantes RGB des pixels avec des nombres pairs et impairs

    Parametre
    image_path : Le chemin de l'image d'origine
    message : Le message à dissimuler
    message_image_path : Le chemin de sortie pour l'image contenant le message
    Si rien, un nom par défaut sera généré

    Returns:
    Le chemin de l'image contenant le message
    """
    original_image = Image.open(image_path)
    largeur, hauteur = original_image.size

    binary_message = ''.join(format(ord(char), '08b') for char in message)

    copie_image = original_image.copy()

    index = 0

    for y in range(hauteur):
        for x in range(largeur):
            pixel = list(copie_image.getpixel((x, y)))

            for i in range(3):
                if index < len(binary_message):
                    if int(binary_message[index]):
                        pixel[i] = pixel[i] // 2 * 2 + 1  #nombre impair
                    else:
                        pixel[i] = pixel[i] // 2 * 2  #nombre pair
                    index += 1

            copie_image.putpixel((x, y), tuple(pixel))

    if message_image_path is None:
        message_image_path = generer_nom_image_contenant_message(image_path)

    copie_image.save(message_image_path)

    return message_image_path

def extraire_message(image_path):
    """
    Extrait un message dissimulé dans une image en récupérant les bits du message à partir des composantes RGB des pixels

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
            pixel = copie_image.getpixel((x, y))

            for i in range(3): 
                binary_message += str(pixel[i] % 2)

    
    extracted_message = ''.join(chr(int(binary_message[i:i + 8], 2)) for i in range(0, len(binary_message), 8)) # Convertir le message binaire en une séquence ASCII

    return extracted_message

if __name__ == "__main__":
    user_message = input("Entrez le message à dissimuler : ")
    user_image_path = input("Entrez le chemin de l'image d'origine : ")
    user_output_path = input("Entrez le chemin de sortie pour l'image contenant le message (laissez vide pour générer un nom par défaut) : ")

    message_image_path = dissimuler_message(user_image_path, user_message, user_output_path)
    print(f"Message dissimulé avec succès dans l'image : {message_image_path}")

    extracted_message = extraire_message(message_image_path)
    print(f"Message extrait : {extracted_message}")