from PIL import Image
import os

def test_generer_nom_image_contenant_message():
    image_path = "path/vers/votre/image.png"
    generated_name = generer_nom_image_contenant_message(image_path)
    assert generated_name == "image_message.png"

def generer_nom_image_contenant_message(image_path):
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    message_image_name = f"{base_name}_message.png"
    return message_image_name


