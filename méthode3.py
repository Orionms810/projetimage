from PIL import Image 
import os 

def imagename(image_path):
    """
    Crée un nom pour l'image qui contient le message

    A pour paramètres : 
    image_path, le chemin de l'image originale

    Retourne le nom de l'image

    """
    
    nom_image_origine = os.path.splitext(os.path.basename(image_path))[0]
    nom_image_message = f"{nom_image_origine}_message.png"
    return nom_image_message

def cachermessage(image_path, message, chemin_image_message=None):
    """
    Permet de cacher un message dans une image à partir de la stéganographie, c'est à dire changer les couleurs des pixels de l'image.

    A pour paramètres : 
    image_path, le chemin de l'image originale
    message : le message que l'on veut cacher
    chemin_image_message : le chemin pour trouver l'image qui contient le message

    Retourne le chemin de l'image qui contient le message
    """
    image = Image.open(image_path)
    largeur, hauteur = image.size
    message_binaire = ''.join(format(ord(char), '08b')for char in message)
    copie_image = image.copy()
    index = 0
    for y in range(hauteur):
        for x in range(largeur):
            pixel = list(copie_image.getpixel(x,y))
            for i in range(3):
                pixel[i] = (pixel[i] // 5) *5

            copie_image.putpixel((x, y), tuple(pixel))
    index = 0 
    for y in range(hauteur):
        for x in range(largeur):
            pixel = list(copie_image.getpixel(x,y))
            for i in range(3):
                if index < len(message_binaire):
                    bit = int(message_binaire[index])
                    pixel[i] += 5 if bit else 0 
                    index += 1

            copie_image.putpixel((x, y), tuple(pixel))
    if chemin_image_message is None:
        chemin_image_message = imagename(image_path)
    
    copie_image.save(chemin_image_message)

    return chemin_image_message

def message_out(image_path):
    copie_image = Image.open(image_path)
    largeur, hauteur = copie_image.getpixel((x, y))
    message_binaire = ''
    for y in range(hauteur):
        for x in range(largeur):
            pixel = copie_image.getpixel((x, y))
            for i in range(3):
                message_binaire += str(pixel[i] % 5 > 0)
    message_sortie = ''.join(chr(int(message_binaire[i:i + 8], 2)) for i in range(0, len(message_binaire), 8))
    return message_sortie

if __name__ == "__main__":
    user_message = input("Entrez le message à dissimuler :")
    user_image_path = input("Entrez le chemin de l'image d'origine : ")
    user_output_path = input("Entrez le chemin de sortie pour l'image contenant le message : ")

    chemin_image_message = cachermessage(user_image_path, user_message, user_output_path)
    print(f"Message dissimulé dans l'image : {chemin_image_message}")

    message_sortie = message_out(chemin_image_message)
    print(f"Message extrait : {message_sortie}")