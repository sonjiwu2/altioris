import { escape as e, badge, date, dayName, empty, icon, key, line, range, tab, when } from '../ui.js';

const calendarIcon = icon('calendar');
const stories = [
  ['calendar', 'Учебный офис · 22 ноября', 'График консультаций на сессию', '/news/consultations'],
  ['flask', 'Студенческий клуб · 21 ноября', 'Открыта запись на медиалабораторию', '/news/media-lab'],
];
const signalDescription = 'Студенческие команды покажут прототипы и расскажут, как проверяли свои идеи. После выступлений можно задать вопросы авторам.';

function lessonState(lesson, now, upcoming) {
  if (new Date(lesson.start) <= now && now < new Date(lesson.end)) return 'Сейчас';
  return upcoming === lesson.id ? 'Ближайшая' : '';
}

export function home({ campus }) {
  const now = new Date(campus.clock);
  const today = campus.lessons.filter(lesson => key(lesson.start) === key(now));
  const upcoming = today.find(lesson => new Date(lesson.start) > now)?.id;
  return `<h1>Главная</h1>
    <section aria-labelledby="news-heading">
      <h2 id="news-heading">Новости кампуса</h2>
      <div class="home-news">
        <article class="signal">
          <div class="signal-content">
            <h3>СИГНАЛ</h3><p>Вечер студенческих проектов</p>
            <p class="signal-meta"><strong>27 ноября</strong><span>18:00</span><span>Атриум корпуса Б</span></p>
            <a class="button button-light" href="/news/signal">О событии ${icon('out')}</a>
          </div>
        </article>
        <div class="news-list panel">${stories.map(([glyph, meta, title, href]) => `<a href="${href}">${icon(glyph)}<span><small>${meta}</small><strong>${title}</strong></span>${icon('right')}</a>`).join('')}</div>
      </div>
    </section>
    <section class="agenda" aria-labelledby="agenda-heading">
      <div class="section-heading"><div><h2 id="agenda-heading">Пары сегодня</h2><p class="muted sentence">${dayName(now)}</p></div><a class="text-link" href="/schedule">Всё расписание ${icon('out')}</a></div>
      <div class="panel agenda-list">${today.length ? today.map(lesson => {
        const status = lessonState(lesson, now, upcoming);
        const teacher = campus.teachers.find(person => person.id === lesson.teacherId);
        return `<a class="agenda-row${status ? ' emphasized' : ''}" href="/schedule?lesson=${encodeURIComponent(lesson.id)}">
          <time datetime="${e(lesson.start)}">${range(lesson.start, lesson.end)}</time>
          <span><strong>${e(lesson.title)}</strong> ${status ? badge(status, 'peach') : ''}<small>${e(lesson.type)}${teacher ? ` · ${e(teacher.shortName)}` : ''}</small></span>
          <span class="room">${e(lesson.room)}</span>
        </a>`;
      }).join('') : empty('Сегодня занятий нет.')}</div>
    </section>`;
}

export function news(path) {
  const back = `<a class="text-link back-link" href="/#news-heading">${icon('back')} К новостям</a>`;
  if (path === '/news/signal') return `${back}<p class="muted eyebrow">Афиша кампуса</p>
    <h1 class="editorial-title">СИГНАЛ</h1><p class="editorial-subtitle">Вечер студенческих проектов</p>
    <div class="split story-grid"><article>
      <img class="story-image signal-image" src="/assets/signal.webp" width="850" height="267" alt="">
      <p>${signalDescription}</p>
      <h2>Программа</h2>
      <dl class="program">${[['18:00', 'Открытие'], ['18:10', 'Презентации команд'], ['19:00', 'Вопросы и общение']].map(([at, title]) => `<div><dt>${at}</dt><dd>${title}</dd></div>`).join('')}</dl>
    </article><aside class="panel story-details">${line('calendar', '<strong>27 ноября · 18:00–19:30</strong>')}${line('pin', 'Атриум корпуса Б')}${line('ticket', 'Вход свободный')}<a class="button" href="/api/calendar/signal" download>Добавить в календарь</a></aside></div>`;
  if (path === '/news/consultations') return `${back}<p class="muted eyebrow">Учебный офис · 22 ноября</p>
    <h1 class="editorial-title">График консультаций на сессию</h1>
    <p class="lead">Задайте вопросы по темам экзаменов и формату пересдачи. Предварительная запись не нужна.</p>
    <div class="panel data-grid"><div class="table-heading"><span>Дисциплина</span><span>Дата и время</span><span>Корпус и аудитория</span></div>
    <div><strong>Операционные системы</strong><span>25 ноября · 16:20–17:00</span><span>Корпус Б · ауд. 412</span></div>
    <div><strong>Теория вычислений</strong><span>26 ноября · 16:20–17:00</span><span>Корпус А · ауд. 204</span></div></div>
    <p class="notice">С собой можно взять конспекты и список вопросов.</p>
    <a class="text-link" href="/schedule/exams">Открыть расписание экзаменов ${icon('out')}</a>`;
  if (path === '/news/media-lab') return `${back}<div class="split media-layout"><article>
    <p class="muted eyebrow">Студенческий клуб · 21 ноября</p><h1 class="editorial-title">Открыта запись<br>на медиалабораторию</h1>
    <p class="lead">За четыре встречи вы попробуете снять короткое видео, записать звук и собрать первый монтаж. Опыт не нужен.</p>
    <div class="panel story-details">${line('calendar', '<strong>Первая встреча</strong><br>2 декабря · 17:30')}${line('pin', 'Медиастудия · корпус В, ауд. 215')}</div>
    <p>${badge('Запись до 25 ноября · 20:00')}</p>
    <a href="/requests?new=media-lab" class="button">Подать заявку</a>
    </article><img class="story-image studio" src="/assets/media-lab.webp" width="638" height="674" alt="Камера на штативе в медиастудии"></div>`;
  return `<h1>Страница не найдена</h1>${back}`;
}

function scheduleHeader(exams) {
  return `<h1>Расписание</h1><nav class="tabs" aria-label="Виды расписания">${tab('/schedule', 'Занятия', !exams)}${tab('/schedule/exams', 'Экзамены', exams)}</nav>`;
}

function shiftDay(day, change) {
  const value = new Date(`${day}T12:00:00+03:00`);
  value.setUTCDate(value.getUTCDate() + change);
  return key(value);
}

function startOfWeek(day) {
  const weekday = new Date(`${day}T12:00:00+03:00`).getUTCDay();
  return shiftDay(day, -((weekday + 6) % 7));
}

function scheduleLink(day, mode, label, className = '', accessibleName = '') {
  return `<a class="${className}" href="/schedule?day=${day}&amp;view=${mode}"${accessibleName ? ` aria-label="${accessibleName}"` : ''}>${label}</a>`;
}

export function schedule({ campus }, params) {
  const activeLesson = campus.lessons.find(lesson => lesson.id === params.get('lesson'));
  const requestedDay = params.get('day');
  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(requestedDay ?? '') && !Number.isNaN(Date.parse(requestedDay));
  const today = key(campus.clock);
  const day = activeLesson ? key(activeLesson.start) : validDay ? requestedDay : today;
  const view = params.get('view');
  const mode = view === 'day' || view === 'week' ? view : matchMedia('(max-width: 680px)').matches ? 'day' : 'week';
  const week = startOfWeek(day);
  const days = mode === 'day' ? [day] : Array.from({ length: 5 }, (_, index) => shiftDay(week, index));
  if (mode === 'week' && campus.lessons.some(lesson => [shiftDay(week, 5), shiftDay(week, 6)].includes(key(lesson.start)))) days.push(shiftDay(week, 5), shiftDay(week, 6));
  const shown = campus.lessons.filter(lesson => days.includes(key(lesson.start)));
  const selected = activeLesson || shown.find(lesson => key(lesson.start) === day) || shown[0];
  const teacher = selected && campus.teachers.find(person => person.id === selected.teacherId);
  const distance = mode === 'day' ? 1 : 7;
  const now = new Date(campus.clock);
  return `${scheduleHeader(false)}<div class="split schedule-layout">
    <section class="panel calendar" aria-label="Календарь занятий">
      <div class="calendar-tools"><div class="inline-group">
        ${scheduleLink(shiftDay(day, -distance), mode, icon('left'), 'icon-button', mode === 'day' ? 'Предыдущий день' : 'Предыдущая неделя')}
        ${scheduleLink(today, mode, 'Сегодня', 'button button-plain')}
        ${scheduleLink(shiftDay(day, distance), mode, icon('right'), 'icon-button', mode === 'day' ? 'Следующий день' : 'Следующая неделя')}
      </div><div class="inline-group">${scheduleLink(day, 'day', 'День', `button button-plain ${mode === 'day' ? 'selected' : ''}`)}${scheduleLink(day, 'week', 'Неделя', `button button-plain ${mode === 'week' ? 'selected' : ''}`)}</div></div>
      <div class="calendar-now"><strong class="sentence">${mode === 'day' ? dayName(`${day}T12:00:00+03:00`) : `${date(`${week}T12:00:00+03:00`)} — ${date(`${shiftDay(week, 6)}T12:00:00+03:00`)}`}</strong><span class="muted">${when(now)} · Москва</span></div>
      <div class="calendar-scroll" role="region" aria-label="Дни расписания" tabindex="0">
      <div class="calendar-grid ${mode === 'day' ? 'single-day' : ''}">${days.map(value => {
        const lessons = shown.filter(lesson => key(lesson.start) === value);
        const label = new Intl.DateTimeFormat('ru-RU', { weekday: mode === 'day' ? 'long' : 'short', day: 'numeric', timeZone: 'Europe/Moscow' }).format(new Date(`${value}T12:00:00+03:00`));
        return `<div class="calendar-day"><h2 class="${value === today ? 'selected' : ''} sentence">${label}</h2>${lessons.map(lesson => {
          const status = lessonState(lesson, now);
          return `<a class="lesson ${lesson.type === 'Семинар' ? 'seminar' : ''}${selected?.id === lesson.id ? ' active' : ''}" href="/schedule?day=${day}&amp;view=${mode}&amp;lesson=${encodeURIComponent(lesson.id)}"${selected?.id === lesson.id ? ' aria-current="true"' : ''}><small>${e(lesson.type)}${status ? ` · ${status}` : ''}</small><time datetime="${e(lesson.start)}">${mode === 'day' ? range(lesson.start, lesson.end) : when(lesson.start)}</time><strong>${e(lesson.title)}</strong><small>${e(lesson.room)}</small></a>`;
        }).join('') || (mode === 'day' ? empty('В этот день занятий нет.') : '')}</div>`;
      }).join('')}</div></div>
    </section><aside class="panel inspector">${selected ? `<h2>${e(selected.title)}</h2>${line('calendar', date(selected.start))}${line('clock', `<strong>${range(selected.start, selected.end)}</strong>`)}${line('pin', e(selected.room))}${teacher ? `<a class="text-link" href="/teachers?item=${encodeURIComponent(teacher.id)}">${e(teacher.shortName)} ${icon('out')}</a>` : ''}` : empty('Выберите дату с занятиями.')}</aside>
    </div><p class="schedule-note"><a class="text-link" href="/notifications">Изменения в расписании ${icon('out')}</a></p>`;
}

export function exams({ campus }) {
  const scheduled = campus.exams.filter(exam => exam.start);
  const pending = campus.exams.filter(exam => !exam.start);
  return `${scheduleHeader(true)}<section class="panel exams">
    <div class="section-heading"><div><h2>Осенняя сессия 2026</h2><p class="muted">Экзамены, зачёты и пересдачи на текущую сессию</p></div><p class="notice">${icon('clock')} Расписание публикует учебный офис</p></div>
    ${scheduled.length ? `<a class="text-link export" href="/api/calendar/exams" download>${calendarIcon} Добавить в календарь</a>` : ''}
    <div class="panel data-grid exams-grid"><div class="table-heading"><span>Дисциплина</span><span>Дата</span><span>Время</span><span>Корпус и аудитория</span></div>
    ${scheduled.map(exam => `<div><strong>${e(exam.title)} ${badge(exam.type, exam.type === 'Зачёт' ? 'sage' : 'peach')}</strong><span>${date(exam.start)}</span><span>${range(exam.start, exam.end)}</span><span>${e(exam.room)}</span></div>`).join('') || empty('Назначенных экзаменов пока нет.')}</div>
    <h3 class="pending-title">Ожидает назначения</h3>${pending.length ? `<div class="panel data-grid">${pending.map(exam => `<div><strong>${e(exam.title)} ${badge(exam.type, 'peach')}</strong><span class="pending-message">${e(exam.announcement || 'Дата, время и аудитория уточняются')}</span></div>`).join('')}</div>` : empty('Все экзамены уже назначены.')}
  </section>`;
}
