"""Rendus haute définition des vêtements 3D -> visuels du site."""
from playwright.sync_api import sync_playwright
from PIL import Image
import io, os

OUT = '/home/user/projetimage/unseen/assets/'
TEX = 'print4k.jpg'          # texture 4096 px, relative à tools/

SHOTS = [
  # nom,            produit, yaw, largeur, hauteur, zoom, cam,             cible,      fov
  ('hoodie_front',  'hoodie',   0, 2000, 2500, .88, '0,0.07,3.9', '0,0.07,0', 30),
  ('hoodie_back',   'hoodie', 180, 2000, 2500, .88, '0,0.07,3.9', '0,0.07,0', 30),
  ('tee_front',     'tee',      0, 2000, 2500, 1.12, '0,-0.04,3.9', '0,-0.04,0', 30),
  ('tee_back',      'tee',    180, 2000, 2500, 1.12, '0,-0.04,3.9', '0,-0.04,0', 30),
  ('detail1',       'hoodie',  24, 2400, 1360, 1,   '0.60,1.05,1.75', '0,0.76,0', 30),
  ('detail2',       'tee',     14, 2400, 1360, 1,   '0.28,0.06,0.78', '0,0.02,0', 30),
  ('detail3',       'hoodie',   6, 2400, 1360, 1,   '0.16,0.48,1.25', '0,0.34,0', 28),
]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium',
        args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
              '--max-texture-size=8192'])
    pg = b.new_page(viewport={'width': 1200, 'height': 900}, device_scale_factor=1)
    pg.on('pageerror', lambda e: print('PAGEERROR:', e))
    for name, prod, yaw, w, h, zoom, cam, tgt, fov in SHOTS:
        url = (f'http://localhost:8099/tools/preview.html?p={prod}&yaw={yaw}&w={w}&h={h}'
               f'&zoom={zoom}&cam={cam}&tgt={tgt}&fov={fov}&tex={TEX}&floor=0')
        pg.goto(url, wait_until='load')
        pg.wait_for_function('window.__ready===true', timeout=60000)
        pg.wait_for_timeout(400)
        buf = pg.locator('#c').screenshot()
        im = Image.open(io.BytesIO(buf)).convert('RGBA')
        bg = Image.new('RGB', im.size, (8, 8, 11))
        bg.paste(im, mask=im.split()[3])
        bg.save(OUT + name + '.jpg', quality=85, subsampling=0, optimize=True)
        print(f'{name:14} {im.size}  {os.path.getsize(OUT+name+".jpg")//1024} Ko')
    b.close()
