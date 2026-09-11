/* =========================================================================
   SAVVA COFFEE — данные меню
   Источник: печатный макет «منيو سافا .pdf», 40 позиций.

   Цены в саудовских риалах. Калорийность указана заведением; у десертов
   во всём разделе стоит 170, это данные из макета, мы их не правим.
   Значение null означает, что в макете число отсутствует.

   Опечатки английских названий из макета исправлены:
     FLAT WAIT             -> FLAT WHITE
     WAIT MOCAH            -> WHITE MOCHA
     ICE WAIT MOCHA        -> ICE WHITE MOCHA
     BLUEBERRY CHEEESECAKE -> BLUEBERRY CHEESECAKE
   Арабские названия оставлены ровно как в макете.

   Поле signature помечает авторскую линейку, названную именем заведения.
   Поле tag группирует напитки для тематических блоков страницы.
   ========================================================================= */

const MENU = [
  /* --- Hot drinks / المشروبات الحارة ------------------------------------ */
  { id: 'espresso',             section: 'hot', price: 11, cals: 2,
    name: { ar: 'إسبريسو', en: 'Espresso', ru: 'Эспрессо' } },
  { id: 'americano',            section: 'hot', price: 12, cals: 2,
    name: { ar: 'أمريكانو', en: 'Americano', ru: 'Американо' } },
  { id: 'macchiato',            section: 'hot', price: 13, cals: 13,
    name: { ar: 'ميكاتو', en: 'Macchiato', ru: 'Макиато' } },
  { id: 'cortado',              section: 'hot', price: 14, cals: 50,
    name: { ar: 'كورتادو', en: 'Cortado', ru: 'Кортадо' } },
  { id: 'flat-white',           section: 'hot', price: 15, cals: 50,
    name: { ar: 'فلات وايت', en: 'Flat White', ru: 'Флэт-уайт' } },
  { id: 'latte',                section: 'hot', price: 16, cals: 75,
    name: { ar: 'لاتيه', en: 'Latte', ru: 'Латте' } },
  { id: 'cappuccino',           section: 'hot', price: 16, cals: 60,
    name: { ar: 'كابتشينو', en: 'Cappuccino', ru: 'Капучино' } },
  { id: 'spanish-latte',        section: 'hot', price: 18, cals: 178,
    name: { ar: 'سبانش لاتيه', en: 'Spanish Latte', ru: 'Испанский латте' } },
  { id: 'matcha-latte',         section: 'hot', price: 16, cals: 75, tag: 'matcha',
    name: { ar: 'ماتشا لاتيه', en: 'Matcha Latte', ru: 'Матча латте' } },
  { id: 'white-mocha',          section: 'hot', price: 16, cals: 230,
    name: { ar: 'وايت موكا', en: 'White Mocha', ru: 'Белая мокка' } },
  { id: 'hot-chocolate',        section: 'hot', price: 15, cals: 237,
    name: { ar: 'هوت شوكليت', en: 'Hot Chocolate', ru: 'Горячий шоколад' } },
  { id: 'english-tea',          section: 'hot', price: 6, cals: 2,
    name: { ar: 'شاي انجليزي', en: 'English Tea', ru: 'Английский чай' } },
  { id: 'turkish',              section: 'hot', price: 11, cals: 50,
    name: { ar: 'تركي سادة', en: 'Turkish Coffee', ru: 'Кофе по-турецки' } },
  { id: 'turkish-milk',         section: 'hot', price: 13, cals: 50,
    name: { ar: 'تركي حليب', en: 'Turkish Coffee with Milk', ru: 'Кофе по-турецки с молоком' } },
  { id: 'coffee-of-day',        section: 'hot', price: 13, cals: null,
    name: { ar: 'قهوة اليوم بارد / حار', en: 'Coffee of the Day, Hot or Iced', ru: 'Кофе дня, горячий или холодный' } },
  { id: 'v60',                  section: 'hot', price: 18, cals: null,
    name: { ar: 'قهوة المقطرة', en: 'V60 / Ice Drip', ru: 'Фильтр V60 или айс-дрип' } },

  /* --- Cold drinks / المشروبات الباردة ---------------------------------- */
  { id: 'alfredo',              section: 'cold', price: 14, cals: 100,
    name: { ar: 'ألفريدو', en: 'Alfredo', ru: 'Альфредо' } },
  { id: 'iced-americano',       section: 'cold', price: 15, cals: 2,
    name: { ar: 'ايس أمركانو', en: 'Iced Americano', ru: 'Айс американо' } },
  { id: 'savva-melon',          section: 'cold', price: 16, cals: 50, signature: true,
    name: { ar: 'شمام سافا', en: 'Savva Melon', ru: 'Дыня Savva' } },
  { id: 'iced-latte',           section: 'cold', price: 17, cals: 100,
    name: { ar: 'ايس لاتيه', en: 'Iced Latte', ru: 'Айс латте' } },
  { id: 'iced-matcha-latte',    section: 'cold', price: 17, cals: 130, tag: 'matcha',
    name: { ar: 'ايس ماتشا لاتيه', en: 'Iced Matcha Latte', ru: 'Айс матча латте' } },
  { id: 'ice-tea-savva',        section: 'cold', price: 17, cals: 189, signature: true,
    name: { ar: 'ايس تي سافا', en: 'Ice Tea Savva', ru: 'Айс-ти Savva' } },
  { id: 'ice-hibiscus-savva',   section: 'cold', price: 17, cals: 180, signature: true, tag: 'hibiscus',
    name: { ar: 'ايس كركديه سافا', en: 'Ice Hibiscus Savva', ru: 'Айс каркаде Savva' } },
  { id: 'hibiscus-slush',       section: 'cold', price: 17, cals: 180, signature: true, tag: 'hibiscus',
    name: { ar: 'سلاش كركديه سافا', en: 'Hibiscus Slush Savva', ru: 'Слаш каркаде Savva' } },
  { id: 'ice-chocolate',        section: 'cold', price: 17, cals: 230,
    name: { ar: 'ايس شوكلت', en: 'Ice Chocolate', ru: 'Айс шоколад' } },
  { id: 'iced-spanish-latte',   section: 'cold', price: 19, cals: 230,
    name: { ar: 'ايس سبانيش لاتيه', en: 'Iced Spanish Latte', ru: 'Айс испанский латте' } },
  { id: 'iced-matcha-spanish',  section: 'cold', price: 19, cals: 230, tag: 'matcha',
    name: { ar: 'ايس ماتشا سبانيش لاتيه', en: 'Iced Matcha Spanish Latte', ru: 'Айс матча испанский латте' } },
  { id: 'ice-white-mocha',      section: 'cold', price: 19, cals: 230,
    name: { ar: 'ايس وايت موكا', en: 'Ice White Mocha', ru: 'Айс белая мокка' } },
  { id: 'ice-shaken',           section: 'cold', price: 20, cals: 231,
    name: { ar: 'ايس شيكن', en: 'Ice Shaken', ru: 'Айс шейкен' } },
  { id: 'savva-matcha',         section: 'cold', price: 22, cals: 2, signature: true, tag: 'matcha',
    name: { ar: 'سافا ماتشا', en: 'Savva Matcha', ru: 'Матча Savva' } },
  { id: 'matcha-berry',         section: 'cold', price: 24, cals: 230, tag: 'matcha',
    name: { ar: 'ماتشا بيري', en: 'Matcha Berry', ru: 'Матча с ягодами' } },

  /* --- Desserts / الحلى -------------------------------------------------- */
  { id: 'crunchy-chocolate',    section: 'dessert', price: 8, cals: 170,
    name: { ar: 'كرانشي شوكلت', en: 'Crunchy Chocolate', ru: 'Хрустящий шоколад' } },
  { id: 'marble-cake',          section: 'dessert', price: 11, cals: 170,
    name: { ar: 'ماربل كيك', en: 'Marble Cake', ru: 'Мраморный кекс' } },
  { id: 'madini-cookies',       section: 'dessert', price: 12, cals: 170,
    name: { ar: 'مديني كوكيز', en: 'Madini Cookies', ru: 'Печенье «Мадини»' } },
  { id: 'chocolate-cake',       section: 'dessert', price: 18, cals: 170,
    name: { ar: 'كيكة شوكلت', en: 'Chocolate Cake', ru: 'Шоколадный торт' } },
  { id: 'cinnamon-danish',      section: 'dessert', price: 19, cals: 170,
    name: { ar: 'دانيش سينابون', en: 'Cinnamon Danish', ru: 'Датская булочка с корицей' } },
  { id: 'pecan-cake',           section: 'dessert', price: 21, cals: 170,
    name: { ar: 'كيكة البيكان', en: 'Pecan Cake', ru: 'Пекановый торт' } },
  { id: 'blueberry-cheesecake', section: 'dessert', price: 27, cals: 170,
    name: { ar: 'تشيز كيك بلوبيري', en: 'Blueberry Cheesecake', ru: 'Черничный чизкейк' } },

  /* --- Breakfast / الفطور ------------------------------------------------ */
  { id: 'halloumi-sandwich',    section: 'breakfast', price: 18, cals: 300,
    name: { ar: 'ساندوتش حلوم', en: 'Halloumi Sandwich', ru: 'Сэндвич с халуми' } },
  { id: 'turkey-sandwich',      section: 'breakfast', price: 19, cals: 300,
    name: { ar: 'ساندوتش تركي', en: 'Turkey Sandwich', ru: 'Сэндвич с индейкой' } }
];

/* Порядок разделов на странице. */
const MENU_SECTIONS = ['hot', 'cold', 'dessert', 'breakfast'];

/* Порог фильтра «лёгкое». Граница в 100 ккал выбрана по самим данным:
   ниже неё лежат чёрный кофе и чай, выше — всё молочное и сладкое. */
const CALORIE_LIMIT_LIGHT = 100;
