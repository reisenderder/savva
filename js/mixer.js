/* =========================================================================
   SAVVA COFFEE — конструктор напитка

   Три ползунка задают сборку: сколько эспрессо или матчи, сколько молока,
   сколько льда. Стакан рядом наполняется слоями, а под ним называется
   ближайшая позиция настоящего меню.
   ========================================================================= */

(function () {
  'use strict';

  var root = document.getElementById('mixer');
  if (!root || !window.SAVVA || typeof MENU === 'undefined') return;

  var S = window.SAVVA;

  var SHOT_ML = 30;      // порция эспрессо
  var SCOOP_ML = 20;     // ложка матчи, разведённая водой
  var CUBE_ML = 18;      // кубик льда
  var MILK_KCAL = 0.64;  // на миллилитр
  var SHOT_KCAL = 2;
  var SCOOP_KCAL = 3;
  var SHOT_MG = 63;      // кофеин в порции эспрессо
  var SCOOP_MG = 35;     // кофеин в ложке матчи
  var GLASS_ML = 360;    // при этом объёме стакан полон

  var RECIPES = [
    { id: 'espresso',            base: 'coffee', shots: 1, milk: 0,   ice: 0 },
    { id: 'americano',           base: 'coffee', shots: 2, milk: 0,   ice: 0 },
    { id: 'iced-americano',      base: 'coffee', shots: 2, milk: 0,   ice: 4 },
    { id: 'macchiato',           base: 'coffee', shots: 1, milk: 20,  ice: 0 },
    { id: 'cortado',             base: 'coffee', shots: 1, milk: 60,  ice: 0 },
    { id: 'flat-white',          base: 'coffee', shots: 2, milk: 120, ice: 0 },
    { id: 'cappuccino',          base: 'coffee', shots: 1, milk: 140, ice: 0 },
    { id: 'latte',               base: 'coffee', shots: 1, milk: 200, ice: 0 },
    { id: 'spanish-latte',       base: 'coffee', shots: 2, milk: 220, ice: 0 },
    { id: 'white-mocha',         base: 'coffee', shots: 2, milk: 180, ice: 0 },
    { id: 'turkish',             base: 'coffee', shots: 3, milk: 0,   ice: 0 },
    { id: 'turkish-milk',        base: 'coffee', shots: 3, milk: 60,  ice: 0 },
    { id: 'iced-latte',          base: 'coffee', shots: 1, milk: 180, ice: 4 },
    { id: 'iced-spanish-latte',  base: 'coffee', shots: 2, milk: 200, ice: 4 },
    { id: 'ice-white-mocha',     base: 'coffee', shots: 2, milk: 160, ice: 4 },
    { id: 'ice-shaken',          base: 'coffee', shots: 3, milk: 80,  ice: 5 },
    { id: 'alfredo',             base: 'coffee', shots: 2, milk: 100, ice: 3 },
    { id: 'ice-chocolate',       base: 'coffee', shots: 0, milk: 200, ice: 4 },
    { id: 'hot-chocolate',       base: 'coffee', shots: 0, milk: 220, ice: 0 },
    { id: 'english-tea',         base: 'coffee', shots: 0, milk: 0,   ice: 0 },
    { id: 'matcha-latte',        base: 'matcha', shots: 1, milk: 200, ice: 0 },
    { id: 'iced-matcha-latte',   base: 'matcha', shots: 1, milk: 180, ice: 4 },
    { id: 'savva-matcha',        base: 'matcha', shots: 1, milk: 0,   ice: 4 },
    { id: 'iced-matcha-spanish', base: 'matcha', shots: 2, milk: 200, ice: 4 },
    { id: 'matcha-berry',        base: 'matcha', shots: 2, milk: 140, ice: 4 }
  ];

  var MATCH_LIMIT = 2.0;

  var baseBox = document.getElementById('mxBase');
  var shots = document.getElementById('mxShots');
  var milk = document.getElementById('mxMilk');
  var ice = document.getElementById('mxIce');
  var shotsOut = document.getElementById('mxShotsOut');
  var milkOut = document.getElementById('mxMilkOut');
  var iceOut = document.getElementById('mxIceOut');
  var shotsLabel = document.getElementById('mxShotsLabel');
  var baseFill = document.getElementById('mxBaseFill');
  var milkFill = document.getElementById('mxMilkFill');
  var foamFill = document.getElementById('mxFoamFill');
  var wavePath = document.getElementById('mxWave');
  var steamGroup = document.getElementById('mxSteamGroup');
  var pourStream = document.getElementById('mxPourStream');
  var glassBox = document.getElementById('mxGlassBox');
  var iceBox = document.getElementById('mxIceBox');
  var strengthOut = document.getElementById('mxStrength');
  var kcalOut = document.getElementById('mxKcal');
  var match = document.getElementById('mxMatch');
  var matchName = match.querySelector('.mixer__matchName');
  var matchMeta = match.querySelector('.mixer__matchMeta');
  var matchLabel = match.querySelector('.mixer__matchLabel');

  var state = { base: 'coffee', shots: 1, milk: 120, ice: 0 };
  var found = null;
  var pourTimer = null;

  var STORE = 'savva.mix';

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE));
      if (!raw) return;
      if (raw.base === 'coffee' || raw.base === 'matcha') state.base = raw.base;
      state.shots = clamp(+raw.shots || 0, 0, 3);
      state.milk = clamp(Math.round((+raw.milk || 0) / 20) * 20, 0, 240);
      state.ice = clamp(+raw.ice || 0, 0, 6);
    } catch (e) { /* default */ }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var FLOOR = 252;
  var MAX_H = 206;

  var CUBES = [
    [-34, 4, 12], [6, 0, -9], [44, 8, 18],
    [-14, 28, -16], [26, 30, 7], [-42, 34, -4]
  ];

  function triggerPour() {
    if (pourStream && glassBox) {
      pourStream.classList.add('is-active');
      glassBox.classList.add('is-pouring');
      clearTimeout(pourTimer);
      pourTimer = setTimeout(function () {
        pourStream.classList.remove('is-active');
        glassBox.classList.remove('is-pouring');
      }, 450);
    }
  }

  function drawGlass() {
    var liquid = state.base === 'matcha' ? state.shots * SCOOP_ML : state.shots * SHOT_ML;
    var total = liquid + state.milk;
    var vol = total + state.ice * CUBE_ML;
    var fill = total === 0 ? 0 : Math.min(1, vol / GLASS_ML) * MAX_H;

    var baseH = total === 0 ? 0 : fill * (liquid / total);
    var milkH = fill - baseH;
    var foamH = (total > 0 && state.shots > 0) ? (state.base === 'matcha' ? 10 : 7) : 0;

    // Base fill
    baseFill.setAttribute('y', String(FLOOR - baseH));
    baseFill.setAttribute('height', baseH.toFixed(1));
    baseFill.setAttribute('fill', state.base === 'matcha' ? 'url(#mxGradMatcha)' : 'url(#mxGradCoffee)');

    // Milk fill
    milkFill.setAttribute('y', String(FLOOR - baseH - milkH));
    milkFill.setAttribute('height', milkH.toFixed(1));
    milkFill.setAttribute('fill', 'url(#mxGradMilk)');

    // Foam layer
    if (foamFill) {
      var foamY = FLOOR - baseH - milkH - foamH;
      foamFill.setAttribute('y', String(foamY));
      foamFill.setAttribute('height', foamH.toFixed(1));
      foamFill.setAttribute('fill', state.base === 'matcha' ? 'url(#mxGradMatchaFoam)' : 'url(#mxGradCrema)');
    }

    // Surface Wave
    if (wavePath) {
      var topY = FLOOR - fill - foamH;
      if (fill > 0) {
        wavePath.setAttribute('d', 'M 20 ' + topY.toFixed(1) + ' Q 60 ' + (topY - 3).toFixed(1) + ', 100 ' + topY.toFixed(1) + ' T 180 ' + topY.toFixed(1) + ' L 180 ' + (topY + 14).toFixed(1) + ' L 20 ' + (topY + 14).toFixed(1) + ' Z');
        wavePath.setAttribute('fill', state.base === 'matcha' ? 'url(#mxGradMatchaFoam)' : (state.shots > 0 ? 'url(#mxGradCrema)' : 'url(#mxGradMilk)'));
        wavePath.style.display = 'block';
      } else {
        wavePath.style.display = 'none';
      }
    }

    // Steam
    if (steamGroup) {
      if (state.shots > 0 && state.ice === 0) {
        steamGroup.classList.add('is-active');
      } else {
        steamGroup.classList.remove('is-active');
      }
    }

    // Ice Box
    iceBox.textContent = '';
    var top = FLOOR - fill;
    for (var i = 0; i < state.ice; i++) {
      var c = CUBES[i];
      var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('class', 'mixer__ice mixer__ice--float');
      r.setAttribute('x', String(100 + c[0] - 13));
      r.setAttribute('y', String(top + c[1]));
      r.setAttribute('width', '26');
      r.setAttribute('height', '26');
      r.setAttribute('rx', '4');
      r.setAttribute('transform', 'rotate(' + c[2] + ' ' + (100 + c[0]) + ' ' + (top + c[1] + 13) + ')');
      r.style.animationDelay = (i * 0.25).toFixed(2) + 's';
      iceBox.appendChild(r);
    }
  }

  function kcal() {
    var one = state.base === 'matcha' ? SCOOP_KCAL : SHOT_KCAL;
    return Math.round((state.shots * one + state.milk * MILK_KCAL) / 5) * 5;
  }

  function caffeine() {
    return state.shots * (state.base === 'matcha' ? SCOOP_MG : SHOT_MG);
  }

  function strengthKey() {
    var mg = caffeine();
    if (!mg) return 'none';
    if (mg < 70) return 'mild';
    if (mg < 130) return 'even';
    if (mg < 190) return 'strong';
    return 'very';
  }

  function distance(r) {
    if (r.base !== state.base) return Infinity;
    var ds = Math.abs(r.shots - state.shots);
    var dm = Math.abs(r.milk - state.milk) / 60;
    var di = Math.abs(r.ice - state.ice) * 0.45;
    return ds + dm + di;
  }

  function findMatch() {
    var best = null, bestD = Infinity;
    RECIPES.forEach(function (r) {
      var d = distance(r);
      if (d < bestD) { bestD = d; best = r; }
    });
    if (!best || bestD > MATCH_LIMIT) return null;
    return S.item(best.id);
  }

  function popVal(el) {
    if (!el) return;
    el.classList.remove('is-pop');
    void el.offsetWidth;
    el.classList.add('is-pop');
  }

  function updateSliderFill(input, val, min, max) {
    var pct = ((val - min) / (max - min) * 100).toFixed(1) + '%';
    input.style.setProperty('--pct', pct);
  }

  function render() {
    shotsLabel.textContent = S.t(state.base === 'matcha' ? 'mixer.shots.matcha' : 'mixer.shots');
    matchLabel.textContent = S.t('mixer.match');

    shotsOut.textContent = String(state.shots);
    milkOut.textContent = state.milk + ' ' + S.t('mixer.unit.ml');
    iceOut.textContent = String(state.ice);

    updateSliderFill(shots, state.shots, 0, 3);
    updateSliderFill(milk, state.milk, 0, 240);
    updateSliderFill(ice, state.ice, 0, 6);

    shots.setAttribute('data-base', state.base);

    strengthOut.textContent = S.t('mixer.strength.' + strengthKey());
    kcalOut.textContent = String(kcal());

    baseBox.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.base === state.base));
    });

    found = findMatch();
    if (found) {
      matchName.textContent = found.name[S.lang()];
      matchName.dir = S.lang() === 'ar' ? 'rtl' : 'ltr';
      matchMeta.textContent = found.price + ' ' + S.t('menu.unit.price') + ' · ' +
        (found.cals === null ? '—' : found.cals + ' ' + S.t('menu.unit.cals'));
      match.classList.remove('is-empty');
      match.removeAttribute('aria-disabled');
    } else {
      matchName.textContent = S.t('mixer.matchNone');
      matchName.dir = S.lang() === 'ar' ? 'rtl' : 'ltr';
      matchMeta.textContent = '';
      match.classList.add('is-empty');
      match.setAttribute('aria-disabled', 'true');
    }

    drawGlass();
  }

  function bindRange(input, key, outputEl) {
    input.addEventListener('input', function () {
      state[key] = parseInt(input.value, 10);
      popVal(outputEl);
      triggerPour();
      save();
      render();
    });
  }

  bindRange(shots, 'shots', shotsOut);
  bindRange(milk, 'milk', milkOut);
  bindRange(ice, 'ice', iceOut);

  baseBox.addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-base]');
    if (!b || b.dataset.base === state.base) return;
    state.base = b.dataset.base;
    triggerPour();
    save();
    render();
  });

  match.addEventListener('click', function (ev) {
    ev.preventDefault();
    if (found) S.reveal(found.id);
  });

  document.getElementById('mxReset').addEventListener('click', function () {
    state = { base: 'coffee', shots: 1, milk: 120, ice: 0 };
    push();
    triggerPour();
    save();
    render();
  });

  function push() {
    shots.value = String(state.shots);
    milk.value = String(state.milk);
    ice.value = String(state.ice);
  }

  load();
  push();
  render();
  S.onLang(render);
})();
