




















methode1 ():

premièrement, pour la parti dissimulation, le message fourni est converti en une séquence binaire de bits. chaque lettre du message est représenté par 8 bits, ce qui signifie 1 octet. Ensuite, l'image d'origine est ouverte et pour chaque pixel, les bits de poids faibles des composantes RGB sont changés pour contenir les bits du message. tout cela se passe dans la fonction; dissimuler_message.

deuxièmement,pour la parti extraction, la fonction extraire_message parcourt tous les pixel et récupèr eles bits de poids faible qui sont ensuite, concaténés et forme la séquence binaire de notre message.
Le message binaire est ensuite divisé en groupes de 8bits, et chaque groupe est converti en un caractère ASCII, qui nous redonne le message original.

