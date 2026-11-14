#!/usr/bin/env python3
"""Build responsive hero images from design/heroes/<name>.jpg using the crops in data/heroes.json.

Writes public/hero/<name>-wide-{1280,1920}.{avif,webp} and public/hero/<name>-tall-{600,900}.{avif,webp}.
Usage: python3 scripts/hero-images.py [name ...]
"""
import json, os, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SIZES = {'wide': [1280, 1920], 'tall': [600, 900]}

heroes = {k: v for k, v in json.load(open(os.path.join(ROOT, 'data/heroes.json'))).items() if not k.startswith('_')}
out_dir = os.path.join(ROOT, 'public/hero')
os.makedirs(out_dir, exist_ok=True)

for name in sys.argv[1:] or heroes:
    cfg = heroes[name]
    src = Image.open(os.path.join(ROOT, f'design/heroes/{name}.jpg')).convert('RGB')
    for shape, widths in SIZES.items():
        crop = src.crop(tuple(cfg[shape]))
        for w in widths:
            # Never upscale: if the crop is narrower than the target, use the crop's own width.
            tw = min(w, crop.width)
            img = crop.resize((tw, round(crop.height * tw / crop.width)), Image.LANCZOS)
            base = os.path.join(out_dir, f'{name}-{shape}-{w}')
            img.save(base + '.avif', 'AVIF', quality=55)
            img.save(base + '.webp', 'WEBP', quality=72, method=6)
            print(f'{name}-{shape}-{w}: {img.width}x{img.height}, '
                  f'{os.path.getsize(base + ".avif") // 1024} KB avif / {os.path.getsize(base + ".webp") // 1024} KB webp')
