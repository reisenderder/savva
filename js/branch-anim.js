/* =========================================================================
   SAVVA COFFEE — сквозная кофейная ветка на заднем плане

   Ветка из печатного макета разрезана на одиннадцать частей (раскладка в
   js/branch.js). Каждая часть висит на своей пружине и вращается вокруг
   черешка — той точки, где лист крепится к стеблю и где растение гнётся
   на самом деле. Поэтому линия реза не расходится: края поворачиваются
   вокруг общей точки и остаются прижатыми друг к другу.

   Слой один на всю страницу, стоит на месте экрана при прокрутке и не
   ловит события сам — клик проходит насквозь и достаётся ветке только
   там, где под курсором пустой фон секции, а не текст, картинка или
   кнопка (см. hitsBackground).

   Что двигает ветку:
     ветер     — две несовпадающие синусоиды на каждую часть, поэтому
                 движение не читается как зациклённая анимация;
     указатель — параллакс по глубине плюс лёгкий разворот всей сцены;
     касание   — толчок, который расходится от точки нажатия и затухает.

   Была попытка сделать эту ветку светящейся: части собирались в холст и
   красились градиентом по штриху. Эффект получился, но ценой четырёх
   полноэкранных проходов на каждый кадр, и на слабых машинах страница
   начала дёргаться. Вернулись сюда: движение слоями разметки отдаёт всю
   работу видеокарте и не стоит почти ничего. История в docs/JOURNAL.md,
   запись Э15.

   Ничего не грузится по сети и не требует библиотек.
   ========================================================================= */

(function () {
  'use strict';

  var host = document.getElementById('branchBg');
  if (!host || typeof BRANCH === 'undefined') return;

  var stage = document.createElement('div');
  stage.className = 'branch-bg__stage';
  host.appendChild(stage);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 62rem)');

  /* --- Настройки движения ------------------------------------------------
     Слой виден постоянно и везде, поэтому движение сделано заметно
     спокойнее, чем у прежней ветки в одном блоке: длиннее дыхание, мягче
     пружина, тише отклик на клик. Задача — тихий, очень плавный фон, а не
     заметный эффект. */
  var WIND_DEG = 1.0;      // размах ветра у самой отзывчивой части, градусы
  var WIND_SEC = 9.0;      // основной период дыхания, секунды
  var SPRING = 40;         // жёсткость пружины: чем меньше, тем плавнее ход
  var DAMPING = 7.5;       // затухание: движение гаснет без рывка и без отскока
  var KICK = 55;           // сила толчка от клика, градусов в секунду
  var KICK_REACH = 1.3;    // радиус влияния толчка в ширинах кадра
  var KICK_FALL = 1.6;     // с какой резкостью толчок слабеет с расстоянием
  var WAVE_SEC = 0.16;     // за сколько волна добегает до края ветки
  var TILT_DEG = 2.5;      // разворот всей сцены за указателем
  var PARALLAX = 0.02;     // сдвиг слоёв по глубине за указателем

  var layers = [];
  var clock = 0;
  var scene = { tiltX: 0, tiltY: 0, tTiltX: 0, tTiltY: 0 };

  /* --- Сборка слоёв ------------------------------------------------------ */

  BRANCH.layers.forEach(function (def, i) {
    var el = document.createElement('div');
    el.className = 'branch-bg__layer';
    el.style.left = (def.left * 100) + '%';
    el.style.top = (def.top * 100) + '%';
    el.style.width = (def.width * 100) + '%';
    el.style.height = (def.height * 100) + '%';
    el.style.transformOrigin = (def.pivotX * 100) + '% ' + (def.pivotY * 100) + '%';
    el.style.zIndex = String(100 + Math.round(def.depth));

    el.style.backgroundImage = 'url("assets/branch/' + def.name + '.png")';

    layers.push({
      el: el,
      def: def,
      /* центр части в долях кадра — по нему считается близость к касанию */
      cx: def.left + def.width / 2,
      cy: def.top + def.height / 2,
      phase: i * 1.37,          // несовпадающие фазы, чтобы не качались в такт
      angle: 0, vel: 0
    });
    stage.appendChild(el);
  });

  /* --- Тон под секцией ----------------------------------------------------
     Линия у частей песочная, и на песочном фоне при одной прозрачности на
     весь сайт её почти не видно: разница яркости выходит около двух
     процентов. Поэтому слой получает один из двух классов по фону секции,
     которая сейчас в середине экрана, а разницу отрабатывают стили.
     Проверка идёт раз в треть секунды и стоит одного замера геометрии по
     восьми блокам: ни на кадры, ни на прокрутку это не влияет.

     Порог светлоты взят выше середины не случайно: фирменный --sage-500
     по яркости лежит почти ровно посередине шкалы, и при пороге 0.5
     первый экран попадал бы в светлый набор. Песочные фоны сайта все
     заметно светлее 0.6, поэтому граница их не задевает. */

  var themeAt = 0;

  function bgOf(el) {
    while (el && el !== document.documentElement) {
      var m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor);
      if (m) {
        var p = m[1].split(',').map(parseFloat);
        if (p.length < 4 || p[3] > 0.05) return p;
      }
      el = el.parentElement;
    }
    return [251, 248, 242];
  }

  function pickTone() {
    var cy = window.innerHeight / 2;
    var blocks = document.querySelectorAll('main > section, .footer');
    var hit = null;
    for (var i = 0; i < blocks.length; i++) {
      var r = blocks[i].getBoundingClientRect();
      if (r.top <= cy && r.bottom > cy) hit = blocks[i];
    }
    var p = bgOf(hit || document.body);
    /* Яркость по восприятию: зелёный весит больше красного и синего. */
    var lum = (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
    host.classList.toggle('on-dark', lum < 0.6);
    host.classList.toggle('on-light', lum >= 0.6);
  }

  pickTone();

  /* --- Толчок от касания -------------------------------------------------
     Сила падает с расстоянием от точки нажатия, а знак зависит от того, с
     какой стороны ударили: ветка отклоняется от касания, а не к нему. */

  /* Кадр ветки выше, чем шире, поэтому доли по вертикали приводятся к
     долям по горизонтали. Иначе круг влияния толчка вышел бы овалом. */
  var ASPECT = BRANCH.master.h / BRANCH.master.w;

  /* Толчок не приходит во все части разом: чем дальше часть от точки
     нажатия, тем позже её догоняет волна. Именно задержка превращает
     общий рывок в бегущую по ветке волну. */
  var pending = [];

  function kick(fx, fy) {
    var a = amp();
    layers.forEach(function (L) {
      var dx = L.cx - fx, dy = (L.cy - fy) * ASPECT;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var falloff = Math.max(0, 1 - dist / KICK_REACH);
      if (!falloff) return;
      var side = dx >= 0 ? 1 : -1;   // ветка расходится от касания, а не к нему
      pending.push({
        layer: L,
        at: clock + dist * WAVE_SEC,
        vel: side * KICK * Math.pow(falloff, KICK_FALL) * L.def.sway * a
      });
    });
  }

  function releaseWave() {
    for (var i = pending.length - 1; i >= 0; i--) {
      if (pending[i].at <= clock) {
        pending[i].layer.vel += pending[i].vel;
        pending.splice(i, 1);
      }
    }
  }

  function amp() {
    if (reduced) return 0.25;
    return narrow.matches ? 0.5 : 1;
  }

  /* --- Что считать «пустым фоном» -----------------------------------------
     Слой сам никогда не ловит события (pointer-events: none в CSS), поэтому
     курсор всегда указывает на настоящий элемент страницы. Если это тело
     документа, <main> или сама секция — под курсором пусто, и клик может
     достаться ветке. Если это что угодно внутри .page — карточка, текст,
     кнопка, картинка — клик остаётся странице, ветка его не трогает. */
  function hitsBackground(target) {
    if (!target) return false;
    if (target === document.body || target === document.documentElement) return true;
    if (target.id === 'main') return true;
    return target.tagName === 'SECTION';
  }

  window.addEventListener('pointerdown', function (ev) {
    if (!hitsBackground(ev.target)) return;
    var r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    kick((ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height);
    askForTilt();
  });

  /* На телефоне датчик наклона требует разрешения, и запросить его можно
     только в ответ на жест человека. Первое касание пустого фона и есть
     этот жест: отдельной кнопки для этого заводить не нужно. */
  var tiltAsked = false;
  function askForTilt() {
    if (tiltAsked || reduced) return;
    tiltAsked = true;
    var DOE = window.DeviceOrientationEvent;
    if (!DOE) return;
    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(function (state) {
        if (state === 'granted') window.addEventListener('deviceorientation', onTilt);
      }).catch(function () { /* отказали — остаётся касание */ });
    } else {
      window.addEventListener('deviceorientation', onTilt);
    }
  }

  function onTilt(ev) {
    if (ev.gamma === null) return;
    scene.tTiltY = clamp(ev.gamma / 45, -1, 1);
    scene.tTiltX = clamp((ev.beta - 45) / 45, -1, 1);
  }

  /* --- Указатель ---------------------------------------------------------- */

  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('pointermove', function (ev) {
      scene.tTiltY = clamp((ev.clientX - window.innerWidth / 2) / (window.innerWidth / 2), -1, 1);
      scene.tTiltX = clamp((ev.clientY - window.innerHeight / 2) / (window.innerHeight / 2), -1, 1);
    }, { passive: true });
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* --- Цикл отрисовки ----------------------------------------------------- */

  var running = false, last = 0;

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    clock += dt;

    releaseWave();

    themeAt += dt;
    if (themeAt > 0.33) { themeAt = 0; pickTone(); }

    var a = amp();
    /* Сцена догоняет указатель плавно, иначе поворот дёргается за курсором. */
    scene.tiltX += (scene.tTiltX - scene.tiltX) * Math.min(1, dt * 2.2);
    scene.tiltY += (scene.tTiltY - scene.tiltY) * Math.min(1, dt * 2.2);
    stage.style.transform = 'rotateX(' + (-scene.tiltX * TILT_DEG * a).toFixed(3) + 'deg) ' +
                            'rotateY(' + (scene.tiltY * TILT_DEG * a).toFixed(3) + 'deg)';

    var w = 2 * Math.PI / WIND_SEC;
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i], d = L.def;

      /* Две волны с несоизмеримыми периодами дают движение без слышимого
         такта: ухо и глаз не находят в нём повтора. */
      var wind = reduced ? 0 :
        (Math.sin(clock * w + L.phase) * 0.62 +
         Math.sin(clock * w * 1.61 + L.phase * 1.7) * 0.38) * WIND_DEG * d.sway * a;

      var acc = -SPRING * (L.angle - wind) - DAMPING * L.vel;
      L.vel += acc * dt;
      L.angle += L.vel * dt;

      /* Параллакс: чем ближе часть к зрителю, тем сильнее она уезжает. */
      var px = scene.tiltY * d.depth * PARALLAX * a;
      var py = scene.tiltX * d.depth * PARALLAX * a;

      L.el.style.transform =
        'translate3d(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px,' + d.depth + 'px) ' +
        'rotate(' + L.angle.toFixed(3) + 'deg)';
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  /* Слой виден постоянно, но на скрытой вкладке цикл не тратит кадры. */
  start();
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  /* Ветка появляется, когда все её части загрузились, иначе видно, как она
     собирается по кускам. */
  var waiting = BRANCH.layers.length;
  BRANCH.layers.forEach(function (def) {
    var probe = new Image();
    probe.onload = probe.onerror = function () {
      if (--waiting === 0) host.classList.add('is-ready');
    };
    probe.src = 'assets/branch/' + def.name + '.png';
  });
})();
