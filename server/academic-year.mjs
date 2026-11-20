import { facultyById } from './faculty.mjs';

const terms = [
  ['2025-autumn', 'Осень 2025', '2025-09-01', '2025-12-19', '2025-12-22', '2026-01-19', [
    ['algorithms','Алгоритмы и структуры данных',7,'sokolov','Экзамен','Сложность алгоритмов;Деревья и хеш-таблицы;Обходы графов'],
    ['construction','Конструирование программного обеспечения',6,'lebedeva','Экзамен','Модули и интерфейсы;Контроль версий;Рефакторинг'],
    ['os','Операционные системы',5,'antonov','Экзамен','Процессы и потоки;Виртуальная память;Файловые системы'],
    ['teamwork','Командная разработка',4,'isaeva','Зачёт','Роли в команде;Рецензирование кода;Демонстрация прототипа'],
    ['probability','Теория вероятностей',5,'kulikov','Экзамен','Вероятность событий;Случайные величины;Предельные теоремы'],
    ['project','Проектный семинар',3,'gusev','Зачёт','Постановка задачи;Техническое задание;Защита проекта'],
  ]],
  ['2026-spring', 'Весна 2026', '2026-02-09', '2026-05-29', '2026-06-02', '2026-06-26', [
    ['discrete','Формальные языки и автоматы',6,'sokolova','Экзамен','Регулярные языки;Конечные автоматы;Контекстно-свободные грамматики'],
    ['databases','Конструирование баз данных',6,'krylov','Экзамен','Модель данных;SQL и индексы;Транзакции'],
    ['stats','Математическая статистика',5,'karimov','Экзамен','Выборки;Оценка параметров;Проверка гипотез'],
    ['practice','Технологическая практика',5,'zueva','Дифференцированный зачёт','Рабочее окружение;Реализация задачи;Отчёт по практике'],
    ['security','Основы информационной безопасности',4,'yudin','Зачёт','Модели угроз;Контроль доступа;Защита приложений'],
    ['networks','Компьютерные сети',4,'nersesyan','Экзамен','Модели сетей;Маршрутизация;Транспортные протоколы'],
  ]],
  ['2026-autumn', 'Осень 2026', '2026-09-01', '2026-12-18', '2026-12-21', '2027-01-22', [
    ['theory','Теория вычислений',5,'tikhonov','Экзамен','Модели вычислений;Вычислимость;Сложность задач'],
    ['distributed','Распределённые системы',6,'smirnova','Экзамен','Обмен сообщениями;Репликация;Согласованность'],
    ['architecture','Архитектура программного обеспечения',6,'voronova','Экзамен','Архитектурные стили;Границы компонентов;Оценка качественных свойств'],
    ['project','Проектный практикум',5,'pavlova','Дифференцированный зачёт','Исследование задачи;Разработка прототипа;Демонстрация проекта'],
    ['testing','Тестирование программного обеспечения',4,'ilyin','Зачёт','Модульные тесты;Интеграционные проверки;Тестирование выпуска'],
    ['networks','Сетевое программирование',4,'morozova','Экзамен','Сокеты;Прикладные протоколы;Асинхронный ввод-вывод'],
  ]],
  ['2027-spring', 'Весна 2027', '2027-02-08', '2027-05-28', '2027-06-01', '2027-06-25', [
    ['analysis','Анализ данных',5,'eremin','Экзамен','Подготовка данных;Исследовательский анализ;Оценка моделей'],
    ['storage','Хранилища данных',5,'fomina','Экзамен','Хранилища и витрины;Загрузка данных;Аналитические запросы'],
    ['devops','Инженерия эксплуатации ПО',5,'belyaev','Экзамен','Сборка и поставка;Наблюдаемость;Восстановление сервиса'],
    ['practice','Производственная практика',6,'romanova','Дифференцированный зачёт','План практики;Работа над проектом;Отчёт и защита'],
    ['quality','Обеспечение качества ПО',5,'demin','Экзамен','Метрики качества;Ревью и аудит;Выпуск продукта'],
    ['cloud','Облачные вычисления',4,'orlov','Зачёт','Виртуализация;Контейнеры;Управление ресурсами'],
  ]],
].map(([id,label,start,teachingEnd,sessionStart,end,subjects])=>({
  id,label,start,teachingEnd,sessionStart,end,
  courses:subjects.map(([code,title,credits,teacherId,assessment,topics])=>({
    id:id+'-'+code,code,title,credits,teacherId,assessment,topics:topics.split(';'),
  })),
}));

const at = (day,time='00:00') => day+'T'+time+':00+03:00';
const dateInMoscow = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'});
export const moscowDay = value => dateInMoscow.format(new Date(value));
const nonTeaching = new Set([
  '2025-11-03','2025-11-04','2026-02-23','2026-03-09','2026-05-01','2026-05-11',
  '2026-06-12','2026-11-04','2027-02-23','2027-03-08','2027-05-03','2027-05-10','2027-06-14',
]);
export const isTeachingDay = day=>!nonTeaching.has(day)&&[1,2,3,4,5].includes(new Date(day+'T12:00:00Z').getUTCDay());
const times = [['08:50','10:10'],['10:30','11:50'],['12:10','13:30'],['14:40','16:00']];
// Each entry specifies a time slot and either one shared course or two parallel workshops.
const rotations = [
  [[[0,0],[1,1],[2,2,3],[3,3,2]], [[1,5,0],[2,0,5]], [[1,2],[2,4,1],[3,1,4]], [[1,4]], [[1,5],[2,3]]],
  [[[1,1],[2,0]], [[0,2],[1,5],[2,3,4],[3,4,3]], [], [[1,4],[2,2,5],[3,5,2]], [[1,3]]],
];
const dateLabel = new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long',year:'numeric'});
const timeLabel = new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'});
export const academicTimeRange=(start,end)=>timeLabel.format(new Date(start))+'–'+timeLabel.format(new Date(end));
export const academicDateTime=(start,end)=>dateLabel.format(new Date(start))+' · '+academicTimeRange(start,end);
const dayMs = 86_400_000;

function days(from,to){
  const values=[];
  for(const day=new Date(from+'T12:00:00Z');day.toISOString().slice(0,10)<=to;day.setUTCDate(day.getUTCDate()+1)){
    const key=day.toISOString().slice(0,10),weekday=day.getUTCDay();
    if(weekday>=1&&weekday<=5&&!nonTeaching.has(key))values.push([key,weekday-1]);
  }
  return values;
}

function buildCalendar(group){
  const lessons=[],exams=[];
  for(const term of terms){
    const teaching=days(term.start,term.teachingEnd);
    const start=Date.parse(term.start);
    const duration=Date.parse(term.teachingEnd)-start+dayMs;
    const startWeekday=(new Date(start).getUTCDay()+6)%7;
    for(const [day,weekday] of teaching){
      const elapsed=Date.parse(day)-start;
      const week=Math.floor((elapsed+startWeekday*dayMs)/(7*dayMs));
      const meetings=rotations[week%rotations.length][weekday];
      if(!meetings.length&&group===0){
        lessons.push({id:'vuc-'+day,termId:term.id,slot:1,title:'Военный учебный центр',teacherId:null,
          start:at(day,'09:00'),end:at(day,'16:00'),type:'День ВУЦ',format:'campus',room:'Учебный корпус ВУЦ',
          topic:'Выездной учебный день. Занятий на факультете нет.'});
      }
      for(const [slot,firstCourse,secondCourse] of meetings){
        const shared=secondCourse===undefined;
        const courseIndex=shared||group===0?firstCourse:secondCourse;
        const course=term.courses[courseIndex], [start,end]=times[slot];
        const online=course.code==='devops'&&shared;
        lessons.push({
          id:day+'-'+slot, termId:term.id, courseId:course.id, slot, title:course.title, teacherId:course.teacherId,
          start:at(day,start),end:at(day,end),type:shared?'Лекция':courseIndex===3?'Практикум':'Практическое занятие',
          format:online?'online':'campus',room:online?'Онлайн':facultyById.get(course.teacherId).room,
          topic:course.topics[Math.floor(elapsed/duration*course.topics.length)],
        });
      }
    }
    const sessionDays=days(term.sessionStart,term.end).filter(([day])=>!/^\d{4}-01-0[1-9]$/.test(day)&&!day.endsWith('-12-31'));
    term.courses.forEach((course,index)=>{
      const [day]=sessionDays[Math.round(index*(sessionDays.length-1)/(term.courses.length-1))];
      const [start,end]=times[group+1];
      exams.push({id:course.id,termId:term.id,title:course.title,type:course.assessment,
        start:at(day,start),end:at(day,end),room:facultyById.get(course.teacherId).room,teacherId:course.teacherId});
    });
  }
  return {lessons,exams};
}

const calendars = [buildCalendar(0),buildCalendar(1)];
const examsById=calendars.map(({exams})=>new Map(exams.map(exam=>[exam.id,exam])));
const teachingHours = calendars.map(({lessons})=>{
  const hours=new Map();
  for(const {courseId} of lessons){
    if(courseId)hours.set(courseId,(hours.get(courseId)??0)+2);
  }
  return hours;
});
export const academicTerms = terms.map(({courses,...term})=>{
  const startYear=term.sessionStart.slice(0,4), endYear=term.end.slice(0,4);
  const sessionLabel=term.id.endsWith('-autumn')
    ? `Зимняя сессия ${startYear}/${endYear.slice(-2)}`
    : `Летняя сессия ${endYear}`;
  return {...term,sessionLabel};
});
const academicYears = academicTerms.filter(term=>term.id.endsWith('-autumn')).map(term=>{
  const startYear=Number(term.start.slice(0,4)),nextYear=startYear+1;
  return {id:startYear+'-'+String(nextYear).slice(-2),label:startYear+'/'+String(nextYear).slice(-2)+' · весь год',
    termIds:[term.id,nextYear+'-spring']};
});
export const courseForTeacher = id => terms.flatMap(term=>term.courses).find(course=>course.teacherId===id);

export function timetableFor(account,clock){
  const today=moscowDay(clock);
  const current=academicTerms.findLast(term=>term.start<=today)??academicTerms[0];
  const examTerm=academicTerms.find(term=>term.end>=today)??academicTerms.at(-1);
  return {
    clock, displayDay:today<academicTerms[0].start?academicTerms[0].start:today>academicTerms.at(-1).end?academicTerms.at(-1).end:today,
    currentTerm:current.id, examTerm:examTerm.id, terms:academicTerms, years:academicYears,
    ...calendars[account.groupIndex],
  };
}

export function academicGrades(account,clock){
  const exams=examsById[account.groupIndex];
  return terms.flatMap((term,termIndex)=>term.courses.map((course,courseIndex)=>{
    const exam=exams.get(course.id);
    const published=Date.parse(exam.end)<=Date.parse(clock);
    const source=account.marks[(courseIndex+termIndex)%account.marks.length]??7;
    const mark=published&&course.assessment!=='Зачёт'?Math.min(10,Math.max(4,source+(courseIndex%3)-1)):null;
    const result=!published?'Ожидается':mark===null?'Зачтено':mark>=8?'Отлично':mark>=6?'Хорошо':'Удовлетворительно';
    return {...course,termId:term.id,mark,result,examId:exam.id,published,
      hours:course.credits*36,classHours:teachingHours[account.groupIndex].get(course.id)??0,
      assessmentStart:exam.start, assessedAt:exam.end};
  }));
}

export function academicNotices(campus,grades){
  const now=Date.parse(campus.clock),day=86_400_000;
  return campus.exams.flatMap(exam=>{
    const upcoming=Date.parse(exam.start)-now;
    const recent=now-Date.parse(exam.end);
    if(upcoming>0&&upcoming<=7*day) return [{
      id:'reminder-'+exam.id,title:exam.type+' · '+exam.title,type:'Дедлайн',
      body:academicDateTime(exam.start,exam.end)+' · '+exam.room,
      at:new Date(Date.parse(exam.start)-7*day).toISOString(),href:'/schedule/exams?item='+exam.id,
    }];
    if(recent>=0&&recent<14*day){
      const grade=grades.find(value=>value.examId===exam.id);
      return [{id:'result-'+exam.id,title:'Опубликован результат · '+exam.title,type:'Результат',
        body:grade.mark===null?grade.result:grade.mark+' из 10 · '+grade.result,
        at:exam.end,href:'/grades?term='+grade.termId+'&item='+grade.id}];
    }
    return [];
  });
}
