/* Reconcept Quiz v1.1.0 — vanilla JS, без зависимостей */
(function () {
  'use strict';

  /* ---------- НАСТРОЙКИ (правятся здесь) ---------- */
  var CFG = {
    YM: 5609182,
    EUR: 100,          // руб. за евро
    HOUR: 40 * 100,    // 4000 руб/час
    TPL_PAGE: 1600,    // типовая страница
    MULTI_BASE: 120000,
    ASTRO_K: 2,
    ASTRO_MIN: 120000,
    SOFT_LIMIT: 60,    // часов: граница модуль/Astro
    LINKS: {
      tg: 'https://t.me/vesnin',
      max: 'https://max.ru/u/f9LHodD0cOLzIoHQFDNyrCKPvcLAdhvTg_SuRq5XdCnqyc_cAKB8rhm9kVM'
    }
  };

  /* ---------- СТАВКИ ---------- */
  var RATE_COMPANY = { ip: 5000, u20: 5000, u100: 10000, o100: 10000, holding: 10000 };

  /* ---------- ФУНКЦИОНАЛ ----------
     hard   — жёсткий триггер Astro
     native — штатно в Тильде (не тарифицируется на чистой Тильде)
     h      — часы [min, max] для Astro и внешних модулей            */
  var FEATURES = {
    leads:     { t: 'Принимать заявки в Telegram и почту', h: [0, 0], native: true, always: true },
    calc:      { t: 'Считать стоимость онлайн', h: [12, 20], native: true },
    booking:   { t: 'Записывать на встречу или бронировать', h: [20, 30], native: true },
    pay:       { t: 'Принимать оплату', h: [15, 25], native: true },
    crm:       { t: 'Складывать заявки в CRM', h: [8, 15], native: true },
    catalog:   { t: 'Каталог с фильтрами и поиском', h: [40, 60], native: true },
    cabinet:   { t: 'Личный кабинет клиента', h: [40, 80], hard: true },
    onec:      { t: 'Обмен с 1С или складом', h: [30, 60], hard: true },
    multilang: { t: 'Несколько языков', h: [20, 30], hard: true },
    anim:      { t: 'Сложные анимации и 3D', h: [20, 60] }
  };

  /* ---------- ВОПРОСЫ ---------- */
  var Q = {
    q_task: {
      t: 'Что должен делать сайт?',
      o: [
        ['a', 'Продавать услуги, приносить заявки'],
        ['b', 'Продавать товары'],
        ['c', 'Представлять компанию, вызывать доверие'],
        ['d', 'Приводить людей из поиска, отвечать на их вопросы'],
        ['f', 'Другое']
      ]
    },
    q_scale_a: {
      t: 'Сколько разных услуг или категорий продукции нужно разместить на сайте?',
      hint: 'Например, у завода металлоконструкций: ангары, навесы, фермы, лестницы — это 4',
      o: [['s1', '1–2'], ['s2', '3–7'], ['s3', '8–15'], ['s4', 'Больше 15'], ['unknown', 'Пока не знаю']]
    },
    q_scale_b: {
      t: 'Сколько товаров в каталоге?',
      o: [['s1', 'До 50'], ['s2', '50–500'], ['s3', '500–5 000'], ['s4', 'Больше 5 000'], ['unknown', 'Пока не знаю']]
    },
    q_scale_c: {
      t: 'Что нужно показать на сайте?', multi: true,
      hint: 'Можно выбрать несколько',
      o: [
        ['about', 'О компании'], ['team', 'Команда'], ['cases', 'Проекты и кейсы'],
        ['services', 'Услуги или продукция'], ['prod', 'Производство'],
        ['docs', 'Сертификаты и документы'], ['jobs', 'Вакансии'],
        ['news', 'Новости'], ['contacts', 'Контакты']
      ]
    },
    q_scale_d: null,
    q_source: {
      t: 'Откуда придут люди?',
      o: [
        ['ads', 'Реклама в Яндексе'], ['seo', 'Поиск, органика'],
        ['social', 'Соцсети и Telegram'], ['offline', 'Офлайн, визитка, тендеры'],
        ['unknown', 'Пока не знаю']
      ]
    },
    q_features: {
      t: 'Что сайт должен уметь?', multi: true,
      hint: 'Можно выбрать несколько. Заявки в Telegram и почту входят всегда',
      o: [
        ['calc', FEATURES.calc.t], ['booking', FEATURES.booking.t], ['pay', FEATURES.pay.t],
        ['crm', FEATURES.crm.t], ['catalog', FEATURES.catalog.t], ['cabinet', FEATURES.cabinet.t],
        ['onec', FEATURES.onec.t], ['multilang', FEATURES.multilang.t], ['anim', FEATURES.anim.t],
        ['none', 'Ничего из этого']
      ]
    },
    q_rhythm: {
      t: 'Кто будет вести контент?',
      o: [
        ['often', 'Хотим часто менять и тестировать, нашими руками'],
        ['rare', 'Правки редкие, можем просить вас'],
        ['no', 'Контента почти не будет'],
        ['unknown', 'Пока не знаю']
      ]
    },
    q_company: {
      t: 'Масштаб компании',
      o: [
        ['ip', 'ИП или частная практика'], ['u20', 'До 20 человек'],
        ['u100', '20–100 человек'], ['o100', 'Больше 100 человек'],
        ['holding', 'Холдинг, госструктура, тендеры']
      ]
    }
  };

  Q.q_scale_d = Q.q_scale_a;
  var COMPANY_T = {}, TASK_T = {
    a: 'заявки на услуги', b: 'продажа товаров',
    c: 'представление компании', d: 'трафик из поиска'
  };
  Q.q_company.o.forEach(function (x) { COMPANY_T[x[0]] = x[1]; });

  /* ---------- СОСТОЯНИЕ ---------- */
  var KEY = 'rq_state_v2';
  var S = { a: {}, idx: 0, sid: '', started: false, done: false, max: 0 };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var p = JSON.parse(raw); if (p && p.a) S = p; }
    } catch (e) {}
    if (!S.sid) S.sid = 'RQ-' + Date.now().toString(36).toUpperCase();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} S = { a: {}, idx: 0, sid: 'RQ-' + Date.now().toString(36).toUpperCase(), started: false, done: false, max: 0 }; }

  /* ---------- МЕТРИКА ---------- */
  function ym(goal, params) {
    try {
      if (typeof window.ym === 'function') {
        window.ym(CFG.YM, 'reachGoal', goal);
        if (params) window.ym(CFG.YM, 'params', { quiz: params });
      }
    } catch (e) {}
  }

  /* ---------- ОЧЕРЕДЬ ВОПРОСОВ ---------- */
  function queue() {
    var t = S.a.q_task;
    if (!t || t === 'f') return ['q_task'];
    var q = ['q_task', 'q_scale_' + t], sc = S.a.q_scale_a;
    if (t === 'a' && (!sc || sc === 's1')) q.push('q_source');
    q.push('q_features', 'q_rhythm', 'q_company');
    return q;
  }

  /* ---------- РАСЧЁТ ---------- */
  function rate() { return RATE_COMPANY[S.a.q_company] || 5000; }

  function scope() {
    var eff = S.a.q_task, sc = S.a['q_scale_' + eff], src = S.a.q_source;
    if (eff === 'a') {
      if (sc === 's1' && (src === 'ads' || src === 'social')) return { kind: 'landing', n: [6, 8] };
      if (sc === 's2') return { kind: 'multi', n: [7, 12] };
      if (sc === 's1' || !sc || sc === 'unknown') return { kind: 'multi', n: [5, 7] };
      if (sc === 's3') return { kind: 'multi', n: [10, 18] };
      return { kind: 'multi', n: [20, 35] };
    }
    if (eff === 'b') {
      if (sc === 's1') return { kind: 'shop', n: [5, 7] };
      if (sc === 's2') return { kind: 'shop', n: [6, 9] };
      if (sc === 's3') return { kind: 'shop', n: [8, 12] };
      if (sc === 's4') return { kind: 'shop', n: [10, 15] };
      return { kind: 'shop', n: [6, 9] };
    }
    if (eff === 'c') {
      var sel = S.a.q_scale_c || [];
      var n = sel.length + (sel.indexOf('cases') > -1 ? 2 : 0) + (sel.indexOf('news') > -1 ? 2 : 0);
      n = Math.max(5, n);
      return { kind: 'multi', n: [n, n + 2] };
    }
    // D: как A + раздел материалов (+2)
    if (sc === 's2') return { kind: 'multi', n: [9, 14] };
    if (sc === 's3') return { kind: 'multi', n: [12, 20] };
    if (sc === 's4') return { kind: 'multi', n: [22, 37] };
    return { kind: 'multi', n: [7, 9] };
  }

  function feats() {
    var sel = (S.a.q_features || []).filter(function (k) { return k !== 'none' && FEATURES[k]; });
    if (S.a.q_task === 'b' && sel.indexOf('catalog') < 0) sel.unshift('catalog');
    var hard = false, h0 = 0, h1 = 0, nonNative0 = 0, nonNative1 = 0;
    sel.forEach(function (k) {
      var f = FEATURES[k];
      if (f.hard) hard = true;
      h0 += f.h[0]; h1 += f.h[1];
      if (!f.native) { nonNative0 += f.h[0]; nonNative1 += f.h[1]; }
    });
    return { sel: sel, hard: hard, h: [h0, h1], soft: [nonNative0, nonNative1] };
  }

  function platform(f) {
    if (f.hard || S.a.q_company === 'holding' || S.a.q_scale_b === 's4') return 'astro';
    if (S.a.q_rhythm === 'often') return f.soft[1] > 0 ? 'module' : 'tilda';
    if (f.soft[1] > CFG.SOFT_LIMIT) return 'astro';
    if (f.soft[1] > 0) return 'module';
    return 'tilda';
  }

  function baseTilda(sp, r, pages) {
    if (sp.kind === 'landing') return pages * r;
    var ind = Math.min(pages, 20), tpl = Math.max(0, pages - 20);
    return CFG.MULTI_BASE * (r / 5000) + Math.max(0, ind - 6) * r * 2.5 + tpl * CFG.TPL_PAGE;
  }

  function calc() {
    var sp = scope(), r = rate(), f = feats(), p = platform(f);

    function total(pages, hours) {
      var b = baseTilda(sp, r, pages);
      if (p === 'astro') b = Math.max(b * CFG.ASTRO_K, CFG.ASTRO_MIN);
      var fee = 0;
      if (p === 'astro') fee = hours * CFG.HOUR;
      else if (p === 'module') fee = hours * CFG.HOUR;
      return b + fee;
    }
    var lo = total(sp.n[0], p === 'astro' ? f.h[0] : f.soft[0]);
    var hi = total(sp.n[1], p === 'astro' ? f.h[1] : f.soft[1]);

    // альтернатива на Astro для сравнения
    var altLo = 0, altHi = 0;
    if (p !== 'astro') {
      altLo = (Math.max(baseTilda(sp, r, sp.n[0]) * CFG.ASTRO_K, CFG.ASTRO_MIN) + f.h[0] * CFG.HOUR);
      altHi = (Math.max(baseTilda(sp, r, sp.n[1]) * CFG.ASTRO_K, CFG.ASTRO_MIN) + f.h[1] * CFG.HOUR);
    }

    return {
      scope: sp, rate: r, f: f, platform: p,
      lo: rnd(lo, 0), hi: rnd(hi, 1),
      altLo: rnd(altLo, 0), altHi: rnd(altHi, 1),
      weeks: weeks(sp, p, sp.n[1]),
      altWeeks: weeks(sp, 'astro', sp.n[1])
    };
  }

  function rnd(v, up) {
    var s = v < 300000 ? 5000 : 10000;
    return (up ? Math.ceil(v / s) : Math.round(v / s)) * s;
  }

  function weeks(sp, p, pages) {
    var astro = p === 'astro', w;
    if (sp.kind === 'landing') w = astro ? 4 : 2;
    else if (sp.kind === 'shop') w = astro ? 10 : 5;
    else if (pages > 12) w = astro ? 10 : 6;
    else w = astro ? 8 : 4;
    if (p === 'module') w += 2;
    return w;
  }

  /* ---------- ТЕКСТЫ РЕШЕНИЯ ---------- */
  var FORMAT_T = { landing: 'Одностраничный сайт', multi: 'Многостраничный сайт', shop: 'Интернет-магазин' };
  var PLATFORM_T = { tilda: 'на Тильде', module: 'на Тильде с внешним модулем', astro: 'на своём коде (Astro)' };

  function reasons(c) {
    var r = [], f = c.f;
    if (c.platform === 'tilda') {
      if (S.a.q_rhythm === 'often') r.push('Вы хотите часто менять контент своими руками — на Тильде это делается без разработчика.');
      r.push('Запуск быстрее и дешевле: от ' + c.weeks + ' недель.');
      r.push('SEO-база закрывается полностью, но потолок оптимизации ниже, чем на своём коде.');
    } else if (c.platform === 'module') {
      var name = f.sel.filter(function (k) { return !FEATURES[k].native; }).map(function (k) { return FEATURES[k].t.toLowerCase(); })[0] || 'нужную функцию';
      r.push('Сайт на Тильде, а ' + name + ' разворачиваем отдельно и подключаем к нему.');
      r.push('Контент остаётся под вашим управлением, кастом — под нашим.');
      r.push('Дешевле полной разработки при том же результате для пользователя.');
    } else {
      var hardNames = f.sel.filter(function (k) { return FEATURES[k].hard; }).map(function (k) { return FEATURES[k].t.toLowerCase(); });
      if (S.a.q_company === 'holding') hardNames.push('требования к своему серверу и коду');
      if (S.a.q_scale_b === 's4') hardNames.push('каталог больше 5 000 позиций');
      if (hardNames.length) r.push(hardNames[0].charAt(0).toUpperCase() + hardNames[0].slice(1) + ' — на конструкторе не делается.');
      r.push('Максимум из технического SEO и скорости загрузки.');
      r.push('Код и сервер ваши, платформа вас ничем не ограничивает.');
    }
    return r;
  }

  function works(c) {
    var w = ['Индивидуальный дизайн', 'Адаптив: десктоп, планшет, смартфон'];
    w.push(c.scope.kind === 'landing'
      ? 'Вёрстка ' + c.scope.n[0] + '–' + c.scope.n[1] + ' экранов'
      : 'Вёрстка ' + c.scope.n[0] + '–' + c.scope.n[1] + ' страниц');
    w.push('Базовая SEO-оптимизация');
    w.push('Формы заявок в Telegram и на почту');
    w.push('Подключение домена и запуск');
    c.f.sel.forEach(function (k) { w.push(FEATURES[k].t); });
    w.push('Обучение работе с сайтом');
    return w;
  }

  function money(n) { return n.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽'; }

  function diagnosis() {
    var p = [TASK_T[S.a.q_task] || 'сайт'];
    if (S.a.q_company) p.push((COMPANY_T[S.a.q_company] || '').toLowerCase());
    var src = { ads: 'трафик из рекламы', seo: 'трафик из поиска', social: 'трафик из соцсетей', offline: 'офлайн-аудитория' }[S.a.q_source];
    if (src && S.a.q_task === 'a') p.push(src);
    p[0] = p[0].charAt(0).toUpperCase() + p[0].slice(1);
    return p.join(' · ');
  }

  /* ---------- РЕНДЕР ---------- */
  var root;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render() {
    root.innerHTML = '';
    if (S.done) return renderResult();
    var q = queue(), id = q[Math.min(S.idx, q.length - 1)];
    if (S.idx >= q.length) { finish(); return; }
    renderQuestion(id, q.length);
  }

  function renderQuestion(id, total) {
    var cfg = Q[id];
    var wrap = el('div', 'rq-step');

    var head = el('div', 'rq-head');
    head.appendChild(el('div', 'rq-count', 'Вопрос ' + (S.idx + 1) + ' из ' + total));
    var bar = el('div', 'rq-bar');
    bar.appendChild(el('i', '', ''));
    bar.firstChild.style.width = Math.round((S.idx / total) * 100) + '%';
    head.appendChild(bar);
    wrap.appendChild(head);

    wrap.appendChild(el('h3', 'rq-q', esc(cfg.t)));
    if (cfg.hint) wrap.appendChild(el('p', 'rq-hint', esc(cfg.hint)));

    var list = el('div', 'rq-opts');
    var picked = S.a[id];
    (cfg.o || []).forEach(function (o, i) {
      var b = el('button', 'rq-opt');
      b.type = 'button';
      b.setAttribute('data-v', o[0]);
      var on = cfg.multi ? (picked || []).indexOf(o[0]) > -1 : picked === o[0];
      if (on) b.className += ' is-on';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.innerHTML = '<span class="rq-key">' + (i < 9 ? i + 1 : '') + '</span><span>' + esc(o[1]) + '</span>';
      b.addEventListener('click', function () { pick(id, o[0], cfg); });
      list.appendChild(b);
    });
    wrap.appendChild(list);


    var nav = el('div', 'rq-nav');
    if (S.idx > 0) {
      var back = el('button', 'rq-back', 'Назад');
      back.type = 'button';
      back.addEventListener('click', function () { S.idx--; ym('quiz_back', { back_from: id }); save(); render(); scrollTop(); });
      nav.appendChild(back);
    }
    if (cfg.multi) {
      var next = el('button', 'rq-next', 'Далее');
      next.type = 'button';
      next.addEventListener('click', function () { step(id); });
      nav.appendChild(next);
    }
    wrap.appendChild(nav);
    root.appendChild(wrap);
  }

  function pick(id, val, cfg) {
    if (!S.started) { S.started = true; ym('quiz_start'); }
    if (cfg.multi) {
      var arr = S.a[id] ? S.a[id].slice() : [];
      if (val === 'none' || val === 'dunno') arr = arr.indexOf(val) > -1 ? [] : [val];
      else {
        arr = arr.filter(function (x) { return x !== 'none' && x !== 'dunno'; });
        var i = arr.indexOf(val);
        if (i > -1) arr.splice(i, 1); else arr.push(val);
      }
      S.a[id] = arr; save(); render();
    } else {
      if (S.a[id] !== val) {
        S.a[id] = val;
        if (id === 'q_task' || id === 'q_scale_a') {
          (id === 'q_task' ? ['q_scale_a', 'q_scale_b', 'q_scale_c', 'q_scale_d', 'q_source'] : ['q_source']).forEach(function (k) { delete S.a[k]; });
        }
      }
      save();
      setTimeout(function () { step(id); }, 180);
    }
  }

  var t0 = Date.now();
  function step(id) {
    var n = S.idx + 1, sec = Math.round((Date.now() - t0) / 1000);
    if (n > S.max) S.max = n;
    ym('quiz_step_' + n, { max_step: S.max, last_q: id, ['t_' + id]: sec });
    S.idx++;
    save();
    var q = queue();
    if (S.idx >= q.length) finish(); else { render(); scrollTop(); }
  }

  function finish() {
    S.done = true; save();
    render(); scrollTop();
  }

  function scrollTop() {
    t0 = Date.now();
    var r = root.getBoundingClientRect();
    if (r.top < 0) window.scrollTo({ top: window.pageYOffset + r.top - 20, behavior: 'smooth' });
  }

  /* ---------- РЕЗУЛЬТАТ ---------- */
  function renderResult() {
    var free = S.a.q_task === 'f';
    var c = free ? null : calc();
    var wrap = el('div', 'rq-result');

    wrap.appendChild(el('div', 'rq-count', 'Готово'));

    if (free) {
      wrap.appendChild(el('h3', 'rq-q', 'Задача нетиповая — посчитаем лично'));
      wrap.appendChild(el('p', 'rq-lead', 'Шаблонный расчёт тут ничего не даст. Напишите, в двух словах, что нужно — разберём задачу и назовём цифру.'));
      ym('quiz_result', { task: 'other' });
    } else {
      wrap.appendChild(el('p', 'rq-diag', esc(diagnosis())));
      wrap.appendChild(el('h3', 'rq-q', esc(FORMAT_T[c.scope.kind] + ' ' + PLATFORM_T[c.platform])));

      var ul = el('ul', 'rq-why');
      reasons(c).forEach(function (t) { ul.appendChild(el('li', '', esc(t))); });
      wrap.appendChild(ul);

      var price = el('div', 'rq-price');
      price.appendChild(el('div', 'rq-num', money(c.lo) + ' – ' + money(c.hi)));
      price.appendChild(el('div', 'rq-term', 'Срок: от ' + c.weeks + ' недель'));
      wrap.appendChild(price);

      var cols = el('div', 'rq-cols');
      var w = el('div', 'rq-works');
      w.appendChild(el('h4', '', 'Что входит'));
      var wl = el('ul', '');
      works(c).forEach(function (t) { wl.appendChild(el('li', '', esc(t))); });
      w.appendChild(wl);
      cols.appendChild(w);

      var showAlt = c.platform !== 'astro' && S.a.q_rhythm !== 'often' &&
        S.a.q_company !== 'ip' && S.a.q_company !== 'u20' && c.altHi > c.hi;
      if (showAlt) {
        var alt = el('div', 'rq-alt');
        alt.appendChild(el('h4', '', 'Альтернатива: на своём коде'));
        alt.appendChild(el('div', 'rq-num rq-num--sm', money(c.altLo) + ' – ' + money(c.altHi)));
        alt.appendChild(el('div', 'rq-term', 'Срок: от ' + c.altWeeks + ' недель'));
        alt.appendChild(el('p', '', 'Дороже и дольше, зато максимальная скорость загрузки, потолок по SEO выше, код и сервер ваши, любой функционал возможен.'));
        cols.appendChild(alt);
      }
      wrap.appendChild(cols);

      wrap.appendChild(el('p', 'rq-disc', 'Это ориентир по похожим проектам. Точная смета — после обсуждения задачи и технического задания. Цена может измениться в обе стороны.'));

      ym('quiz_result', {
        task: S.a.q_task, company: S.a.q_company,
        format: c.scope.kind, platform: c.platform, min: c.lo, max: c.hi
      });
    }

    var bonus = el('div', 'rq-bonus');
    bonus.appendChild(el('h4', '', 'Бесплатная консультация 30 минут'));
    bonus.appendChild(el('p', '', 'Разберём задачу и отдадим структуру будущего сайта — даже если работать будете не с нами.'));
    wrap.appendChild(bonus);

    var btns = el('div', 'rq-btns');
    [['tg', 'Написать в Telegram', 'quiz_tg'], ['max', 'Написать в MAX', 'quiz_max']].forEach(function (b, i) {
      var a = el('a', 'rq-btn' + (i === 0 ? ' rq-btn--main' : ''), esc(b[1]));
      a.href = CFG.LINKS[b[0]];
      a.target = '_blank';
      a.rel = 'noopener';
      a.addEventListener('click', function () { ym(b[2], { contact: b[0] }); });
      btns.appendChild(a);
    });
    wrap.appendChild(btns);

    var again = el('button', 'rq-again', 'Пройти заново');
    again.type = 'button';
    again.addEventListener('click', function () { reset(); render(); scrollTop(); });
    wrap.appendChild(again);

    root.appendChild(wrap);
  }

  /* ---------- КЛАВИАТУРА ---------- */
  function keys(e) {
    if (S.done || !root.contains(document.activeElement)) return;
    var q = queue(), id = q[Math.min(S.idx, q.length - 1)], cfg = Q[id];
    if (!cfg) return;
    if (e.key === 'Escape' && S.idx > 0) { S.idx--; save(); render(); scrollTop(); return; }
    if (e.key === 'Enter' && cfg.multi && document.activeElement.tagName !== 'BUTTON') { step(id); return; }
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9 && cfg.o && cfg.o[n - 1]) {
      pick(id, cfg.o[n - 1][0], cfg);
    }
  }

  /* ---------- СТАРТ ---------- */
  function init() {
    root = document.getElementById('rq');
    if (!root) return;
    root.className = 'rq';
    load();
    render();
    document.addEventListener('keydown', keys);
    if ('IntersectionObserver' in window) {
      var seen = false;
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !seen) { seen = true; t0 = Date.now(); ym('quiz_view'); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(root);
    }
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { S: S, calc: calc, queue: queue, rate: rate, scope: scope, feats: feats, platform: platform, CFG: CFG }; return; }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
