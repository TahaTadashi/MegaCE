# PhysBox D10

Lightweight bilingual (Persian/English) scientific calculator for school mathematics, physics, and chemistry across Grades 7–10. The static interface runs in a modern browser; an optional PHP JSON API is included.

## Run locally

1. Copy this folder to `C:\xampp\htdocs\PhysBox-D10`.
2. Start Apache in XAMPP Control Panel.
3. Open `http://localhost/PhysBox-D10/`.

The browser interface does not require PHP, MySQL, Composer, or Node. History is stored locally in the browser. The optional JSON API requires PHP 8.2+.

## Included

- Persian RTL / English LTR, dark/light themes, and responsive layout.
- Engineering calculator with arithmetic, powers, percent, factorial, π/e, square/cube roots, absolute value, trigonometric and inverse trigonometric functions, cot/sec/csc, log and ln. Trigonometric angles use degrees. It also has separate tools for approximate square roots (with selectable decimal precision), sin/cos/tan, powers, and fraction↔decimal conversion. A zero denominator and undefined tangent angles are rejected with a clear message.
- Linear/quadratic equations, inequalities, two-variable systems, geometry, function tables, and unit conversion.
- Dedicated relative-quantity conversion with separate numerator/denominator units and prefixes.
- Density and average speed, plus chemistry tools for average atomic mass, all 118 elements, molar mass of elements and formulas (for example CuSO2), mass/mole/atom/molecule conversions, and neutral subatomic particle counts. Reaction balancing remains available.
- Final-answer-only output. Decimal is the default; three buttons switch numeric answers to scientific, integer/natural, or fraction format. The integer/natural option is available only when the answer is a whole number; it never rounds decimals. Fractions use a horizontal bar, and irrational values are marked as approximate fractions. The calculator accepts implicit multiplication such as `2√5` and `2رادیکال5`.

The exact curriculum coverage depends on school track and book edition. See [docs/curriculum-scope-fa.md](docs/curriculum-scope-fa.md).

## Checks

```powershell
node tests/calculations.test.js
node --check assets/js/app.js
```

PHP endpoint execution requires PHP 8.2+.
