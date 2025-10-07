// Simple SPA with hash routing and localStorage state
const appEl = document.getElementById('app');

// App constants
const BRANCHES = [
  { id: 'algebra', name: 'ÁLGERA'.replace('ÁLGERA','ÁLGEBRA') },
  { id: 'aritmetica', name: 'ARITMÉTICA' },
  { id: 'geometria', name: 'GEOMETRÍA' },
  { id: 'logica', name: 'PROBLEMAS LÓGICOS' }
];
const LEVELS = ['basico', 'intermedio', 'avanzado'];

// Curiosidades (¿Sabías que...?)
const FACTS = [
  { area: 'logica', text: '¿Sabías que la Paradoja de Aquiles y la Tortuga se resuelve con series infinitas? La suma de infinitas distancias puede dar un tiempo finito.' },
  { area: 'geometria', text: '¿Sabías que el Efecto Mariposa no es desorden? En la Teoría del Caos, pequeños cambios iniciales provocan resultados enormes.' },
  { area: 'aritmetica', text: '¿Sabías que los Primos Gemelos (primos que difieren en 2) podrían ser infinitos? Aún no se ha demostrado.' },
  { area: 'algebra', text: '¿Sabías que “logaritmo” viene de logos (razón) y arithmos (número)? Se inventaron para convertir multiplicaciones en sumas.' },
  { area: 'aritmetica', text: '¿Sabías que la suma de números impares consecutivos (1+3+5+...) siempre produce un cuadrado perfecto?' },
  { area: 'logica', text: '¿Sabías que el Número de Graham es tan grande que no cabe ni usando toda la materia del universo para escribirlo?' }
];
function randomFact() { return FACTS[Math.floor(Math.random() * FACTS.length)]; }

// Diagnostic questions (6) with points per spec
const DIAGNOSTIC = [
  { id: 'diag-arit-1', branch: 'aritmetica', difficulty: 'basico', points: 1,
    q: 'RESUELVE: 10 + 5 × 2.',
    options: ['20', '30', '15', '25'], correctIndex: 0 },
  { id: 'diag-geom-1', branch: 'geometria', difficulty: 'basico', points: 1,
    q: 'CALCULA EL ÁREA DE UN TRIÁNGULO CON BASE 10 CM Y ALTURA 4 CM.',
    options: ['10 cm²', '14 cm²', '20 cm²', '40 cm²'], correctIndex: 2 },
  { id: 'diag-alg-1', branch: 'algebra', difficulty: 'basico', points: 1,
    q: 'RESUELVE LA ECUACIÓN: 3X + 5 = 20.',
    options: ['x = 3', 'x = 5', 'x = 10', 'x = 15'], correctIndex: 1 },
  { id: 'diag-alg-adv', branch: 'algebra', difficulty: 'avanzado', points: 2,
    q: 'RESUELVE: 4X − 2 = 3X + 5.',
    options: ['x = 2', 'x = 5', 'x = 7', 'x = 9'], correctIndex: 2 },
  { id: 'diag-log-1', branch: 'logica', difficulty: 'basico', points: 1,
    q: 'SI UN TREN RECORRE 180 KM EN 3 HORAS, ¿CUÁL ES SU VELOCIDAD MEDIA?',
    options: ['30 km/h', '45 km/h', '60 km/h', '75 km/h'], correctIndex: 2 },
  { id: 'diag-log-adv', branch: 'logica', difficulty: 'avanzado', points: 2,
    q: 'LA SUMA DE DOS NÚMEROS ES 30 Y SU DIFERENCIA ES 6. ¿CUÁLES SON?',
    options: ['15 y 15', '18 y 12', '20 y 10', '24 y 6'], correctIndex: 1 }
];
const DIAG_TOTAL_POINTS = DIAGNOSTIC.reduce((s, q) => s + q.points, 0); // 9

// Storage helpers
const STORAGE_KEY = 'nous_state_v1';
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function saveState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// Initial state
function createInitialState() {
  const progress = {};
  for (const b of BRANCHES) progress[b.id] = { basico: 'locked', intermedio: 'locked', avanzado: 'locked', completed: {} };
  return { user: { name: '', age: '', level: 'principiante' }, streak: 0, totalPracticeMinutes: 0, diagnostics: { done: false, points: 0, totalPoints: DIAG_TOTAL_POINTS }, progress };
}

let state = loadState() || createInitialState();
if (state && (!state.diagnostics || typeof state.diagnostics.points !== 'number')) { state.diagnostics = { done: false, points: 0, totalPoints: DIAG_TOTAL_POINTS }; saveState(state); }

// Router
const routes = { '/': renderWelcome, '/diagnostico': renderDiagnostic, '/mapa': renderMap, '/ejercicios': renderExercises, '/perfil': renderProfile };
function navigate(path) { location.hash = '#' + path; }
function router() { const hash = location.hash.replace('#', '') || '/'; const view = routes[hash.split('?')[0]] || routes['/']; view(); }
window.addEventListener('hashchange', router);

// UI helpers
function h(tag, attrs = {}, children = []) { const el = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v; else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v); else el.setAttribute(k, v); } for (const child of [].concat(children)) { if (child == null) continue; if (typeof child === 'string') el.appendChild(document.createTextNode(child)); else el.appendChild(child); } return el; }
function setView(title, subtitle, contentEl) { appEl.innerHTML=''; const header=h('div',{class:'view-header'},[ h('div',{},[ h('div',{class:'view-title'},[String(title).toUpperCase()]), subtitle? h('div',{class:'view-subtitle'},[subtitle]): null ]) ]); appEl.appendChild(h('section',{class:'view'},[header, contentEl])); }

// Welcome / Register
function renderWelcome() {
  const userKnown = Boolean(state.user.name);
  const content = h('div', { class: 'card' }, [
    h('p', { class: 'view-subtitle' }, ['Bienvenido a Nous. Soy Ratium y estaré contigo en este viaje del conocimiento.']),
    h('form', { class: 'form', id: 'welcome-form', onsubmit: onSubmitWelcome }, [
      h('div', { class: 'grid' }, [ h('label', {}, [ 'Nombre', h('input', { type: 'text', name: 'name', required: true, value: state.user.name || '' }) ]), h('label', {}, [ 'Edad', h('input', { type: 'number', min: '5', max: '100', name: 'age', required: true, value: state.user.age || '' }) ]) ]),
      h('div', { class: 'form-actions' }, [ h('button', { type: 'submit', class: 'btn btn-primary' }, [ userKnown ? 'Actualizar' : 'Comenzar' ]), h('a', { href: '#/diagnostico', class: 'btn btn-secondary' }, ['Ir al diagnóstico']) ])
    ])
  ]);
  setView('Nous', '“La razón como camino, el conocimiento como meta.”', content);
}
function onSubmitWelcome(e) { e.preventDefault(); const data = Object.fromEntries(new FormData(e.target)); state.user.name=(data.name||'').trim(); state.user.age=(data.age||'').trim(); saveState(state); navigate('/diagnostico'); }

// Diagnostic (locked after done)
function renderDiagnostic() {
  if (state.diagnostics.done) { return setView('Prueba Diagnóstica', 'Ya completaste el diagnóstico.', h('div',{class:'card'},[ h('p',{},['Este módulo solo puede realizarse una vez.']), h('a',{href:'#/mapa',class:'btn btn-primary'},['Ir al mapa']) ])); }
  const params = new URLSearchParams(location.hash.split('?')[1] || ''); const idx = Number(params.get('q') || 0);
  if (idx >= DIAGNOSTIC.length) return renderDiagnosticSummary();
  const q = DIAGNOSTIC[idx];
  const options = q.options.map((opt, i) => h('button', { class: 'option', type: 'button', onclick: () => onAnswerDiagnostic(idx, i) }, [opt]));
  const content = h('div', { class: 'quiz card' }, [ h('p', { class: 'view-subtitle' }, ['Prueba Diagnóstica Nous (PDB) · Responde las 6 preguntas.']), h('div', { class: 'view-subtitle' }, [`Pregunta ${idx + 1} de ${DIAGNOSTIC.length} · ${q.points} punto(s)`]), h('h3', {}, [String(q.q).toUpperCase()]), h('div', { class: 'options' }, options) ]);
  setView('Prueba Diagnóstica', 'Mide tu nivel para personalizar el plan de estudio.', content);
}
function onAnswerDiagnostic(idx, answerIndex) {
  const q = DIAGNOSTIC[idx]; const correct = q.correctIndex === answerIndex; state.diagnostics.points = (state.diagnostics.points || 0) + (correct ? q.points : 0); saveState(state);
  const next = idx + 1; if (next < DIAGNOSTIC.length) { location.hash = '#/diagnostico?q=' + next; } else { state.diagnostics.done = true; const level = getLevelFromPoints(state.diagnostics.points); state.user.level = level.toLowerCase(); applyUnlockRules(level); saveState(state); renderDiagnosticSummary(); }
}
function getLevelFromPoints(points) { if (points >= 7) return 'Avanzado'; if (points >= 4) return 'Intermedio'; return 'Principiante'; }
function renderDiagnosticSummary() { const totalPts = state.diagnostics.totalPoints || DIAG_TOTAL_POINTS; const points = state.diagnostics.points || 0; const levelMsg = getLevelFromPoints(points); const content = h('div', { class: 'card' }, [ h('p', {}, [`Ratium: ¡Bien hecho! Obtuviste ${points} de ${totalPts} puntos. Nivel asignado: ${levelMsg}.`]), h('div', { class: 'form-actions' }, [ h('a', { href: '#/mapa', class: 'btn btn-primary' }, ['Ir al mapa']), h('a', { href: '#/ejercicios', class: 'btn btn-secondary' }, ['Comenzar ejercicios']) ]) ]); setView('Resumen Diagnóstico', 'Esto desbloqueará tus niveles iniciales.', content); }

// Unlock rules
function applyUnlockRules(level) { for (const b of BRANCHES) { const branch = state.progress[b.id]; if (level === 'Avanzado') { branch.basico='unlocked'; branch.intermedio='unlocked'; branch.avanzado='unlocked'; } else if (level === 'Intermedio') { branch.basico='unlocked'; branch.intermedio='unlocked'; branch.avanzado='locked'; } else { branch.basico='unlocked'; branch.intermedio='locked'; branch.avanzado='locked'; } } }

// Map UI
function renderMap() {
  const grid = h('div', { class: 'map-grid' });
  for (const b of BRANCHES) {
    const prog = state.progress[b.id];
    const levels = h('div', { class: 'node-levels' }, [ levelBadge(b.id, 'basico', prog.basico), levelBadge(b.id, 'intermedio', prog.intermedio), levelBadge(b.id, 'avanzado', prog.avanzado) ]);
    const node = h('div', { class: 'node' }, [ h('div', { class: 'node-title' }, [b.name]), levels ]);
    grid.appendChild(node);
  }
  const fact = randomFact();
  const factCard = h('div', { class: 'card' }, [ h('strong', {}, ['¿SABÍAS QUE…? ']), h('span', {}, [fact.text]) ]);
  const content = h('div', { class: 'view' }, [ h('p', { class: 'view-subtitle' }, ['TU PROGRESO POR RAMAS Y NIVELES. COMPLETA NIVELES PARA DESBLOQUEAR LOS SIGUIENTES.']) ]);
  content.appendChild(grid); content.appendChild(factCard);
  setView('Mapa de Progreso', 'Camino visual de aprendizaje', content);
}
function levelBadge(branchId, level, status) { const label = level[0].toUpperCase() + level.slice(1); const cls = 'badge ' + (status === 'unlocked' ? 'unlocked' : 'locked'); const attrs = status === 'unlocked' ? { class: cls, role: 'button', tabindex: '0', onclick: () => startLesson(branchId, level) } : { class: cls, title: 'Bloqueado' }; return h('span', attrs, [label]); }
function startLesson(branchId, level) { sessionStorage.setItem('current_lesson', JSON.stringify({ branchId, level })); navigate('/ejercicios'); }

// Build Algebra exercises (25 total: 8 básico, 8 medio, 9 avanzado)
function buildAlgebraExercises() {
  const basico = [
    { q: 'RESUELVE: 2X + 3 = 11', correct: 'x = 4', distractors: ['x = 3','x = 5','x = 8'], hints: ['Resta 3 a ambos lados','Divide entre 2','Verifica la solución'], solution: 'x = 4', explanation: '2x + 3 = 11 → 2x = 8 → x = 4' },
    { q: 'RESUELVE: 5X = 20', correct: 'x = 4', distractors: ['x = 5','x = 20','x = 2'], hints: ['Divide ambos lados entre 5','Simplifica','Verifica'], solution: 'x = 4', explanation: '5x = 20 → x = 20/5 = 4' },
    { q: 'RESUELVE: 3X - 5 = 7', correct: 'x = 4', distractors: ['x = 3','x = 5','x = 6'], hints: ['Suma 5 a ambos lados','Divide entre 3','Verifica'], solution: 'x = 4', explanation: '3x - 5 = 7 → 3x = 12 → x = 4' },
    { q: 'RESUELVE: 2X + 1 = 9', correct: 'x = 4', distractors: ['x = 3','x = 5','x = 8'], hints: ['Resta 1 a ambos lados','Divide entre 2','Verifica'], solution: 'x = 4', explanation: '2x + 1 = 9 → 2x = 8 → x = 4' },
    { q: 'RESUELVE: 4X = 16', correct: 'x = 4', distractors: ['x = 3','x = 5','x = 8'], hints: ['Divide ambos lados entre 4','Simplifica','Verifica'], solution: 'x = 4', explanation: '4x = 16 → x = 16/4 = 4' },
    { q: 'RESUELVE: X + 7 = 11', correct: 'x = 4', distractors: ['x = 3','x = 5','x = 18'], hints: ['Resta 7 a ambos lados','Simplifica','Verifica'], solution: 'x = 4', explanation: 'x + 7 = 11 → x = 11 - 7 = 4' },
    { q: 'RESUELVE: 6X - 2 = 22', correct: 'x = 4', distractors: ['x = 3','x = 5','x = 6'], hints: ['Suma 2 a ambos lados','Divide entre 6','Verifica'], solution: 'x = 4', explanation: '6x - 2 = 22 → 6x = 24 → x = 4' },
    { q: 'RESUELVE: 3X + 2 = 14', correct: 'x = 4', distractors: ['x = 3','x = 5','x = 6'], hints: ['Resta 2 a ambos lados','Divide entre 3','Verifica'], solution: 'x = 4', explanation: '3x + 2 = 14 → 3x = 12 → x = 4' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  const intermedio = [
    { q: 'RESUELVE EL SISTEMA: X + Y = 10, X - Y = 2', correct: 'x = 6, y = 4', distractors: ['x = 5, y = 5','x = 8, y = 2','x = 4, y = 6'], hints: ['Suma las dos ecuaciones','Halla x','Sustituye para hallar y'], solution: 'x = 6, y = 4', explanation: 'Sumando: 2x = 12 → x = 6 → y = 4' },
    { q: 'RESUELVE EL SISTEMA: 2X + Y = 7, X - Y = 2', correct: 'x = 3, y = 1', distractors: ['x = 2, y = 3','x = 4, y = -1','x = 1, y = 5'], hints: ['Suma las ecuaciones','Halla x','Sustituye para y'], solution: 'x = 3, y = 1', explanation: 'Sumando: 3x = 9 → x = 3 → y = 1' },
    { q: 'RESUELVE EL SISTEMA: X + 2Y = 8, 2X - Y = 1', correct: 'x = 2, y = 3', distractors: ['x = 3, y = 2','x = 1, y = 4','x = 4, y = 2'], hints: ['Usa sustitución','Despeja una variable','Sustituye'], solution: 'x = 2, y = 3', explanation: 'x = 8 - 2y → 2(8-2y) - y = 1 → y = 3, x = 2' },
    { q: 'RESUELVE EL SISTEMA: 3X + Y = 10, X - Y = 2', correct: 'x = 3, y = 1', distractors: ['x = 2, y = 4','x = 4, y = -2','x = 1, y = 7'], hints: ['Suma las ecuaciones','Halla x','Sustituye'], solution: 'x = 3, y = 1', explanation: 'Sumando: 4x = 12 → x = 3 → y = 1' },
    { q: 'RESUELVE EL SISTEMA: X + Y = 12, 2X - Y = 6', correct: 'x = 6, y = 6', distractors: ['x = 5, y = 7','x = 7, y = 5','x = 4, y = 8'], hints: ['Suma las ecuaciones','Halla x','Sustituye'], solution: 'x = 6, y = 6', explanation: 'Sumando: 3x = 18 → x = 6 → y = 6' },
    { q: 'RESUELVE EL SISTEMA: 2X + 3Y = 13, X - Y = 1', correct: 'x = 3.2, y = 2.2', distractors: ['x = 2, y = 3','x = 4, y = 1','x = 1, y = 4'], hints: ['Despeja x de la segunda','Sustituye en la primera','Resuelve'], solution: 'x = 3.2, y = 2.2', explanation: 'x = y + 1 → 2(y+1) + 3y = 13 → y = 2.2, x = 3.2' },
    { q: 'RESUELVE EL SISTEMA: X + Y = 15, 3X - Y = 5', correct: 'x = 5, y = 10', distractors: ['x = 4, y = 11','x = 6, y = 9','x = 3, y = 12'], hints: ['Suma las ecuaciones','Halla x','Sustituye'], solution: 'x = 5, y = 10', explanation: 'Sumando: 4x = 20 → x = 5 → y = 10' },
    { q: 'RESUELVE EL SISTEMA: 4X + Y = 17, X - 2Y = -1', correct: 'x = 3, y = 5', distractors: ['x = 2, y = 6','x = 4, y = 4','x = 1, y = 8'], hints: ['Despeja x de la segunda','Sustituye en la primera','Resuelve'], solution: 'x = 3, y = 5', explanation: 'x = 2y - 1 → 4(2y-1) + y = 17 → y = 5, x = 3' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  const avanzado = [
    { q: 'RESUELVE: X² - 5X + 6 = 0', correct: 'x = 2, x = 3', distractors: ['x = -2, x = -3','x = 1, x = 6','No tiene solución real'], hints: ['Usa factorización','Identifica factores','Resuelve'], solution: 'x = 2 y x = 3', explanation: 'x² - 5x + 6 = (x - 2)(x - 3) = 0' },
    { q: 'RESUELVE: X² - 7X + 12 = 0', correct: 'x = 3, x = 4', distractors: ['x = -3, x = -4','x = 2, x = 6','No tiene solución real'], hints: ['Factoriza','Busca dos números que sumen -7 y multipliquen 12'], solution: 'x = 3 y x = 4', explanation: 'x² - 7x + 12 = (x - 3)(x - 4) = 0' },
    { q: 'RESUELVE: X² - 9 = 0', correct: 'x = 3, x = -3', distractors: ['x = 9, x = -9','x = 3, x = 3','No tiene solución real'], hints: ['Diferencia de cuadrados','a² - b² = (a-b)(a+b)'], solution: 'x = 3 y x = -3', explanation: 'x² - 9 = (x - 3)(x + 3) = 0' },
    { q: 'RESUELVE: X² + 6X + 9 = 0', correct: 'x = -3', distractors: ['x = 3','x = -3, x = 3','No tiene solución real'], hints: ['Trinomio cuadrado perfecto','(x + 3)² = 0'], solution: 'x = -3', explanation: 'x² + 6x + 9 = (x + 3)² = 0' },
    { q: 'RESUELVE: X² - 4X + 4 = 0', correct: 'x = 2', distractors: ['x = -2','x = 2, x = -2','No tiene solución real'], hints: ['Trinomio cuadrado perfecto','(x - 2)² = 0'], solution: 'x = 2', explanation: 'x² - 4x + 4 = (x - 2)² = 0' },
    { q: 'RESUELVE: X² - 8X + 15 = 0', correct: 'x = 3, x = 5', distractors: ['x = -3, x = -5','x = 2, x = 6','No tiene solución real'], hints: ['Factoriza','Busca dos números que sumen -8 y multipliquen 15'], solution: 'x = 3 y x = 5', explanation: 'x² - 8x + 15 = (x - 3)(x - 5) = 0' },
    { q: 'RESUELVE: X² - 10X + 25 = 0', correct: 'x = 5', distractors: ['x = -5','x = 5, x = -5','No tiene solución real'], hints: ['Trinomio cuadrado perfecto','(x - 5)² = 0'], solution: 'x = 5', explanation: 'x² - 10x + 25 = (x - 5)² = 0' },
    { q: 'RESUELVE: X² - 6X + 8 = 0', correct: 'x = 2, x = 4', distractors: ['x = -2, x = -4','x = 1, x = 8','No tiene solución real'], hints: ['Factoriza','Busca dos números que sumen -6 y multipliquen 8'], solution: 'x = 2 y x = 4', explanation: 'x² - 6x + 8 = (x - 2)(x - 4) = 0' },
    { q: 'RESUELVE: X² - 12X + 36 = 0', correct: 'x = 6', distractors: ['x = -6','x = 6, x = -6','No tiene solución real'], hints: ['Trinomio cuadrado perfecto','(x - 6)² = 0'], solution: 'x = 6', explanation: 'x² - 12x + 36 = (x - 6)² = 0' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  return { basico, intermedio, avanzado };
}

// Build Lógica exercises (25 total: 8 básico, 8 medio, 9 avanzado)
function buildLogicExercises() {
  const basico = [
    { q: 'SERIE: 2, 4, 6, 8, ¿?', correct: '10', distractors: ['8','12','14'], hints: ['Observa el patrón','Se suman 2','Aplica'], solution: '10', explanation: 'La serie aumenta de 2 en 2 → 10' },
    { q: 'SERIE: 1, 3, 5, 7, ¿?', correct: '9', distractors: ['8','10','11'], hints: ['Observa el patrón','Números impares','Aplica'], solution: '9', explanation: 'Serie de números impares → 9' },
    { q: 'SERIE: 2, 4, 8, 16, ¿?', correct: '32', distractors: ['20','24','28'], hints: ['Observa el patrón','Se multiplica por 2','Aplica'], solution: '32', explanation: 'Cada número se multiplica por 2 → 32' },
    { q: 'SERIE: 1, 4, 9, 16, ¿?', correct: '25', distractors: ['20','24','30'], hints: ['Observa el patrón','Son cuadrados perfectos','Aplica'], solution: '25', explanation: '1², 2², 3², 4² → 5² = 25' },
    { q: 'SERIE: 3, 6, 9, 12, ¿?', correct: '15', distractors: ['13','14','16'], hints: ['Observa el patrón','Múltiplos de 3','Aplica'], solution: '15', explanation: 'Múltiplos de 3 → 15' },
    { q: 'SERIE: 1, 1, 2, 3, 5, ¿?', correct: '8', distractors: ['6','7','9'], hints: ['Observa el patrón','Fibonacci: suma los dos anteriores','Aplica'], solution: '8', explanation: 'Fibonacci: 3 + 5 = 8' },
    { q: 'SERIE: 10, 20, 30, 40, ¿?', correct: '50', distractors: ['45','55','60'], hints: ['Observa el patrón','Se suman 10','Aplica'], solution: '50', explanation: 'Aumenta de 10 en 10 → 50' },
    { q: 'SERIE: 1, 8, 27, 64, ¿?', correct: '125', distractors: ['100','120','130'], hints: ['Observa el patrón','Son cubos perfectos','Aplica'], solution: '125', explanation: '1³, 2³, 3³, 4³ → 5³ = 125' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  const intermedio = [
    { q: 'SI HOY ES LUNES, ¿QUÉ DÍA SERÁ EN 10 DÍAS?', correct: 'Jueves', distractors: ['Martes','Miércoles','Viernes'], hints: ['Una semana son 7 días','Resta 7 a 10','Cuenta'], solution: 'Jueves', explanation: '10 = 7 + 3 → Lunes + 3 = Jueves' },
    { q: 'SI HOY ES MIÉRCOLES, ¿QUÉ DÍA SERÁ EN 15 DÍAS?', correct: 'Jueves', distractors: ['Miércoles','Viernes','Sábado'], hints: ['15 = 14 + 1','14 días = 2 semanas','Miércoles + 1'], solution: 'Jueves', explanation: '15 = 14 + 1 → Miércoles + 1 = Jueves' },
    { q: 'SI HOY ES VIERNES, ¿QUÉ DÍA ERA HACE 5 DÍAS?', correct: 'Domingo', distractors: ['Lunes','Martes','Miércoles'], hints: ['Cuenta hacia atrás','Viernes - 5 días'], solution: 'Domingo', explanation: 'Viernes - 5 días = Domingo' },
    { q: 'SI HOY ES SÁBADO, ¿QUÉ DÍA SERÁ EN 20 DÍAS?', correct: 'Viernes', distractors: ['Jueves','Sábado','Domingo'], hints: ['20 = 14 + 6','14 días = 2 semanas','Sábado + 6'], solution: 'Viernes', explanation: '20 = 14 + 6 → Sábado + 6 = Viernes' },
    { q: 'SI HOY ES MARTES, ¿QUÉ DÍA SERÁ EN 7 DÍAS?', correct: 'Martes', distractors: ['Lunes','Miércoles','Jueves'], hints: ['7 días = 1 semana','Misma semana siguiente'], solution: 'Martes', explanation: '7 días = 1 semana → Martes' },
    { q: 'SI HOY ES DOMINGO, ¿QUÉ DÍA ERA HACE 3 DÍAS?', correct: 'Jueves', distractors: ['Viernes','Sábado','Lunes'], hints: ['Cuenta hacia atrás','Domingo - 3 días'], solution: 'Jueves', explanation: 'Domingo - 3 días = Jueves' },
    { q: 'SI HOY ES JUEVES, ¿QUÉ DÍA SERÁ EN 14 DÍAS?', correct: 'Jueves', distractors: ['Miércoles','Viernes','Sábado'], hints: ['14 días = 2 semanas','Misma semana en 2 semanas'], solution: 'Jueves', explanation: '14 días = 2 semanas → Jueves' },
    { q: 'SI HOY ES LUNES, ¿QUÉ DÍA ERA HACE 8 DÍAS?', correct: 'Domingo', distractors: ['Sábado','Lunes','Martes'], hints: ['8 = 7 + 1','7 días = 1 semana','Lunes - 1'], solution: 'Domingo', explanation: '8 = 7 + 1 → Lunes - 1 = Domingo' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  const avanzado = [
    { q: 'HAY 20 CABEZAS Y 54 PATAS ENTRE GALLINAS Y CONEJOS. ¿CUÁNTOS HAY DE CADA UNO?', correct: 'Gallinas=13, Conejos=7', distractors: ['Gallinas=12, Conejos=8','Gallinas=10, Conejos=10','Gallinas=14, Conejos=6'], hints: ['Cada animal tiene 1 cabeza','Gallina=2 patas, Conejo=4 patas','Plantea un sistema'], solution: 'Gallinas=13, Conejos=7', explanation: 'x + y = 20; 2x + 4y = 54 → x = 13, y = 7' },
    { q: 'UN GRANJERO TIENE 30 CABEZAS Y 80 PATAS ENTRE GALLINAS Y CONEJOS. ¿CUÁNTOS HAY DE CADA UNO?', correct: 'Gallinas=20, Conejos=10', distractors: ['Gallinas=15, Conejos=15','Gallinas=25, Conejos=5','Gallinas=18, Conejos=12'], hints: ['Cada animal tiene 1 cabeza','Gallina=2 patas, Conejo=4 patas','Plantea un sistema'], solution: 'Gallinas=20, Conejos=10', explanation: 'x + y = 30; 2x + 4y = 80 → x = 20, y = 10' },
    { q: 'HAY 25 CABEZAS Y 70 PATAS ENTRE GALLINAS Y CONEJOS. ¿CUÁNTOS HAY DE CADA UNO?', correct: 'Gallinas=15, Conejos=10', distractors: ['Gallinas=10, Conejos=15','Gallinas=20, Conejos=5','Gallinas=12, Conejos=13'], hints: ['Cada animal tiene 1 cabeza','Gallina=2 patas, Conejo=4 patas','Plantea un sistema'], solution: 'Gallinas=15, Conejos=10', explanation: 'x + y = 25; 2x + 4y = 70 → x = 15, y = 10' },
    { q: 'UN GRANJERO TIENE 40 CABEZAS Y 100 PATAS ENTRE GALLINAS Y CONEJOS. ¿CUÁNTOS HAY DE CADA UNO?', correct: 'Gallinas=30, Conejos=10', distractors: ['Gallinas=20, Conejos=20','Gallinas=35, Conejos=5','Gallinas=25, Conejos=15'], hints: ['Cada animal tiene 1 cabeza','Gallina=2 patas, Conejo=4 patas','Plantea un sistema'], solution: 'Gallinas=30, Conejos=10', explanation: 'x + y = 40; 2x + 4y = 100 → x = 30, y = 10' },
    { q: 'HAY 35 CABEZAS Y 90 PATAS ENTRE GALLINAS Y CONEJOS. ¿CUÁNTOS HAY DE CADA UNO?', correct: 'Gallinas=25, Conejos=10', distractors: ['Gallinas=20, Conejos=15','Gallinas=30, Conejos=5','Gallinas=15, Conejos=20'], hints: ['Cada animal tiene 1 cabeza','Gallina=2 patas, Conejo=4 patas','Plantea un sistema'], solution: 'Gallinas=25, Conejos=10', explanation: 'x + y = 35; 2x + 4y = 90 → x = 25, y = 10' },
    { q: 'UN GRANJERO TIENE 50 CABEZAS Y 120 PATAS ENTRE GALLINAS Y CONEJOS. ¿CUÁNTOS HAY DE CADA UNO?', correct: 'Gallinas=40, Conejos=10', distractors: ['Gallinas=30, Conejos=20','Gallinas=45, Conejos=5','Gallinas=35, Conejos=15'], hints: ['Cada animal tiene 1 cabeza','Gallina=2 patas, Conejo=4 patas','Plantea un sistema'], solution: 'Gallinas=40, Conejos=10', explanation: 'x + y = 50; 2x + 4y = 120 → x = 40, y = 10' },
    { q: 'HAY 60 CABEZAS Y 140 PATAS ENTRE GALLINAS Y CONEJOS. ¿CUÁNTOS HAY DE CADA UNO?', correct: 'Gallinas=50, Conejos=10', distractors: ['Gallinas=40, Conejos=20','Gallinas=55, Conejos=5','Gallinas=45, Conejos=15'], hints: ['Cada animal tiene 1 cabeza','Gallina=2 patas, Conejo=4 patas','Plantea un sistema'], solution: 'Gallinas=50, Conejos=10', explanation: 'x + y = 60; 2x + 4y = 140 → x = 50, y = 10' },
    { q: 'UN GRANJERO TIENE 45 CABEZAS Y 110 PATAS ENTRE GALLINAS Y CONEJOS. ¿CUÁNTOS HAY DE CADA UNO?', correct: 'Gallinas=35, Conejos=10', distractors: ['Gallinas=25, Conejos=20','Gallinas=40, Conejos=5','Gallinas=30, Conejos=15'], hints: ['Cada animal tiene 1 cabeza','Gallina=2 patas, Conejo=4 patas','Plantea un sistema'], solution: 'Gallinas=35, Conejos=10', explanation: 'x + y = 45; 2x + 4y = 110 → x = 35, y = 10' },
    { q: 'HAY 55 CABEZAS Y 130 PATAS ENTRE GALLINAS Y CONEJOS. ¿CUÁNTOS HAY DE CADA UNO?', correct: 'Gallinas=45, Conejos=10', distractors: ['Gallinas=35, Conejos=20','Gallinas=50, Conejos=5','Gallinas=40, Conejos=15'], hints: ['Cada animal tiene 1 cabeza','Gallina=2 patas, Conejo=4 patas','Plantea un sistema'], solution: 'Gallinas=45, Conejos=10', explanation: 'x + y = 55; 2x + 4y = 130 → x = 45, y = 10' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  return { basico, intermedio, avanzado };
}

// New: Build Geometría exercises (8 básico, 8 intermedio, 9 avanzado)
function buildGeometryExercises() {
  const basico = [
    { q: 'ÁREA DE RECTÁNGULO DE 6 × 4', correct: '24', distractors: ['10','20','28'], hints: ['Área = base × altura','Multiplica 6 por 4','Simplifica'], solution: '24', explanation: '6 × 4 = 24' },
    { q: 'PERÍMETRO DE UN CUADRADO DE LADO 5', correct: '20', distractors: ['10','25','30'], hints: ['Perímetro = 4 × lado','Multiplica 4×5','Simplifica'], solution: '20', explanation: '4 × 5 = 20' },
    { q: 'ÁREA DE TRIÁNGULO (BASE 10, ALTURA 8)', correct: '40', distractors: ['18','80','48'], hints: ['Área = (base × altura) / 2','10×8=80','80/2'], solution: '40', explanation: '(10×8)/2 = 40' },
    { q: 'SUMA DE ÁNGULOS INTERNOS DE UN TRIÁNGULO', correct: '180°', distractors: ['90°','270°','360°'], hints: ['Propiedad básica','Triángulo siempre','Recuerda 180°'], solution: '180°', explanation: 'En cualquier triángulo suman 180°' },
    { q: 'LADOS DE UN HEXÁGONO', correct: '6', distractors: ['5','7','8'], hints: ['“Hexa” significa 6','Cuenta lados','Selecciona 6'], solution: '6', explanation: 'Hexágono tiene 6 lados' },
    { q: 'ÁREA DE UN CUADRADO DE LADO 7', correct: '49', distractors: ['14','28','56'], hints: ['Área = lado × lado','7×7','Calcula'], solution: '49', explanation: '7×7 = 49' },
    { q: 'PERÍMETRO DE RECTÁNGULO 3 × 9', correct: '24', distractors: ['18','21','30'], hints: ['Perímetro = 2(largo+ancho)','3+9=12','2×12'], solution: '24', explanation: '2(3+9)=24' },
    { q: 'ÁNGULOS RECTOS EN UN RECTÁNGULO', correct: '4', distractors: ['2','3','0'], hints: ['Cada esquina es recta','Recto = 90°','Cuatro esquinas'], solution: '4', explanation: 'Tiene 4 ángulos rectos' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  const intermedio = [
    { q: 'ÁREA DE UN CÍRCULO (RADIO 3, π≈3.14)', correct: '≈28.3', distractors: ['≈18.8','≈31.4','≈56.5'], hints: ['Área = πr²','3²=9','3.14×9≈28.26'], solution: '≈28.3', explanation: 'π·3² ≈ 3.14×9 ≈ 28.3' },
    { q: 'PERÍMETRO TRIÁNGULO 3, 4, 5', correct: '12', distractors: ['11','13','14'], hints: ['Suma lados','3+4+5','Calcula'], solution: '12', explanation: '3+4+5=12' },
    { q: 'DIAGONAL DE RECTÁNGULO 6 × 8', correct: '10', distractors: ['12','14','8'], hints: ['Teorema de Pitágoras','6²+8²','√(36+64)=√100'], solution: '10', explanation: 'd=√(6²+8²)=10' },
    { q: 'ÁREA DE PARALELOGRAMO (BASE 12, ALTURA 5)', correct: '60', distractors: ['30','24','72'], hints: ['Área = base × altura','12×5','Calcula'], solution: '60', explanation: '12×5=60' },
    { q: 'ÁREA DE TRAPECIO (BASES 10 Y 6, ALTURA 4)', correct: '32', distractors: ['40','64','26'], hints: ['Área= (B+b)/2 × h','(10+6)/2=8','8×4'], solution: '32', explanation: '((10+6)/2)×4=32' },
    { q: 'DIAGONALES EN UN PENTÁGONO', correct: '5', distractors: ['4','6','10'], hints: ['Fórmula n(n−3)/2','n=5','5×2/2'], solution: '5', explanation: '5(5−3)/2 = 5' },
    { q: 'ÁNGULO FALTANTE EN TRIÁNGULO (50° Y 60°)', correct: '70°', distractors: ['60°','80°','90°'], hints: ['Suman 180°','180−(50+60)','Calcula'], solution: '70°', explanation: '180−110=70°' },
    { q: 'CIRCUNFERENCIA (RADIO 5, π≈3.14)', correct: '≈31.4', distractors: ['≈25.1','≈15.7','≈62.8'], hints: ['C=2πr','2×3.14×5','≈31.4'], solution: '≈31.4', explanation: '2πr ≈ 31.4' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  const avanzado = [
    { q: 'HIPOTENUSA CON CATETOS 9 Y 12', correct: '15', distractors: ['13','18','21'], hints: ['Pitágoras','9²+12²','√(81+144)=√225'], solution: '15', explanation: '√225=15' },
    { q: 'ÁNGULO INTERIOR DE POLÍGONO REGULAR DE 8 LADOS', correct: '135°', distractors: ['120°','140°','150°'], hints: ['Fórmula ((n−2)×180)/n','n=8','Calcula'], solution: '135°', explanation: '((8−2)×180)/8=135°' },
    { q: 'DIAGONALES EN UN OCTÁGONO', correct: '20', distractors: ['16','18','24'], hints: ['n(n−3)/2','n=8','8×5/2'], solution: '20', explanation: '8(8−3)/2=20' },
    { q: 'ÁREA DE CÍRCULO (RADIO 5, π≈3.14)', correct: '≈78.5', distractors: ['≈31.4','≈62.8','≈25.0'], hints: ['Área=πr²','5²=25','3.14×25≈78.5'], solution: '≈78.5', explanation: 'π·25≈78.5' },
    { q: 'ESCALA: SI LA LONGITUD SE DUPLICA, ¿CÓMO CAMBIA EL ÁREA?', correct: 'SE MULTIPLICA POR 4', distractors: ['SE DUPLICA','SE TRIPLICA','SE MULTIPLICA POR 8'], hints: ['Área escala con factor²','Factor=2','2²'], solution: 'Se multiplica por 4', explanation: 'k=2 → área×4' },
    { q: 'PERÍMETRO DE HEXÁGONO REGULAR LADO 7', correct: '42', distractors: ['36','49','28'], hints: ['Perímetro=6×lado','6×7','Calcula'], solution: '42', explanation: '6×7=42' },
    { q: 'ALTURA DE TRIÁNGULO EQUILÁTERO LADO 6', correct: '≈5.2', distractors: ['≈4.5','≈6.0','≈3.0'], hints: ['h= (√3/2)·lado','√3≈1.732','(1.732/2)×6≈5.196'], solution: '≈5.2', explanation: 'h≈5.20' },
    { q: 'ÁREA DE TRIÁNGULO EQUILÁTERO LADO 6', correct: '≈15.6', distractors: ['≈12.0','≈18.0','≈20.8'], hints: ['Área= (√3/4)·lado²','6²=36','(1.732/4)×36≈15.59'], solution: '≈15.6', explanation: '(√3/4)·36≈15.6' },
    { q: 'RADIO SI LA CIRCUNFERENCIA ES ≈31.4 (π≈3.14)', correct: '5', distractors: ['10','3','6'], hints: ['C=2πr','Despeja r=C/(2π)','31.4/(2×3.14)'], solution: '5', explanation: 'r≈31.4/6.28≈5' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  return { basico, intermedio, avanzado };
}

function shuffle(arr){return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(p=>p[1]);}

// Exercises
const ALG_SET = buildAlgebraExercises();
const LOGIC_SET = buildLogicExercises();
const GEOM_SET = buildGeometryExercises();
// Build Aritmética exercises (25 total: 8 básico, 8 medio, 9 avanzado)
function buildArithmeticExercises() {
  const basico = [
    { q: 'CALCULA: 15 + 28', correct: '43', distractors: ['33','53','41'], hints: ['Suma decenas','Suma unidades','Une resultados'], solution: '43', explanation: '15 + 28 = 43' },
    { q: 'CALCULA: 45 - 17', correct: '28', distractors: ['32','38','22'], hints: ['Resta unidades','Resta decenas','Verifica'], solution: '28', explanation: '45 - 17 = 28' },
    { q: 'CALCULA: 6 × 7', correct: '42', distractors: ['36','48','49'], hints: ['Multiplica 6 por 7','Recuerda tablas','Verifica'], solution: '42', explanation: '6 × 7 = 42' },
    { q: 'CALCULA: 84 ÷ 4', correct: '21', distractors: ['20','22','24'], hints: ['Divide 84 entre 4','Verifica con multiplicación'], solution: '21', explanation: '84 ÷ 4 = 21' },
    { q: 'CALCULA: 3² + 4²', correct: '25', distractors: ['12','13','49'], hints: ['Calcula 3² = 9','Calcula 4² = 16','Suma: 9 + 16'], solution: '25', explanation: '3² + 4² = 9 + 16 = 25' },
    { q: 'CALCULA: 2³', correct: '8', distractors: ['6','9','16'], hints: ['2³ = 2 × 2 × 2','Multiplica paso a paso'], solution: '8', explanation: '2³ = 2 × 2 × 2 = 8' },
    { q: 'CALCULA: 15% de 200', correct: '30', distractors: ['25','35','40'], hints: ['15% = 0.15','Multiplica 200 × 0.15'], solution: '30', explanation: '15% de 200 = 0.15 × 200 = 30' },
    { q: 'CALCULA: 1/4 + 1/2', correct: '3/4', distractors: ['1/6','2/6','1/3'], hints: ['Busca denominador común','1/2 = 2/4','Suma: 1/4 + 2/4'], solution: '3/4', explanation: '1/4 + 1/2 = 1/4 + 2/4 = 3/4' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  const intermedio = [
    { q: 'HALLA EL 20% DE 250', correct: '50', distractors: ['40','60','100'], hints: ['Convierte 20% a fracción','20% = 1/5','250 ÷ 5'], solution: '50', explanation: '20% = 1/5 → 250 ÷ 5 = 50' },
    { q: 'MCM DE 6 Y 8', correct: '24', distractors: ['12','18','48'], hints: ['Múltiplos de 6: 6,12,18,24...','Múltiplos de 8: 8,16,24...','Primer común: 24'], solution: '24', explanation: 'MCM(6,8) = 24' },
    { q: 'MCD DE 12 Y 18', correct: '6', distractors: ['3','4','9'], hints: ['Divisores de 12: 1,2,3,4,6,12','Divisores de 18: 1,2,3,6,9,18','Mayor común: 6'], solution: '6', explanation: 'MCD(12,18) = 6' },
    { q: 'CONVIERTE 0.75 A FRACCIÓN', correct: '3/4', distractors: ['1/4','1/2','2/3'], hints: ['0.75 = 75/100','Simplifica dividiendo entre 25'], solution: '3/4', explanation: '0.75 = 75/100 = 3/4' },
    { q: 'CALCULA: 2.5 × 4.2', correct: '10.5', distractors: ['8.7','9.5','11.2'], hints: ['Multiplica 25 × 42 = 1050','Cuenta decimales: 1+1=2','1050 → 10.5'], solution: '10.5', explanation: '2.5 × 4.2 = 10.5' },
    { q: 'CALCULA: 3/4 DE 80', correct: '60', distractors: ['50','70','90'], hints: ['3/4 de 80','Multiplica 80 × 3/4','80 × 3 ÷ 4'], solution: '60', explanation: '3/4 de 80 = 80 × 3/4 = 60' },
    { q: '¿CUÁL ES PRIMO?', correct: '31', distractors: ['21','27','33'], hints: ['21 = 3×7 (no primo)','27 = 3×9 (no primo)','31 solo divisible por 1 y 31'], solution: '31', explanation: '31 es primo (solo divisible por 1 y 31)' },
    { q: 'CALCULA: 5² - 3²', correct: '16', distractors: ['4','8','34'], hints: ['5² = 25','3² = 9','25 - 9'], solution: '16', explanation: '5² - 3² = 25 - 9 = 16' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  const avanzado = [
    { q: 'RESUELVE: √144', correct: '12', distractors: ['10','14','16'], hints: ['Identifica la raíz cuadrada','Recuerda 12×12','Aplica'], solution: '12', explanation: '√144 = 12' },
    { q: 'RESUELVE: √169', correct: '13', distractors: ['11','15','17'], hints: ['Busca número que al cuadrado dé 169','13×13 = 169'], solution: '13', explanation: '√169 = 13' },
    { q: 'CALCULA: 2⁴', correct: '16', distractors: ['8','12','32'], hints: ['2⁴ = 2×2×2×2','Multiplica paso a paso'], solution: '16', explanation: '2⁴ = 2×2×2×2 = 16' },
    { q: 'CALCULA: 3³', correct: '27', distractors: ['9','18','81'], hints: ['3³ = 3×3×3','Multiplica paso a paso'], solution: '27', explanation: '3³ = 3×3×3 = 27' },
    { q: 'RESUELVE: 2X + 5 = 17', correct: '6', distractors: ['5','7','8'], hints: ['Resta 5 a ambos lados','2X = 12','Divide entre 2'], solution: '6', explanation: '2X + 5 = 17 → 2X = 12 → X = 6' },
    { q: 'CALCULA: 15% DE 300', correct: '45', distractors: ['30','50','60'], hints: ['15% = 0.15','Multiplica 300 × 0.15'], solution: '45', explanation: '15% de 300 = 0.15 × 300 = 45' },
    { q: 'MCM DE 4, 6 Y 8', correct: '24', distractors: ['12','16','48'], hints: ['Múltiplos de 4: 4,8,12,16,20,24...','Múltiplos de 6: 6,12,18,24...','Múltiplos de 8: 8,16,24...'], solution: '24', explanation: 'MCM(4,6,8) = 24' },
    { q: 'CALCULA: 1/3 + 1/6', correct: '1/2', distractors: ['1/9','2/9','1/4'], hints: ['Busca denominador común','1/3 = 2/6','Suma: 2/6 + 1/6'], solution: '1/2', explanation: '1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2' },
    { q: 'RESUELVE: 3X - 7 = 14', correct: '7', distractors: ['5','6','8'], hints: ['Suma 7 a ambos lados','3X = 21','Divide entre 3'], solution: '7', explanation: '3X - 7 = 14 → 3X = 21 → X = 7' }
  ].map(m => { const options = shuffle([m.correct, ...m.distractors]); return { q: m.q, options, correctIndex: options.indexOf(m.correct), hints: m.hints, solution: m.solution, explanation: m.explanation }; });

  return { basico, intermedio, avanzado };
}

const ARITH_SET = buildArithmeticExercises();
const EXERCISES = { algebra: ALG_SET, aritmetica: ARITH_SET, geometria: GEOM_SET, logica: LOGIC_SET };

function renderExercises() {
  const current = JSON.parse(sessionStorage.getItem('current_lesson') || 'null'); const fallback = { branchId: 'aritmetica', level: 'basico' }; const ctx = current || fallback; const lesson = EXERCISES[ctx.branchId][ctx.level];
  const idx = Number(new URLSearchParams(location.hash.split('?')[1]).get('i') || 0); if (idx >= lesson.length) return renderExerciseSummary(ctx);
  const q = lesson[idx];

  const options = q.options.map((opt, i) => h('button', { class: 'option', type: 'button', onclick: () => onAnswerExercise(ctx, idx, i) }, [opt]));
  const info = BRANCHES.find(b => b.id === ctx.branchId);

  const hintBox = h('div', { class: 'hints' });
  const feedback = h('div', { class: 'feedback', id: 'feedback' });
  let hintsShown = 0;

  let solutionUsed = false;
  const solutionBtn = h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => {
    if (solutionUsed) return; solutionUsed = true; solutionBtn.setAttribute('disabled','true');
    const sol = q.solution || '(no disponible)'; const exp = q.explanation || '';
    const p = h('div', {}, ['Solución: ', sol, exp ? ' — ' + exp : '']); hintBox.appendChild(p);
  } }, ['Mostrar solución']);

  const actions = h('div', { class: 'quiz-actions' }, [
    h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => {
      const hints = q.hints || []; if (hintsShown < Math.min(3, hints.length)) { const p = h('div', {}, ['Pista ', String(hintsShown + 1), ': ', hints[hintsShown]]); hintBox.appendChild(p); hintsShown += 1; }
    } }, ['Pedir pista']),
    solutionBtn
  ]);

  const content = h('div', { class: 'quiz card' }, [
    h('div', { class: 'view-subtitle' }, [`${info.name} · ${ctx.level.toUpperCase()}`]),
    h('h3', {}, [`${idx + 1}) `, String(q.q).toUpperCase()]),
    h('div', { class: 'options' }, options),
    actions,
    hintBox,
    feedback
  ]);
  setView('Ejercicios', 'Ratium te acompaña. Puedes pedir pistas o solución.', content);
}

function onAnswerExercise(ctx, idx, answerIndex) {
  const lesson = EXERCISES[ctx.branchId][ctx.level]; const q = lesson[idx]; const correct = q.correctIndex === answerIndex; const key = `${ctx.branchId}:${ctx.level}:${idx}`; state.progress[ctx.branchId].completed[key] = correct ? 'correct' : 'wrong'; saveState(state);
  const optionEls = Array.from(document.querySelectorAll('.option')); optionEls.forEach((el, i) => { if (i === q.correctIndex) el.classList.add('correct'); if (i === answerIndex && !correct) el.classList.add('wrong'); el.setAttribute('disabled', 'true'); });
  const fb = document.getElementById('feedback'); fb.className = 'feedback ' + (correct ? 'correct' : 'wrong'); fb.textContent = correct ? '¡CORRECTO!' : 'INCORRECTO. REVISA LA SOLUCIÓN O PIDE PISTAS.';
  const next = idx + 1; const nextBtn = document.createElement('button'); nextBtn.className = 'btn btn-primary'; nextBtn.textContent = next < lesson.length ? 'Siguiente' : 'Finalizar'; nextBtn.onclick = () => { if (next < lesson.length) { location.hash = `#/ejercicios?i=${next}`; } else { const correctCount = Object.keys(state.progress[ctx.branchId].completed).filter(k => k.startsWith(`${ctx.branchId}:${ctx.level}:`) && state.progress[ctx.branchId].completed[k] === 'correct').length; if (correctCount >= 1) { if (ctx.level === 'basico') state.progress[ctx.branchId].intermedio = 'unlocked'; if (ctx.level === 'intermedio') state.progress[ctx.branchId].avanzado = 'unlocked'; saveState(state); } renderExerciseSummary(ctx); } };
  document.querySelector('.quiz-actions')?.appendChild(nextBtn);
}

function renderExerciseSummary(ctx) { const info = BRANCHES.find(b => b.id === ctx.branchId); const content = h('div', { class: 'card' }, [ h('p', {}, [`Sesión completada en ${info.name} · ${ctx.level.toUpperCase()}.`]), h('div', { class: 'form-actions' }, [ h('a', { href: '#/mapa', class: 'btn btn-primary' }, ['Volver al mapa']), h('button', { class: 'btn btn-secondary', onclick: () => { sessionStorage.removeItem('current_lesson'); navigate('/ejercicios'); } }, ['Practicar otra']) ]) ]); setView('Resumen', 'Revisa tu progreso y continúa.', content); }

// Profile
function renderProfile() { const byBranch = {}; for (const b of BRANCHES) { const comp = state.progress[b.id].completed; byBranch[b.id] = { correct: 0, total: 0 }; for (const k in comp) { if (k.startsWith(b.id + ':')) { byBranch[b.id].total += 1; if (comp[k] === 'correct') byBranch[b.id].correct += 1; } } } const strongest = Object.entries(byBranch).sort((a,b)=> (b[1].correct)-(a[1].correct))[0]?.[0] || BRANCHES[0].id; const weakest = Object.entries(byBranch).sort((a,b)=> (a[1].correct)-(b[1].correct))[0]?.[0] || BRANCHES[0].id; const strongName = BRANCHES.find(b=>b.id===strongest).name; const weakName = BRANCHES.find(b=>b.id===weakest).name; const content = h('div', { class: 'card' }, [ h('div', {}, [`Nombre: ${state.user.name || '—'}`]), h('div', {}, [`Edad: ${state.user.age || '—'}`]), h('div', {}, [`Racha diaria: ${state.streak} días`]), h('div', {}, [`Tiempo practicado: ${state.totalPracticeMinutes} min`]), h('div', {}, [`Rama más fuerte: ${strongName}`]), h('div', {}, [`Rama más débil: ${weakName}`]), h('div', { class: 'form-actions' }, [ h('a', { href: '#/mapa', class: 'btn btn-primary' }, ['Iniciar lección']) ]) ]); setView('Perfil del Usuario', 'Datos y progreso general', content); }

// Chat elements
const chatToggle = document.getElementById('chat-toggle');
const chatPanel = document.getElementById('chat-panel');
const chatClose = document.getElementById('chat-close');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
function pushMsg(who, text) { const msg = h('div', { class: 'msg ' + (who === 'Tú' ? 'user' : 'bot') }, [ h('div', { class: 'who' }, [who]), h('div', { class: 'bubble' }, [text]) ]); chatMessages.appendChild(msg); chatMessages.scrollTop = chatMessages.scrollHeight; }
function ratiumRespond(userText) { const lc = userText.toLowerCase(); if (lc.includes('pista') || lc.includes('ayuda')) return 'Puedo darte hasta 3 pistas por ejercicio. Dime qué parte te confunde.'; if (lc.includes('diagnost')) return 'La prueba diagnóstica ajusta tus niveles iniciales según tus puntos obtenidos (0–9).'; if (lc.includes('mapa') || lc.includes('progreso')) return 'En el mapa verás tus ramas y niveles desbloqueados. Completa niveles para avanzar.'; if (lc.includes('sabias') || lc.includes('sabías') || lc.includes('dato')) return randomFact().text; return null; }

async function callAI(userText) {
  const resp = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userText, user: state.user }) });
  let data;
  try { data = await resp.json(); } catch { data = {}; }
  if (!resp.ok) throw new Error(data?.detail || data?.error || 'AI error');
  return data.reply || 'No obtuve respuesta.';
}

// Chat form submission
if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (chatInput.value || '').trim();
    if (!text) return;
    pushMsg('Tú', text);
    chatInput.value = '';
    const canned = ratiumRespond(text);
    if (canned) { setTimeout(() => pushMsg('Ratium', canned), 200); return; }
    pushMsg('Ratium', 'Pensando…');
    const last = chatMessages.lastChild;
    try {
      const reply = await callAI(text);
      last.querySelector('.bubble').textContent = reply;
    } catch (err) {
      last.querySelector('.bubble').textContent = 'Ocurrió un error con la IA. Intenta de nuevo más tarde.';
    }
  });
}

// Boot
router(); if (!location.hash) navigate('/');

// CHAT SYSTEM - DIRECT APPROACH
function initChat() {
  console.log('Initializing chat...');
  
  const chatPanel = document.getElementById('chat-panel');
  const chatToggle = document.getElementById('chat-toggle');
  const chatClose = document.getElementById('chat-close');
  
  console.log('Chat elements found:', {
    panel: !!chatPanel,
    toggle: !!chatToggle,
    close: !!chatClose
  });
  
  // Force close chat on load
  if (chatPanel) {
    chatPanel.style.display = 'none';
    console.log('Chat panel hidden');
  }
  
  // Toggle button
  if (chatToggle) {
    chatToggle.onclick = function(e) {
      e.preventDefault();
      console.log('Toggle clicked');
      if (chatPanel) {
        if (chatPanel.style.display === 'none') {
          chatPanel.style.display = 'block';
          console.log('Chat opened');
          document.getElementById('chat-input')?.focus();
        } else {
          chatPanel.style.display = 'none';
          console.log('Chat closed');
        }
      }
    };
  }
  
  // Close button
  if (chatClose) {
    chatClose.onclick = function(e) {
      e.preventDefault();
      console.log('Close button clicked');
      if (chatPanel) {
        chatPanel.style.display = 'none';
        console.log('Chat closed via X button');
      }
    };
  }
}

// Initialize immediately and on load
initChat();
window.addEventListener('load', initChat);

