/**
 * El banco de kashiot: preguntas de guemará y palabras para traducir.
 *
 * hondura 1 Bet Hamidrash · 2 Los Salones · 3 El Cerro · 4 La Biblioteca · 5 El Pardés
 * Para agregar un reto, agrega un renglón. No hace falta tocar nada más.
 */

export interface Pregunta {
  n: number;
  p: string;
  o: string[];
  c: number;
  e: string;
}

export interface Palabra {
  n: number;
  h: string;
  t: string;
}

export const PREGUNTAS: Pregunta[] = [
  { n: 1, p: "¿En qué idioma está escrita casi toda la Guemará?", o: ["Arameo", "Hebreo", "Griego", "Ladino"], c: 0, e: "Arameo babilonio. Por eso cuesta la primera vez." },
  { n: 1, p: "¿Cuántos sedarim (órdenes) tiene la Mishná?", o: ["Cuatro", "Seis", "Diez", "Doce"], c: 1, e: "Seis: Zeraim, Moed, Nashim, Nezikin, Kodashim y Taharot." },
  { n: 1, p: "¿Quién ordenó la Mishná?", o: ["Rabí Akivá", "Rav Ashí", "Rabí Yehudá HaNasí", "Rambam"], c: 2, e: "Rabí Yehudá HaNasí, al que la Guemará llama simplemente Rabí." },
  { n: 1, p: "Cada daf tiene dos caras. ¿Cómo se llaman?", o: ["Alef y bet", "Rishón y shení", "Peshat y derash", "Yamín y smol"], c: 0, e: "Amud alef y amud bet. Por eso 2a y 2b." },
  { n: 1, p: "El comentario que va pegado al lomo de la página es de…", o: ["Tosafot", "Rashi", "Maharshá", "Rosh"], c: 1, e: "Rashi va del lado de adentro; Tosafot del lado de afuera." },
  { n: 1, p: "Mishná y Guemará juntas forman…", o: ["El Midrash", "El Talmud", "La Halajá", "El Sidur"], c: 1, e: "Eso es el Talmud." },
  { n: 1, p: "¿Cuál Talmud se estudia más en las yeshivot?", o: ["El Yerushalmí", "El Bavlí", "Los dos igual", "Ninguno"], c: 1, e: "El Bavlí, el de Babilonia." },
  { n: 1, p: "¿Cómo se le dice al pasaje que estás estudiando en la Guemará?", o: ["Sugiá", "Perek", "Siman", "Daf"], c: 0, e: "Sugiá. El perek es el capítulo y el daf es la hoja." },
  { n: 1, p: "¿En qué seder está masejet Sukká?", o: ["Zeraim", "Moed", "Nashim", "Nezikin"], c: 1, e: "En Moed, el orden de las fiestas." },
  { n: 1, p: "Los sabios de la Mishná se llaman…", o: ["Amoraim", "Tanaim", "Gueonim", "Rishonim"], c: 1, e: "Tanaim. Los de la Guemará son amoraim." },
  { n: 2, p: "\"Kal vajomer\" es aprender…", o: ["De una palabra repetida", "De lo leve a lo grave", "De la mayoría", "De una lista"], c: 1, e: "Si en lo chico aplica, con más razón en lo grande." },
  { n: 2, p: "\"Guezerá shavá\" aprende una ley de…", o: ["Dos versículos con la misma palabra", "Un sueño", "La costumbre", "Un cálculo de números"], c: 0, e: "La misma palabra en dos lugares enlaza las dos leyes." },
  { n: 2, p: "Una \"baraita\" es una enseñanza de los tanaim que…", o: ["Está en la Mishná", "Quedó fuera de la Mishná", "Escribió Rashi", "Está en el Zohar"], c: 1, e: "Baraita quiere decir \"de afuera\"." },
  { n: 2, p: "Cuando la Guemará dice \"teikú\", quiere decir que la pregunta…", o: ["Se resolvió", "Era tonta", "Queda sin resolver", "Es de otro tratado"], c: 2, e: "Queda parada. Nadie la cerró." },
  { n: 2, p: "\"Majloket\" es…", o: ["Una disputa entre sabios", "Un tipo de korbán", "Una fiesta", "Un error del copista"], c: 0, e: "Dos opiniones que no coinciden." },
  { n: 2, p: "\"Nafká miná\" pregunta…", o: ["De dónde salió el versículo", "Qué diferencia práctica hay", "Quién lo dijo", "Cuándo pasó"], c: 1, e: "Si las dos opiniones dan lo mismo en la práctica, ¿para qué discutir?" },
  { n: 2, p: "\"Matnitín\" se refiere a…", o: ["Nuestra Mishná", "Una baraita", "El Yerushalmí", "Un comentario tardío"], c: 0, e: "La Mishná que estamos estudiando." },
  { n: 2, p: "Abayé y Ravá son famosos por…", o: ["Sus discusiones", "Haber escrito la Mishná", "Ser hermanos", "Vivir en Jerusalén"], c: 0, e: "Sus majlokot son el pan de cada día en el Bavlí." },
  { n: 2, p: "\"Peshitá\" quiere decir que lo que se dijo…", o: ["Es obvio", "Es falso", "Es una pregunta", "Es del Rambam"], c: 0, e: "La Guemará reclama: eso ya se sabía, ¿para qué decirlo?" },
  { n: 2, p: "\"Tá shemá\" introduce…", o: ["Una prueba de una fuente", "Una bendición", "Un cuento", "Un regaño"], c: 0, e: "\"Ven y escucha\": aquí va una fuente para resolver." },
  { n: 3, p: "¿Cuántas paredes necesita como mínimo una sucá?", o: ["Una", "Dos y un poco", "Tres completas", "Cuatro"], c: 1, e: "Dos como deben ser y una tercera aunque sea de un tefaj." },
  { n: 3, p: "¿Cuál es la altura máxima de una sucá?", o: ["10 tefajim", "20 amot", "7 amot", "No hay máximo"], c: 1, e: "Más alta de veinte amot, no sirve. Con eso abre la masejet." },
  { n: 3, p: "¿Y la altura mínima?", o: ["10 tefajim", "1 amá", "20 tefajim", "3 amot"], c: 0, e: "Diez tefajim. Menos de eso ya no es un espacio." },
  { n: 3, p: "La sejaj tiene que ser de algo que…", o: ["Sea nuevo", "Creció de la tierra y está cortado", "Sea de metal", "Lo haya hecho un jajam"], c: 1, e: "Que haya crecido del suelo, que esté desconectado y que no reciba tumá." },
  { n: 3, p: "¿Cuál korbán se quema completo sobre el mizbéaj?", o: ["Shelamim", "Jatat", "Olá", "Minjá"], c: 2, e: "La olá sube entera. De ahí su nombre." },
  { n: 3, p: "El korbán minjá está hecho principalmente de…", o: ["Carne", "Harina y aceite", "Vino", "Fruta"], c: 1, e: "Harina fina con aceite y levoná." },
  { n: 3, p: "¿Qué libro de la Torá abre con las leyes de los korbanot?", o: ["Shemot", "Vayikrá", "Bamidbar", "Devarim"], c: 1, e: "Vayikrá, desde el primer perek." },
  { n: 3, p: "\"Lejatjilá\" significa…", o: ["Después de hecho", "De entrada, como se debe", "Nunca", "Solo en shabat"], c: 1, e: "Lejatjilá es como sí se hace; bedivad es qué pasa si ya se hizo de otro modo." },
  { n: 3, p: "\"Bedivad\" significa…", o: ["De entrada", "Ya hecho, a posteriori", "Por costumbre", "Por error grave"], c: 1, e: "Lo que ya pasó: ¿vale o no vale?" },
  { n: 3, p: "\"Safek\" significa…", o: ["Certeza", "Duda", "Castigo", "Permiso"], c: 1, e: "Duda. Media Guemará es qué hacer con un safek." },
  { n: 4, p: "\"Migó\" es un argumento que dice…", o: ["Que la mayoría manda", "Que si quisiera mentir habría dicho algo mejor", "Que el texto se repite", "Que el testigo es pariente"], c: 1, e: "Si tenía a la mano una mentira más conveniente y no la usó, le creemos." },
  { n: 4, p: "\"Jazaká\" es la presunción de que…", o: ["Las cosas siguen como estaban", "Todos son culpables", "El texto está mal", "Hay que preguntar al rav"], c: 0, e: "Lo que estaba, sigue estando, hasta que se demuestre lo contrario." },
  { n: 4, p: "\"Sevará\" es…", o: ["Un versículo", "Razonamiento lógico, sin versículo", "Una costumbre", "Un decreto del rey"], c: 1, e: "A veces la Guemará pregunta \"¿para qué versículo? ¡es sevará!\"." },
  { n: 4, p: "\"Midiorayta\" quiere decir que la ley es…", o: ["De la Torá", "De los sabios", "De la costumbre", "Del gobierno"], c: 0, e: "De la Torá misma. Miderabanán es de los sabios." },
  { n: 4, p: "\"Teyuvtá\" es…", o: ["Una pregunta sin respuesta", "Una refutación que gana", "Un elogio", "Un tipo de korbán"], c: 1, e: "El argumento quedó tumbado." },
  { n: 4, p: "Pardés son cuatro niveles: Peshat, Remez, Derash y…", o: ["Sod", "Siman", "Seder", "Safek"], c: 0, e: "Sod, lo escondido. Las cuatro letras forman PaRDeS." },
  { n: 4, p: "\"Peshat\" es…", o: ["El sentido simple del texto", "Una alusión", "Una parábola", "Un secreto"], c: 0, e: "Lo que dice el texto, tal como se lee." },
  { n: 4, p: "Una \"baayá\" que la Guemará no logra resolver termina en…", o: ["Teikú", "Teyuvtá", "Mashmá", "Guezerá"], c: 0, e: "Teikú: queda abierta." },
  { n: 4, p: "\"Rov\" como principio es decidir según…", o: ["La mayoría", "El más viejo", "El más rico", "El que preguntó"], c: 0, e: "Seguimos a la mayoría cuando hay duda." },
  { n: 4, p: "Cuando la Guemará dice \"gufá\", está…", o: ["Cerrando el tema", "Volviendo al texto que citó de pasada", "Citando la Torá", "Pidiendo silencio"], c: 1, e: "Trajo una fuente para otra cosa y ahora la estudia por sí misma." },
  { n: 1, p: "En el Bet Hamidrash, ¿qué se usa para apoyar el libro cuando estudias de pie?", o: ["El shtender", "El arón", "La bimá", "La mejitzá"], c: 0, e: "El shtender." },
  { n: 1, p: "¿Cómo se llama la app de los alumnos de Or Barak?", o: ["Or+", "Barak", "Metivta", "Luz"], c: 0, e: "Or+. En la que estás jugando ahorita." },
];

export const PALABRAS: Palabra[] = [
  { n: 1, h: "אָמַר", t: "dijo" },
  { n: 1, h: "תָּנָא", t: "enseñó" },
  { n: 1, h: "מַאי", t: "¿qué?" },
  { n: 1, h: "לֹא", t: "no" },
  { n: 1, h: "אִין", t: "sí" },
  { n: 1, h: "הָכָא", t: "aquí" },
  { n: 1, h: "הָתָם", t: "allá" },
  { n: 1, h: "מִלְּתָא", t: "una cosa, un asunto" },
  { n: 1, h: "רַבָּנַן", t: "los sabios" },
  { n: 1, h: "שְׁמַע", t: "escucha" },
  { n: 2, h: "תָּא שְׁמַע", t: "ven y escucha" },
  { n: 2, h: "קָא מַשְׁמַע לָן", t: "nos enseña" },
  { n: 2, h: "אִיכָּא דְּאָמְרִי", t: "hay quienes dicen" },
  { n: 2, h: "מְנָא הָנֵי מִילֵּי", t: "¿de dónde se sabe esto?" },
  { n: 2, h: "פְּשִׁיטָא", t: "es obvio" },
  { n: 2, h: "אֶלָּא", t: "sino" },
  { n: 2, h: "וְהָא", t: "¡pero si…!" },
  { n: 2, h: "דִּלְמָא", t: "quizá" },
  { n: 2, h: "רֵישָׁא", t: "la primera parte" },
  { n: 2, h: "סֵיפָא", t: "la última parte" },
  { n: 2, h: "מַתְנִיתִין", t: "nuestra Mishná" },
  { n: 2, h: "בָּרַיְיתָא", t: "enseñanza de afuera de la Mishná" },
  { n: 3, h: "קוּשְׁיָא", t: "pregunta difícil" },
  { n: 3, h: "תֵּירוּץ", t: "respuesta" },
  { n: 3, h: "מַחֲלוֹקֶת", t: "disputa" },
  { n: 3, h: "לִכְאוֹרָה", t: "a primera vista" },
  { n: 3, h: "אַדְּרַבָּה", t: "al contrario" },
  { n: 3, h: "גּוּפָא", t: "volvamos al texto mismo" },
  { n: 3, h: "סוּגְיָא", t: "el tema que se estudia" },
  { n: 3, h: "מַסֶּכֶת", t: "tratado" },
  { n: 3, h: "דַּף", t: "hoja" },
  { n: 3, h: "עַמּוּד", t: "cara de la hoja" },
  { n: 3, h: "שֶׁנֶּאֱמַר", t: "pues está dicho" },
  { n: 3, h: "דִּכְתִיב", t: "pues está escrito" },
  { n: 3, h: "כִּדְתַנְיָא", t: "como se enseñó" },
  { n: 3, h: "הַשְׁתָּא", t: "ahora" },
  { n: 4, h: "תֵּיקוּ", t: "queda sin resolver" },
  { n: 4, h: "תְּיוּבְתָּא", t: "refutación" },
  { n: 4, h: "סְבָרָא", t: "razonamiento lógico" },
  { n: 4, h: "חֲזָקָה", t: "presunción" },
  { n: 4, h: "מִיגּוֹ", t: "ya que pudo decir otra cosa" },
  { n: 4, h: "נָפְקָא מִינַּהּ", t: "diferencia práctica" },
  { n: 4, h: "בִּשְׁלָמָא", t: "se entiende que…" },
  { n: 4, h: "מֵעִיקָּרָא", t: "desde el principio" },
  { n: 4, h: "הָכִי נַמֵי", t: "así también" },
  { n: 4, h: "בָּעְיָא", t: "pregunta abierta" },
  { n: 4, h: "מִדְּאוֹרַיְיתָא", t: "de la Torá" },
  { n: 4, h: "מִדְּרַבָּנָן", t: "de los sabios" },
];
