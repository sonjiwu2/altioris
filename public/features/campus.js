import { escape as e, badge, date, empty, icon, key, line, portrait, range, tab, termPicker } from '../ui.js?v=20261120-11';

const moscow = {timeZone:'Europe/Moscow'};
const fullDay = value => value+'T12:00:00+03:00';
const monthLabel = new Intl.DateTimeFormat('ru-RU',{...moscow,month:'long'});
const weekdayLabel = new Intl.DateTimeFormat('ru-RU',{...moscow,weekday:'short'});
const dateWithYear = new Intl.DateTimeFormat('ru-RU',{...moscow,day:'numeric',month:'long',year:'numeric'});
const header = exams => '<h1>Расписание</h1><nav class="tabs" aria-label="Виды расписания">'+
 tab('/schedule','Занятия',!exams,'calendar')+tab('/schedule/exams','Экзамены',exams,'doc')+'</nav>';

function shiftDay(day,change){
 const value=new Date(fullDay(day));value.setUTCDate(value.getUTCDate()+change);return key(value);
}
function startOfWeek(day){
 return shiftDay(day,-((new Date(fullDay(day)).getUTCDay()+6)%7));
}
function weekLabel(start,end){
 if(start.slice(0,7)!==end.slice(0,7))return date(fullDay(start))+' — '+dateWithYear.format(new Date(fullDay(end)));
 return Number(start.slice(-2))+'–'+dateWithYear.format(new Date(fullDay(end)));
}
function periodArrow(day, direction, mode, disabled){
 const label=(direction==='left'?'Предыдущ':'Следующ')+(mode==='day'?'ий день':'ая неделя');
 const glyph=icon(direction);
 return disabled
  ? '<button class="icon-button" type="button" disabled aria-label="'+label+'">'+glyph+'</button>'
  : '<a class="icon-button" href="/schedule?day='+day+'" aria-label="'+label+'">'+glyph+'</a>';
}
function teacherLine(teacher){
 if(!teacher)return '';
 return '<div class="info-line">'+portrait(teacher)+'<span>Преподаватель<a class="text-link" href="/teachers?item='+e(teacher.id)+'">'+e(teacher.shortName)+'</a><small>'+e(teacher.role)+', кафедра '+e(teacher.department)+'</small></span></div>';
}
function lessonCard(lesson,selected,row){
 const online=lesson.format==='online';
 const href='/schedule?day='+key(lesson.start)+'&amp;lesson='+encodeURIComponent(lesson.id);
 const tone=lesson.courseId?(lesson.type==='Лекция'?'':'seminar '):'campus-activity ';
 return '<a class="lesson '+tone+(selected?'active':'')+'" href="'+href+'" style="grid-row:'+row+'"'+(selected?' aria-current="true"':'')+
  '><time datetime="'+e(lesson.start)+'">'+range(lesson.start,lesson.end)+'</time><strong>'+e(lesson.title)+
  '</strong><span class="lesson-room">'+icon(online?'computer':'pin')+e(lesson.room)+'</span>'+badge(lesson.type)+'</a>';
}
function lessonDetails(selected,teachers){
 if(!selected)return empty('Выберите дату с занятиями.');
 const online=selected.format==='online';
 return badge('Выбранное занятие','sage')+'<h2>'+e(selected.title)+'</h2>'+
  line('clock','Время<strong>'+dateWithYear.format(new Date(selected.start))+' · '+range(selected.start,selected.end)+'</strong>')+
  teacherLine(teachers.find(teacher=>teacher.id===selected.teacherId))+
  line('people','Вид занятия<strong>'+e(selected.type)+'</strong>')+
  line(online?'computer':'pin','Формат<strong>'+(online?'Онлайн':'Очно · '+e(selected.room))+'</strong>')+
  line('doc','Тема<strong class="lesson-description">'+e(selected.topic)+'</strong>')+
  (online?'<a class="online-card" href="/support?topic=online">'+icon('computer')+'Онлайн-занятие<small>Вопросы подключения — в поддержке</small></a>':'');
}

export function schedule({campus},params){
 const active=campus.lessons.find(lesson=>lesson.id===params.get('lesson'));
 const earliest=campus.terms[0].start,latest=campus.terms.at(-1).end;
 const raw=params.get('day');
 const valid=/^\d{4}-\d{2}-\d{2}$/.test(raw??'')&&!Number.isNaN(Date.parse(raw))&&key(fullDay(raw))===raw&&raw>=earliest&&raw<=latest;
 const day=active?key(active.start):valid?raw:campus.displayDay;
 const mode=matchMedia('(max-width:680px)').matches?'day':'week';
 const week=startOfWeek(day), last=shiftDay(week,6), distance=mode==='day'?1:7;
 const days=mode==='day'?[day]:Array.from({length:5},(_,index)=>shiftDay(week,index));
 const visible=campus.lessons.filter(lesson=>days.includes(key(lesson.start)));
 const slots=[...new Set(visible.map(lesson=>lesson.slot))].sort((a,b)=>a-b);
 const selected=active??visible.find(lesson=>key(lesson.start)===day)??visible[0];
 const title=mode==='day'?dateWithYear.format(new Date(fullDay(day))):weekLabel(week,last);
 const previous=shiftDay(day,-distance),next=shiftDay(day,distance);
 const toolbar='<div class="calendar-tools"><div class="inline-group">'+
  periodArrow(previous<earliest?earliest:previous,'left',mode,mode==='day'?day===earliest:week<=earliest)+
  '<span class="week-title">'+title+'</span>'+
  periodArrow(next>latest?latest:next,'right',mode,mode==='day'?day===latest:last>=latest)+
  '</div><form class="schedule-date" action="/schedule" data-quick-filter><label><span class="sr-only">Перейти к дате</span>'+
  '<input type="date" name="day" min="'+earliest+'" max="'+latest+'" value="'+day+'"></label></form></div>';
 const grid=visible.length?'<div class="calendar-scroll" role="region" aria-label="Дни расписания" tabindex="0"><div class="calendar-grid '+
  (mode==='day'?'single-day':'')+'" style="--days:'+days.length+';--slots:'+slots.length+'">'+days.map(value=>{
   const timestamp=new Date(fullDay(value));
   const cards=visible.filter(lesson=>key(lesson.start)===value)
    .map(lesson=>lessonCard(lesson,lesson.id===selected?.id,slots.indexOf(lesson.slot)+2)).join('');
   return '<div class="calendar-day"><h2 class="sentence">'+weekdayLabel.format(timestamp)+' '+Number(value.slice(-2))+
    '<strong>'+monthLabel.format(timestamp)+'</strong></h2>'+(cards||'<p class="calendar-day-empty">Нет пар</p>')+'</div>';
  }).join('')+'</div></div>':empty(mode==='day'?'В этот день занятий нет.':'На этой неделе занятий нет.');
 return header(false)+'<div class="split schedule-layout"><section class="panel calendar" aria-label="Календарь занятий">'+toolbar+grid+
  '</section><aside class="panel inspector schedule-inspector">'+lessonDetails(selected,campus.teachers)+'</aside></div>';
}

export function exams({campus,grades},params){
 const requested=campus.exams.find(exam=>exam.id===params.get('item'));
 const periods=[...campus.years,...campus.terms];
 const period=periods.find(item=>item.id===params.get('term'))??periods.find(item=>item.id===(requested?.termId??campus.currentTerm));
 const termIds=period.termIds??[period.id];
 const scheduled=campus.exams.filter(exam=>termIds.includes(exam.termId));
 const results=new Map(grades.filter(grade=>grade.published).map(grade=>[grade.examId,grade]));
 const selected=scheduled.find(exam=>exam.id===requested?.id)??scheduled[0];
 const result=results.get(selected?.id);
 const cards=scheduled.map(exam=>{
  const timestamp=new Date(exam.start);
  const score=results.get(exam.id);
  return '<a class="exam-event '+(selected?.id===exam.id?'active':'')+'" href="/schedule/exams?term='+e(period.id)+'&amp;item='+e(exam.id)+'"'+
   (selected?.id===exam.id?' aria-current="true"':'')+'><div class="exam-date"><strong>'+Number(key(exam.start).slice(-2))+
   '</strong><small>'+monthLabel.format(timestamp)+'</small></div><div><h3>'+e(exam.title)+'</h3><p>'+range(exam.start,exam.end)+' · '+
   e(exam.room)+'</p><div class="inline-group exam-status">'+badge(exam.type,exam.type==='Экзамен'?'peach':'sage')+
   (score?badge(score.mark===null?score.result:score.mark+' из 10','sage'):'')+'</div></div></a>';
 }).join('');
 const details=selected?badge('Выбранный контроль','sage')+'<h2>'+e(selected.title)+'</h2>'+
  line('calendar','Время<strong>'+dateWithYear.format(new Date(selected.start))+' · '+range(selected.start,selected.end)+'</strong>')+
  line('pin','Аудитория<strong>'+e(selected.room)+'</strong>')+
  teacherLine(campus.teachers.find(teacher=>teacher.id===selected.teacherId))+
  line('doc','Тип контроля<strong>'+e(selected.type)+'</strong>')+
  line(result?'check':'clock','Результат<strong>'+e(!result?'Ожидается':result.mark===null?result.result:result.mark+' из 10 · '+result.result)+'</strong>')+
  (result?'<a class="text-link" href="/grades?term='+e(result.termId)+'&amp;item='+e(result.id)+'">'+icon('doc')+'Открыть в зачётке</a>':''):
  empty('Выберите экзамен или зачёт.');
 return header(true)+'<div class="split exam-layout"><section class="panel exam-panel"><div class="section-heading"><h2>Экзамены и зачёты</h2>'+
  termPicker('/schedule/exams',periods,period.id)+'</div><div class="exam-timeline">'+cards+'</div>'+
  '</section><aside class="panel inspector schedule-inspector">'+details+'</aside></div>';
}
