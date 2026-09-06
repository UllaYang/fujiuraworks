import base64
from io import BytesIO
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, "/tmp/codex-qr-libs")

import qrcode
import qrcode.image.svg
from PIL import Image, ImageChops, ImageDraw


URL = "https://fujiuraworks.jp"
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "assets"
ILLUSTRATION_PATH = Path(
    "/Users/fujiuratakashi/Documents/GitHub/fujiuraworks/"
    "fujiuraworks.jp/img/footer.png"
)


def make_qr(image_factory=None, box_size=40):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=4,
    )
    qr.add_data(URL)
    qr.make(fit=True)
    return qr.make_image(
        image_factory=image_factory,
        fill_color="black",
        back_color="white",
    )


OUTPUT_DIR.mkdir(exist_ok=True)

png = make_qr()
png.save(OUTPUT_DIR / "qr-fujiuraworks.png", dpi=(300, 300))

svg = make_qr(qrcode.image.svg.SvgPathImage, box_size=10)
svg_path = OUTPUT_DIR / "qr-fujiuraworks.svg"
svg.save(svg_path)

# A conservative circular knockout for a logo or illustration. The white ring
# around the artwork helps scanners distinguish it from the QR modules.
png_with_space = png.copy().convert("RGB")
draw = ImageDraw.Draw(png_with_space)
center = png_with_space.width / 2
radius = 170
draw.ellipse(
    (center - radius, center - radius, center + radius, center + radius),
    fill="white",
)
png_with_space.save(
    OUTPUT_DIR / "qr-fujiuraworks-illustration-space.png",
    dpi=(300, 300),
)

ET.register_namespace("", "http://www.w3.org/2000/svg")
tree = ET.parse(svg_path)
root = tree.getroot()
ET.SubElement(
    root,
    "{http://www.w3.org/2000/svg}circle",
    {"cx": "18.5", "cy": "18.5", "r": "4.25", "fill": "white"},
)
tree.write(
    OUTPUT_DIR / "qr-fujiuraworks-illustration-space.svg",
    encoding="UTF-8",
    xml_declaration=True,
)

# Fit the supplied character art inside the knockout while retaining a white
# safety ring. The QR modules themselves remain pixel-perfect and untouched.
illustration = Image.open(ILLUSTRATION_PATH).convert("RGBA")
alpha_bbox = illustration.getchannel("A").getbbox()
if alpha_bbox:
    illustration = illustration.crop(alpha_bbox)

art_size = 280
illustration.thumbnail((art_size, art_size), Image.Resampling.LANCZOS)
art = Image.new("RGBA", (art_size, art_size), (255, 255, 255, 0))
art.paste(
    illustration,
    ((art_size - illustration.width) // 2, (art_size - illustration.height) // 2),
    illustration,
)
circle_mask = Image.new("L", (art_size, art_size), 0)
ImageDraw.Draw(circle_mask).ellipse((0, 0, art_size - 1, art_size - 1), fill=255)
art.putalpha(ImageChops.multiply(art.getchannel("A"), circle_mask))

illustrated_png = png_with_space.copy().convert("RGBA")
art_xy = ((illustrated_png.width - art_size) // 2,) * 2
illustrated_png.alpha_composite(art, art_xy)
illustrated_png.convert("RGB").save(
    OUTPUT_DIR / "qr-fujiuraworks-illustrated.png",
    dpi=(300, 300),
)

buffer = BytesIO()
art.save(buffer, format="PNG")
art_data = base64.b64encode(buffer.getvalue()).decode("ascii")
illustrated_svg_tree = ET.parse(
    OUTPUT_DIR / "qr-fujiuraworks-illustration-space.svg"
)
illustrated_svg_root = illustrated_svg_tree.getroot()
ET.SubElement(
    illustrated_svg_root,
    "{http://www.w3.org/2000/svg}image",
    {
        "x": "15",
        "y": "15",
        "width": "7",
        "height": "7",
        "href": f"data:image/png;base64,{art_data}",
    },
)
illustrated_svg_tree.write(
    OUTPUT_DIR / "qr-fujiuraworks-illustrated.svg",
    encoding="UTF-8",
    xml_declaration=True,
)
