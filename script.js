/* ================================================================
   ЧЕРТА. — интерактив и анимации (GSAP + ScrollTrigger + Lenis)
   ================================================================ */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const img = (id, w = 1200, q = 75) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;
  const body = document.body;
  // ?static — без прелоадера и анимаций (для скриншотов и предпросмотра)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('static');
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // при обновлении страница всегда начинается с первого экрана
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  scrollTo(0, 0);
  addEventListener('pageshow', () => scrollTo(0, 0));
  addEventListener('load', () => { scrollTo(0, 0); window.__lenis && window.__lenis.scrollTo(0, { immediate: true, force: true }); });

  if (!hasGsap) body.classList.add('no-gsap');
  if (reduced) body.classList.add('no-motion');

  /* ---------- Заглушки для недоступных картинок ---------- */
  const markBroken = (el) => el.parentElement && el.parentElement.classList.add('img-fallback');
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') markBroken(e.target); }, true);
  $$('img').forEach((i) => { if (i.complete && i.naturalWidth === 0 && i.getAttribute('src')) markBroken(i); });

  /* ---------- Разбивка заголовков на слова ---------- */
  $$('[data-split]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
  });
  const manifesto = $('#manifesto');
  // «что», «когда», «за сколько» выделяются фирменной чертой
  const accent = /(^| )(что|когда|за сколько)(?=[.,]?$)/;
  manifesto.innerHTML = manifesto.textContent.trim().split(' ')
    .map((w) => `<span class="mw">${w.replace(accent, '$1<span class="hl">$2</span>')}</span>`)
    .join(' ');

  /* ---------- Плавная прокрутка ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    window.__lenis = lenis;
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const lock = (on) => {
    body.classList.toggle('is-locked', on);
    if (lenis) on ? lenis.stop() : lenis.start();
  };
  const scrollToEl = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };

  /* ---------- Шапка, меню, навигация ---------- */
  const header = $('#header');
  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    $('.burger__text', burger).textContent = open ? 'Закрыть' : 'Меню';
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', !open);
    body.classList.toggle('menu-open', open);
    header.classList.remove('is-hidden');
    lock(open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));

  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? $('#top') : $(id);
    if (!target) return;
    e.preventDefault();
    if (menu.classList.contains('is-open')) {
      // под закрытой шторкой мгновенно переходим к блоку, затем шторка поднимается
      if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
      else scrollTo(0, target.getBoundingClientRect().top + scrollY);
      hasGsap && ScrollTrigger.update();
      requestAnimationFrame(() => requestAnimationFrame(() => { headerTheme(); setMenu(false); }));
    } else scrollToEl(target);
  }));

  // цвет шапки — по теме секции под ней
  const headerTheme = () => {
    const under = document.elementsFromPoint(innerWidth / 2, 34).find((el) => !el.closest('.header, .cursor'));
    const sec = under && under.closest('.light, .dark, .pp');
    header.classList.toggle('on-light', !!sec && !sec.classList.contains('dark'));
    header.classList.toggle('is-solid', scrollY > innerHeight * 0.6);
  };
  const onScrollHeader = () => headerTheme();
  addEventListener('scroll', onScrollHeader, { passive: true });
  headerTheme();

  const navLinks = $$('.nav a');
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => { const t = $(a.getAttribute('href')); t && navIO.observe(t); });

  /* ---------- Hero: принципы по кругу ---------- */
  const principles = ['Определённость', 'Прозрачность', 'Контроль', 'Завершённость'];
  const pWord = $('#principleWord');
  const pNum = $('#principleNum');
  let pi = 0;
  if (!reduced) setInterval(() => {
    pi = (pi + 1) % principles.length;
    pWord.classList.add('is-out');
    setTimeout(() => {
      pWord.textContent = principles[pi];
      pNum.textContent = `0${pi + 1} / 04`;
      pWord.classList.remove('is-out');
    }, 350);
  }, 3200);

  /* ---------- Курсор ---------- */
  const cursor = $('#cursor');
  const cursorLabel = $('#cursorLabel');
  if (finePointer && hasGsap && !reduced) {
    const cx = gsap.quickTo(cursor, 'x', { duration: .45, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: .45, ease: 'power3' });
    addEventListener('mousemove', (e) => { cx(e.clientX); cy(e.clientY); cursor.classList.add('is-on'); }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    document.addEventListener('mouseover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, label, .svc, .pr');
      cursor.classList.toggle('has-label', !!lab);
      cursorLabel.textContent = lab ? lab.dataset.cursor : '';
      cursor.classList.toggle('is-link', !lab && !!link);
    });
  }

  /* ---------- Магнитные кнопки ---------- */
  if (finePointer && hasGsap && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .25);
        my((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  /* ---------- Услуги: картинка за курсором ---------- */
  const svcList = $('#svcList');
  const svcFloat = $('#svcFloat');
  const svcFloatImg = $('#svcFloatImg');
  if (finePointer && hasGsap) {
    $$('.svc', svcList).forEach((s) => { const i = new Image(); i.src = img(s.dataset.img, 700, 75); });
    const fx = gsap.quickTo(svcFloat, 'x', { duration: .7, ease: 'power3' });
    const fy = gsap.quickTo(svcFloat, 'y', { duration: .7, ease: 'power3' });
    svcList.addEventListener('mousemove', (e) => {
      fx(e.clientX + 30);
      fy(e.clientY - svcFloat.offsetHeight / 2);
    });
    $$('.svc', svcList).forEach((s) => s.addEventListener('mouseenter', () => {
      svcFloatImg.src = img(s.dataset.img, 700, 75);
      svcFloat.classList.add('is-on');
    }));
    svcList.addEventListener('mouseleave', () => svcFloat.classList.remove('is-on'));
  }

  /* ================================================================
     ПАСПОРТ РЕМОНТА — демонстрационные данные
     ================================================================ */
  const PHOTOS = [
    { id: '1517581177682-a085bb7ffb15', stage: 'Демонтаж', cap: 'Демонтаж старых перегородок', date: '05 сен' },
    { id: '1621905251189-08b45d6a269e', stage: 'Электромонтаж', cap: 'Сборка щита, маркировка линий', date: '18 сен' },
    { id: '1558618666-fcd25c85cd64', stage: 'Электромонтаж', cap: 'Штробление под кабель — гостиная', date: '15 сен' },
    { id: '1607472586893-edb57bdc0e39', stage: 'Черновая сантехника', cap: 'Разводка труб, опрессовка', date: '10 окт' },
    { id: '1589939705384-5185137a7f0f', stage: 'Подготовка стен', cap: 'Закладные под встроенный шкаф', date: '22 окт' },
    { id: '1562259949-e8e7689d7828', stage: 'Подготовка стен', cap: 'Грунтование перед штукатуркой', date: '24 окт' },
    { id: '1513467535987-fd81bc7d62f8', stage: 'Подготовка стен', cap: 'Раскрой профиля для ниши', date: '21 окт' },
    { id: '1513694203232-719a280e022f', stage: 'Визуализация', cap: 'Планируемый результат — гостиная', date: 'проект' },
    { id: '1586023492125-27b2c045efd7', stage: 'Визуализация', cap: 'Планируемый результат — спальня', date: 'проект' },
    { id: '1600489000022-c2086d79f9d4', stage: 'Визуализация', cap: 'Планируемый результат — кухня', date: 'проект' },
  ];

  const STAGES = [
    { name: 'Демонтаж', dates: '01 — 12 сен', st: 'ok', pct: 100, resp: 'Прораб Илья К.',
      desc: 'Демонтаж старых перегородок, стяжки и отделки, вывоз мусора. Зафиксировано исходное состояние стен и перекрытий.', doc: 'Акт выполненных работ' },
    { name: 'Электромонтаж', dates: '13 — 30 сен', st: 'ok', pct: 100, resp: 'Электрик Сергей М.',
      desc: 'Новая разводка по согласованной схеме: 38 точек, отдельные линии на кухню и санузел, щит с УЗО. Перед закрытием штроб — фотофиксация.', doc: 'Акт скрытых работ, исполнительная схема' },
    { name: 'Черновая сантехника', dates: '01 — 10 окт', st: 'ok', pct: 100, resp: 'Сантехник Артём В.',
      desc: 'Разводка водоснабжения и канализации, установка инсталляции, опрессовка системы. Гидроизоляция санузла с проливкой.', doc: 'Акт скрытых работ, протокол опрессовки' },
    { name: 'Подготовка стен', dates: '11 окт — 07 ноя', st: 'work', pct: 60, resp: 'Прораб Илья К.',
      desc: 'Грунтование, штукатурка по маякам, шпаклёвка под покраску. Плоскость проверяется правилом 2 м до перехода к чистовой отделке.', doc: 'Промежуточная приёмка — 07 ноя' },
    { name: 'Чистовая отделка', dates: '09 — 28 ноя', st: 'plan', pct: 0, resp: 'Прораб Илья К.',
      desc: 'Покраска стен и потолков, укладка керамогранита и микроцемента в санузле. Материалы согласованы, часть уже на объекте.', doc: '—' },
    { name: 'Напольные покрытия', dates: '29 ноя — 06 дек', st: 'plan', pct: 0, resp: 'Прораб Илья К.',
      desc: 'Укладка инженерной доски с подготовкой основания, монтаж теневого плинтуса.', doc: '—' },
    { name: 'Чистовой монтаж', dates: '07 — 15 дек', st: 'plan', pct: 0, resp: 'Электрик, сантехник',
      desc: 'Установка розеток, выключателей, светильников, сантехники и скрытых дверей.', doc: '—' },
    { name: 'Финальная приёмка', dates: '16 — 19 дек', st: 'plan', pct: 0, resp: 'Руководитель проекта',
      desc: 'Совместный обход по согласованному перечню работ, закрытие замечаний, передача документов и ключей.', doc: 'Акт приёмки, перечень работ' },
  ];

  const MATERIALS = [
    { sw: '#B8946A', name: 'Инженерная доска, дуб', spec: '1-полосная, масло, 190 мм', room: 'Жилые комнаты', f: 'order', date: 'поставка 06 ноя' },
    { sw: '#D9D4C9', name: 'Керамогранит «светлый камень»', spec: '60×120, матовый', room: 'Санузел, прихожая', f: 'site', date: 'доставлен 20 окт' },
    { sw: '#BDB8AE', name: 'Микроцемент, тон «Туман»', spec: 'двухкомпонентный', room: 'Душевая зона', f: 'agreed', date: 'заказ до 01 ноя' },
    { sw: '#EFEBE2', name: 'Краска глубокоматовая', spec: 'тёплый белый, моющаяся', room: 'Стены и потолки', f: 'agreed', date: 'заказ до 05 ноя' },
    { sw: '#CFCBC3', name: 'Гипсовая штукатурка', spec: 'машинного нанесения', room: 'Все стены', f: 'site', date: 'на объекте' },
    { sw: '#E6E2D9', name: 'Скрытые двери под покраску', spec: 'h 2400 мм, 5 шт.', room: 'Вся квартира', f: 'order', date: 'поставка 18 ноя' },
    { sw: '#9A9C97', name: 'Инсталляция для унитаза', spec: 'с кнопкой смыва', room: 'Санузел', f: 'site', date: 'смонтирована' },
    { sw: '#3B3C38', name: 'Кабель ВВГнг-LS', spec: '3×2,5 и 3×1,5', room: 'Вся квартира', f: 'site', date: 'смонтирован' },
    { sw: '#A7A49C', name: 'Теневой плинтус', spec: 'алюминий, анодированный', room: 'Жилые комнаты', f: 'agreed', date: 'заказ до 15 ноя' },
  ];
  const ST_LABEL = { ok: ['Выполнено', 'ok'], work: ['В работе', 'work'], plan: ['Запланировано', 'wait'] };
  const MAT_LABEL = { site: ['На объекте', 'ok'], order: ['Заказано', 'work'], agreed: ['Согласовано', 'wait'] };

  const pp = $('#pp');

  // прогресс: шкала и счётчик
  const pct = $('#ppPct');
  const ppIO = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    pp.classList.add('is-in');
    ppIO.disconnect();
    if (reduced) { pct.textContent = 62; return; }
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 1800);
      pct.textContent = Math.round(62 * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.2 });
  ppIO.observe(pp);

  // вкладки
  const tabs = $$('.pp__tabs [role="tab"]');
  const selectTab = (name, focus) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = $('#' + t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
      if (on && focus) t.focus();
    });
    hasGsap && ScrollTrigger.refresh();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(n.dataset.tab, true);
    });
  });
  $$('[data-goto]', pp).forEach((b) => b.addEventListener('click', () => selectTab(b.dataset.goto)));

  const thumbHTML = (p, i, extra = '') =>
    `<button class="thumb${extra}" data-lb="${i}"><img src="${img(p.id, 700, 70)}" alt="${p.cap}" loading="lazy">${p.stage === 'Визуализация' ? '<em class="mono">план</em>' : ''}<span class="mono">${p.date}</span></button>`;

  // этапы
  const stagesList = $('#stagesList');
  stagesList.innerHTML = STAGES.map((s, i) => {
    const [lbl, cls] = ST_LABEL[s.st];
    const pics = PHOTOS.map((p, j) => [p, j]).filter(([p]) => p.stage === s.name);
    const picsHTML = pics.length
      ? pics.map(([p, j]) => thumbHTML(p, j)).join('')
      : `<div class="stage__empty mono">Фото появятся, когда этап начнётся</div>`;
    return `<li class="stage${s.st === 'work' ? ' is-open' : ''}">
      <button class="stage__head" aria-expanded="${s.st === 'work'}">
        <span class="mono dim">0${i + 1}</span>
        <span class="stage__name">${s.name}</span>
        <span class="stage__dates mono dim">${s.dates}</span>
        <span class="status status--${cls} mono">${lbl}${s.st === 'work' ? ` · ${s.pct}%` : ''}</span>
        <span class="stage__pm" aria-hidden="true"></span>
      </button>
      <div class="stage__body"><div><div class="stage__inner">
        <div>
          <p>${s.desc}</p>
          <dl class="stage__meta">
            <div><dt class="mono dim">Сроки</dt><dd>${s.dates}</dd></div>
            <div><dt class="mono dim">Ответственный</dt><dd>${s.resp}</dd></div>
            <div><dt class="mono dim">Документы</dt><dd>${s.doc}</dd></div>
          </dl>
          <div class="stage__bar"><span style="width:${s.pct}%;${s.st === 'ok' ? 'background:var(--k)' : ''}"></span></div>
        </div>
        <div class="stage__pics">${picsHTML}</div>
      </div></div></div>
    </li>`;
  }).join('');
  $$('.stage__head', stagesList).forEach((h) => h.addEventListener('click', () => {
    const li = h.parentElement;
    const open = !li.classList.contains('is-open');
    li.classList.toggle('is-open', open);
    h.setAttribute('aria-expanded', open);
  }));

  // материалы
  const matList = $('#matList');
  const renderMat = (f) => {
    const rows = MATERIALS.filter((m) => f === 'all' || m.f === f);
    matList.innerHTML = `<div class="mat__row mat__row--head mono dim" role="row"><span></span><span>Материал</span><span>Помещение</span><span>Статус</span><span class="mat__date">Дата</span></div>` +
      rows.map((m, i) => {
        const [lbl, cls] = MAT_LABEL[m.f];
        return `<div class="mat__row" role="row" style="animation-delay:${i * 45}ms">
          <span class="mat__sw" style="background:${m.sw}" aria-hidden="true"></span>
          <span class="mat__name"><strong>${m.name}</strong><span>${m.spec}</span></span>
          <span>${m.room}</span>
          <span class="status status--${cls} mono">${lbl}</span>
          <span class="mat__date mono dim">${m.date}</span>
        </div>`;
      }).join('');
  };
  renderMat('all');
  $$('#matFilters .chip').forEach((c) => c.addEventListener('click', () => {
    $$('#matFilters .chip').forEach((x) => x.classList.toggle('is-on', x === c));
    renderMat(c.dataset.f);
  }));

  // фотоотчёт
  const gal = $('#gal');
  const photoFilters = $('#photoFilters');
  const stageNames = ['Все', ...new Set(PHOTOS.map((p) => p.stage))];
  photoFilters.innerHTML = stageNames.map((s, i) => `<button class="chip${i ? '' : ' is-on'}" data-s="${s}">${s}</button>`).join('');
  const renderGal = (s) => {
    gal.innerHTML = PHOTOS.map((p, i) => [p, i])
      .filter(([p]) => s === 'Все' || p.stage === s)
      .map(([p, i], k) => thumbHTML(p, i, k === 0 && s === 'Все' ? ' is-wide' : '').replace('class="thumb', `style="animation-delay:${k * 45}ms" class="thumb`))
      .join('');
  };
  renderGal('Все');
  photoFilters.addEventListener('click', (e) => {
    const c = e.target.closest('.chip'); if (!c) return;
    $$('.chip', photoFilters).forEach((x) => x.classList.toggle('is-on', x === c));
    renderGal(c.dataset.s);
  });

  // лайтбокс
  const lb = $('#lb');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  let lbIdx = 0;
  const showLb = (i) => {
    lbIdx = (i + PHOTOS.length) % PHOTOS.length;
    const p = PHOTOS[lbIdx];
    lbImg.src = img(p.id, 1600, 80);
    lbImg.alt = p.cap;
    lbCap.textContent = `${p.stage} ■ ${p.cap} ■ ${p.date}`;
    if (lb.hidden) { lb.hidden = false; lock(true); }
  };
  const closeLb = () => { lb.hidden = true; lock(false); };
  pp.addEventListener('click', (e) => { const t = e.target.closest('[data-lb]'); if (t) showLb(+t.dataset.lb); });
  $('.lb__close', lb).addEventListener('click', closeLb);
  $('.lb__nav--prev', lb).addEventListener('click', () => showLb(lbIdx - 1));
  $('.lb__nav--next', lb).addEventListener('click', () => showLb(lbIdx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  /* ---------- Проекты: модальное окно ---------- */
  const PROJECTS = [
    { num: 'Объект 017 ■ Новостройка ■ Москва', title: 'Дуб и свет', id: '1604014237800-1c9102c219da',
      text: 'Квартира от застройщика без отделки. Объединили кухню и гостиную, спрятали хранение в стену из дубового шпона, сохранили максимум дневного света.',
      facts: [['Площадь', '86 м², 3 комнаты'], ['Срок', '4,5 месяца, 9 этапов'], ['Материалы', 'Шпон дуба, гипсовая штукатурка, керамогранит'], ['Ключевые работы', 'Перепланировка, скрытые двери, встроенная кухня'], ['Изменения в смете', '3 — все согласованы до начала работ']] },
    { num: 'Объект 021 ■ Вторичное жильё ■ Москва', title: 'Сталинка', id: '1505873242700-f289a29e1e0f',
      text: 'Капитальный ремонт с полной заменой инженерии. Выровняли геометрию стен и потолков, сохранив высоту, перенесли кухню к окну.',
      facts: [['Площадь', '64 м², 2 комнаты'], ['Срок', '5 месяцев, 10 этапов'], ['Материалы', 'Дубовые рейки, светлый камень, матовая краска'], ['Ключевые работы', 'Демонтаж до основания, новая электрика и трубы'], ['Скрытые работы', 'Сфотографированы и оформлены актами']] },
    { num: 'Объект 009 ■ Новостройка ■ Московская обл.', title: 'У парка', id: '1616593969747-4797dc75033e',
      text: 'Спокойный интерьер для семьи с ребёнком: шумоизоляция детской и спальни, два санузла, много закрытого хранения.',
      facts: [['Площадь', '112 м², 4 комнаты'], ['Срок', '6 месяцев, 11 этапов'], ['Материалы', 'Инженерная доска, микроцемент, дуб'], ['Ключевые работы', 'Шумоизоляция, два санузла, гардеробная'], ['Приёмка', '142 пункта перечня работ']] },
    { num: 'Объект 012 ■ Новостройка ■ Москва', title: 'Для двоих', id: '1600607687644-c7171b42498f',
      text: 'Небольшая площадь без ощущения тесноты: светлые поверхности, скрытые системы хранения, ванна вместо душевой — по желанию заказчиков.',
      facts: [['Площадь', '48 м², 1 комната + кухня-гостиная'], ['Срок', '3,5 месяца, 8 этапов'], ['Материалы', 'Светлая штукатурка, керамогранит, дуб'], ['Ключевые работы', 'Перенос мокрой зоны, встроенные шкафы'], ['Замечания на приёмке', '4 — устранены за 3 дня']] },
  ];
  const modal = $('#modal');
  let lastFocus = null;
  const openModal = (i) => {
    const p = PROJECTS[i];
    $('#mImg').src = img(p.id, 1600, 80);
    $('#mImg').alt = p.title;
    $('#mNum').textContent = p.num;
    $('#mTitle').textContent = p.title;
    $('#mText').textContent = p.text;
    $('#mFacts').innerHTML = p.facts.map(([k, v]) => `<div><dt class="mono">${k}</dt><dd>${v}</dd></div>`).join('');
    lastFocus = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    lock(true);
    $('.modal__close', modal).focus();
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.hidden = true;
    lock(false);
    lastFocus && lastFocus.focus();
  };
  $$('.proj').forEach((p) => p.addEventListener('click', () => openModal(+p.dataset.project)));
  $$('[data-close]', modal).forEach((b) => b.addEventListener('click', closeModal));

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!modal.hidden) closeModal();
      else if (!lb.hidden) closeLb();
      else if (menu.classList.contains('is-open')) setMenu(false);
    }
    if (!lb.hidden && e.key === 'ArrowRight') showLb(lbIdx + 1);
    if (!lb.hidden && e.key === 'ArrowLeft') showLb(lbIdx - 1);
  });

  /* ---------- Уведомление, документы, политика ---------- */
  const toast = $('#toast');
  let toastT;
  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 2600);
  };
  $$('.docs li', pp).forEach((d) => {
    d.tabIndex = 0;
    d.setAttribute('role', 'button');
    const fire = () => showToast('Демо: документ откроется в реальном паспорте объекта');
    d.addEventListener('click', fire);
    d.addEventListener('keydown', (e) => { if (e.key === 'Enter') fire(); });
  });

  const policy = $('#policy');
  const openPolicy = () => { policy.hidden = false; lock(true); $('[data-policy-close]', policy).focus(); };
  const closePolicy = () => { policy.hidden = true; lock(false); $('#policyOpen').focus(); };
  $('#policyOpen').addEventListener('click', openPolicy);
  $('[data-policy-close]', policy).addEventListener('click', closePolicy);
  policy.addEventListener('click', (e) => { if (e.target === policy) closePolicy(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !policy.hidden) closePolicy(); });

  /* ---------- Качество: метки и чек-лист ---------- */
  $$('.pin').forEach((p) => p.addEventListener('click', () => {
    const was = p.classList.contains('is-open');
    $$('.pin').forEach((x) => x.classList.remove('is-open'));
    p.classList.toggle('is-open', !was);
  }));
  const checks = $$('#check input');
  checks.forEach((c) => c.addEventListener('change', () => {
    const n = checks.filter((x) => x.checked).length;
    $('#checkCount').textContent = `${n} / ${checks.length}`;
    $('#checkBar').style.width = (n / checks.length) * 100 + '%';
    $('#checkDone').classList.toggle('is-on', n === checks.length);
  }));

  /* ---------- Вопросы ---------- */
  $$('.acc__q').forEach((q) => q.addEventListener('click', () => {
    const open = q.getAttribute('aria-expanded') !== 'true';
    $$('.acc__q').forEach((x) => x.setAttribute('aria-expanded', 'false'));
    q.setAttribute('aria-expanded', open);
    hasGsap && setTimeout(() => ScrollTrigger.refresh(), 750);
  }));

  /* ---------- Форма ---------- */
  const form = $('#form');
  const area = $('#area');
  const areaOut = $('#areaOut');
  const updArea = () => {
    areaOut.textContent = `${area.value} м²`;
    area.style.setProperty('--p', ((area.value - area.min) / (area.max - area.min)) * 100 + '%');
  };
  area.addEventListener('input', updArea);
  updArea();

  const phone = $('#phone');
  const fmtPhone = (v) => {
    let d = v.replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  };
  phone.addEventListener('input', () => { phone.value = fmtPhone(phone.value); });
  phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7 ('; });
  phone.addEventListener('blur', () => { if (phone.value.replace(/\D/g, '').length <= 1) phone.value = ''; });

  const nameF = $('#name');
  const consent = $('#consent');
  const validate = () => {
    const okName = nameF.value.trim().length >= 2;
    const okPhone = phone.value.replace(/\D/g, '').length === 11;
    nameF.parentElement.classList.toggle('is-err', !okName);
    phone.parentElement.classList.toggle('is-err', !okPhone);
    consent.parentElement.classList.toggle('is-err', !consent.checked);
    return okName && okPhone && consent.checked;
  };
  [nameF, phone].forEach((f) => f.addEventListener('input', () => { if (f.parentElement.classList.contains('is-err')) validate(); }));
  consent.addEventListener('change', () => consent.parentElement.classList.remove('is-err'));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) { const bad = $('.is-err input', form); bad && bad.focus(); return; }
    const data = new FormData(form);
    $('#formOkText').textContent =
      `${nameF.value.trim()}, спасибо. ${data.get('type')}, ${area.value} м² — перезвоним на ${phone.value} в течение рабочего дня и договоримся о замере.`;
    $('#formOk').hidden = false;
  });
  $('#formReset').addEventListener('click', () => { form.reset(); updArea(); $('#formOk').hidden = true; });

  /* ================================================================
     АНИМАЦИИ
     ================================================================ */
  const loader = $('#loader');
  const hideLoader = () => { loader.style.display = 'none'; body.classList.remove('is-loading'); };

  if (!hasGsap || reduced) {
    hideLoader();
    $$('.pr').forEach((p) => p.classList.add('is-in'));
    // счётчик шагов процесса без GSAP
    $$('.step').forEach((s) => s.classList.add('is-on'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const ease = 'expo.out';

  /* --- Прелоадер + появление первого экрана --- */
  lock(true);
  scrollTo(0, 0);
  const heroWords = $$('.hero__title .w > span');
  gsap.set(heroWords, { yPercent: 110 });
  gsap.set('[data-fade]', { autoAlpha: 0, y: 24 });
  gsap.set('.hero__media img', { scale: 1.35 });
  gsap.set('.hero__pline', { scaleX: 0 });
  gsap.set('.loader__word span', { yPercent: 105 });

  const counter = { v: 0 };
  const tl = gsap.timeline({ defaults: { ease } });
  tl.to('.loader__word span', { yPercent: 0, duration: 1.1, stagger: .06 })
    .to(counter, {
      v: 100, duration: 1.5, ease: 'power2.inOut',
      onUpdate: () => {
        $('#loaderNum').textContent = Math.round(counter.v);
      },
    }, 0.1)
    .to('.loader__word span', { yPercent: -105, duration: .8, stagger: .04, ease: 'expo.in' }, '+=0.05')
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.25')
    .add(() => { hideLoader(); lock(false); })
    .to('.hero__media img', { scale: 1, duration: 2.4 }, '-=0.9')
    .to(heroWords, { yPercent: 0, duration: 1.4, stagger: .06 }, '<0.2')
    .to('[data-fade]', { autoAlpha: 1, y: 0, duration: 1.2, stagger: .08 }, '<0.3')
    .to('.hero__pline', { scaleX: 1, duration: 1.4 }, '<0.2');

  /* --- Hero: параллакс при прокрутке --- */
  gsap.to('.hero__media img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__grid', { yPercent: 18, autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* --- Заголовки по словам (кроме hero) --- */
  $$('[data-split]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from($$('.w > span', el), {
      yPercent: 110, duration: 1.3, stagger: .05, ease,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  /* --- Манифест: слова проявляются при прокрутке --- */
  gsap.to('#manifesto .mw', {
    opacity: 1, stagger: .1, ease: 'none',
    scrollTrigger: {
      trigger: '#manifesto', start: 'top 80%', end: 'bottom 45%', scrub: true,
      // черта под словом появляется, когда слово проявилось
      onUpdate: () => $$('#manifesto .hl').forEach((h) => h.classList.toggle('is-on', +getComputedStyle(h.parentElement).opacity > .9)),
    },
  });
  gsap.from('.approach__mark .mark', {
    rotate: -90, scale: .6, autoAlpha: 0, duration: 1.6, ease,
    scrollTrigger: { trigger: '.approach__mark', start: 'top 90%' },
  });

  /* --- Линии-черты --- */
  $$('[data-rule]').forEach((r) => gsap.from(r, {
    scaleX: 0, duration: 1.8, ease,
    scrollTrigger: { trigger: r, start: 'top 95%' },
  }));

  /* --- Принципы: схема дорисовывается --- */
  $$('.pr').forEach((p) => ScrollTrigger.create({ trigger: p, start: 'top 80%', once: true, onEnter: () => p.classList.add('is-in') }));

  /* --- Текстовые блоки --- */
  const fadeSel = '.label, .pr__text, .pr__title, .svc__text, .svc__name, .svc__tag, .approach__text, .shead__note, .proj__meta > *, .q__check, .final__info, .form, .pp-points li, .acc__q, .footer__top > *, .process__count';
  gsap.set(fadeSel, { autoAlpha: 0, y: 30 });
  ScrollTrigger.batch(fadeSel, {
    start: 'top 92%',
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.2, stagger: .07, ease, overwrite: true }),
  });

  /* --- Фото: шторка + параллакс --- */
  $$('.media').forEach((m) => {
    const im = $('img', m);
    gsap.fromTo(m, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease,
      scrollTrigger: { trigger: m, start: 'top 90%' },
      onComplete: () => gsap.set(m, { clearProps: 'clipPath' }),
    });
    if (!im) return;
    gsap.fromTo(im, { scale: 1.3 }, { scale: 1, duration: 2, ease, scrollTrigger: { trigger: m, start: 'top 90%' } });
    if (im.offsetHeight > m.offsetHeight + 4) {
      gsap.fromTo(im, { yPercent: -12 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  });

  /* --- Бегущая строка: постоянная скорость --- */
  const track = $('#marquee');
  let mx = 0;
  gsap.ticker.add((time, dt) => {
    const half = track.scrollWidth / 2;
    mx -= 0.05 * dt; // ≈ 50 px/с независимо от частоты кадров
    if (mx <= -half) mx += half;
    track.style.transform = `translate3d(${mx}px,0,0)`;
  });

  /* --- Паспорт: окно «выезжает» навстречу --- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    gsap.fromTo('.pp', { scale: .88, y: 80 }, {
      scale: 1, y: 0, ease: 'none',
      scrollTrigger: { trigger: '.pp-wrap', start: 'top bottom', end: 'top 15%', scrub: true },
    });
  });

  /* --- Процесс: горизонтальная лента --- */
  const steps = $$('.step');
  const procNow = $('#procNow');
  mm.add('(min-width: 901px)', () => {
    const trackEl = $('#processTrack');
    const dist = () => trackEl.scrollWidth - innerWidth;
    gsap.to(trackEl, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '#processPin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
        onUpdate: (self) => {
          $('#processBar').style.transform = `scaleX(${self.progress})`;
          const idx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999 + 0.35));
          steps.forEach((s, i) => s.classList.toggle('is-on', i <= idx));
          procNow.textContent = String(idx + 1).padStart(2, '0');
        },
      },
    });
  });
  mm.add('(max-width: 900px)', () => {
    steps.forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 75%', onEnter: () => s.classList.add('is-on'), onLeaveBack: () => s.classList.remove('is-on') }));
  });

  /* --- Финальный экран --- */
  gsap.fromTo('.final__img img', { yPercent: -14 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.final__hero', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.fromTo('.final__img', { clipPath: 'inset(12% 8% 12% 8%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
    scrollTrigger: { trigger: '.final__hero', start: 'top bottom', end: 'top top', scrub: true },
  });

  /* --- Футер: буквы поднимаются --- */
  gsap.from('#footerWord span', {
    yPercent: 100, duration: 1.4, stagger: .06, ease,
    scrollTrigger: { trigger: '#footerWord', start: 'top 95%' },
  });

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
