import { escape as e, badge, date, detailedDate, empty, fields, icon, safeLink, when } from '../ui.js';

const requestTypes = {
  certificate: 'Справка об обучении',
  'academic-leave': 'Академический отпуск',
  dormitory: 'Справка для общежития',
  'media-lab': 'Запись на медиалабораторию',
};
const completed = status => /готов|заверш|отклон/iu.test(status);
const requestStatus = status => badge(status, completed(status) && !/отклон/iu.test(status) ? 'sage' : 'peach');

export function requests({ requests: items }, params) {
  const search = params.get('q')?.trim() ?? '';
  const filter = params.get('filter') ?? '';
  const filtered = items.filter(item => item.title.toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'open' ? !completed(item.status) : filter === 'done' ? completed(item.status) : true));
  const selected = filtered.find(item => item.id === params.get('item')) ?? filtered[0];
  const newType = params.get('new');
  const tabs = [['', 'Все'], ['open', 'В работе'], ['done', 'Завершённые']];
  const urlFor = (name, value) => {
    const query = new URLSearchParams();
    if (search) query.set('q', search);
    if (filter && name !== 'filter') query.set('filter', filter);
    if (value) query.set(name, value);
    return `/requests${query.size ? '?' + e(query) : ''}`;
  };
  return `<div class="section-heading"><h1>Заявки</h1><button type="button" class="button" data-dialog="request-dialog">${icon('plus')} Новая заявка</button></div>
  <div class="split work-layout"><section class="panel inspector list-panel" aria-label="Список заявок">
    <form class="filters" method="get" action="/requests"><label class="search-field">${icon('search')}<span class="sr-only">Поиск по заявкам</span><input name="q" type="search" placeholder="Поиск по заявкам" value="${e(search)}"></label>${filter ? `<input name="filter" type="hidden" value="${e(filter)}">` : ''}<button class="button button-outline">Найти</button></form>
    <nav class="pills" aria-label="Состояние заявки">${tabs.map(([value, label]) => `<a href="${urlFor('filter', value)}"${filter === value ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    ${filtered.map(item => `<a class="service-row ${item.id === selected?.id ? 'active' : ''}" href="${urlFor('item', item.id)}"${item.id === selected?.id ? ' aria-current="true"' : ''}>${icon('doc')}<span><strong>${e(item.title)}</strong><small>${date(item.createdAt)}</small></span>${requestStatus(item.status)}${icon('right')}</a>`).join('') || empty('Заявки не найдены.')}</section>
  <aside class="panel inspector">${selected ? `<p>${requestStatus(selected.status)}</p><h2>${e(selected.title)}</h2>${fields([['Дата подачи', detailedDate(selected.createdAt)], ['Формат', selected.documentId ? 'Электронный PDF' : 'Электронная заявка']])}
    ${selected.documentId ? `<a class="file-row" href="/api/documents/${encodeURIComponent(selected.documentId)}" download>${icon('doc')}<span><strong>${e(selected.title)}.pdf</strong><small>Демонстрационный документ</small></span><span>Скачать PDF</span></a>` : ''}
    <h3>История</h3><ol class="timeline">${selected.history.map(step => `<li><time datetime="${e(step.at)}">${detailedDate(step.at)}</time> · ${e(step.label)}</li>`).join('')}</ol>
    <a class="text-link" href="/support?request=${encodeURIComponent(selected.id)}">${icon('chat')} Задать вопрос по заявке</a>` : empty('Выберите заявку, чтобы увидеть её статус и историю.')}</aside></div>
  <dialog id="request-dialog" aria-labelledby="request-title"${Object.hasOwn(requestTypes, newType) ? ' data-auto-open' : ''}><div class="section-heading"><h2 id="request-title">Новая заявка</h2><button class="icon-button" type="button" data-close aria-label="Закрыть">${icon('close')}</button></div>
  <form data-mutation="request"><label>Вид заявки<select name="type" required>${Object.entries(requestTypes).map(([value, label]) => `<option value="${value}"${value === newType ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
  <p class="muted">Заявка сохранится в конкурсном кабинете.</p><p class="form-error" role="alert" hidden></p><button class="button">Подать заявку</button></form></dialog>`;
}

export function notifications({ notifications: items }, params) {
  const unread = items.filter(item => !item.read).length;
  const onlyUnread = params.get('filter') === 'unread';
  const visible = onlyUnread ? items.filter(item => !item.read) : items;
  const selected = items.find(item => item.id === params.get('item')) ?? visible[0];
  const url = safeLink(selected?.href);
  const linkedLabel = url.startsWith('/schedule') ? 'К расписанию' : url.startsWith('/requests') ? 'Открыть заявку' : url.startsWith('/news') ? 'Читать объявление' : 'Открыть раздел';
  return `<div class="section-heading"><h1>Уведомления</h1>${unread ? badge(`Новых: ${unread}`, 'peach') : ''}</div>
  <div class="split work-layout"><section class="panel inspector list-panel" aria-label="Список уведомлений">
  <div class="section-heading"><nav class="pills" aria-label="Фильтр уведомлений"><a href="/notifications"${!onlyUnread ? ' aria-current="page"' : ''}>Все</a><a href="/notifications?filter=unread"${onlyUnread ? ' aria-current="page"' : ''}>Непрочитанные</a></nav>
  ${unread ? '<button type="button" class="text-link" data-read-all>Отметить все прочитанными</button>' : ''}</div>
  ${visible.map(item => `<a class="service-row ${item.id === selected?.id ? 'active' : ''}" href="/notifications?item=${encodeURIComponent(item.id)}${onlyUnread ? '&amp;filter=unread' : ''}"${item.id === selected?.id ? ' aria-current="true"' : ''}>${icon(item.type === 'Дедлайн' ? 'clock' : 'bell')}<span><strong>${e(item.title)}</strong><small>${item.read ? '' : 'Новое · '}${e(item.type)}</small></span><time datetime="${e(item.at)}">${date(item.at)}</time></a>`).join('') || empty('Непрочитанных уведомлений нет.')}</section>
  <aside class="panel inspector">${selected ? `<p class="muted">${e(selected.type)} · ${detailedDate(selected.at)}</p><h2>${e(selected.title)}</h2><p>${e(selected.body)}</p>
  <div class="inline-group notice-actions">${url ? `<a class="button" href="${url}">${linkedLabel} ${icon('out')}</a>` : ''}${!selected.read ? `<button class="button button-outline" type="button" data-read="${e(selected.id)}">Отметить прочитанным</button>` : ''}</div>` : empty('Здесь появится текст уведомления.')}</aside></div>`;
}

const topics = [
  ['certificate', 'doc', 'Заказать справку'],
  ['status', 'check', 'Проверить заявку'],
  ['faq', 'search', 'Найти ответ'],
  ['specialist', 'chat', 'Как связаться со специалистом'],
];

export function support(data, params) {
  const teacher = data.campus.teachers.find(person => person.id === params.get('teacher'));
  const request = data.requests.find(item => item.id === params.get('request'));
  const draft = teacher ? `Вопрос о преподавателе ${teacher.shortName}: ` : request ? `Вопрос по заявке «${request.title}»: ` : '';
  return `<h1>Чат поддержки</h1><div class="split support-layout">
  <aside class="panel inspector topics"><h2>Темы</h2>${topics.map(([action, glyph, title]) => `<button class="topic" type="button" data-support="${action}">${icon(glyph)} ${title}</button>`).join('')}</aside>
  <section class="panel chat"><header class="chat-header"><span class="assistant-icon">${icon('chat')}</span><h2>Помощник Altioris</h2>${badge('Автоответы', 'sage')}</header>
  <div class="chat-history" aria-label="История сообщений" tabindex="0"><div class="bubble"><p>Привет! Чем помочь?</p><div class="quick-actions">${topics.map(([action, glyph, title]) => `<button type="button" data-support="${action}">${icon(glyph)} ${title}</button>`).join('')}</div></div>
  ${data.support.map(item => {
    const href = safeLink(item.href);
    return `<div class="bubble${item.role === 'student' || item.role === 'user' ? ' own' : ''}"><p>${e(item.text)}</p>${href ? `<a class="text-link" href="${href}">Перейти в раздел ${icon('out')}</a>` : ''}<time datetime="${e(item.at)}">${when(item.at)}</time></div>`;
  }).join('')}</div>
  <form class="chat-form" data-mutation="message"><label class="sr-only" for="chat-message">Ваш вопрос</label><input id="chat-message" name="text" maxlength="500" required placeholder="Напишите вопрос" value="${e(draft)}"><button class="button" aria-label="Отправить вопрос">${icon('arrow')}</button><p class="form-error" role="alert" hidden></p></form>
  </section></div>`;
}
