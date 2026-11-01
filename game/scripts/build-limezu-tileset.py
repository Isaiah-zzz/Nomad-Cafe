"""Combine LimeZu's free Room Builder and Interiors sheets (32x32) into the
single tileset the café map uses. AI Town renders a map from one tileset image.

The LimeZu pack can't be redistributed, so it isn't in git. Download
Modern_Interiors_Free_v2.2.zip from https://limezu.itch.io/moderninteriors,
unzip it into public/assets/limezu/, then run:

    python3 scripts/build-limezu-tileset.py

Layout of the output (17 tiles wide): the Room Builder sheet first, then the
Interiors sheet below it, one Interiors row per output row, then our own
coffee bar (scripts/draw-coffee-sprites.py). data/cafe.js maps indices into
this image with its R(), I() and C() helpers.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "public/assets/limezu"
SRC = ROOT / "Modern tiles_Free/Interiors_free/32x32"
OUT = ROOT / "cafe-tileset.png"

room = Image.open(SRC / "Room_Builder_free_32x32.png").convert("RGBA")
interiors = Image.open(SRC / "Interiors_free_32x32.png").convert("RGBA")
coffee = Image.open(ROOT.parent / "coffee/coffee-bar.png").convert("RGBA")

out = Image.new("RGBA", (room.width, room.height + interiors.height + coffee.height))
out.paste(room, (0, 0))
out.paste(interiors, (0, room.height))
out.paste(coffee, (0, room.height + interiors.height))
out.save(OUT)
print(f"wrote {OUT.relative_to(ROOT.parent.parent.parent)} {out.size}")
