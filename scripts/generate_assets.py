from PIL import Image, ImageDraw, ImageFont
import math
import os
import qrcode

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSET_DIR = os.path.join(ROOT, "assets", "balance3.r")
os.makedirs(ASSET_DIR, exist_ok=True)

SIZE = 480
cx = cy = SIZE // 2

# Dark field-compass dial with a clear, high-contrast scale.
dial = Image.new("RGBA", (SIZE, SIZE), (8, 14, 16, 255))
draw = ImageDraw.Draw(dial)
draw.ellipse((22, 22, 458, 458), outline=(104, 127, 119, 255), width=3)
draw.ellipse((34, 34, 446, 446), outline=(46, 65, 62, 255), width=2)
draw.ellipse((65, 65, 415, 415), outline=(80, 100, 92, 255), width=2)
draw.ellipse((86, 86, 394, 394), outline=(37, 55, 51, 255), width=1)

for i in range(72):
    a = math.radians(i * 5 - 90)
    major = i % 6 == 0
    medium = i % 3 == 0
    r1 = 190 if major else (198 if medium else 204)
    r2 = 216
    x1, y1 = cx + math.cos(a) * r1, cy + math.sin(a) * r1
    x2, y2 = cx + math.cos(a) * r2, cy + math.sin(a) * r2
    color = (222, 169, 87, 255) if i == 0 else ((142, 164, 151, 255) if major else (83, 105, 96, 255))
    draw.line((x1, y1, x2, y2), fill=color, width=3 if major else (2 if medium else 1))

try:
    font_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
except OSError:
    font_big = font_small = ImageFont.load_default()

for label, degree in [("N", 0), ("E", 90), ("S", 180), ("W", 270)]:
    a = math.radians(degree - 90)
    x, y = cx + math.cos(a) * 165, cy + math.sin(a) * 165
    box = draw.textbbox((0, 0), label, font=font_big)
    draw.text((x - (box[2] - box[0]) / 2, y - (box[3] - box[1]) / 2),
              label, font=font_big,
              fill=(238, 173, 83, 255) if label == "N" else (210, 220, 212, 255))

for label, degree in [("NE", 45), ("SE", 135), ("SW", 225), ("NW", 315)]:
    a = math.radians(degree - 90)
    x, y = cx + math.cos(a) * 165, cy + math.sin(a) * 165
    box = draw.textbbox((0, 0), label, font=font_small)
    draw.text((x - (box[2] - box[0]) / 2, y - (box[3] - box[1]) / 2),
              label, font=font_small, fill=(130, 151, 139, 255))

draw.ellipse((217, 217, 263, 263), outline=(180, 194, 182, 255), width=2)
dial.save(os.path.join(ASSET_DIR, "dial.png"))

# Transparent two-color needle, centered so the watch can rotate it smoothly.
needle = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
nd = ImageDraw.Draw(needle)
nd.polygon([(240, 74), (222, 240), (240, 218), (258, 240)],
           fill=(226, 87, 53, 255), outline=(255, 205, 166, 255))
nd.polygon([(240, 406), (222, 240), (240, 262), (258, 240)],
           fill=(205, 216, 204, 255), outline=(84, 101, 91, 255))
nd.ellipse((229, 229, 251, 251), fill=(226, 178, 98, 255), outline=(10, 18, 16, 255), width=3)
needle.save(os.path.join(ASSET_DIR, "needle.png"))

icon = Image.new("RGBA", (128, 128), (8, 14, 16, 255))
idraw = ImageDraw.Draw(icon)
idraw.ellipse((6, 6, 122, 122), outline=(198, 164, 101, 255), width=5)
idraw.line((64, 18, 64, 110), fill=(220, 82, 54, 255), width=7)
idraw.polygon([(64, 12), (49, 68), (64, 58), (79, 68)], fill=(230, 94, 60, 255))
idraw.ellipse((55, 55, 73, 73), fill=(230, 190, 110, 255))
icon.save(os.path.join(ASSET_DIR, "icon.png"))

# QR code opens the latest downloadable release page.
install_url = "https://github.com/qiang1284779398-hue/field-compass/releases/latest"
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=12, border=4)
qr.add_data(install_url)
qr.make(fit=True)
qr.make_image(fill_color="black", back_color="white").convert("RGB").resize((720, 720)).save(
    os.path.join(ROOT, "INSTALL_QR.png"), optimize=True
)
print("Generated compass assets and INSTALL_QR.png")
