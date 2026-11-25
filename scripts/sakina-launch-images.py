# Usage: python3 scripts/sakina-launch-images.py ~/Documents/Claude-Workspace/eficiatech/Clients/Sakina-Films/launch/
# Writes into launch/site/, which content/work/sakina-films.md uses as its sources.
# Web versions of the two Sakina launch stories: phone/Instagram chrome cropped off, and every
# region showing people or a couple's names pixelated (site imagery rule + guests' privacy).
# Coordinates are measured on a half-size preview of each image and doubled.
import sys
from PIL import Image
base = sys.argv[1]
SAND = (227, 213, 188)
def pixelate(im, box, block=24):
    # One cell size everywhere, and the cells pulled 60% toward sand, so it reads as a deliberate blur.
    x0, y0, x1, y1 = [round(v * 2) for v in box]
    region = im.crop((x0, y0, x1, y1))
    w, h = region.size
    small = region.resize((max(1, w // block), max(1, h // block)), Image.BILINEAR)
    small = Image.blend(small, Image.new('RGB', small.size, SAND), 0.6)
    im.paste(small.resize((w, h), Image.NEAREST), (x0, y0))

# 1. Before & after
im = Image.open(base + 'sakina-before-after-story.png').convert('RGB')
pixelate(im, (36, 393, 297, 737))           # the whole "before" grid: guests, couples, crowds
pixelate(im, (267, 557, 362, 685))     # after grid, tile 1: a person and a couple's names
im.crop((36 * 2, 185 * 2, 575 * 2, 978 * 2)).save(base + 'site/sakina-before-after.png')

# 2. The new grid, as posted
im = Image.open(base + 'sakina-launch-story-grid.png').convert('RGB')
pixelate(im, (118, 247, 233, 398))     # row 1, col 1: a person and a couple's names
pixelate(im, (233, 705, 348, 856))     # row 4, col 2: a person
pixelate(im, (348, 705, 464, 856))    # row 4, col 3: a person
# Three rows only: drops the bottom row, the reel badge and the Instagram scrollbar.
im.crop((118 * 2, 247 * 2, 456 * 2, 704 * 2)).save(base + 'site/sakina-new-grid.png')
print('ok')
