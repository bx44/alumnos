#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pasa el juego al español, usando la tabla de herramientas/traduccion.json.

Reemplaza literales completos, nunca pedazos: sólo cambia una cadena si el
texto entre comillas es exactamente igual al de la tabla. Así no puede tocar
un identificador ni romper código por accidente.

    python3 herramientas/traducir.py          # traduce src/ y test/
    python3 herramientas/traducir.py --ver    # sólo dice qué falta por traducir

Para agregar una traducción: edita traduccion.json y vuelve a correrlo.
'nombres'  se aplica sólo donde dice   name: '...'
'mensajes' se aplica a cualquier literal igual
"""

import io
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TABLA = os.path.join(RAIZ, 'herramientas', 'traduccion.json')
CARPETAS = ('src', 'test')
SALTAR = {'banco.ts', 'porton.ts', 'traduccion.json'}

PAT_NOMBRE = re.compile(r"(\bname: ')((?:[^'\\]|\\.)+)(')")


def archivos():
    for carpeta in CARPETAS:
        base = os.path.join(RAIZ, carpeta)
        if not os.path.isdir(base):
            continue
        for raiz, _, nombres in os.walk(base):
            for a in nombres:
                if a.endswith('.ts') and a not in SALTAR:
                    yield os.path.join(raiz, a)


def main():
    solo_ver = '--ver' in sys.argv
    tabla = json.load(io.open(TABLA, encoding='utf-8'))
    nombres, mensajes = tabla['nombres'], tabla['mensajes']
    plantillas = tabla.get('plantillas', {})

    cambios = 0
    tocados = set()
    for p in archivos():
        s = io.open(p, encoding='utf-8').read()
        original = s

        def cambia_nombre(m):
            nonlocal cambios
            v = m.group(2)
            if v in nombres and nombres[v] != v:
                cambios += 1
                return m.group(1) + nombres[v].replace("'", "\\'") + m.group(3)
            return m.group(0)

        s = PAT_NOMBRE.sub(cambia_nombre, s)

        for en, es in mensajes.items():
            viejo = "'" + en + "'"
            if viejo in s:
                s = s.replace(viejo, "'" + es.replace("'", "\\'") + "'")
                cambios += 1

        # plantillas: con comillas dobles o con acentos graves, sin tocar los ${...}
        for en, es in plantillas.items():
            for comilla in ('"', '`'):
                viejo = comilla + en + comilla
                if viejo in s:
                    s = s.replace(viejo, comilla + es + comilla)
                    cambios += 1

        if s != original and not solo_ver:
            io.open(p, 'w', encoding='utf-8').write(s)
            tocados.add(os.path.relpath(p, RAIZ))

    if solo_ver:
        print('faltan por traducir:', cambios, 'lugares')
    else:
        print('traducidos:', cambios, 'lugares en', len(tocados), 'archivos')
    return 0


if __name__ == '__main__':
    sys.exit(main())
