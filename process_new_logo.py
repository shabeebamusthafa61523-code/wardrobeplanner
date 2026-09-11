import os
from PIL import Image

input_path = r"C:\Users\Lenovo L460\.gemini\antigravity\brain\e17d7381-fe16-49cc-95ee-eb56cc1ea8d8\.user_uploaded\media_1789040200183.jpg"
output_dir = r"d:\Wardrobedetect\frontend\public"
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "logo.png")

img = Image.open(input_path).convert("RGBA")
width, height = img.size
pixels = img.load()

def get_luminance(r, g, b):
    return 0.299 * r + 0.587 * g + 0.114 * b

visited = set()
queue = []

# Initialize from all outer borders
for x in range(width):
    for y in range(height):
        if x < 10 or x > width - 10 or y < 10 or y > height - 10:
            r, g, b, a = pixels[x, y]
            # Border pixels that are light or soft grey shadow
            if get_luminance(r, g, b) > 120:
                queue.append((x, y))
                visited.add((x, y))

neighbors = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)]

while queue:
    cx, cy = queue.pop(0)
    pixels[cx, cy] = (0, 0, 0, 0)
    
    for dx, dy in neighbors:
        nx, ny = cx + dx, cy + dy
        if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
            r, g, b, a = pixels[nx, ny]
            # Continue expanding across outer background or soft shadow outside rose-gold frame
            # Rose-gold frame has reddish-copper hue (r > g + 15 and r > b + 20)
            is_rose_gold = (r > g + 25) and (r > b + 25) and (r > 100)
            
            if not is_rose_gold:
                visited.add((nx, ny))
                queue.append((nx, ny))

img.save(output_path, "PNG")
print(f"Successfully processed sharp rose gold logo to {output_path}")
