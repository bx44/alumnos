"""Copia la versión publicada de Hexterra (bx44/hexterra) a juegos/hexterra/
y sube el número de CACHE de sw.js si el juego cambió."""
import re, sys, urllib.request, pathlib
URL = "https://raw.githubusercontent.com/bx44/hexterra/main/index.html"
src = urllib.request.urlopen(URL, timeout=60).read().decode("utf-8")
if "<title>Hexterra</title>" not in src:
    sys.exit("No parece Hexterra; no se copia nada.")
src = re.sub(r'<link rel="manifest"[^>]*>',
             '<!-- manifiesto retirado: aqui Hexterra vive dentro de Or+, no como app aparte -->', src, count=1)
hdr = """<!--
  Copia de Hexterra para jugarse dentro de Or+.
  Original: https://github.com/bx44/hexterra
  Se copia sola (.github/workflows/sync-hexterra.yml). No la edites aquí:
  los cambios se hacen en bx44/hexterra.
  Unico cambio: se quito el enlace al manifiesto.
-->
"""
out = hdr + src
dest = pathlib.Path("juegos/hexterra/index.html")
if dest.exists() and dest.read_text(encoding="utf-8") == out:
    print("Sin cambios."); sys.exit(0)
dest.write_text(out, encoding="utf-8")
sw = pathlib.Path("sw.js"); s = sw.read_text(encoding="utf-8")
s = re.sub(r"(orbarak-alumnos-v)(\d+)", lambda m: m.group(1) + str(int(m.group(2)) + 1), s, count=1)
sw.write_text(s, encoding="utf-8")
print("Hexterra actualizado.")
