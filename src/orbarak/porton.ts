/**
 * El portón de Or Barak.
 *
 * Antes de bajar de piso hay una kashiá. Si le atinas te llevas oro, algo de
 * experiencia y aire; si no, bajas igual con las manos vacías. Nunca se
 * bloquea el paso: el que no sabe hoy baja y aprende, no se queda arriba.
 *
 * La ventana es HTML encima del lienzo, no dibujada en canvas. Así el
 * navegador se encarga del hebreo con su nikud, que es justo lo que un
 * lienzo de pixeles no sabe hacer.
 */

import { PREGUNTAS, PALABRAS, type Pregunta, type Palabra } from './banco.js';

export interface Kashia {
  id: string;
  palabra: string | null;
  pregunta: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

export interface Memoria {
  seed: number;
  pasados: number[];
  salieron: string[];
  falladas: string[];
  aciertos: number;
  errores: number;
  racha: number;
  mejorRacha: number;
}

const LLAVE = 'pardes-kashiot';

function vacia(seed: number): Memoria {
  return { seed, pasados: [], salieron: [], falladas: [],
           aciertos: 0, errores: 0, racha: 0, mejorRacha: 0 };
}

let memoria: Memoria | null = null;

export function memoriaDe(seed: number): Memoria {
  if (memoria !== null && memoria.seed === seed) return memoria;
  try {
    const crudo = localStorage.getItem(LLAVE);
    if (crudo !== null) {
      const m = JSON.parse(crudo) as Memoria;
      if (m.seed === seed) { memoria = m; return m; }
    }
  } catch {
    // sin almacenamiento se juega igual, nada más no se recuerda
  }
  memoria = vacia(seed);
  return memoria;
}

function guarda(): void {
  if (memoria === null) return;
  try {
    localStorage.setItem(LLAVE, JSON.stringify(memoria));
  } catch {
    // modo privado del navegador: ni modo
  }
}

export function honduraDe(piso: number): number {
  const h = Math.ceil(piso / 5);
  return h < 1 ? 1 : h > 5 ? 5 : h;
}

function revuelve<T>(l: T[]): T[] {
  const c = l.slice();
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j] as T, c[i] as T];
  }
  return c;
}

function cercaDe<T extends { n: number }>(lista: T[], n: number, fuera: string[],
                                          id: (x: T) => string): T[] {
  for (let margen = 0; margen <= 4; margen++) {
    const c = lista.filter((x) => Math.abs(x.n - n) <= margen && !fuera.includes(id(x)));
    if (c.length > 0) return c;
  }
  return lista.filter((x) => !fuera.includes(id(x)));
}

function dePregunta(q: Pregunta): Kashia {
  const buena = q.o[q.c] as string;
  const ops = revuelve(q.o);
  return { id: 'p:' + q.p, palabra: null, pregunta: q.p,
           opciones: ops, correcta: ops.indexOf(buena), explicacion: q.e };
}

function deTraduccion(w: Palabra): Kashia | null {
  const malas = revuelve(PALABRAS.filter((o) => o.t !== w.t).map((o) => o.t)).slice(0, 3);
  if (malas.length < 3) return null;
  const ops = revuelve([w.t, ...malas]);
  return { id: 't:' + w.h, palabra: w.h, pregunta: '¿Qué quiere decir?',
           opciones: ops, correcta: ops.indexOf(w.t), explicacion: w.h + ' = ' + w.t + '.' };
}

export function sacaKashia(hondura: number, m: Memoria): Kashia | null {
  const traducir = PALABRAS.length >= 4 && (Math.random() < 0.45 || PREGUNTAS.length === 0);

  if (traducir) {
    const c = cercaDe(PALABRAS, hondura, m.salieron, (w) => 't:' + w.h);
    const w = c[Math.floor(Math.random() * c.length)];
    if (w !== undefined) { const k = deTraduccion(w); if (k !== null) return k; }
  }
  const c = cercaDe(PREGUNTAS, hondura, m.salieron, (q) => 'p:' + q.p);
  const q = c[Math.floor(Math.random() * c.length)];
  if (q !== undefined) return dePregunta(q);

  const w2 = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
  return w2 === undefined ? null : deTraduccion(w2);
}

// ─────────────────────── la ventana ───────────────────────

let abierta = false;
export function portonAbierto(): boolean { return abierta; }

const ESTILOS = `
.pd-porton{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;
  justify-content:center;padding:18px;background:rgba(8,10,16,.93);
  font-family:'Trebuchet MS',system-ui,sans-serif;color:#F2F1F7;overflow-y:auto}
.pd-caja{width:100%;max-width:420px}
.pd-rotulo{font-size:11px;letter-spacing:.18em;color:#C99B52;margin-bottom:10px}
.pd-heb{font-size:40px;line-height:1.4;text-align:center;margin:4px 0 10px;
  direction:rtl;font-family:'Times New Roman',serif}
.pd-preg{font-size:19px;line-height:1.35;margin-bottom:14px}
.pd-op{display:flex;gap:10px;align-items:center;width:100%;text-align:left;
  margin-bottom:8px;padding:13px 14px;border-radius:11px;border:2px solid #3A3558;
  background:#241f42;color:#F2F1F7;font-size:15px;font-family:inherit;cursor:pointer;
  line-height:1.3}
.pd-op:disabled{opacity:.5}
.pd-op .pd-letra{color:#C99B52;font-weight:700;font-size:13px;width:13px;flex:0 0 auto}
.pd-op.pd-bien{background:#1E4330;border-color:#4E9B57;opacity:1}
.pd-op.pd-mal{background:#45201C;border-color:#C4483A;opacity:1}
.pd-cierre{font-size:14.5px;line-height:1.55;color:#A9A3C6;margin:12px 0}
.pd-cierre b{color:#F2F1F7}
.pd-seguir{width:100%;padding:13px;border:0;border-radius:11px;background:#C99B52;
  color:#241a08;font-size:16px;font-weight:700;font-family:inherit;cursor:pointer}
`;

function meteEstilos(): void {
  if (document.getElementById('pd-estilos') !== null) return;
  const s = document.createElement('style');
  s.id = 'pd-estilos';
  s.textContent = ESTILOS;
  document.head.appendChild(s);
}

/** Traga el teclado mientras el portón está abierto. */
function tragaTeclas(e: KeyboardEvent): void {
  e.stopPropagation();
  e.preventDefault();
}

/**
 * Enseña la kashiá. Llama a `alTerminar(acertó)` cuando el alumno cierra.
 */
export function preguntaPorton(titulo: string, k: Kashia, m: Memoria,
                               alTerminar: (acerto: boolean) => void): void {
  meteEstilos();
  abierta = true;
  window.addEventListener('keydown', tragaTeclas, true);

  const capa = document.createElement('div');
  capa.className = 'pd-porton';
  const letras = ['A', 'B', 'C', 'D', 'E'];

  const caja = document.createElement('div');
  caja.className = 'pd-caja';
  caja.innerHTML =
    '<div class="pd-rotulo">' + titulo.toUpperCase() + '</div>' +
    (k.palabra !== null ? '<div class="pd-heb"></div>' : '') +
    '<div class="pd-preg"></div>' +
    '<div class="pd-ops"></div>' +
    '<div class="pd-cierre"></div>';
  if (k.palabra !== null) {
    (caja.querySelector('.pd-heb') as HTMLElement).textContent = k.palabra;
  }
  (caja.querySelector('.pd-preg') as HTMLElement).textContent = k.pregunta;

  const zonaOps = caja.querySelector('.pd-ops') as HTMLElement;
  const cierre = caja.querySelector('.pd-cierre') as HTMLElement;
  const botones: HTMLButtonElement[] = [];

  k.opciones.forEach((texto, i) => {
    const b = document.createElement('button');
    b.className = 'pd-op';
    b.innerHTML = '<span class="pd-letra"></span><span class="pd-txt"></span>';
    (b.querySelector('.pd-letra') as HTMLElement).textContent = letras[i] ?? '';
    (b.querySelector('.pd-txt') as HTMLElement).textContent = texto;
    b.addEventListener('click', () => contesta(i));
    zonaOps.appendChild(b);
    botones.push(b);
  });

  capa.appendChild(caja);
  document.body.appendChild(capa);

  let contestada = false;

  function contesta(cual: number): void {
    if (contestada) return;
    contestada = true;
    const acerto = cual === k.correcta;

    m.salieron.push(k.id);
    if (m.salieron.length > 60) m.salieron.shift();
    if (acerto) {
      m.aciertos++;
      m.racha++;
      if (m.racha > m.mejorRacha) m.mejorRacha = m.racha;
      m.falladas = m.falladas.filter((x) => x !== k.id);
    } else {
      m.errores++;
      m.racha = 0;
      if (!m.falladas.includes(k.id) && m.falladas.length < 20) m.falladas.push(k.id);
    }
    guarda();

    botones.forEach((b, i) => {
      b.disabled = true;
      if (i === k.correcta) b.classList.add('pd-bien');
      else if (i === cual) b.classList.add('pd-mal');
    });

    cierre.innerHTML = '<b>' + (acerto ? 'Eso es.' : 'No era.') + '</b> ';
    cierre.appendChild(document.createTextNode(k.explicacion));
    if (acerto && m.racha > 1) {
      const r = document.createElement('b');
      r.textContent = ' Llevas ' + m.racha + ' seguidas.';
      cierre.appendChild(r);
    }

    const seguir = document.createElement('button');
    seguir.className = 'pd-seguir';
    seguir.textContent = acerto ? 'Pasar el portón' : 'Bajar de todos modos';
    seguir.addEventListener('click', () => {
      cierra();
      alTerminar(acerto);
    });
    caja.appendChild(seguir);
    seguir.focus();
  }

  function cierra(): void {
    abierta = false;
    window.removeEventListener('keydown', tragaTeclas, true);
    capa.remove();
  }
}

export function marcaPasado(m: Memoria, piso: number): void {
  if (!m.pasados.includes(piso)) m.pasados.push(piso);
  guarda();
}
