import { escape as e, badge, date, decimal, empty, fields, icon, portrait, subjectIllustration, tab, termPicker } from '../ui.js?v=20261120-10';
function header(rating){return '<h1>Успеваемость</h1><nav class="tabs academic-tabs" aria-label="Учебные результаты">'+tab('/grades','Зачётка',!rating,'doc')+tab('/grades/ranking','Рейтинг',rating,'trophy')+'</nav>';}
export function grades(data,params){
 const {campus}=data;
 const periods=[...campus.years,...campus.terms];
 const completedYear=campus.years.findLast(year=>data.grades.filter(grade=>year.termIds.includes(grade.termId)).every(grade=>grade.published));
 const requested=data.grades.find(grade=>grade.id===params.get('item'));
 const period=periods.find(item=>item.id===params.get('term'))??periods.find(item=>item.id===(requested?.termId??completedYear?.id??campus.currentTerm));
 const termIds=period.termIds??[period.id];
 const courses=data.grades.filter(grade=>termIds.includes(grade.termId));
 const selected=courses.find(grade=>grade.id===requested?.id)??courses[0];
 const teacher=selected&&data.campus.teachers.find(person=>person.id===selected.teacherId);
 const earned=courses.reduce((total,grade)=>total+(grade.published?grade.credits:0),0);
 const credits=courses.reduce((total,grade)=>total+grade.credits,0);
 function gradeRow(grade){
  const tone=grade.published&&(grade.mark>=8||grade.result==='Зачтено')?'positive':'';
  const mark=grade.mark??(grade.result==='Зачтено'?'✓':'—');
  return '<a class="grade-row '+tone+' '+(grade.id===selected?.id?'active':'')+'" href="/grades?term='+e(period.id)+'&amp;item='+e(grade.id)+'"'+
   (grade.id===selected?.id?' aria-current="true"':'')+'>'+subjectIllustration(grade.id)+
   '<strong>'+e(grade.title)+'</strong><span class="grade-mark">'+mark+'</span><span class="grade-result">'+e(grade.result)+'</span></a>';
 }
 const rows=termIds.map(id=>{
  const heading=termIds.length>1?'<h3 class="grade-term-heading">'+e(campus.terms.find(term=>term.id===id).label)+'</h3>':'';
  return heading+courses.filter(grade=>grade.termId===id).map(gradeRow).join('');
 }).join('');
 const details=selected?'<aside class="panel grade-inspector"><p class="eyebrow">Дисциплина</p><h2>'+e(selected.title)+'</h2>'+
  '<div class="result-summary '+(selected.published?'positive':'')+'"><strong>'+(selected.mark??(selected.published?'✓':'—'))+'</strong>'+
  (selected.mark!==null?'<span>из 10</span>':'')+'<em>'+e(selected.result)+'</em></div>'+
  fields([['Итоговый контроль',selected.assessment,'doc'],['Дата контроля',date(selected.assessedAt),'calendar'],
   ['Кредиты',selected.credits,'books'],['Академические часы по расписанию',selected.classHours,'clock']])+
  '<a class="text-link grade-exam-link" href="/schedule/exams?term='+e(selected.termId)+'&amp;item='+e(selected.examId)+'">'+icon('calendar')+'Открыть запись о контроле</a>'+
  (teacher?'<a class="person-link" href="/teachers?item='+e(teacher.id)+'">'+portrait(teacher)+'<span>'+e(teacher.shortName)+'</span></a>':'')+
  '</aside>':'';
 return header(false)+'<div class="split academic-layout"><section class="panel grade-list" aria-label="Зачётка">'+
  '<div class="section-heading"><h2>Зачётная книжка</h2>'+termPicker('/grades',periods,period.id)+'</div>'+
  '<p class="grade-progress">Зачётные единицы: '+earned+' из '+credits+'</p>'+
  (rows||empty('Учебных записей за этот семестр нет.'))+'</section>'+details+'</div>';
}
const seasonDate=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long',year:'numeric'});
const publicationDate=value=>seasonDate.format(new Date(value));

function rankChange(change){
 if(change===null)return '<span class="rank-change neutral" aria-label="Первый сезон">—</span>';
 if(!change)return '<span class="rank-change neutral" aria-label="Без изменений">0</span>';
 const direction=change>0?'Выше':'Ниже';
 return '<span class="rank-change '+(change>0?'up':'down')+'" aria-label="'+direction+' на '+Math.abs(change)+'">'+
  (change>0?'↑ ':'↓ ')+Math.abs(change)+'</span>';
}

export function ranking({ranking:data,student},params=new URLSearchParams()){
 const season=data.seasons.find(item=>item.id===params.get('season'))??data.seasons.at(-1);
 const all=params.get('view')==='all';
 const next=data.nextSeason?'<p class="rank-next">Следующая публикация <time datetime="'+e(data.nextSeason.publishedAt)+'">'+
  publicationDate(data.nextSeason.publishedAt)+'</time></p>':'';
 if(!season)return header(true)+'<div class="section-heading rank-heading"><h2>Рейтинг на программе</h2></div>'+
  '<section class="panel ranking-panel">'+empty('Рейтинг появится после завершения первой сессии.')+next+'</section>';
 const href=(seasonId,showAll=false)=>'/grades/ranking?season='+encodeURIComponent(seasonId)+(showAll?'&amp;view=all':'');
 const current=season.peers.findIndex(peer=>peer.self);
 const start=Math.max(0,Math.min(current-2,season.peers.length-5));
 const rows=all?season.peers:season.peers.slice(start,start+5);
 const history=data.seasons.map(item=>`<a class="rank-season" href="${href(item.id,all)}"${item.id===season.id?' aria-current="page"':''}>
   <span><strong>${e(item.label)}</strong><small>${publicationDate(item.publishedAt)}</small></span>
   <span class="season-place">${item.rank??'—'} место ${rankChange(item.change)}</span></a>`).join('');
 const peers=rows.map(peer=>`<tr${peer.self?' class="self"':''}><td>${peer.rank}</td>
   <td><span class="rank-student">${portrait(peer.self?student:peer)}<span>${e(peer.name)}${peer.self?'<span class="sr-only"> — вы</span>':''}</span></span></td>
   <td>${decimal(peer.gpa)}</td><td>${rankChange(peer.change)}</td></tr>`).join('');
 return header(true)+`<div class="rank-heading">
   <h2>Рейтинг на программе</h2>${next}
  </div>
  <section class="rank-history" aria-labelledby="rank-history-title">
   <h3 id="rank-history-title">История по сессиям</h3>
   <nav aria-label="Сезоны рейтинга">${history}</nav>
  </section>
  <dl class="rank-strip" aria-label="${e(season.label)}">
   <div>${icon('rank-place')}<span><dt>Место</dt><dd>${season.rank??'—'} <small>из ${season.total}</small></dd></span></div>
   <div>${icon('rank-mean')}<span><dt>Средний балл</dt><dd>${decimal(season.mean)}</dd></span></div>
   <div>${icon('rank-gpa')}<span><dt>GPA</dt><dd>${decimal(season.gpa)}</dd></span></div>
  </dl>
  <div class="panel ranking-panel"><table class="ranking-table">
   <thead><tr><th scope="col">Место</th><th scope="col">Студент</th><th scope="col">GPA</th><th scope="col"><span aria-hidden="true">Δ</span><span class="sr-only">Изменение места</span></th></tr></thead>
   <tbody>${peers}</tbody>
  </table></div>
  <div class="section-heading rank-meta"><a class="text-link" href="${href(season.id,!all)}">${all?'Показать ближайших':'Все участники · '+season.total}</a>
   <button class="text-link" type="button" data-dialog="rating-rule">Как считается рейтинг</button></div>
  <dialog id="rating-rule" aria-labelledby="rating-title"><div class="section-heading"><h2 id="rating-title">Как считается рейтинг</h2><button class="icon-button" type="button" data-close aria-label="Закрыть">${icon('close')}</button></div>
   <p>Рейтинг публикуется после каждой зимней и летней сессии. В сезон входят оценки этого семестра. Средний балл — обычное среднее, а GPA учитывает вес дисциплин в зачётных единицах. Зачёты без числовой оценки пропускаются.</p>
   <p>Места определяются по GPA до округления. При равных баллах используется имя в алфавитном порядке. Стрелки показывают изменение места относительно предыдущей сессии.</p>
  </dialog>`;
}

const normalizeSearch=value=>value.toLocaleLowerCase('ru').replaceAll('ё','е');
export function teachers({campus},params){
 const query=params.get('q')?.trim()??'';
 const departments=new Map(campus.teachers.map(teacher=>[teacher.department,teacher.departmentLabel]));
 const office=departments.has(params.get('office'))?params.get('office'):'';
 const terms=normalizeSearch(query).split(/\s+/u).filter(Boolean);
 const filtered=campus.teachers.filter(teacher=>{
  if(office&&teacher.department!==office)return false;
  const searchText=normalizeSearch([teacher.name,teacher.subject,teacher.department,teacher.departmentLabel].join(' '));
  return terms.every(term=>searchText.includes(term));
 });
 const selected=filtered.find(p=>p.id===params.get('item'))||filtered[0],filters=new URLSearchParams();
 if(query)filters.set('q',query);if(office)filters.set('office',office);
 const people=filtered.map(person=>{
  const item=new URLSearchParams(filters);
  item.set('item',person.id);
  const active=person.id===selected?.id;
  return `<a class="person-link${active?' active':''}" href="/teachers?${e(item)}"${active?' aria-current="true"':''}>${portrait(person)}<span><strong>${e(person.shortName)}</strong><small>${e(person.subject)}</small></span></a>`;
 }).join('');
 const detail=selected?`<aside class="panel teacher-details">
   <div class="teacher-identity">${portrait(selected)}<div><h2>${e(selected.name)}</h2>${badge(selected.role)}
    <p class="teacher-department"><span class="teacher-seal seal-${e(selected.sealTone)}" aria-hidden="true">${e(selected.initials)}</span>Кафедра ${e(selected.department)}</p>
   </div></div>
   <div class="teacher-facts">${fact('calendar','Стаж',selected.experience)}${fact('pin','Кабинет',selected.office)}${fact('mail','Учебная почта',selected.email,true)}${fact('clock','Консультации',selected.consultation)}</div>
   <section class="teacher-section"><h3>Дисциплина</h3><div class="subject-chips"><a class="subject-chip" href="/grades?item=${e(selected.courseId)}">${e(selected.subject)}</a></div></section>
   <section class="teacher-section"><h3>О преподавателе</h3><p>${e(selected.bio)}</p></section>
  </aside>`:'';
 return `<h1>Преподаватели</h1>
 <form class="filters teacher-filters" method="get" action="/teachers" data-teacher-filters>
  <label class="search-field">${icon('search')}<span class="sr-only">Имя или дисциплина</span><input type="search" name="q" placeholder="Имя или дисциплина" value="${e(query)}"></label>
  <div class="department-filter"><label for="teacher-department">Кафедра</label><select id="teacher-department" name="office">
   <option value="">Все кафедры</option>
   ${[...departments].sort((a,b)=>a[1].localeCompare(b[1],'ru')).map(([department,label])=>`<option value="${e(department)}"${office===department?' selected':''}>${e(label)}</option>`).join('')}
  </select></div>
  <button class="button button-outline">Найти</button>
 </form><div class="split directory"><section class="panel teacher-list" aria-label="Список преподавателей">${people||empty('Преподаватели не найдены. Попробуйте другой запрос.')}</section>${detail}</div>`;
}
function fact(glyph,label,value,copy=false){return '<div class="info-line">'+icon(glyph)+'<span>'+label+'<small>'+e(value)+'</small></span>'+(copy?'<button class="icon-button" type="button" data-copy="'+e(value)+'" aria-label="Скопировать почту">'+icon('copy')+'</button>':'')+'</div>';}
export function profile({student,documents}){
 return '<h1>Мой профиль</h1><section class="panel profile-identity">'+portrait(student)+'<div><h2>'+e(student.name)+'</h2><div class="inline-group">'+badge('Студент')+badge(student.group,'sage')+'</div></div><button class="button button-outline" type="button" data-dialog="avatar-dialog">'+icon('camera')+'Изменить фото</button></section><div class="split profile-grid"><section class="panel"><h2>Учебные данные</h2>'+fields([['Факультет',student.faculty,'cap'],['Направление',student.program,'books'],['Форма обучения',student.form],['Курс',student.year],['Группа',student.group],['Год поступления',student.admissionYear,'calendar'],['Учебная почта',student.email,'mail']])+'</section><section class="panel"><div class="student-card"><header class="student-card-header"><img src="/assets/crest.webp" alt="" width="65" height="83"><h3>Студенческий билет</h3></header><div class="student-card-body"><h3>'+e(student.name)+'</h3><div class="student-number"><span>'+e(student.number)+'</span><button class="icon-button" type="button" data-copy="'+e(student.number)+'" aria-label="Скопировать номер студенческого билета">'+icon('copy')+'</button></div><p class="student-valid">Действует до 30 июня 2028</p><span class="sample-stamp">Образец</span></div></div></section></div><section class="panel profile-documents"><h2>Мои документы</h2>'+documents.map(doc=>'<a class="file-row" href="/api/documents/'+encodeURIComponent(doc.id)+'" download>'+icon(doc.title.includes('успеваемости')?'books':'doc')+'<span><strong>'+e(doc.title)+'</strong><small>'+date(doc.createdAt)+'</small></span>'+badge('PDF')+'<span class="text-link">'+icon('out')+'<span>Открыть</span></span></a>').join('')+(!documents.length?empty('Документы появятся здесь после готовности заявки.'):'')+'</section><dialog id="avatar-dialog" aria-labelledby="avatar-title"><div class="section-heading"><h2 id="avatar-title">Фото профиля</h2><button class="icon-button" type="button" data-close aria-label="Закрыть">'+icon('close')+'</button></div><form data-mutation="photo" class="photo-form"><div class="photo-preview">'+portrait(student)+'<span>Предпросмотр фото</span></div><label class="photo-picker">Выбрать изображение<input type="file" accept="image/*" data-photo-file aria-describedby="photo-help"></label><p id="photo-help">JPG, PNG, WebP, GIF и другие форматы, которые открывает браузер. До 20 МБ. Фото будет обрезано по центру до квадрата.</p><p class="form-error" role="alert" hidden></p><div class="photo-actions"><button class="button" data-photo-save disabled>Сохранить фото</button>'+(student.avatar==='custom'?'<button class="button button-outline" type="button" data-remove-photo>Вернуть исходное фото</button>':'')+'</div></form></dialog>';
}

