const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/app.js', 'utf8').replace(/\binit\(\);\s*$/, '');
const fields = {};
const localStorage = { pbLang: 'fa', pbHistory: '', setItem(k, v) { this[k] = v; }, removeItem(k) { delete this[k]; } };
const document = {
  documentElement: {},
  body: {},
  getElementById(id) { return { value: fields[id] ?? '' }; },
  querySelector(selector) {
    const key = selector.startsWith('#') ? selector.slice(1) : selector;
    return { value: fields[key] ?? '', selectedOptions: [{ text: 'بدون پیشوند' }] };
  },
};
const context = vm.createContext({ localStorage, document, console });
vm.runInContext(source, context);
const run = (expression) => vm.runInContext(expression, context);
let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
}

test('safe expression parser handles precedence, radicals, and trigonometry', () => {
  assert.equal(run("evaluate('2+3*4')"), '14');
  assert.equal(run("evaluate('-2^2')"), '-4');
  assert.equal(run("evaluate('2^-2')"), '0.25');
  assert.equal(run("evaluate('sin(30)+5!')"), '120.5');
  assert.equal(run("evaluate('√2')"), '1.414213562');
  assert.equal(run("evaluate('2√5')"), '4.472135955');
  assert.equal(run("evaluate('2رادیکال5')"), '4.472135955');
  assert.equal(run("evaluate('2(3+4)')"), '14');
  assert.equal(run("evaluate('∛(-8)')"), '-2');
  assert.equal(run("evaluate('asin(0.5)+acos(0.5)+atan(1)')"), '135');
  assert.equal(run("evaluate('cot(45)+sec(60)+csc(30)')"), '5');
  assert.equal(run("evaluate('۲+۳×۴')"), '14');
  assert.equal(run("asciiNumerals('۱٫۵')"), '1.5');
});

test('invalid and non-finite expressions are rejected', () => {
  assert.throws(() => run("evaluate('1/0')"));
  assert.throws(() => run("evaluate('sqrt(-1)')"));
  assert.throws(() => run("evaluate('2+unknown(4)')"));
});

test('linear equations and school-level inequality boundaries', () => {
  assert.equal(run("solveLinearInequality(-2,4,0,'lt').text"), 'S = (2, ∞)');
  assert.equal(run("solveLinearInequality(2,3,11,'le').text"), 'S = (−∞, 4]');
  assert.equal(run("solveLinearInequality(0,2,1,'lt').text"), 'مجموعهٔ تهی');
  assert.equal(run("solveLinearInequality(0,1,2,'lt').text"), 'همهٔ اعداد حقیقی');
});

test('quadratic inequalities handle two, repeated, and missing roots', () => {
  assert.equal(run("solveQuadraticInequality(1,0,-1,'gt').text"), 'S = (−∞, -1) ∪ (1, ∞)');
  assert.equal(run("solveQuadraticInequality(1,0,-1,'le').text"), 'S = [-1, 1]');
  assert.equal(run("solveQuadraticInequality(1,0,0,'le').text"), 'S = {0}');
  assert.equal(run("solveQuadraticInequality(1,0,1,'lt').text"), 'مجموعهٔ تهی');
  assert.equal(run("solveQuadraticInequality(-1,0,1,'ge').text"), 'S = [-1, 1]');
});

test('unit conversions preserve dimensions and final-answer output', () => {
  assert.equal(run("convert(2000,'m','cm')"), 200000);
  assert.equal(run("convert(32,'°F','°C')"), 0);
  const menu = run("outputFormatMarkup()");
  assert.match(menu, /scientific/);
  assert.equal((menu.match(/data-format=/g) || []).length, 3);
  assert.throws(() => run("convert(1,'m','g')"));
});

test('formula parsing, molar mass, and reaction balancing work', () => {
  assert.equal(run("parseFormula('Al2(SO4)3').atoms.O"), 12);
  assert.ok(Math.abs(run("parseFormula('Al2(SO4)3').mass") - 342.131076) < 1e-6);
  assert.equal(run("balance('H2 + O2 -> H2O').text"), '2H2 + O2 → 2H2O');
  assert.equal(run("balance('2H2 + O2 -> 2H2O').text"), '2H2 + O2 → 2H2O');
  assert.equal(run("balance('Al + O2 -> Al2O3').text"), '4Al + 3O2 → 2Al2O3');
  assert.match(run('atomicForm()'), /<textarea id="isotopes"/);
  assert.match(run('stoichForm()'), /<textarea id="reactants"/);
});

test('stoichiometry accepts coefficient-prefixed reactions and returns final product mass', () => {
  fields.equation = '2H2 + O2 -> 2H2O';
  fields.reactants = 'H2, 4\nO2, 16';
  fields.product = 'H2O';
  let output = '';
  const form = { id: 'stoich', querySelector() { return { set innerHTML(value) { output = value; } }; } };
  run('solve')(form);
  assert.match(output, /18\.016/);
  assert.match(output, /g H2O/);
  assert.doesNotMatch(output, /O2|محدودکننده|نظری/);
});

test('inequality form calculates and displays its answer', () => {
  fields.a = '2'; fields.b = '3'; fields.c = '11'; fields.ineqMode = 'linear'; fields.relation = 'le';
  let output = '';
  const form = { id: 'inequality', querySelector() { return { set innerHTML(value) { output = value; } }; } };
  run('solve')(form);
  assert.match(output, /S = \(−∞, 4\]/);
  assert.match(output, /قالب پاسخ/);
});

test('two-variable system displays only the final answer', () => {
  fields.r1 = '2,1,5';
  fields.r2 = '1,-1,1';
  let output = '';
  const form = { id: 'system', querySelector() { return { set innerHTML(value) { output = value; } }; } };
  run('solve')(form);
  assert.match(output, /x = 2/);
  assert.match(output, /y = 1/);
  assert.match(output, /قالب پاسخ/);
  assert.doesNotMatch(output, /بررسی در معادله‌ها|روش حذف|جایگذاری/);
});

test('answer formats convert final numeric values only', () => {
  assert.equal(run("formatResult('x = 1.5, y = -2','fraction')"), 'x = 3/2, y = -2');
  assert.equal(run("formatResult('x = 1.5','integer')"), 'x = 1.5');
  assert.equal(run("formatResult('x = 2','integer')"), 'x = 2');
  assert.match(run("renderAnswerValue('0.5','fraction')"), /<span>1<\/span><span>2<\/span>/);
  assert.match(run("renderAnswerValue('≈ 4.472135955','fraction')"), /≈ <span class="answer-fraction"/);
  assert.match(run("formatResult('x = 1.414213562','scientific')"), /≈ 1\.414 × 10/);
  assert.match(run("formatResult('x = 1.414213562','fraction')"), /≈ \d+\/\d+/);
  const menu = run("outputFormatMarkup()");
  assert.match(menu, /scientific/);
  assert.equal((menu.match(/data-format=/g) || []).length, 3);
  const formatted = run(`(()=>{const value={textContent:'',innerHTML:''},mk=n=>({dataset:{format:n},disabled:false,classList:{contains(){return false},toggle(){} }}),buttons=['scientific','integer','fraction'].map(mk),nodeList={length:buttons.length,forEach(fn){buttons.forEach(fn)},*[Symbol.iterator](){yield*buttons}},root={querySelectorAll(){return nodeList},querySelector(){return value}};bindOutputFormat(root,'1.2');buttons[2].onclick();return {disabled:buttons[1].disabled,value:value.innerHTML}})()`);
  assert.equal(formatted.disabled, true);
  assert.match(formatted.value, /answer-fraction/);
  assert.match(formatted.value, /<span>6<\/span><span>5<\/span>/);
});

test('linear function table does not require the quadratic coefficient', () => {
  fields.type = 'linearFn'; fields.a = '2'; fields.b = '1'; fields.c = ''; fields.range = '0,2';
  let output = '';
  const form = { id: 'graph', querySelector() { return { set innerHTML(value) { output = value; } }; } };
  run('solve')(form);
  assert.match(output, /0: 1 · 1: 3 · 2: 5/);
});

test('geometry validates required values and triangle side lengths', () => {
  let output = '';
  const form = { id: 'area', querySelector() { return { set innerHTML(value) { output = value; } }; } };
  fields.shape = 'rectangle'; fields.length = '3'; fields.width = '4';
  run('solve')(form);
  assert.match(output, /12/);
  fields.shape = 'triangle'; fields.base = '2'; fields.height = '3'; fields.sideA = '1'; fields.sideB = '1';
  run('solve')(form);
  assert.match(output, /نامساوی مثلث/);
  fields.length = '';
  assert.throws(() => run("num('length')"));
});

test('English labels exist and every form receives a submit handler', () => {
  assert.equal(run("T.en.atomicDesc"), 'Calculate from isotope abundances');
  assert.equal(source.includes("$$('form').forEach"), true);
  assert.equal(/(?<!\$)\$\('[^']*'\)\.forEach/.test(source), false);
  assert.equal(run("tools.some(t=>t[0]==='inequality')"), true);
  assert.match(run('areaForm()'), /id="circleFields" hidden/);
});

test('the dashboard initializes with a minimal browser DOM', () => {
  const elements = new Map();
  const element = () => ({
    innerHTML: '', textContent: '', value: '', placeholder: '', onclick: null,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    querySelectorAll() { return []; }, addEventListener() {},
  });
  const bootDocument = {
    documentElement: {}, body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    querySelector(selector) { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); },
    querySelectorAll() { return []; },
  };
  const bootContext = vm.createContext({ localStorage: { pbLang: 'fa', pbHistory: '' }, document: bootDocument, console });
  vm.runInContext(fs.readFileSync('assets/js/app.js', 'utf8'), bootContext);
  assert.match(elements.get('#content').innerHTML, /به PhysBox خوش آمدید/);
});

console.log(`${passed} calculation checks passed.`);
