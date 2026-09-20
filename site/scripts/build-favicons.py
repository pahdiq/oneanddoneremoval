"""Raster exports of the existing code-native favicon.svg mark. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

assets = Path(__file__).resolve().parent.parent / 'public' / 'assets'
# Same 64-unit blue rounded square and white path as favicon.svg.
scale = 12
icon = Image.new('RGBA', (64 * scale, 64 * scale))
draw = ImageDraw.Draw(icon)
draw.rounded_rectangle((0, 0, 64 * scale - 1, 64 * scale - 1), radius=12 * scale, fill='#075bff')
points = [(19,20),(32,12),(42,12),(36,47),(46,47),(44,54),(15,54),(17,47),(27,47),(31,22),(18,29)]
draw.polygon([(x*scale,y*scale) for x,y in points], fill='white')
for size, name in [(96,'favicon-96.png'), (192,'favicon-192.png'), (180,'apple-touch-icon.png')]:
    icon.resize((size,size),Image.Resampling.LANCZOS).save(assets / name, optimize=True)
icon.resize((256,256),Image.Resampling.LANCZOS).save(assets.parent / 'favicon.ico', sizes=[(16,16),(32,32),(48,48),(64,64)])
print('Exported existing brand mark to PNG, Apple touch icon, and multi-size ICO.')
