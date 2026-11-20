import { escape as e, badge, date, empty, icon, key, line, portrait, range, tab, when } from '../ui.js?v=20261120-5';
function header(exams){return '<h1>Расписание</h1><nav class="tabs" aria-label="Виды расписания">'+tab('/schedule','Занятия',!exams,'calendar')+tab('/schedule/exams','Экзамены',exams,'doc')+'</nav>';}
function shiftDay(day,change){const d=new Date(day+'T12:00:00+03:00');d.setUTCDate(d.getUTCDate()+change);return key(d);}
function startOfWeek(day){const weekday=new Date(day+'T12:00:00+03:00').getUTCDay();return shiftDay(day,-((weekday+6)%7));}
function link(day,label,classes='',name=''){return '<a class="'+classes+'" href="/schedule?day='+day+'"'+(name?' aria-label="'+name+'"':'')+'>'+label+'</a>';}
function dateParts(value){const d=new Date(value);return [new Intl.DateTimeFormat('ru-RU',{day:'numeric',timeZone:'Europe/Moscow'}).format(d),new Intl.DateTimeFormat('ru-RU',{month:'long',timeZone:'Europe/Moscow'}).format(d)];}
export function schedule({campus},params){
 const active=campus.lessons.find(l=>l.id===params.get('lesson'));
 const raw=params.get('day'),valid=/^\d{4}-\d{2}-\d{2}$/.test(raw??'')&&!Number.isNaN(Date.parse(raw));
 const today=key(campus.clock),day=active?key(active.start):valid?raw:today;
 const mode=matchMedia('(max-width:680px)').matches?'day':'week';
 const week=startOfWeek(day),days=mode==='day'?[day]:Array.from({length:5},(_,i)=>shiftDay(week,i));
 if(mode==='week'&&campus.lessons.some(l=>[shiftDay(week,5),shiftDay(week,6)].includes(key(l.start))))days.push(shiftDay(week,5),shiftDay(week,6));
 const shown=campus.lessons.filter(l=>days.includes(key(l.start)));
 const selected=active||shown.find(l=>l.id==='lesson-4')||shown.find(l=>key(l.start)===day)||shown[0];
 const teacher=selected&&campus.teachers.find(p=>p.id===selected.teacherId);
 const online=selected?.id==='lesson-4',distance=mode==='day'?1:7;
 const title=mode==='day'?date(day+'T12:00:00+03:00'):date(week+'T12:00:00+03:00').split(' ')[0]+'–'+date(shiftDay(week,6)+'T12:00:00+03:00');
 return header(false)+'<div class="split schedule-layout"><section class="panel calendar" aria-label="Календарь занятий"><div class="calendar-tools"><div class="inline-group">'+link(shiftDay(day,-distance),icon('left'),'icon-button','Предыдущий период')+'<span class="week-title">'+title+'</span>'+link(shiftDay(day,distance),icon('right'),'icon-button','Следующий период')+'</div></div><div class="calendar-scroll" role="region" aria-label="Дни расписания" tabindex="0"><div class="calendar-grid '+(mode==='day'?'single-day':'')+'" style="--days:'+days.length+'">'+days.map(value=>{
  const lessons=shown.filter(l=>key(l.start)===value),d=new Date(value+'T12:00:00+03:00');
  const weekday=new Intl.DateTimeFormat('ru-RU',{weekday:'short',timeZone:'Europe/Moscow'}).format(d);
  return '<div class="calendar-day"><h2 class="sentence">'+weekday+' '+date(value+'T12:00:00+03:00').split(' ')[0]+'<strong>'+new Intl.DateTimeFormat('ru-RU',{month:'long',timeZone:'Europe/Moscow'}).format(d)+'</strong></h2>'+lessons.map(l=>{
   const slot=Number(when(l.start).split(':')[0])<12?2:Number(when(l.start).split(':')[0])<14?3:4;
   const on=l.id==='lesson-4';
   return '<a class="lesson '+(l.type==='Семинар'?'seminar ':'')+(selected?.id===l.id?'active':'')+'" href="/schedule?day='+day+'&amp;lesson='+encodeURIComponent(l.id)+'" style="grid-row:'+slot+'"'+(selected?.id===l.id?' aria-current="true"':'')+'><time datetime="'+e(l.start)+'">'+range(l.start,l.end)+'</time><strong>'+e(l.title)+'</strong><span class="lesson-room">'+icon(on?'computer':'pin')+(on?'Онлайн':e(l.room))+'</span>'+badge(l.type)+'</a>';
  }).join('')+(!lessons.length&&mode==='day'?empty('В этот день занятий нет.'):'')+'</div>';
 }).join('')+'</div></div></section><aside class="panel inspector schedule-inspector">'+(selected?badge('Выбранное занятие','sage')+'<h2>'+e(selected.title)+'</h2>'+line('clock','Время<strong>'+date(selected.start)+' · '+range(selected.start,selected.end)+'</strong>')+(teacher?'<div class="info-line">'+portrait(teacher)+'<span>Преподаватель<a class="text-link" href="/teachers?item='+e(teacher.id)+'">'+e(teacher.shortName)+'</a><small>'+e(teacher.role)+', кафедра информатики</small></span></div>':'')+line('people','Тип занятия<strong>'+e(selected.type)+'</strong>')+line(online?'computer':'pin','Формат<strong>'+(online?'Онлайн':'Очно · '+e(selected.room))+'</strong>')+line('doc','Описание<strong class="lesson-description">'+(selected.title==='Алгоритмы'?'Разберём обходы графов и задачи на поиск пути.':'Обсудим основные темы курса и решим практические задачи.')+'</strong>')+(online?'<a class="online-card" href="/support?topic=online">'+icon('computer')+'Онлайн-занятие<small>Вопросы подключения — в поддержке</small></a>':''):empty('Выберите дату с занятиями.'))+'</aside></div>';
}
export function exams({campus},params){
 const scheduled=campus.exams.filter(x=>x.start),pending=campus.exams.filter(x=>!x.start);
 const selected=scheduled.find(x=>x.id===params.get('item'))||scheduled.find(x=>x.id==='os-exam')||scheduled[0];
 const teacher=campus.teachers.find(p=>p.id==='voronova');
 return header(true)+'<div class="split exam-layout"><section class="panel exam-panel"><h2>Экзамены и зачёты</h2><p>Учебный офис публикует даты и аудитории.</p><h3 class="rule-heading"><span>Назначено</span></h3><div class="exam-timeline">'+scheduled.map(exam=>{
 const [day,month]=dateParts(exam.start);
 return '<a class="exam-event '+(selected?.id===exam.id?'active':'')+'" href="/schedule/exams?item='+e(exam.id)+'"'+(selected?.id===exam.id?' aria-current="true"':'')+'><div class="exam-date"><strong>'+day+'</strong><small>'+month+'</small></div><div><h3>'+e(exam.title)+'</h3><p>'+range(exam.start,exam.end)+' · '+e(exam.room)+'</p>'+badge(exam.type,exam.type==='Экзамен'?'peach':'sage')+'</div></a>';
 }).join('')+'</div>'+(!scheduled.length?empty('Назначенных экзаменов пока нет.'):'')+'<h3 class="rule-heading"><span>Ожидает назначения</span></h3>'+pending.map(exam=>'<div class="pending-exam"><span>'+e(exam.title)+'</span>'+badge('Дата уточняется')+'</div>').join('')+(scheduled.length?'<a class="text-link calendar-export" href="/api/calendar/exams" download>'+icon('calendar')+'Добавить экзамены в календарь</a>':'')+'</section><aside class="panel inspector schedule-inspector">'+(selected?badge('Выбранный экзамен','sage')+'<h2>'+e(selected.title)+'</h2>'+line('calendar','Время<strong>'+date(selected.start)+' · '+range(selected.start,selected.end)+'</strong>')+line('pin','Аудитория<strong>'+e(selected.room)+'</strong>')+(teacher?'<div class="info-line">'+portrait(teacher)+'<span>Преподаватель<a class="text-link" href="/teachers?item='+e(teacher.id)+'">'+e(teacher.shortName)+'</a><small>'+e(teacher.role)+'</small></span></div>':'')+line('doc','Тип контроля<strong>'+e(selected.type)+'</strong>')+line('clock','Формат<strong>Очный · письменный</strong>')+line('sparkle','Совет<strong>Повторите темы курса и вопросы к итоговому контролю.</strong>')+line('clipboard','Что взять<strong>Студенческий билет и ручку.</strong>'):empty('Выберите экзамен.'))+'</aside></div>';
}
export function news(path){
 const items={
 '/news/signal':['СИГНАЛ','Вечер студенческих проектов','27 ноября · 18:00','Студенческие команды покажут прототипы и расскажут, как проверяли свои идеи. После выступлений можно задать вопросы авторам.'],
 '/news/consultations':['График консультаций','Подготовка к сессии','25–26 ноября','Операционные системы — 25 ноября, 16:20, корпус Б, ауд. 412. Теория вычислений — 26 ноября, 16:20, корпус А, ауд. 204. Предварительная запись не нужна.'],
 '/news/media-lab':['Медиалаборатория','Новый взгляд на творчество','2 декабря · 17:30','За четыре встречи вы попробуете снять короткое видео, записать звук и собрать первый монтаж. Опыт не нужен.'],
 };
 const item=items[path];if(!item)return '<h1>Страница не найдена</h1><a class="button" href="/schedule">К расписанию</a>';
 return '<a class="text-link back-link" href="/notifications">'+icon('back')+'К объявлениям</a><h1>'+item[0]+'</h1><section class="panel inspector"><h2>'+item[1]+'</h2>'+line('calendar',item[2])+'<p class="lead">'+item[3]+'</p><a class="button" href="'+(path==='/news/media-lab'?'/requests?new=media-lab':'/schedule/exams')+'">'+(path==='/news/media-lab'?'Подать заявку':'Открыть расписание')+'</a></section>';
}

