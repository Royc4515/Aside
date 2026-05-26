"""Add a subtle border + rounded corners to promo images so they don't blend
into GitHub's page background. Dark images get a faint light border, light
images get a faint dark border."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).parent
RADIUS = 18
BORDER = 2

# (filename, variant)
TARGETS = [
    ("hero-dark.png",        "dark"),
    ("hero-light.png",       "light"),
    ("features-dark.png",    "dark"),
    ("features-light.png",   "light"),
    ("providers-dark.png",   "dark"),
    ("providers-light.png",  "light"),
    ("dark-light.png",       "dark"),  # has both halves; pick darker stroke
]

def frame(path: Path, variant: str) -> None:
    src = Image.open(path).convert("RGBA")
    w, h = src.size

    # Build a rounded-corner alpha mask
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=RADIUS, fill=255)

    # Apply mask: corners become transparent
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(src, (0, 0), mask)

    # Stroke the same rounded rect with a subtle border
    if variant == "dark":
        stroke = (255, 255, 255, 38)   # ~15% white
    else:
        stroke = (0, 0, 0, 32)         # ~12% black
    draw = ImageDraw.Draw(out)
    for i in range(BORDER):
        draw.rounded_rectangle(
            (i, i, w - 1 - i, h - 1 - i),
            radius=max(1, RADIUS - i),
            outline=stroke,
            width=1,
        )

    out.save(path, "PNG", optimize=True)
    print(f"  framed {path.name}")

for name, variant in TARGETS:
    p = ROOT / name
    if not p.exists():
        print(f"  SKIP (missing): {name}")
        continue
    frame(p, variant)

print("done")
