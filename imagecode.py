from PIL import Image
import os

def test_generer_nom_image_contenant_message():
    image_path = "path/vers/votre/image.png"
    generated_name = generer_nom_image_contenant_message(image_path)
    assert generated_name == "image_message.png"

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
    Dissimule un message dans une image en modifiant les composantes RGB des pixels.

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

    binary_message = ''.join(format(ord(char), '08b') for char in message)

    steg_image = original_image.copy()

    index = 0 

    for y in range(height):
        for x in range(width):
            pixel = list(steg_image.getpixel((x, y)))

            for i in range(3): 
                if index < len(binary_message):
                    pixel[i] = int(format(pixel[i], '08b')[:-1] + binary_message[index], 2)
                    index += 1

            steg_image.putpixel((x, y), tuple(pixel))

    if message_image_path is None:
        message_image_path = generer_nom_image_contenant_message(image_path)
        
    steg_image.save(message_image_path)

    return message_image_path
 

def extraire_message(image_path):
    """
    Extrait un message dissimulé dans une image en récupérant les bits de poids faible des composantes RGB.

    Parameters:
    image_path (str): Le chemin de l'image contenant le message.

    Returns:
    str: Le message extrait.
    """
    steg_image = Image.open(image_path)
    width, height = steg_image.size

    binary_message = ''
    for y in range(height):
        for x in range(width):
            pixel = list(steg_image.getpixel((x, y)))

            for i in range(3):
                binary_message += format(pixel[i], '08b')[-1]
    extracted_message = ''.join(chr(int(binary_message[i:i + 8], 2)) for i in range(0, len(binary_message), 8))

    return extracted_message

if __name__ == "__main__":
    user_message = input("Entrez le message à dissimuler : ")
    user_image_path = input("Entrez le chemin de l'image d'origine : ")
    user_output_path = input("Entrez le chemin de sortie pour l'image contenant le message: ")

    message_image_path = dissimuler_message(user_image_path, user_message, user_output_path)
    print(f"Message dissimulé dans l'image : {message_image_path}")

    extracted_message = extraire_message(message_image_path)
    print(f"Message extrait : {extracted_message}")
