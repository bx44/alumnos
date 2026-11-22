#!/usr/bin/env bash
# Publica una versión nueva de Pardés en Or+.
#
# POR QUÉ EXISTE ESTO
# GitHub Pages deja que el navegador guarde el index.html diez minutos.
# Si al publicar se borra el main.<hash>.js viejo en el mismo commit en
# que se sube el nuevo, durante esos diez minutos hay gente con el
# index.html guardado pidiendo un archivo que ya no existe: pantalla
# negra. Pasó el 22 de noviembre de 2026.
#
# La regla, entonces: se deja el JS de la versión anterior, y se borra el
# de dos versiones atrás. Y se sube el número del caché del service
# worker, si no a nadie le llega nada.
#
#   herramientas/publicar-pardes.sh [ruta del repo del juego]

set -euo pipefail

APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JUEGO="${1:-/home/claude/port-pixel-dungeon-ts}"
DESTINO="$APP/juegos/pardes"

echo "==> compilando en $JUEGO"
( cd "$JUEGO" && bun run build )

NUEVO="$(cd "$JUEGO/dist" && ls main.*.js)"
[ -n "$NUEVO" ] || { echo "no salió ningún main.*.js del build"; exit 1; }

ANTERIOR="$(cd "$DESTINO" && grep -o 'main\.[a-f0-9]*\.js' index.html || true)"

if [ "$NUEVO" = "$ANTERIOR" ]; then
  echo "==> el build no cambió ($NUEVO); no hay nada que publicar"
  exit 0
fi

echo "==> nuevo: $NUEVO   anterior: ${ANTERIOR:-ninguno}"

# Borrar los de dos versiones atrás: todo main.*.js que no sea el nuevo
# ni el anterior.
for v in "$DESTINO"/main.*.js; do
  n="$(basename "$v")"
  if [ "$n" != "$NUEVO" ] && [ "$n" != "$ANTERIOR" ]; then
    echo "    se va el viejo: $n"
    rm -f "$v"
  fi
done

cp "$JUEGO/dist/index.html" "$JUEGO/dist/manifest.webmanifest" "$DESTINO/"
cp "$JUEGO/dist/$NUEVO" "$DESTINO/"

# Subir el número del caché del service worker.
ACTUAL="$(grep -o "orbarak-alumnos-v[0-9]*" "$APP/sw.js" | head -1)"
NUM="${ACTUAL##*-v}"
SIGUIENTE="orbarak-alumnos-v$((NUM + 1))"
sed -i "s/$ACTUAL/$SIGUIENTE/" "$APP/sw.js"
echo "==> caché: $ACTUAL -> $SIGUIENTE"

echo
echo "listo. Queda en juegos/pardes/:"
ls -1 "$DESTINO"
echo
echo "Falta revisarlo y hacer el commit. Después de publicar, acuérdate"
echo "de que GitHub Pages tarda un minuto o dos en servirlo."
