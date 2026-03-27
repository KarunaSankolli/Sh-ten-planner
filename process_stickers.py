from PIL import Image
import os

files = [
    ("/Users/karuna/.gemini/antigravity/brain/1d88939f-0982-4cd0-8a6e-122cfae3821a/sticker_lightbulb_1774511924554.png", "assets/sticker_lightbulb.png"),
    ("/Users/karuna/.gemini/antigravity/brain/1d88939f-0982-4cd0-8a6e-122cfae3821a/sticker_water_1774512004474.png", "assets/sticker_water.png"),
    ("/Users/karuna/.gemini/antigravity/brain/1d88939f-0982-4cd0-8a6e-122cfae3821a/sticker_dumbbell_1774512023472.png", "assets/sticker_dumbbell.png"),
    ("/Users/karuna/.gemini/antigravity/brain/1d88939f-0982-4cd0-8a6e-122cfae3821a/sticker_book_1774512039589.png", "assets/sticker_book.png")
]

os.makedirs("assets", exist_ok=True)

def process(path, out):
    img = Image.open(path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    visited = set()
    queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    
    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited:
            continue
        visited.add((x, y))
        
        r, g, b, a = pixels[x, y]
        # Allow anti-aliasing dark pixels too
        if r < 40 and g < 40 and b < 40 and a > 0:
            pixels[x, y] = (0, 0, 0, 0)
            
            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    queue.append((nx, ny))
                    
    img.save(out)
    print(f"Processed {out}")

for f, out in files:
    try:
        process(f, out)
    except Exception as e:
        print(f"Failed {f}: {e}")
