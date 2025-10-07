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

// Build Algebra exercises
function buildAlgebraExercises() { const basico=[]; for (let i=1;i<=20;i++){ if(i%2===1){ const correct='x = 4'; const options=shuffle([correct,'x = 3','x = 5','x = 8']); basico.push({ q:'RESUELVE: 2X + 3 = 11', options, correctIndex: options.indexOf(correct), hints:['Resta 3 a ambos lados','Divide entre 2','Verifica la solución'], solution:'x = 4', explanation:'2x + 3 = 11 → 2x = 8 → x = 4' }); } else { const correct='x = 4'; const options=shuffle([correct,'x = 5','x = 20','x = 2']); basico.push({ q:'RESUELVE: 5X = 20', options, correctIndex: options.indexOf(correct), hints:['Divide ambos lados entre 5','Simplifica','Verifica'], solution:'x = 4', explanation:'5x = 20 → x = 20/5 = 4' }); } } const intermedio=[]; for(let i=21;i<=30;i++){ const correct='x = 6, y = 4'; const options=shuffle([correct,'x = 5, y = 5','x = 8, y = 2','x = 4, y = 6']); intermedio.push({ q:'RESUELVE EL SISTEMA: X + Y = 10, X − Y = 2', options, correctIndex: options.indexOf(correct), hints:['Suma las dos ecuaciones','Halla x','Sustituye para hallar y'], solution:'x = 6, y = 4', explanation:'Sumando: 2x = 12 → x = 6 → y = 4' }); } const avanzado=[]; for(let i=31;i<=40;i++){ const correct='x = 2, x = 3'; const options=shuffle([correct,'x = −2, x = −3','x = 1, x = 6','No tiene solución real']); avanzado.push({ q:'RESUELVE: X² − 5X + 6 = 0', options, correctIndex: options.indexOf(correct), hints:['Usa factorización','Identifica factores','Resuelve'], solution:'x = 2 y x = 3', explanation:'x² − 5x + 6 = (x − 2)(x − 3) = 0' }); } return { basico, intermedio, avanzado }; }

// New: Build Lógica exercises 71–100
function buildLogicExercises() {
  const basico = []; // 71–80: series +2
  for (let i = 71; i <= 80; i++) {
    const correct = '10';
    const options = shuffle([correct, '8', '12', '14']);
    basico.push({
      q: 'SERIE: 2, 4, 6, 8, ¿?',
      options, correctIndex: options.indexOf(correct),
      hints: ['Observa el patrón', 'Se suman 2', 'Aplica'],
      solution: '10',
      explanation: 'La serie aumenta de 2 en 2 → 10'
    });
  }
  const intermedio = []; // 81–90: día de la semana en 10 días desde lunes
  for (let i = 81; i <= 90; i++) {
    const correct = 'Jueves';
    const options = shuffle([correct, 'Martes', 'Miércoles', 'Viernes']);
    intermedio.push({
      q: 'SI HOY ES LUNES, ¿QUÉ DÍA SERÁ EN 10 DÍAS?',
      options, correctIndex: options.indexOf(correct),
      hints: ['Una semana son 7 días', 'Resta 7 a 10', 'Cuenta'],
      solution: 'Jueves',
      explanation: '10 = 7 + 3 → Lunes + 3 = Jueves'
    });
  }
  const avanzado = []; // 91–100: gallinas y conejos
  for (let i = 91; i <= 100; i++) {
    const correct = 'Gallinas=13, Conejos=7';
    const options = shuffle([correct, 'Gallinas=12, Conejos=8', 'Gallinas=10, Conejos=10', 'Gallinas=14, Conejos=6']);
    avanzado.push({
      q: 'HAY 20 CABEZAS Y 54 PATAS ENTRE GALLINAS Y CONEJOS. ¿CUÁNTOS HAY DE CADA UNO?',
      options, correctIndex: options.indexOf(correct),
      hints: ['Cada animal tiene 1 cabeza', 'Gallina=2 patas, Conejo=4 patas', 'Plantea un sistema'],
      solution: 'Gallinas=13, Conejos=7',
      explanation: 'x + y = 20; 2x + 4y = 54 → x = 13, y = 7'
    });
  }
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
const EXERCISES = { algebra: ALG_SET, aritmetica: { basico: [ { q: '12 + 15 = ?', options: ['25','26','27','28'], correctIndex: 2 } ], intermedio: [ { q: 'MCM de 6 y 8', options: ['12','18','24','48'], correctIndex: 2 } ], avanzado: [ { q: '¿Cuál es primo?', options: ['21','27','31','33'], correctIndex: 2 } ] }, geometria: GEOM_SET, logica: LOGIC_SET };

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

// Chat
const chatToggle = document.getElementById('chat-toggle'); const chatPanel = document.getElementById('chat-panel'); const chatClose = document.getElementById('chat-close'); const chatForm = document.getElementById('chat-form'); const chatInput = document.getElementById('chat-input'); const chatMessages = document.getElementById('chat-messages');
function pushMsg(who, text) { const msg = h('div', { class: 'msg ' + (who === 'Tú' ? 'user' : 'bot') }, [ h('div', { class: 'who' }, [who]), h('div', { class: 'bubble' }, [text]) ]); chatMessages.appendChild(msg); chatMessages.scrollTop = chatMessages.scrollHeight; }
function ratiumRespond(userText) { const lc = userText.toLowerCase(); if (lc.includes('pista') || lc.includes('ayuda')) return 'Puedo darte hasta 3 pistas por ejercicio. Dime qué parte te confunde.'; if (lc.includes('diagnost')) return 'La prueba diagnóstica ajusta tus niveles iniciales según tus puntos obtenidos (0–9).'; if (lc.includes('mapa') || lc.includes('progreso')) return 'En el mapa verás tus ramas y niveles desbloqueados. Completa niveles para avanzar.'; if (lc.includes('sabias') || lc.includes('sabías') || lc.includes('dato')) return randomFact().text; return null; }

async function callAI(userText) {
  const resp = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userText, user: state.user }) });
  let data;
  try { data = await resp.json(); } catch { data = {}; }
  if (!resp.ok) throw new Error(data?.detail || data?.error || 'AI error');
  return data.reply || 'No obtuve respuesta.';
}

// Chat event listeners
if (chatToggle) {
  chatToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isHidden = chatPanel.hasAttribute('hidden');
    if (isHidden) {
      chatPanel.removeAttribute('hidden');
      chatInput?.focus();
    } else {
      chatPanel.setAttribute('hidden', '');
    }
  });
}

if (chatClose) {
  chatClose.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    chatPanel.setAttribute('hidden', '');
  });
}
chatForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = (chatInput.value || '').trim();
  if (!text) return;
  pushMsg('Tú', text);
  chatInput.value = '';
  const canned = ratiumRespond(text);
  if (canned) { setTimeout(() => pushMsg('Ratium', canned), 200); return; }
  const thinkingId = Date.now();
  pushMsg('Ratium', 'Pensando…');
  const last = chatMessages.lastChild;
  try {
    const reply = await callAI(text);
    last.querySelector('.bubble').textContent = reply;
  } catch (err) {
    last.querySelector('.bubble').textContent = 'Ocurrió un error con la IA. Intenta de nuevo más tarde.';
  }
});

// Boot
router(); if (!location.hash) navigate('/');

