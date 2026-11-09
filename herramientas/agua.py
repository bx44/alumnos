#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hace los 16 dibujos de la orilla del agua, como Shattered.

Shattered no dibuja el agua en cuadros: escoge entre 16 dibujos segun que
vecinos son tierra (DungeonTileSheet.stitchWaterTile, +1 arriba, +2 derecha,
+4 abajo, +8 izquierda). El dibujo numero 0 -agua rodeada de agua- es puro
transparente; los otros 15 traen la orilla: el barranco oscuro del lado de
la tierra y la espuma clara pegada al agua. Eso es lo que redondea las
esquinas.

Aqui se toman esos 16 dibujos de la hoja de Shattered (tiles_sewers.png,
renglon 3, que es el verde que va con el agua del port) y se pegan encima
del agua plana que ya usa el juego, para que cada variante salga completa y
el dibujante no tenga que componer nada en vivo.

    python3 herramientas/agua.py

Escribe src/assets/water_sprites.ts.
"""

import base64
import io
import os
import re
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit('falta Pillow: pip install --break-system-packages pillow')

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOJA = '/home/claude/spd/core/src/main/assets/environment/tiles_sewers.png'
ORIGINALES = os.path.join(RAIZ, 'src', 'assets', 'original_sprites.ts')
SALIDA = os.path.join(RAIZ, 'src', 'assets', 'water_sprites.ts')

LADO = 16
RENGLON_AGUA = 2  # DungeonTileSheet.WATER = xy(1,3) -> renglon 3, o sea el 2


def agua_del_port():
    """El agua plana que ya trae el juego (PD water0.png)."""
    s = io.open(ORIGINALES, encoding='utf-8').read()
    m = re.search(r"\n  water: \{ w: (\d+), h: (\d+), rgba: '([^']+)'", s)
    if m is None:
        sys.exit('no encontre el sprite water en original_sprites.ts')
    w, h = int(m.group(1)), int(m.group(2))
    return Image.frombytes('RGBA', (w, h), base64.b64decode(m.group(3)))


def main():
    if not os.path.exists(HOJA):
        sys.exit('no esta la hoja de Shattered: ' + HOJA)

    fondo = agua_del_port()
    hoja = Image.open(HOJA).convert('RGBA')

    partes = []
    for i in range(16):
        orilla = hoja.crop((i * LADO, RENGLON_AGUA * LADO,
                            i * LADO + LADO, RENGLON_AGUA * LADO + LADO))
        tile = fondo.copy()
        tile.alpha_composite(orilla)
        b64 = base64.b64encode(tile.tobytes()).decode('ascii')
        arriba = '+1 arriba' if i & 1 else ''
        der = '+2 derecha' if i & 2 else ''
        abajo = '+4 abajo' if i & 4 else ''
        izq = '+8 izquierda' if i & 8 else ''
        lados = ', '.join(x for x in (arriba, der, abajo, izq) if x) or 'agua abierta'
        partes.append(
            '  // tierra: %s\n'
            "  water_%d: { w: %d, h: %d, rgba: '%s' },"
            % (lados, i, LADO, LADO, b64)
        )

    texto = (
        '/**\n'
        ' * Las 16 orillas del agua.\n'
        ' *\n'
        ' * Generado por herramientas/agua.py. No se edita a mano.\n'
        ' *\n'
        ' * Shattered escoge el dibujo del agua segun que vecinos son tierra\n'
        ' * (DungeonTileSheet.stitchWaterTile): +1 arriba, +2 derecha, +4 abajo,\n'
        ' * +8 izquierda. Son los mismos 16 de alla, con la orilla de Shattered\n'
        ' * encima del agua del juego.\n'
        ' */\n'
        'export const WATER_SPRITES: Record<string, { w: number; h: number; rgba: string }> = {\n'
        + '\n'.join(partes) +
        '\n};\n'
    )
    io.open(SALIDA, 'w', encoding='utf-8').write(texto)
    print('escrito', os.path.relpath(SALIDA, RAIZ), '-', len(texto), 'letras')
    return 0


if __name__ == '__main__':
    sys.exit(main())
