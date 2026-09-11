/* =========================================================================
   SAVVA COFFEE — напиток часа

   На первом экране стоит строка, которая знает, который сейчас час в
   Эр-Рияде, и называет напиток под это время. Время берётся у часов
   гостя и переводится в пояс кафе средствами самого браузера, поэтому
   подсказка остаётся верной и для того, кто открыл страницу из другой
   страны, и для того, кто сидит в зале.

   Ничего не грузится по сети: часовой пояс и форматирование времени
   умеет сам браузер, а названия и цены берутся из js/menu.js.

   Выбор внутри одного времени суток меняется день ото дня: номер дня в
   году задаёт, какой из вариантов показать. Поэтому строка не выглядит
   намертво прошитой, но в пределах одного визита не скачет.
   ========================================================================= */

(function () {
  'use strict';

  var box = document.getElementById('nowbar');
  if (!box || !window.SAVVA || typeof MENU === 'undefined') return;

  var S = window.SAVVA;
  var ZONE = 'Asia/Riyadh';

  /* Время суток и что наливают. Часы заданы по расписанию заведения:
     открыто с 07:00 до полуночи (см. contact.hours в js/i18n.js).
     Варианты внутри каждой полосы подобраны по смыслу: утром молочное и
     горячее, в полуденную жару холодное и кислое, вечером матча, ночью
     то, что не помешает уснуть. */
  var SLOTS = [
    { key: 'closed',  from: 0,  to: 7,  items: ['coffee-of-day', 'english-tea'] },
    { key: 'morning', from: 7,  to: 11, items: ['flat-white', 'cappuccino', 'v60'] },
    { key: 'noon',    from: 11, to: 14, items: ['iced-americano', 'savva-melon', 'ice-shaken'] },
    { key: 'heat',    from: 14, to: 17, items: ['ice-hibiscus-savva', 'hibiscus-slush', 'iced-matcha-latte'] },
    { key: 'evening', from: 17, to: 20, items: ['savva-matcha', 'matcha-latte', 'spanish-latte'] },
    { key: 'night',   from: 20, to: 24, items: ['english-tea', 'turkish', 'macchiato'] }
  ];

  /* Часы и минуты в поясе кафе. Intl отдаёт их строками, поэтому номер
     часа приходится доставать разбором, зато пересчёт пояса и переход на
     летнее время остаются заботой браузера, а не нашей. */
  function riyadhNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      var h = 0, m = 0;
      parts.forEach(function (p) {
        if (p.type === 'hour') h = parseInt(p.value, 10);
        if (p.type === 'minute') m = parseInt(p.value, 10);
      });
      /* Полночь этот формат отдаёт как 24, а нам нужен ноль. */
      return { h: h % 24, m: m };
    } catch (e) {
      var d = new Date();
      return { h: d.getHours(), m: d.getMinutes() };
    }
  }

  /* Номер дня в году. Нужен только как ровный счётчик, чтобы вариант
     менялся каждый день и не зависел от случайности. */
  function dayIndex() {
    var d = new Date();
    return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  }

  function slotFor(h) {
    for (var i = 0; i < SLOTS.length; i++) {
      if (h >= SLOTS[i].from && h < SLOTS[i].to) return SLOTS[i];
    }
    return SLOTS[0];
  }

  function two(n) { return (n < 10 ? '0' : '') + n; }

  var current = null;

  function render() {
    var now = riyadhNow();
    var slot = slotFor(now.h);
    var pick = slot.items[dayIndex() % slot.items.length];
    var item = S.item(pick);
    if (!item) return;
    current = item;

    box.querySelector('.nowbar__label').textContent = S.t('now.label');
    box.querySelector('.nowbar__time').textContent = two(now.h) + ':' + two(now.m);
    box.querySelector('.nowbar__slot').textContent = S.t('now.slot.' + slot.key);
    box.querySelector('.nowbar__pour').textContent =
      slot.key === 'closed' ? S.t('now.wait') : S.t('now.pour');

    var name = box.querySelector('.nowbar__name');
    name.textContent = item.name[S.lang()];
    /* Название всегда набирается своим письмом: арабское слово внутри
       латинской строки иначе ломает порядок символов. */
    name.dir = S.lang() === 'ar' ? 'rtl' : 'ltr';

    box.querySelector('.nowbar__price').textContent =
      item.price + ' ' + S.t('menu.unit.price');
    box.querySelector('.nowbar__cta').textContent = S.t('now.cta');

    box.classList.toggle('is-closed', slot.key === 'closed');
    box.hidden = false;
  }

  box.querySelector('.nowbar__drink').addEventListener('click', function (ev) {
    if (!current) return;
    ev.preventDefault();
    S.reveal(current.id);
  });

  render();
  S.onLang(render);

  /* Час может смениться, пока страница открыта: проверяем раз в минуту.
     Это один вызов часов в минуту, на отрисовку он не влияет. */
  setInterval(render, 60000);
})();
