"""Draw the café's coffee bar and cup, which LimeZu's free pack doesn't have.

They're drawn at 16px per tile in LimeZu's colors and doubled, like the pack's
32x32 sheets. Run after editing, then rebuild the tileset:

    python3 scripts/draw-coffee-sprites.py
    python3 scripts/build-limezu-tileset.py

coffee-bar.png is a 6x3-tile counter with an espresso machine (data/cafe.js
places it); cup.png is the cup guests carry and set on their table.
"""

from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "public/assets/coffee"

COLORS = {
    "O": (0x3A, 0x3A, 0x50),  # outline
    "T": (0xE0, 0xB8, 0x70),  # counter top
    "H": (0xF1, 0xD1, 0x88),  # counter top highlight
    "F": (0xCA, 0x88, 0x54),  # counter front
    "P": (0xB3, 0x5E, 0x3F),  # counter planks
    "S": (0xA7, 0x97, 0x96),  # shadow on the floor
    "1": (0xE8, 0xEB, 0xF2),  # steel highlight
    "2": (0xC3, 0xC8, 0xD6),  # steel
    "3": (0x8D, 0x93, 0xA8),  # steel shade
    "R": (0xEC, 0x6C, 0x55),  # power light
    "W": (0xF8, 0xF8, 0xF8),  # cup
    "G": (0xCC, 0xC2, 0xBC),  # cup shade
    "C": (0x7A, 0x4A, 0x2E),  # coffee
}

MACHINE = [
    "...W.W..........",
    "..OOOOOOOOOOOO..",
    "..O3333333333O..",
    "..OOOOOOOOOOOO..",
    "..O1222222223O..",
    "..O12OOOO2R23O..",
    "..O1222222223O..",
    "..O1OOO22OOO3O..",
    "..O13O3333O33OO.",
    "..O13333333333O.",
    "..O13CCC33CCC3O.",
    "..O13WWG33WWG3O.",
    "..O13WWG33WWG3..",
    "..O1OOOOOOOO23O.",
    "..O1O3O3O3O323O.",
    "..OOOOOOOOOOOOO.",
]

CUP = [
    ".OOOO...",
    "OCCCCO..",
    "OWWWGOO.",
    "OWWWGO.O",
    "OWWWGOO.",
    ".OOOO...",
]


def paint(img, x, y, rows):
    for dy, row in enumerate(rows):
        for dx, ch in enumerate(row):
            if ch in COLORS:
                img.putpixel((x + dx, y + dy), COLORS[ch] + (255,))


def rect(img, x0, y0, x1, y1, ch):
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            img.putpixel((x, y), COLORS[ch] + (255,))


def counter():
    # Three rows of tiles: the machine rises into the top one, the counter top
    # fills the middle one, and its front faces the guests in the bottom one.
    img = Image.new("RGBA", (96, 48))
    rect(img, 0, 20, 95, 42, "O")
    rect(img, 1, 21, 94, 21, "H")
    rect(img, 1, 22, 94, 31, "T")
    rect(img, 1, 32, 94, 32, "P")
    rect(img, 1, 33, 94, 41, "F")
    for x in range(8, 95, 8):
        rect(img, x, 33, x, 41, "P")
    rect(img, 1, 43, 94, 44, "S")
    paint(img, 8, 11, MACHINE)
    # Cups waiting by the machine.
    paint(img, 27, 22, CUP)
    paint(img, 36, 22, CUP)
    return img.resize((192, 96), Image.NEAREST)


def cup():
    img = Image.new("RGBA", (8, 6))
    paint(img, 0, 0, CUP)
    return img.resize((16, 12), Image.NEAREST)


OUT.mkdir(parents=True, exist_ok=True)
counter().save(OUT / "coffee-bar.png")
cup().save(OUT / "cup.png")
print(f"wrote {OUT}/coffee-bar.png and cup.png")
