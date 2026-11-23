// Adivina si un contacto de WhatsApp es chico o chica por su nombre (para «Tu chat frente al resto»).
// Solo mira la primera palabra del nombre. Si no la conoce o es ambigua (Álex, Cris, Andrea…), devuelve null
// y ese chat no cuenta para las métricas de chico/chica. Se ejecuta en el navegador: el nombre no sale del dispositivo.

const CHICO = `
  antonio jose manuel francisco david juan javier daniel carlos jesus alejandro miguel rafael pedro pablo angel
  sergio fernando jorge luis alberto alvaro diego adrian raul enrique ramon vicente ivan ruben oscar andres joaquin
  santiago eduardo victor roberto jaime mario ignacio marcos hugo martin lucas mateo leo nicolas gonzalo samuel
  hector emilio salvador julian tomas agustin cristian marc jordi pau xavier joan josep oriol arnau pol gerard
  albert guillermo felipe alfonso ricardo arturo ernesto rodrigo julio cesar esteban gustavo gabriel sebastian
  emiliano matias benjamin bruno izan thiago dario iker unai aitor asier mikel jon borja inigo ismael marco
  aaron eric erik isaac jacobo lorenzo marcelo mauricio octavio orlando patricio rolando ulises valentin
  armando alfredo benito bernardo ezequiel fabian federico gerardo gilberto hernan humberto jaime leonardo
  lisandro moises nestor omar pascual reinaldo rogelio saul teodoro toni pepe paco manolo nacho quique kike
  rafa fran juanma juanjo josemi chema txema dani
  john michael james robert william richard thomas mark paul steven kevin brian george peter
  papa papi padre abuelo abu yayo tio primo hermano suegro hijo
`;

const CHICA = `
  maria carmen ana isabel laura cristina marta lucia elena pilar sara paula raquel rosa beatriz patricia silvia
  julia irene monica alba andrea rocio sandra teresa eva angela nuria noelia claudia sonia natalia ines carla
  susana yolanda rebeca lorena miriam esther veronica mercedes encarnacion dolores montserrat montse amparo
  victoria alicia diana sofia valeria daniela martina emma olivia lola vega aitana carlota mia alma chloe
  ariadna ainhoa leire nerea irati maialen uxue nahia aroa celia clara adriana alejandra gabriela fernanda
  mariana camila valentina renata ximena regina jimena lorena marina lidia esperanza ines inmaculada inma
  macarena estefania tamara vanessa jessica jennifer barbara gloria margarita josefa francisca antonia
  manuela luisa juana rosario consuelo begona aurora lourdes concepcion conchi rosana silvana bianca ruth
  judith noemi anna laia mireia nuria berta queralt gemma meritxell neus marta joana aina
  leticia sheila cecilia emilia elisa estela fatima jazmin lara luna maya nadia nora olga rita sabrina
  tania vera yaiza zoe mery mari maripaz maite marisa marisol mayte paqui loli pepa tere charo
  mary jennifer linda elizabeth susan sarah karen nancy lisa betty
  mama mami madre abuela yaya tia prima hermana suegra hija
`;

const set = (s) => new Set(s.trim().split(/\s+/));
const CHICOS = set(CHICO);
const CHICAS = set(CHICA);

const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** 'chico' | 'chica' | null */
export function generoDe(nombre) {
  if (!nombre) return null;
  const primera = normalizar(String(nombre)).split(/[^a-z]+/).find(Boolean);
  if (!primera) return null;
  const esChico = CHICOS.has(primera);
  const esChica = CHICAS.has(primera);
  if (esChico === esChica) return null; // desconocido o en las dos listas
  return esChico ? 'chico' : 'chica';
}
