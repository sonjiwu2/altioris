import { escape as e, badge, date, decimal, empty, fields, icon, portrait, tab } from '../ui.js';

function academicHeader(ranking) {
  return `<h1>Успеваемость</h1><div class="section-heading academic-heading"><nav class="tabs" aria-label="Учебные результаты">${tab('/grades', 'Оценки', !ranking)}${tab('/grades/ranking', 'Рейтинг', ranking)}</nav><span class="muted">2026/2027 · 1–2 модули</span></div>`;
}

export function grades(data, params) {
  const selected = data.grades.find(grade => grade.id === params.get('item')) || data.grades[0];
  const teacher = selected && data.campus.teachers.find(person => person.id === selected.teacherId);
  return `${academicHeader(false)}<div class="split academic-layout">
    <section class="panel grade-list" aria-label="Оценки по дисциплинам"><div class="table-heading grade-row"><span>Дисциплина</span><span>Результат</span></div>
    ${data.grades.map(grade => {
      const style = grade.retakeDate || (grade.mark != null && grade.mark < 4) ? 'negative' : grade.mark >= 8 || grade.result === 'Зачтено' ? 'positive' : '';
      const mark = grade.mark ?? (grade.result === 'Зачтено' ? icon('check') : '—');
      return `<a class="grade-row ${grade.id === selected?.id ? 'active' : ''}" href="/grades?item=${encodeURIComponent(grade.id)}"${grade.id === selected?.id ? ' aria-current="true"' : ''}>
        <strong>${e(grade.title)}</strong><span class="result ${style}"><strong>${mark}</strong><small>${e(grade.result)}</small></span>${icon('right')}</a>`;
    }).join('') || empty('Оценки ещё не опубликованы.')}</section>
    ${selected ? `<aside class="panel inspector"><h2>${e(selected.title)}</h2><p class="result-summary"><strong>${selected.mark ?? '—'}${selected.mark == null ? '' : ' / 10'}</strong> · ${e(selected.result)}</p>
      ${fields([['Итоговый контроль', selected.assessment], ['Кредиты', selected.credits], ['Часы', selected.hours], ['Аудиторные', selected.classHours], ['Пересдача', selected.retakeDate ? date(selected.retakeDate) : '—']])}
      ${teacher ? `<a class="person-link" href="/teachers?item=${encodeURIComponent(teacher.id)}">${portrait(teacher)}<span><strong>${e(teacher.shortName)}</strong><small>Преподаватель</small></span>${icon('right')}</a>` : ''}</aside>` : ''}
  </div>`;
}

export function ranking({ ranking: data }) {
  return `${academicHeader(true)}<dl class="rank-strip"><div><dt>Место на программе</dt><dd>${data.rank ?? '—'} из ${data.total}</dd></div><div><dt>Средний балл</dt><dd>${decimal(data.mean)}</dd></div><div><dt>GPA</dt><dd>${decimal(data.gpa)}</dd></div></dl>
    <div class="rank-meta section-heading"><span class="muted">Демонстрационные данные</span><button class="text-link" type="button" data-dialog="rating-rule">Как считается рейтинг</button></div>
    <div class="panel"><table class="ranking-table"><thead><tr><th scope="col">Место</th><th scope="col">Студент</th><th scope="col">Балл</th></tr></thead><tbody>
    ${data.peers.map(peer => `<tr class="${peer.self ? 'self' : ''}"><td>${peer.rank}</td><td>${e(peer.name)} ${peer.self ? badge('Вы') : ''}</td><td>${decimal(peer.gpa)}</td></tr>`).join('')}</tbody></table></div>
    <dialog id="rating-rule" aria-labelledby="rating-title"><div class="section-heading"><h2 id="rating-title">Как считается рейтинг</h2><button class="icon-button" type="button" data-close aria-label="Закрыть">${icon('close')}</button></div>
    <p>Средний балл — обычное среднее числовых оценок. GPA учитывает вес дисциплин в кредитах. Результаты «зачтено» и предметы без оценки в расчёт не входят.</p>
    <p>Место в рейтинге определяется по GPA до округления. Рейтинг показывает вымышленных студентов программы.</p></dialog>`;
}

export function teachers({ campus }, params) {
  const query = params.get('q')?.trim() ?? '';
  const office = params.get('office') ?? '';
  const buildings = [...new Set(campus.teachers.map(teacher => teacher.office?.split(' · ')[0]).filter(Boolean))];
  const filtered = campus.teachers.filter(person => `${person.name} ${person.subject}`.toLowerCase().includes(query.toLowerCase()) && (!office || person.office?.startsWith(office)));
  const selected = filtered.find(teacher => teacher.id === params.get('item')) ?? filtered[0];
  const filters = new URLSearchParams();
  if (query) filters.set('q', query);
  if (office) filters.set('office', office);
  return `<h1>Преподаватели</h1>
  <form class="filters" method="get" action="/teachers"><label class="search-field">${icon('search')}<span class="sr-only">Имя или дисциплина</span><input type="search" name="q" placeholder="Имя или дисциплина" value="${e(query)}"></label>
  <label><span class="sr-only">Корпус</span><select name="office"><option value="">Все корпуса</option>${buildings.map(value => `<option value="${e(value)}"${office === value ? ' selected' : ''}>${e(value)}</option>`).join('')}</select></label><button class="button button-outline">Найти</button></form>
  <div class="split directory"><section class="teacher-list" aria-label="Список преподавателей">
  ${filtered.map(person => {
    const item = new URLSearchParams(filters);
    item.set('item', person.id);
    return `<a class="panel person-link ${person.id === selected?.id ? 'active' : ''}" href="/teachers?${e(item)}"${person.id === selected?.id ? ' aria-current="true"' : ''}>${portrait(person)}<span><strong>${e(person.shortName)}</strong><small>${e(person.subject)}</small></span>${icon('right')}</a>`;
  }).join('') || empty('Преподаватели по этому запросу не найдены.')}</section>
  ${selected ? `<aside class="panel inspector teacher-details"><div class="identity">${portrait(selected)}<div><h2>${e(selected.name)}</h2><p class="muted">${e(selected.role)}</p></div></div>
  ${fields([['Дисциплина', selected.subject], ['Стаж преподавания', selected.experience], ['Кампус', selected.campus], ['Корпус', selected.office], ['Почта', selected.email]])}
  <div class="section-heading teacher-actions">${selected.consultation ? badge(`Консультации · ${selected.consultation}`, 'sage') : ''}
  <a class="button button-outline" href="/support?teacher=${encodeURIComponent(selected.id)}">Спросить в поддержке</a></div></aside>` : ''}
  </div>`;
}

export function profile({ student, documents }) {
  return `<div class="section-heading"><h1>Мой профиль</h1><button class="button button-outline" type="button" data-logout>${icon('exit')} Выйти</button></div>
  <section class="panel identity profile-identity">${portrait(student)}<div><h2>${e(student.name)}</h2><p class="muted">Бакалавриат</p>
  <button class="button button-plain" type="button" data-dialog="avatar-dialog">${icon('camera')} Изменить фото</button></div></section>
  <div class="split profile-grid"><section class="panel inspector"><h2>Сведения об обучении</h2>${fields([['Факультет', student.faculty], ['Направление', student.program], ['Курс и группа', `${student.year} курс · ${student.group}`], ['Форма обучения', student.form], ['Год поступления', student.admissionYear], ['Кампус', student.campus], ['Учебная почта', student.email], ['Студенческий ID', student.number]])}</section>
  <section class="panel inspector"><h2>Документы</h2><div class="student-card"><h3>Студенческий билет</h3><p>${e(student.shortName)}</p><span>${e(student.number)}</span>${badge('Демо')}</div>
  ${documents.map(doc => `<a class="file-row" href="/api/documents/${encodeURIComponent(doc.id)}" download>${icon('doc')}<span><strong>${e(doc.title)}</strong><small>PDF · ${date(doc.createdAt)}</small></span><span>Скачать</span></a>`).join('') || empty('Документов пока нет.')}</section></div>
  <dialog id="avatar-dialog" aria-labelledby="avatar-title"><div class="section-heading"><h2 id="avatar-title">Фото профиля</h2><button class="icon-button" type="button" data-close aria-label="Закрыть">${icon('close')}</button></div>
  <form data-mutation="avatar"><label class="choice"><input type="radio" name="avatar" value="portrait"${student.avatar !== 'initials' ? ' checked' : ''}> Демонстрационный аватар</label>
  <label class="choice"><input type="radio" name="avatar" value="initials"${student.avatar === 'initials' ? ' checked' : ''}> Инициалы</label><p class="form-error" role="alert" hidden></p><button class="button">Сохранить</button></form></dialog>`;
}
