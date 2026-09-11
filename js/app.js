/* =========================================================================
   SAVVA COFFEE — логика страницы

   Зависит от js/i18n.js и js/menu.js, которые подключаются раньше.
   Ничего не грузит по сети: страница обязана работать при открытии файла
   двойным кликом, где fetch запрещён политикой происхождения.
   ========================================================================= */

(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  root.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Фотографии фирменной линейки ------------------------------------ */

  var SIG_PHOTO = {
    'savva-matcha':       'assets/img/sig-savva-matcha.jpg',
    'savva-melon':        'assets/img/sig-savva-melon.jpg',
    'ice-tea-savva':      'assets/img/sig-ice-tea-savva.jpg',
    'ice-hibiscus-savva': 'assets/img/sig-ice-hibiscus-savva.jpg',
    'hibiscus-slush':     'assets/img/sig-hibiscus-slush.jpg'
  };

  var SECTION_ICON = {
    hot:       'assets/icon-carafe.svg',
    cold:      'assets/icon-glass.svg',
    dessert:   'assets/icon-cake.png',
    breakfast: 'assets/icon-croissant.png'
  };

  /* --- Язык -------------------------------------------------------------- */

  var STORE_KEY = 'savva.lang';
  var lang = pickLang();

  function pickLang() {
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved && I18N[saved]) return saved;
    } catch (e) { /* приватный режим — просто идём дальше */ }
    var nav = (navigator.language || '').slice(0, 2).toLowerCase();
    return I18N[nav] ? nav : LANG_DEFAULT;
  }

  function t(key) {
    var dict = I18N[lang] || I18N[LANG_DEFAULT];
    return dict[key] !== undefined ? dict[key] : key;
  }

  /* Название позиции на текущем языке и подпись на втором письме.
     Арабская страница подписывает английским, остальные — арабским:
     так на экране всегда остаётся двуязычие печатного меню. */
  function altLang() { return lang === 'ar' ? 'en' : 'ar'; }

  /* --- Что страница отдаёт наружу ----------------------------------------
     Напиток часа и конструктор напитка живут в отдельных файлах, но им
     нужны те же переводы, те же позиции меню и тот же момент смены языка.
     Отдавать наружу весь модуль незачем, поэтому наружу выходит только
     это: четыре функции чтения и подписка на смену языка. */

  var langHooks = [];

  window.SAVVA = {
    t: function (key) { return t(key); },
    lang: function () { return lang; },
    altLang: altLang,
    item: function (id) {
      for (var i = 0; i < MENU.length; i++) if (MENU[i].id === id) return MENU[i];
      return null;
    },
    onLang: function (fn) { langHooks.push(fn); },
    reveal: revealItem
  };

  /* Показать позицию в меню по её идентификатору. Строка может быть скрыта
     вкладкой раздела или фильтром «лёгкое», поэтому сначала снимаем оба
     ограничения и только потом ищем строку: иначе ссылка «найти в меню»
     иногда никуда не приводила бы. */
  function revealItem(id) {
    var light = document.getElementById('lightOnly');
    if (light.checked) { light.checked = false; }
    if (activeTab !== 'all') {
      activeTab = 'all';
      document.querySelectorAll('#menuTabs button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.tab === 'all'));
      });
    }
    renderMenu();

    var row = document.querySelector('.mrow[data-id="' + id + '"]');
    if (!row) return;
    row.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    row.classList.remove('is-flash');
    /* Перезапуск подсветки: без чтения свойства браузер склеит снятие и
       возврат класса в один кадр и анимация не начнётся заново. */
    void row.offsetWidth;
    row.classList.add('is-flash');
  }

  function applyLang(next) {
    lang = next;
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* ничего */ }

    root.lang = lang;
    root.dir = t('meta.dir');

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      var parts = el.getAttribute('data-i18n-attr').split('|');
      el.setAttribute(parts[0], t(parts[1]));
    });

    document.querySelectorAll('#langs button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });

    locbarShape();
    buildSignature();
    buildTabs();
    renderMenu();
    buildMiniLists();
    langHooks.forEach(function (fn) { fn(); });
  }

  function buildLangSwitch() {
    var box = document.getElementById('langs');
    LANGS.forEach(function (code) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.lang = code;
      b.textContent = I18N[code]['meta.short'];
      b.setAttribute('aria-label', I18N[code]['meta.label']);
      b.addEventListener('click', function () { applyLang(code); });
      box.appendChild(b);
    });
  }

  /* --- Мелкие помощники разметки ---------------------------------------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* Второе название выводится своим письмом и направлением, иначе арабское
     слово рядом с латиницей ломает порядок символов в строке. */
  function altNameNode(item) {
    var other = altLang();
    var n = el('span', 'mrow__alt', item.name[other]);
    if (other === 'ar') { n.dir = 'rtl'; n.lang = 'ar'; n.classList.add('ar-ui'); }
    else { n.dir = 'ltr'; n.lang = other; }
    return n;
  }

  function priceNode(item, cls) {
    var wrap = el('span', cls || 'mrow__price');
    wrap.classList.add('num');
    wrap.textContent = String(item.price);
    var unit = el('span', 'mrow__unit', t('menu.unit.price'));
    wrap.appendChild(unit);
    return wrap;
  }

  function calsText(item) {
    return item.cals === null ? '—' : item.cals + ' ' + t('menu.unit.cals');
  }

  /* --- Фирменная линейка -------------------------------------------------- */

  function buildSignature() {
    var grid = document.getElementById('sigGrid');
    grid.textContent = '';

    MENU.filter(function (i) { return i.signature; }).forEach(function (item, idx) {
      var li = el('li', 'sig__card reveal');

      var shot = el('div', 'sig__shot');
      var img = new Image();
      img.src = SIG_PHOTO[item.id];
      img.alt = item.name[lang];
      img.loading = 'lazy';
      img.width = 800; img.height = 1000;
      shot.appendChild(img);
      shot.appendChild(el('span', 'sig__rank num', '0' + (idx + 1)));

      var bodyBox = el('div', 'sig__body');
      bodyBox.appendChild(el('h3', 'sig__name', item.name[lang]));

      var alt = altNameNode(item);
      alt.className = 'sig__alt';
      if (altLang() === 'ar') alt.classList.add('ar-ui');
      bodyBox.appendChild(alt);

      var meta = el('div', 'sig__meta');
      meta.appendChild(priceNode(item, 'sig__price'));
      meta.appendChild(el('span', 'sig__cals num', calsText(item)));
      bodyBox.appendChild(meta);

      li.appendChild(shot);
      li.appendChild(bodyBox);
      grid.appendChild(li);
    });

    observeReveals(grid);
    if (!reduced) bindTilt(grid);
  }

  /* --- Меню ---------------------------------------------------------------- */

  var activeTab = 'all';

  function buildTabs() {
    var box = document.getElementById('menuTabs');
    box.textContent = '';

    var list = ['all'].concat(MENU_SECTIONS);
    list.forEach(function (key) {
      var b = el('button', null, key === 'all' ? t('menu.filter.all') : t('menu.section.' + key));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(key === activeTab));
      b.dataset.tab = key;
      b.addEventListener('click', function () {
        activeTab = key;
        box.querySelectorAll('button').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x.dataset.tab === key));
        });
        renderMenu();
      });
      box.appendChild(b);
    });
  }

  function currentItems() {
    var lightOnly = document.getElementById('lightOnly').checked;
    return MENU.filter(function (i) {
      if (activeTab !== 'all' && i.section !== activeTab) return false;
      if (lightOnly && (i.cals === null || i.cals > CALORIE_LIMIT_LIGHT)) return false;
      return true;
    });
  }

  function renderMenu() {
    var host = document.getElementById('menuBody');
    var empty = document.getElementById('menuEmpty');
    host.textContent = '';

    var items = currentItems();
    empty.hidden = items.length > 0;

    MENU_SECTIONS.forEach(function (section) {
      var group = items.filter(function (i) { return i.section === section; });
      if (!group.length) return;

      var box = el('section', 'mgroup reveal');

      var head = el('div', 'mgroup__head');
      var icon = new Image();
      icon.src = SECTION_ICON[section];
      icon.alt = '';
      icon.className = 'mgroup__icon';
      icon.loading = 'lazy';
      head.appendChild(icon);
      head.appendChild(el('h3', 'mgroup__title', t('menu.section.' + section)));
      head.appendChild(el('span', 'mgroup__count num', String(group.length)));
      box.appendChild(head);

      var rows = el('div', 'mgroup__items');
      group.forEach(function (item) {
        var row = el('div', 'mrow');
        row.dataset.id = item.id;

        var thumb = el('div', 'mrow__thumb');
        var img = new Image();
        img.src = 'assets/img/menu/' + item.id + '.jpg';
        img.alt = item.name[lang] || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 44;
        img.height = 44;
        thumb.appendChild(img);
        row.appendChild(thumb);

        var names = el('div', 'mrow__names');
        names.appendChild(el('span', 'mrow__name', item.name[lang]));
        names.appendChild(altNameNode(item));
        if (item.signature) names.appendChild(el('span', 'mrow__mark', 'Savva'));
        row.appendChild(names);
        row.appendChild(el('span', 'mrow__dots'));

        var right = el('div', 'mrow__right');
        right.appendChild(priceNode(item));
        right.appendChild(el('span', 'mrow__cals num', calsText(item)));
        row.appendChild(right);

        rows.appendChild(row);
      });
      box.appendChild(rows);

      host.appendChild(box);
    });

    observeReveals(host);
  }

  /* --- Короткие списки в блоках матчи и каркаде --------------------------- */

  function buildMiniLists() {
    [['matchaList', 'matcha'], ['hibiscusList', 'hibiscus']].forEach(function (pair) {
      var host = document.getElementById(pair[0]);
      host.textContent = '';
      MENU.filter(function (i) { return i.tag === pair[1]; }).forEach(function (item) {
        var li = document.createElement('li');
        li.appendChild(el('b', null, item.name[lang]));
        li.appendChild(el('span', 'num', item.price + ' ' + t('menu.unit.price')));
        host.appendChild(li);
      });
    });
  }

  /* --- Появление блоков при скролле --------------------------------------- */

  var revealObserver = null;

  function observeReveals(scope) {
    if (!('IntersectionObserver' in window)) return;
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          revealObserver.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    }
    (scope || document).querySelectorAll('.reveal:not(.is-in)').forEach(function (n) {
      revealObserver.observe(n);
    });
  }

  /* --- Цветовая волна в блоке матчи --------------------------------------- */

  function watchWash() {
    var wash = document.querySelector('.wash');
    if (!wash || reduced) return;

    function update() {
      var r = wash.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      /* 0 — блок только показался снизу, 1 — его низ дошёл до середины экрана */
      var p = (vh - r.top) / (vh * 0.55 + r.height * 0.45);
      wash.style.setProperty('--wash', Math.min(1, Math.max(0, p)).toFixed(3));
    }
    onScroll(update);
    update();
  }

  /* --- Наклон карточек вслед за курсором ---------------------------------- */

  function bindTilt(scope) {
    scope.querySelectorAll('.sig__card').forEach(function (card) {
      card.addEventListener('pointermove', function (ev) {
        if (ev.pointerType !== 'mouse') return;
        var r = card.getBoundingClientRect();
        var dx = (ev.clientX - r.left) / r.width - 0.5;
        var dy = (ev.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (dx * 6).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-dy * 6).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* --- Счётчики в блоке концепции ----------------------------------------- */

  function watchCounters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length || !('IntersectionObserver' in window)) return;
    if (reduced) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var node = e.target;
        io.unobserve(node);
        var target = parseInt(node.dataset.count, 10);
        var started = null;
        var dur = 1100;
        (function step(now) {
          if (started === null) started = now;
          var k = Math.min(1, (now - started) / dur);
          /* мягкое торможение, чтобы число «доезжало», а не обрывалось */
          var eased = 1 - Math.pow(1 - k, 3);
          node.textContent = String(Math.round(target * eased));
          if (k < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });

    nodes.forEach(function (n) { io.observe(n); });
  }

  /* --- Фирменная 3D-деталь ------------------------------------------------
     Первый экран реагирует только внутри фотографии: указатель чуть
     сдвигает свет на поверхности кофе. После первого экрана появляется
     керамический медальон у края и исчезает ещё до того, как список меню
     займёт экран. На телефоне тот же медальон остаётся обычной частью
     блока концепции. */

  function bindBrandFeature() {
    var frame = document.querySelector('.hero__frame');
    var hero = document.getElementById('top');
    var concept = document.getElementById('concept');
    var menu = document.getElementById('menu');
    var orbit = document.getElementById('brandOrbit');
    var medallion = orbit && orbit.querySelector('.brand-medallion');
    if (!frame || !hero || !concept || !menu || !orbit || !medallion) return;

    var compact = window.matchMedia('(max-width: 62rem)');
    var canHover = window.matchMedia('(hover: hover)');

    if (canHover.matches) {
      frame.addEventListener('pointermove', function (ev) {
        if (ev.pointerType !== 'mouse') return;
        var r = frame.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        frame.style.setProperty('--coffee-x', (x * 7).toFixed(2) + 'px');
        frame.style.setProperty('--coffee-y', (y * 7).toFixed(2) + 'px');
      });
      frame.addEventListener('pointerleave', function () {
        frame.style.setProperty('--coffee-x', '0px');
        frame.style.setProperty('--coffee-y', '0px');
      });
    }

    /* --- Непрерывное 3D-вращение медальона со скроллом и интерактивностью --- */
    var angleY = 0;
    var angleZ = 0;
    var currentTiltX = -4;
    var currentTiltY = 0;
    var targetTiltX = -4;
    var targetTiltY = 0;
    var lastScrollY = window.scrollY;

    if (canHover.matches) {
      window.addEventListener('pointermove', function (ev) {
        if (compact.matches || ev.pointerType !== 'mouse') return;
        var x = ev.clientX / (window.innerWidth || 1) - 0.5;
        var y = ev.clientY / (window.innerHeight || 1) - 0.5;
        targetTiltX = -4 - y * 10;
        targetTiltY = x * 10;
      }, { passive: true });
    }

    orbit.addEventListener('click', function () {
      angleY += 180;
    });

    window.addEventListener('scroll', function () {
      var dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      angleY += dy * 0.4;
      angleZ += dy * 0.15;
    }, { passive: true });

    function spinLoop() {
      // Плавное бесконечное вращение БЕЗ сброса через modulo (исключает рывки и скачки)
      angleY += 0.8;
      angleZ += 0.25;

      // Мягкая интерполяция наклона от мыши
      currentTiltX += (targetTiltX - currentTiltX) * 0.08;
      currentTiltY += (targetTiltY - currentTiltY) * 0.08;

      var wobbleZ = Math.sin(angleZ * Math.PI / 180) * 6;

      medallion.style.transform = 'perspective(900px) rotateX(' + currentTiltX.toFixed(2) + 'deg) rotateY(' + (angleY + currentTiltY).toFixed(2) + 'deg) rotateZ(' + wobbleZ.toFixed(2) + 'deg)';

      requestAnimationFrame(spinLoop);
    }
    requestAnimationFrame(spinLoop);

    var footer = document.querySelector('.footer');

    function update() {
      var vh = window.innerHeight || 1;
      var show = true;
      if (!compact.matches && footer) {
        var fr = footer.getBoundingClientRect();
        show = fr.top > vh * 0.6;
      }
      orbit.classList.toggle('is-visible', show);
    }

    onScroll(update);
    update();
  }

  /* --- Живая чашка кофе на первом экране -----------------------------------
     - Тёплый пар мягко отклоняется от движения курсора в воздухе.
     - Блик света на поверхности кофе следует за курсором.
     - Клик/тап рождает падающую каплю эспрессо и расходящиеся волны. */

  /* --- Интерактивный живой кофе (Canvas) ------------------------------------
     Работает через requestAnimationFrame без ограничений CSS:
     - Непрерывный клубящийся тёплый пар над чашкой с реакцией на курсор.
     - Живые концентрические волны по поверхности кофе (клипированы по кругу чашки).
     - Автоматические капли эспрессо и моментальная реакция на клик / тап. */

  function bindHeroCoffee() {
    var frame = document.getElementById('heroFrame');
    var canvas = document.getElementById('heroCoffeeCanvas');
    var hint = document.getElementById('heroHint');
    if (!frame || !canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;

    function resize() {
      var rect = frame.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function getCupGeom() {
      return {
        cx: width * 0.502,
        cy: height * 0.498,
        r: width * 0.322
      };
    }

    var plumes = [
      { ox: -0.24, phase: 0.8, amp: 44, w: 32, alpha: 0.28 },
      { ox: -0.09, phase: 2.2, amp: 62, w: 42, alpha: 0.38 },
      { ox: +0.05, phase: 3.7, amp: 56, w: 40, alpha: 0.35 },
      { ox: +0.22, phase: 5.1, amp: 40, w: 28, alpha: 0.26 },
      { ox: -0.01, phase: 1.5, amp: 66, w: 46, alpha: 0.40 }
    ];

    var steamPuffs = [];
    var ripples = [];
    var splashes = [];
    var lastDropTime = performance.now();
    var mouseWind = 0;
    var targetWind = 0;
    var lastMouseX = null;

    frame.addEventListener('pointermove', function (ev) {
      if (ev.pointerType !== 'mouse') return;
      if (lastMouseX !== null) {
        var dx = ev.clientX - lastMouseX;
        targetWind = Math.max(-2.5, Math.min(2.5, dx * 0.15));
      }
      lastMouseX = ev.clientX;
    }, { passive: true });

    frame.addEventListener('pointerleave', function () {
      lastMouseX = null;
      targetWind = 0;
    });

    function spawnSteamPuff(originX, originY, plumeIdx) {
      var p = plumes[plumeIdx % plumes.length];
      steamPuffs.push({
        plume: p,
        ox: originX,
        oy: originY,
        x: originX,
        y: originY,
        vy: -0.72 - Math.random() * 0.45,
        size: 16 + Math.random() * 10,
        growth: 0.55 + Math.random() * 0.35,
        life: 0,
        maxLife: 140 + Math.random() * 50,
        lateralJitter: (Math.random() - 0.5) * 0.2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    function addRipple(x, y, isBig) {
      var speed = isBig ? 1.4 : 0.95;
      var maxR = isBig ? width * 0.32 : width * 0.25;
      var count = isBig ? 3 : 2;
      for (var i = 0; i < count; i++) {
        ripples.push({
          x: x,
          y: y,
          r: 3 - i * 10,
          speed: speed,
          maxR: maxR,
          alpha: isBig ? 0.48 : 0.28,
          delay: i * 11
        });
      }
    }

    function addSplash(x, y) {
      splashes.push({
        x: x,
        y: y,
        life: 0,
        maxLife: 20,
        scale: 0.3
      });
    }

    function triggerAt(clientX, clientY) {
      var rect = frame.getBoundingClientRect();
      var x = clientX - rect.left;
      var y = clientY - rect.top;
      var cup = getCupGeom();
      var dist = Math.hypot(x - cup.cx, y - cup.cy);
      if (dist > cup.r) {
        var a = Math.atan2(y - cup.cy, x - cup.cx);
        x = cup.cx + Math.cos(a) * (cup.r * 0.7);
        y = cup.cy + Math.sin(a) * (cup.r * 0.7);
      }
      addSplash(x, y);
      addRipple(x, y, true);
      for (var k = 0; k < 4; k++) {
        spawnSteamPuff(x + (Math.random() - 0.5) * 15, y, k);
      }
      if (hint) hint.classList.add('is-hidden');
    }

    frame.addEventListener('click', function (ev) {
      triggerAt(ev.clientX, ev.clientY);
    });

    frame.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        var cup = getCupGeom();
        triggerAt(frame.getBoundingClientRect().left + cup.cx, frame.getBoundingClientRect().top + cup.cy);
      }
    });

    var cup = getCupGeom();
    for (var k = 0; k < 15; k++) {
      var pi = k % plumes.length;
      spawnSteamPuff(cup.cx + plumes[pi].ox * cup.r, cup.cy - cup.r * (0.35 + Math.random() * 0.3), pi);
      var pt = steamPuffs[steamPuffs.length - 1];
      pt.life = Math.random() * pt.maxLife * 0.7;
    }
    addRipple(cup.cx, cup.cy, false);

    var lastTime = performance.now();

    function frameLoop(now) {
      requestAnimationFrame(frameLoop);
      if (width <= 0 || height <= 0) return;

      var dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      var time = now * 0.001;

      mouseWind += (targetWind - mouseWind) * 0.05;
      targetWind *= 0.96;

      ctx.clearRect(0, 0, width, height);

      var cup = getCupGeom();
      var scale = width / 500;

      // Спокойные автоматические капли раз в 6 секунд
      if (now - lastDropTime > 6200) {
        lastDropTime = now;
        var offX = cup.cx + (Math.random() - 0.5) * (cup.r * 0.35);
        var offY = cup.cy + (Math.random() - 0.5) * (cup.r * 0.35);
        addSplash(offX, offY);
        addRipple(offX, offY, false);
      }

      // 1. Деликатные волны на поверхности кофе (клипированы по чашке)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cup.cx, cup.cy, cup.r, 0, Math.PI * 2);
      ctx.clip();

      for (var i = ripples.length - 1; i >= 0; i--) {
        var rip = ripples[i];
        if (rip.delay > 0) {
          rip.delay--;
          continue;
        }
        rip.r += rip.speed;
        var progress = rip.r / rip.maxR;
        if (progress >= 1 || rip.r < 0) {
          ripples.splice(i, 1);
          continue;
        }

        var fade = Math.sin(progress * Math.PI) * Math.pow(1 - progress, 1.1);
        var currentAlpha = rip.alpha * fade;
        if (currentAlpha <= 0.005) continue;

        ctx.beginPath();
        ctx.arc(rip.x, rip.y + 0.8, rip.r, 0, Math.PI * 2);
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = 'rgba(70, 45, 18, ' + (currentAlpha * 0.42).toFixed(3) + ')';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = 'rgba(255, 252, 242, ' + currentAlpha.toFixed(3) + ')';
        ctx.stroke();
      }

      // Микро-всплеск капли
      for (var s = splashes.length - 1; s >= 0; s--) {
        var sp = splashes[s];
        sp.life++;
        var spProg = sp.life / sp.maxLife;
        if (spProg >= 1) {
          splashes.splice(s, 1);
          continue;
        }
        var spAlpha = Math.sin(spProg * Math.PI);
        var dotR = (1 - spProg) * 3 + 0.8;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y - Math.sin(spProg * Math.PI) * 6, dotR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 248, 225, ' + (spAlpha * 0.65).toFixed(3) + ')';
        ctx.fill();
      }

      ctx.restore();

      // 2. Теплая полупрозрачная дымка над верхней частью кофе
      ctx.save();
      var hazeY = cup.cy - cup.r * 0.52;
      var hazeRx = cup.r * 0.48;
      var hazeRy = cup.r * 0.36;
      ctx.beginPath();
      ctx.ellipse(cup.cx, hazeY, hazeRx, hazeRy, 0, 0, Math.PI * 2);
      var hazeGrad = ctx.createRadialGradient(cup.cx, hazeY, 0, cup.cx, hazeY, hazeRx);
      var breathe = Math.sin(time * 1.2) * 0.03;
      hazeGrad.addColorStop(0, 'rgba(255, 252, 245, ' + (0.24 + breathe).toFixed(3) + ')');
      hazeGrad.addColorStop(0.5, 'rgba(255, 250, 240, ' + (0.12 + breathe * 0.5).toFixed(3) + ')');
      hazeGrad.addColorStop(1, 'rgba(255, 250, 240, 0)');
      ctx.fillStyle = hazeGrad;
      ctx.fill();
      ctx.restore();

      // 3. Струящийся, завивающийся шелковистый пар (Живые ленты / Wispy Ribbons)
      var totalRise = height * 0.60;
      var numSteps = 28;

      ctx.save();
      for (var pI = 0; pI < plumes.length; pI++) {
        var pl = plumes[pI];
        var ox = cup.cx + pl.ox * cup.r;
        var oy = cup.cy - cup.r * 0.45;

        var pts = [];
        for (var step = 0; step < numSteps; step++) {
          var prog = step / (numSteps - 1);
          var y = oy - prog * totalRise;

          var amp = pl.amp * (0.2 + 1.55 * Math.pow(prog, 0.82)) * scale;
          var w1 = Math.sin(time * 1.35 + prog * 4.6 + pl.phase) * amp;
          var w2 = Math.cos(time * 2.15 + prog * 8.2 + pl.phase * 1.6) * (amp * 0.42);
          var w3 = Math.sin(time * 0.7 + prog * 13.0 + pl.phase * 2.7) * (amp * 0.18);
          var wind = mouseWind * (prog * 34);
          var x = ox + w1 + w2 + w3 + wind;
          pts.push({ x: x, y: y, prog: prog });
        }

        // Отрисовка витка струи по сегментам с нарастающей шириной
        for (var seg = 0; seg < pts.length - 1; seg++) {
          var pt1 = pts[seg];
          var pt2 = pts[seg + 1];
          var pr = pt1.prog;

          var envelope = Math.sin(Math.pow(pr, 0.58) * Math.PI) * (1 - pr * 0.32);
          var alpha = pl.alpha * envelope;
          if (alpha <= 0.005) continue;

          var curW = pl.w * (0.45 + 1.15 * pr) * scale;

          // Внешняя мягкая вуаль
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.lineWidth = curW + 18 * scale;
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.32).toFixed(3) + ')';
          ctx.stroke();

          // Тело струи пара
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.lineWidth = curW;
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(255, 253, 248, ' + (alpha * 0.75).toFixed(3) + ')';
          ctx.stroke();

          // Тонкая шелковистая нить в центре завитка
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.lineWidth = Math.max(2, curW * 0.26);
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + Math.min(1, alpha * 1.3).toFixed(3) + ')';
          ctx.stroke();
        }
      }
      ctx.restore();

      // 4. Клубящиеся мягкие облачка пара, плывущие по струям
      if (Math.random() < 0.22 && steamPuffs.length < 35) {
        var rIdx = Math.floor(Math.random() * plumes.length);
        var rPlume = plumes[rIdx];
        spawnSteamPuff(cup.cx + rPlume.ox * cup.r + (Math.random() - 0.5) * 12, cup.cy - cup.r * 0.45, rIdx);
      }

      for (var pIdx = steamPuffs.length - 1; pIdx >= 0; pIdx--) {
        var puff = steamPuffs[pIdx];
        puff.life++;
        if (puff.life >= puff.maxLife) {
          steamPuffs.splice(pIdx, 1);
          continue;
        }

        var prog = puff.life / puff.maxLife;
        var pPlume = puff.plume;

        puff.y += puff.vy;
        puff.size += puff.growth * 0.4;
        puff.rot += puff.rotSpeed;

        var amp = pPlume.amp * (0.2 + 1.55 * Math.pow(prog, 0.82)) * scale;
        var w1 = Math.sin(time * 1.35 + prog * 4.6 + pPlume.phase) * amp;
        var w2 = Math.cos(time * 2.15 + prog * 8.2 + pPlume.phase * 1.6) * (amp * 0.42);
        var wind = mouseWind * (prog * 34);
        var curX = puff.ox + w1 + w2 + wind + puff.lateralJitter * puff.life;

        var envelope = Math.sin(Math.pow(prog, 0.58) * Math.PI) * (1 - prog * 0.32);
        var a = pPlume.alpha * 0.55 * envelope;
        if (a <= 0.005) continue;

        var grad = ctx.createRadialGradient(curX, puff.y, 0, curX, puff.y, puff.size * scale);
        grad.addColorStop(0, 'rgba(255, 255, 255, ' + a.toFixed(3) + ')');
        grad.addColorStop(0.4, 'rgba(255, 253, 248, ' + (a * 0.6).toFixed(3) + ')');
        grad.addColorStop(0.8, 'rgba(250, 247, 240, ' + (a * 0.18).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(250, 247, 240, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.arc(curX, puff.y, puff.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }
    }

    requestAnimationFrame(frameLoop);
  }

  /* --- Шапка: фон, подсветка раздела, мобильное меню ---------------------- */

  function bindTopbar() {
    var bar = document.getElementById('topbar');
    var nav = document.getElementById('topnav');
    var burger = document.getElementById('burger');
    var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
    var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });

    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    links.forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });

    function update() {
      bar.classList.toggle('is-stuck', window.scrollY > window.innerHeight * 0.75);

      var mid = window.innerHeight * 0.35;
      var current = -1;
      targets.forEach(function (sec, i) {
        if (sec && sec.getBoundingClientRect().top <= mid) current = i;
      });
      links.forEach(function (a, i) { a.classList.toggle('is-current', i === current); });
    }
    onScroll(update);
    update();
  }

  /* Один обработчик прокрутки на всех: браузер успевает отрисовать кадр
     между вызовами, и страница не дёргается на слабых машинах. */
  var scrollJobs = [];
  var ticking = false;

  function onScroll(fn) {
    scrollJobs.push(fn);
    if (scrollJobs.length > 1) return;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        scrollJobs.forEach(function (job) { job(); });
        ticking = false;
      });
    }, { passive: true });
    window.addEventListener('resize', function () {
      scrollJobs.forEach(function (job) { job(); });
    });
  }

  /* --- Планка с адресом ----------------------------------------------------
     Появляется, когда первый экран уходит вверх, и прячется у блока
     контактов. На узком экране дополнительно уезжает вниз при прокрутке
     вперёд и возвращается при прокрутке назад. */

  function bindLocbar() {
    var bar = document.getElementById('locbar');
    var contact = document.getElementById('contact');
    if (!bar || !contact) return;

    var lastY = window.scrollY;

    function update() {
      var y = window.scrollY;
      var passedHero = y > window.innerHeight * 0.85;
      var r = contact.getBoundingClientRect();
      var contactVisible = r.top < window.innerHeight * 0.9 && r.bottom > 0;

      bar.classList.toggle('is-shown', passedHero && !contactVisible);
      /* Прячем не только глазами: скрытая планка не должна ловить
         клавиатурный фокус и попадать в чтение с экрана. */
      bar.setAttribute('aria-hidden', String(!(passedHero && !contactVisible)));
      bar.tabIndex = passedHero && !contactVisible ? 0 : -1;

      if (Math.abs(y - lastY) > 6) {
        bar.classList.toggle('is-tucked', y > lastY && passedHero);
        lastY = y;
      }
    }
    onScroll(update);
    update();
  }

  /* Арабская версия набирается пилюлей внизу: вертикальный набор годится
     для латиницы и кириллицы, а арабское письмо так не ставят. */
  function locbarShape() {
    var bar = document.getElementById('locbar');
    if (bar) bar.classList.toggle('locbar--pill', root.dir === 'rtl');
  }

  /* --- Прелоадер ----------------------------------------------------------- */

  function releasePreloader() {
    /* Держим заставку ровно столько, сколько идёт отрисовка логотипа,
       но не дольше: ждать ради ожидания незачем. */
    var minimum = reduced ? 0 : 2300;
    var started = performance.now();
    function finish() {
      var left = Math.max(0, minimum - (performance.now() - started));
      setTimeout(function () {
        body.classList.remove('is-loading');
        body.classList.add('is-ready');
      }, left);
    }
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish);
  }

  /* --- Кнопка «Наверх» ----------------------------------------------------- */

  function bindToTop() {
    var btn = document.getElementById('toTop');
    if (!btn) return;

    btn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: reduced ? 'auto' : 'smooth'
      });
    });

    function update() {
      var show = window.scrollY > window.innerHeight * 0.45;
      btn.classList.toggle('is-visible', show);
    }

    onScroll(update);
    update();
  }

  /* --- Запуск -------------------------------------------------------------- */

  buildLangSwitch();
  applyLang(lang);
  document.getElementById('lightOnly').addEventListener('change', renderMenu);

  observeReveals(document);
  watchWash();
  watchCounters();
  bindBrandFeature();
  bindHeroCoffee();
  bindTopbar();
  bindLocbar();
  bindToTop();
  releasePreloader();
})();
