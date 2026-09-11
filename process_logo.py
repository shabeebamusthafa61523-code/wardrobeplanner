import os
from PIL import Image, ImageFilter

input_path = r"C:\Users\Lenovo L460\.gemini\antigravity\brain\e17d7381-fe16-49cc-95ee-eb56cc1ea8d8\.user_uploaded\media_1789019451719.jpg"
output_dir = r"d:\Wardrobedetect\frontend\public"
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "logo.png")

img = Image.open(input_path).convert("RGBA")
width, height = img.size

# Convert image to RGB array / pixel access
pixels = img.load()

# FLOOD FILL BACKGROUND REMOVAL FROM EDGES
# We know the outer background is white/light grey marble.
# We flood fill from all edge pixels where pixel luminance is high (light background).

visited = set()
queue = []

# Add all border pixels to queue if they are light (luminance > 180)
def get_luminance(r, g, b):
    return 0.299 * r + 0.587 * g + 0.114 * b

for x in range(width):
    for y in [0, height - 1]:
        r, g, b, a = pixels[x, y]
        if get_luminance(r, g, b) > 170:
            queue.append((x, y))
            visited.add((x, y))

for y in range(height):
    for x in [0, width - 1]:
        if (x, y) not in visited:
            r, g, b, a = pixels[x, y]
            if get_luminance(r, g, b) > 170:
                queue.append((x, y))
                visited.add((x, y))

# BFS Flood Fill
neighbors = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)]

while queue:
    cx, cy = queue.pop(0)
    # Set alpha to 0 for background
    pixels[cx, cy] = (0, 0, 0, 0)
    
    for dx, dy in neighbors:
        nx, ny = cx + dx, cy + dy
        if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
            r, g, b, a = pixels[nx, ny]
            # Stop flood fill when reaching dark metallic shield border (luminance < 175 or silver metallic boundary)
            # The marble background has high brightness and low color saturation.
            luminance = get_luminance(r, g, b)
            if luminance > 165:
                visited.add((nx, ny))
                queue.append((nx, ny))

img.save(output_path, "PNG")
print(f"Successfully processed logo and saved to {output_path}")
