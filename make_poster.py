# -*- coding: utf-8 -*-
"""生成可分享的游戏海报。二维码打开 PLAY_URL。"""
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
PLAY_URL = os.environ.get("PLAY_URL", "https://hua691.github.io/gut-match3-play/?v=10")
OUT = os.path.join(ROOT, "海报.png")

W, H = 1080, 2160
BG = os.path.join(ROOT, "assets", "static", "image", "bg.ead9a73e.jpg")
THEME = os.path.join(ROOT, "assets", "static", "image", "theme.24d3b741.png")
LOGO = os.path.join(ROOT, "image", "logo.png")
KIT = os.path.join(ROOT, "assets", "static", "image", "prize_kit.png")
FONT = r"C:\Windows\Fonts\msyhbd.ttc"

def main():
    src = Image.open(BG).convert("RGBA")
    # 从天空取到木牌，底部花草留给红条
    src = src.crop((0, 160, src.width, 2680))
    scale = W / src.width
    bg = src.resize((W, int(src.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (W, H), (227, 18, 36, 255))
    canvas.paste(bg, (0, 0), bg)

    theme = Image.open(THEME).convert("RGBA")
    tw = 920
    th = int(theme.height * tw / theme.width)
    theme = theme.resize((tw, th), Image.Resampling.LANCZOS)
    canvas.paste(theme, ((W - tw) // 2, 86), theme)

    logo = Image.open(LOGO).convert("RGBA")
    lh = 72
    lw = int(logo.width * lh / logo.height)
    logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
    canvas.paste(logo, (28, 18), logo)

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    red = (226, 16, 36, 255)
    top = 1720
    draw.rectangle((0, top + 40, W, H), fill=red)
    draw.ellipse((-140, top - 10, W + 140, top + 160), fill=red)
    canvas.alpha_composite(overlay)

    kit = Image.open(KIT).convert("RGBA")
    kh = 470
    kw = int(kit.width * kh / kit.height)
    kit = kit.resize((kw, kh), Image.Resampling.LANCZOS)
    kx, ky = 8, 1655
    canvas.paste(kit, (kx, ky), kit)

    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=1)
    qr.add_data(PLAY_URL)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#111111", back_color="#ffffff").convert("RGBA")
    qr_size = 220
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.NEAREST)
    pad = 14
    card = Image.new("RGBA", (qr_size + pad * 2, qr_size + pad * 2), (255, 255, 255, 255))
    card.paste(qr_img, (pad, pad), qr_img)
    card_x = W - card.width - 36
    card_y = 1820
    canvas.paste(card, (card_x, card_y), card)

    text = ImageDraw.Draw(canvas)
    f4 = ImageFont.truetype(FONT, 26)
    hint = "扫码立即玩"
    hw = text.textlength(hint, font=f4)
    text.text((card_x + (card.width - hw) / 2, card_y + card.height + 8), hint, font=f4, fill=(255, 255, 255))

    canvas.convert("RGB").save(OUT, quality=95)
    print(OUT)
    print(PLAY_URL)

if __name__ == "__main__":
    main()
