"""Imprimé UNSEEN haute définition : éclairs jaunes + sakura roses sur noir."""
from PIL import Image, ImageDraw, ImageFilter
import random, math

random.seed(7)
S = 4096
SS = 2                      # suréchantillonnage
W = S * SS

def midpoint(p0, p1, disp, depth):
    if depth == 0:
        return [p0, p1]
    mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    ln = math.hypot(dx, dy) or 1
    nx, ny = -dy / ln, dx / ln
    off = random.uniform(-disp, disp)
    mid = (mx + nx * off, my + ny * off)
    return midpoint(p0, mid, disp / 2, depth - 1)[:-1] + midpoint(mid, p1, disp / 2, depth - 1)

def bolt(layers, p0, p1, width, depth=6, gen=0):
    pts = midpoint(p0, p1, math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * .16, depth)
    glow, mid, core = layers
    glow.line(pts, fill=(255, 170, 20, 62), width=int(width * 4.5), joint='curve')
    mid.line(pts,  fill=(255, 205, 0, 240),  width=max(2, int(width * 1.9)), joint='curve')
    core.line(pts, fill=(255, 248, 190, 255), width=max(1, int(width * .8)), joint='curve')
    if gen < 3:
        for _ in range(random.randint(2, 4)):
            i = random.randrange(2, len(pts) - 2)
            a = pts[i]
            ang = math.atan2(p1[1] - p0[1], p1[0] - p0[0]) + random.uniform(-1.25, 1.25)
            ln = math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * random.uniform(.22, .45)
            b = (a[0] + math.cos(ang) * ln, a[1] + math.sin(ang) * ln)
            bolt(layers, a, b, width * .6, depth - 1, gen + 1)
    return pts

def petal_poly(r, n=26):
    """Contour d'un pétale de sakura (pointe échancrée)."""
    def bez(p0, p1, p2, p3, t):
        u = 1 - t
        return (u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
                u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1])
    pts = [bez((0,0),(r*.38,-r*.30),(r*.44,-r*.82),(r*.13,-r*.99), i/n) for i in range(n+1)]
    pts.append((0, -r*.78))
    pts += [bez((-r*.13,-r*.99),(-r*.44,-r*.82),(-r*.38,-r*.30),(0,0), i/n) for i in range(n+1)]
    return pts

def blossom(size, c_out, c_in):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = cy = size / 2
    r = size * .46
    for k in range(5):
        a = math.radians(k * 72 + 18)
        ca, sa = math.cos(a), math.sin(a)
        for poly, col in ((petal_poly(r), c_out), (petal_poly(r * .62), c_in)):
            d.polygon([(cx + x*ca - y*sa, cy + x*sa + y*ca) for x, y in poly], fill=col)
    d.ellipse([cx-size*.05, cy-size*.05, cx+size*.05, cy+size*.05], fill=(255, 240, 248, 255))
    for k in range(5):                                  # étamines
        a = math.radians(k * 72)
        d.ellipse([cx+math.cos(a)*size*.11-size*.018, cy+math.sin(a)*size*.11-size*.018,
                   cx+math.cos(a)*size*.11+size*.018, cy+math.sin(a)*size*.11+size*.018],
                  fill=(255, 225, 240, 255))
    return im

PINKS = [((226, 24, 104, 255), (255, 110, 170, 255)),
         ((255, 70, 140, 255), (255, 170, 205, 255)),
         ((255, 140, 190, 255), (255, 225, 240, 255))]
SPRITES = [blossom(320, o, i) for o, i in PINKS]

base = Image.new('RGB', (W, W), (5, 4, 6))
gl = Image.new('RGBA', (W, W), (0, 0, 0, 0)); gd = ImageDraw.Draw(gl)
ml = Image.new('RGBA', (W, W), (0, 0, 0, 0)); md = ImageDraw.Draw(ml)
cl = Image.new('RGBA', (W, W), (0, 0, 0, 0)); cd = ImageDraw.Draw(cl)

paths = []
for i in range(9):                                       # éclairs principaux
    x = W * (i + .5) / 9 + random.uniform(-W*.05, W*.05)
    paths.append(bolt((gd, md, cd), (x, -W*.05), (x + random.uniform(-W*.14, W*.14), W*1.05), 8*SS))
for _ in range(5):                                       # quelques éclairs obliques
    paths.append(bolt((gd, md, cd), (random.uniform(0, W), random.uniform(0, W*.4)),
                      (random.uniform(0, W), random.uniform(W*.6, W)), 5*SS, 5))

base.paste(gl.filter(ImageFilter.GaussianBlur(22*SS)), (0, 0), gl.filter(ImageFilter.GaussianBlur(22*SS)))
base.paste(ml, (0, 0), ml)
base.paste(cl, (0, 0), cl)

flowers = Image.new('RGBA', (W, W), (0, 0, 0, 0))
for pts in paths:                                        # fleurs le long des éclairs
    for p in pts[::max(1, len(pts)//14)]:
        for _ in range(random.randint(1, 2)):
            s = int(random.uniform(.020, .055) * W)
            sp = random.choice(SPRITES).resize((s, s), Image.LANCZOS).rotate(random.uniform(0, 360), Image.BICUBIC)
            x = int(p[0] + random.uniform(-.05, .05) * W - s / 2)
            y = int(p[1] + random.uniform(-.05, .05) * W - s / 2)
            flowers.alpha_composite(sp, (x, y))
for _ in range(80):                                      # pétales dispersés
    s = int(random.uniform(.009, .022) * W)
    sp = random.choice(SPRITES).resize((s, s), Image.LANCZOS).rotate(random.uniform(0, 360), Image.BICUBIC)
    flowers.alpha_composite(sp, (random.randrange(W - s), random.randrange(W - s)))

base.paste(flowers, (0, 0), flowers)
out = base.resize((S, S), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=70, threshold=3))
out.save('/home/user/projetimage/unseen/assets/print.jpg', quality=82, subsampling=0, optimize=True)
out.resize((512, 512), Image.LANCZOS).save('/tmp/claude-0/-home-user-projetimage/dfce37fd-ffa9-510b-8a49-ab74e7de4a6c/scratchpad/print_preview.png')
print('print.jpg', out.size)
