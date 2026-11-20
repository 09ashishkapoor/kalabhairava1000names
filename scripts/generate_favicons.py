"""Generate square favicon assets from the existing devotional artwork.

Run from the repository root:  python scripts/generate_favicons.py

The site's old icons pointed at a 1920x1080 landscape background, which Google
and browsers squash into an unreadable blur. These crops keep the deity from
the original artwork (no image generation) and output the sizes the site needs.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "kalabhairava-bg-desktop.webp"
OUT = ROOT / "public"

# Square crop centred on the deity, keeping the halo and upper torso. Using
# the same crop at every size keeps the icon consistent and, at 16px, retains
# enough structure (arms/halo) to avoid looking like a colour blob.
DEITY_CROP = (700, 60, 1220, 580)


def crop(image: Image.Image, box: tuple[int, int, int, int], size: int) -> Image.Image:
    return image.crop(box).resize((size, size), Image.LANCZOS)


def main() -> None:
    image = Image.open(SOURCE).convert("RGB")

    # Classic multi-resolution favicon (browsers and Google request this by default).
    image.crop(DEITY_CROP).save(
        OUT / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    # Modern PNG icons + Apple touch icon.
    for filename, size in [
        ("favicon-32.png", 32),
        ("favicon-192.png", 192),
        ("favicon-512.png", 512),
        ("apple-touch-icon.png", 180),
    ]:
        crop(image, DEITY_CROP, size).save(OUT / filename, format="PNG", optimize=True)

    for name in ["favicon.ico", "favicon-32.png", "favicon-192.png",
                 "favicon-512.png", "apple-touch-icon.png"]:
        print(f"wrote public/{name}")


if __name__ == "__main__":
    main()
