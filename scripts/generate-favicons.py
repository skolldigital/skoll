from PIL import Image
from pathlib import Path

src = Path(r'e:\PROJECTS\WORKS\Skoll\assets\images\logo_mark_main.png')
out_dir = Path(r'e:\PROJECTS\WORKS\Skoll\assets\images')
root = Path(r'e:\PROJECTS\WORKS\Skoll')

img = Image.open(src).convert('RGBA')
w, h = img.size
side = max(w, h)
pad = int(side * 0.08)
canvas_side = side + pad * 2
square = Image.new('RGBA', (canvas_side, canvas_side), (10, 10, 10, 255))
offset = ((canvas_side - w) // 2, (canvas_side - h) // 2)
square.paste(img, offset, img)

sizes = {
    'favicon-48.png': 48,
    'favicon-96.png': 96,
    'favicon-192.png': 192,
    'apple-touch-icon.png': 180,
    'android-chrome-512.png': 512,
}

for name, size in sizes.items():
    resized = square.resize((size, size), Image.Resampling.LANCZOS)
    path = out_dir / name
    resized.save(path, 'PNG', optimize=True)
    print(f'Wrote {path.name} ({size}x{size})')

favicon_main = square.resize((192, 192), Image.Resampling.LANCZOS)
favicon_main.save(out_dir / 'favicon.png', 'PNG', optimize=True)
print('Wrote favicon.png (192x192)')

ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_images = [square.resize(s, Image.Resampling.LANCZOS) for s in ico_sizes]
ico_images[-1].save(root / 'favicon.ico', format='ICO', sizes=ico_sizes)
print('Wrote favicon.ico at site root')
ico_images[-1].save(out_dir / 'favicon.ico', format='ICO', sizes=ico_sizes)
print('Wrote assets/images/favicon.ico')
