import { createHash } from 'node:crypto'
import { accounts, campusFor, gradesFor, rankingFor } from './fixtures.mjs'
import { academicDateTime, academicTerms, isTeachingDay, moscowDay } from './academic-year.mjs'
import { campusBulletin } from './campus-bulletins.mjs'

const ownersByGroup = [accounts.filter(account=>account.groupIndex===0), accounts.filter(account=>account.groupIndex===1)]
const dayTime = (day,time) => `${day}T${time}:00+03:00`
const overlaps = (left,right) => Date.parse(left.start)<Date.parse(right.end) && Date.parse(right.start)<Date.parse(left.end)
const roomKey = value => value.normalize('NFC').toLowerCase().replace(/аудитория/gu,'ауд').match(/[\p{L}\p{N}]+/gu)?.join(' ')
const expectedTime = /^([01]\d|2[0-3]):[0-5]\d$/
const eventId = /^[\w-]{1,64}$/
const expectedDay = /^\d{4}-\d{2}-\d{2}$/
const gradeLabel = mark => mark>=8?'Отлично':mark>=6?'Хорошо':mark>=4?'Удовлетворительно':'Требуется пересдача'

export class RejectedAcademicChange extends Error {}
const requireValue=(condition,message)=>{if(!condition)throw new RejectedAcademicChange(message)}

export function campusWithChanges(owner,at,changes){
 const campus=campusFor(owner,at),group=accounts.find(account=>account.id===owner).groupIndex;
 const edits=new Map(changes.filter(change=>change.kind==='lesson'&&change.groups.includes(group)).map(change=>[change.lessonId,change.lesson]));
 if(!edits.size)return campus;
 return {...campus,lessons:campus.lessons.map(lesson=>edits.has(lesson.id)?edits.get(lesson.id):lesson)
   .filter(Boolean).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start))};
}

export function gradesWithChanges(account,at,changes){
 const edits=new Map(changes.filter(change=>change.kind==='grade'&&change.owner===account.id&&Date.parse(change.at)<=Date.parse(at))
   .map(change=>[change.courseId+'|'+change.stage,change]));
 return gradesFor(account,at).map(grade=>{
  const current=edits.get(grade.id+'|current'),final=edits.get(grade.id+'|final');
  return {...grade,...(current?{currentMark:current.mark,currentMarkedAt:current.at}:{}),
   ...(final&&grade.published?{mark:final.mark,result:gradeLabel(final.mark)}:{})};
 });
}

export function rankingWithChanges(account,at,cohort,changes,grades=gradesWithChanges(account,at,changes)){
 return rankingFor(account,grades,cohort,at,student=>gradesWithChanges(student,at,changes));
}

export function normalizeAcademicEvent(event,clock,{demo=false}={}){
 requireValue(event&&typeof event==='object'&&!Array.isArray(event),'Укажите объект события.');
 const {id,kind}=event,rawTime=event.at??clock;
 requireValue(typeof id==='string'&&eventId.test(id),'Укажите стабильный идентификатор события.');
 requireValue(typeof rawTime==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/.test(rawTime)&&Number.isFinite(Date.parse(rawTime)),'Укажите время события с часовым поясом.');
 const at=new Date(rawTime).toISOString();
 requireValue(demo||Date.parse(at)>=Date.parse(clock)-1000,'Время публикации уже прошло.');
 if(kind==='bulletin'){
  requireValue(demo&&[0,1].includes(event.slot),'Недопустимое время рассылки.');
  return {id,kind,at,slot:event.slot};
 }
 if(kind==='notice'){
  const {owner,title,body}=event;
  requireValue(accounts.some(account=>account.id===owner),'Укажите получателя.');
  requireValue(typeof title==='string'&&title.trim().length>0&&title.length<=120&&
   typeof body==='string'&&body.trim().length>0&&body.length<=1400,'Укажите заголовок и текст уведомления.');
  return {id,kind,at,owner,title:title.trim(),body:body.trim()};
 }
 if(kind==='demo'){
  requireValue(demo&&['move','room','online','substitute','cancel','current','final'].includes(event.action),'Недопустимый учебный сценарий.');
  return {id,kind,at,action:event.action};
 }
 if(kind==='grade'){
  const {owner,courseId,stage,mark}=event;
  requireValue(accounts.some(account=>account.id===owner)&&typeof courseId==='string'&&eventId.test(courseId),'Неизвестный студент или дисциплина.');
  requireValue(['current','final'].includes(stage)&&Number.isInteger(mark)&&mark>=0&&mark<=10,'Оценка должна быть целым числом от 0 до 10.');
  return {id,kind,at,owner,courseId,stage,mark};
 }
 requireValue(kind==='lesson','Выберите событие lesson, grade или notice.');
 const {groups,lessonId,day,start,end,room,teacherId,onlineUrl,cancel}=event;
 requireValue(Array.isArray(groups)&&groups.length>0&&groups.every(group=>group===0||group===1)&&new Set(groups).size===groups.length&&typeof lessonId==='string'&&eventId.test(lessonId),'Укажите группы и занятие.');
 const moves=day!==undefined||start!==undefined||end!==undefined;
 if(moves)requireValue(expectedDay.test(day)&&expectedTime.test(start)&&expectedTime.test(end)&&start<end,'Укажите дату, начало и конец занятия.');
 if(room!==undefined)requireValue(typeof room==='string'&&room.trim().length>0&&room.length<=90&&!/[\r\n]/.test(room),'Укажите аудиторию.');
 if(teacherId!==undefined)requireValue(typeof teacherId==='string'&&eventId.test(teacherId),'Некорректный идентификатор преподавателя.');
 if(onlineUrl!==undefined){
  let url;
  try{url=new URL(onlineUrl)}catch{}
  requireValue(typeof onlineUrl==='string'&&onlineUrl.length<=500&&url?.protocol==='https:'&&!url.username&&!url.password,'Укажите HTTPS-ссылку на занятие без учётных данных.');
 }
 const changes=moves||room!==undefined||teacherId!==undefined||onlineUrl!==undefined;
 requireValue((cancel===true&&!changes)||(cancel===undefined&&changes),'Укажите изменение или отмену занятия.');
 requireValue(!(room!==undefined&&onlineUrl!==undefined),'Для онлайн-встречи физическая аудитория не нужна.');
 return {id,kind,at,groups,lessonId,day,start,end,room:room?.trim(),teacherId,onlineUrl,cancel};
}

function lessonUpdate(event,state,validateAt=event.at){
 const {at,groups,lessonId}=event;
 const targets=groups.map(group=>state[group].lessons.find(lesson=>lesson.id===lessonId));
 const before=targets[0];
 requireValue(before?.courseId&&targets.every(lesson=>lesson&&JSON.stringify(lesson)===JSON.stringify(before)),'Занятие уже изменено, отменено или отсутствует в выбранных группах.');
 requireValue(Date.parse(before.start)>Date.parse(validateAt),'Занятие уже началось.');
 const effect={kind:'lesson',groups,lessonId,lesson:null};
 const base={at,type:'Расписание',href:'/schedule?day='+moscowDay(before.start)};
 if(event.cancel)return {effect,notice:{...base,title:'Занятие отменено · '+before.title,
  body:`Отменена пара, запланированная на ${academicDateTime(before.start,before.end)}.\n\nПроверьте остальные занятия этого дня в расписании.`}};
 const next={...before};
 if(event.day){
  const term=state[groups[0]].terms.find(item=>item.id===before.termId);
  next.start=dayTime(event.day,event.start);next.end=dayTime(event.day,event.end);
  const timestamp=Date.parse(next.start);
  requireValue(Number.isFinite(timestamp)&&moscowDay(next.start)===event.day&&event.day>=term.start&&event.day<=term.teachingEnd&&isTeachingDay(event.day)&&timestamp>Date.parse(validateAt),'Пара должна оставаться в будущем учебном дне своего семестра.');
 }
 if(event.teacherId){
  requireValue(state[0].teachers.some(teacher=>teacher.id===event.teacherId),'Замещающий преподаватель не найден.');
  next.teacherId=event.teacherId;
 }
 if(event.room){next.room=event.room;next.format='campus';delete next.onlineUrl;}
 if(event.onlineUrl||event.demoRoom){next.room='Онлайн';next.format='online';next.onlineUrl=event.onlineUrl??'/schedule/online?lesson='+lessonId;}
 requireValue(JSON.stringify(next)!==JSON.stringify(before),'Значения уже совпадают с расписанием.');
 for(const [group,campus] of state.entries()){
  for(const item of [...campus.lessons,...campus.exams]){
   if(!overlaps(item,next)||(groups.includes(group)&&item.id===lessonId))continue;
   const shared=item.id===lessonId&&item.type==='Лекция'&&next.type==='Лекция'&&item.courseId===next.courseId&&item.start===next.start&&item.end===next.end&&item.teacherId===next.teacherId&&item.format===next.format&&item.room===next.room&&item.onlineUrl===next.onlineUrl;
   if(shared)continue;
   requireValue(!groups.includes(group)&&item.teacherId!==next.teacherId&&(item.format==='online'||next.format==='online'||roomKey(item.room)!==roomKey(next.room)),'В это время заняты группа, преподаватель или аудитория.');
  }
 }
 effect.lesson=next;
 const moved=before.start!==next.start||before.end!==next.end;
 const title=moved?'Пара перенесена':next.onlineUrl&&next.onlineUrl!==before.onlineUrl?'Появилась ссылка на пару':next.teacherId!==before.teacherId?'Назначена замена':'Изменилось место занятия';
 const teacher=state[groups[0]].teachers.find(item=>item.id===next.teacherId);
 const location=next.format==='online'?'Занятие пройдёт онлайн. Ссылка доступна в карточке пары.':`Место занятия: ${next.room}.`;
 const details=[moved?`Было: ${academicDateTime(before.start,before.end)}.\nСтало: ${academicDateTime(next.start,next.end)}.`:academicDateTime(next.start,next.end)+'.',location];
 if(next.teacherId!==before.teacherId)details.push(`Занятие проведёт ${teacher.shortName}.`);
 return {effect,notice:{...base,type:next.onlineUrl&&next.onlineUrl!==before.onlineUrl?'Онлайн':base.type,title:title+' · '+next.title,body:details.join('\n\n'),href:'/schedule?lesson='+lessonId}};
}

function gradeUpdate(event,changes,cohort){
 const {owner,at,courseId,stage,mark}=event;
 const account=cohort.find(student=>student.id===owner);
 requireValue(account,'Аккаунт студента отключён.');
 const grade=gradesWithChanges(account,at,changes).find(grade=>grade.id===courseId);
 const term=academicTerms.find(term=>term.id===grade?.termId);
 requireValue(grade&&(stage==='final'?(grade.published&&grade.assessment!=='Зачёт'):
  (!grade.published&&term.start<=moscowDay(at))),'Оценка не соответствует периоду дисциплины или состоянию контроля.');
 const before=stage==='final'?grade.mark:grade.currentMark;
 requireValue(before!==mark,'Такая оценка уже опубликована.');
 const effect={kind:'grade',owner,stage,courseId,mark,at};
 const notices=[{owner,at,type:'Результат',title:(stage==='current'?'Текущая оценка':'Итоговая оценка уточнена')+' · '+grade.title,
  body:(before==null?'':before+' → ')+mark+' из 10',href:'/grades?term='+grade.termId+'&item='+grade.id}];
 if(stage==='final'){
  const previous=rankingWithChanges(account,at,cohort,changes).seasons.find(season=>season.id===grade.termId);
  if(previous){
   const revised=rankingWithChanges(account,at,cohort,[...changes,effect]).seasons.find(season=>season.id===grade.termId);
   const places=new Map(previous.peers.map(peer=>[peer.id,peer.rank]));
   for(const peer of revised.peers){
    const old=places.get(peer.id);
    if(old!==peer.rank)notices.push({owner:peer.id,at,type:'Рейтинг',title:'Уточнён рейтинг · '+revised.label,
     body:old+' → '+peer.rank+' место из '+revised.total,href:'/grades/ranking?season='+revised.id});
   }
  }
 }
 return {effect,notices};
}

const offset=(seed,max)=>createHash('sha256').update(seed).digest().readUInt32BE()%max;
const nextDay=value=>new Date(Date.parse(value+'T12:00:00Z')+86_400_000).toISOString().slice(0,10);

function demoChange(event,state,changes,cohort,processedAt){
 const today=moscowDay(processedAt),seed=event.id;
 if(['current','final'].includes(event.action)){
  const enabled=[...cohort].sort((a,b)=>a.id.localeCompare(b.id));
  requireValue(enabled.length,'Нет включённых аккаунтов для сценария.');
  const student=enabled[offset(seed,enabled.length)];
  const grades=gradesWithChanges(student,event.at,changes);
  const stage=event.action;
  const candidates=grades.filter(grade=>stage==='current'?!grade.published&&grade.termId==='2026-autumn':grade.published&&grade.termId==='2026-spring'&&grade.mark!==null);
  requireValue(candidates.length,'Нет доступных результатов для сценария.');
  const grade=candidates[offset(seed+':course',candidates.length)];
  const old=stage==='final'?grade.mark:grade.currentMark;
  const mark=old===9?7:9;
  return gradeUpdate({...event,owner:student.id,courseId:grade.id,stage,mark},changes,cohort);
 }
 const preferred=offset(seed,2);
 for(const group of [preferred,1-preferred]){
  const campus=state[group];
  const lessons=campus.lessons.filter(lesson=>lesson.courseId&&moscowDay(lesson.start)>today&&moscowDay(lesson.start)<='2026-11-30');
  const ordered=lessons.map((_,index)=>lessons[(offset(seed+':group:'+group,lessons.length)+index)%lessons.length]);
  for(const lesson of ordered){
   const change={...event,groups:[group],lessonId:lesson.id};
   const tryUpdate=patch=>{
    try{return lessonUpdate({...change,...patch},state,processedAt)}catch(error){if(!(error instanceof RejectedAcademicChange))throw error;return null;}
   };
   let result;
   if(event.action==='move'){
    const day=moscowDay(lesson.start);
    for(const proposed of [nextDay(day),day,nextDay(nextDay(day))].filter(value=>value<='2026-11-30')){
     for(const [start,end] of [['08:50','10:10'],['10:30','11:50'],['12:10','13:30'],['14:40','16:00']]){
      if(proposed===day&&lesson.start.slice(11,16)===start)continue;
      result=tryUpdate({day:proposed,start,end});if(result)break;
     }
     if(result)break;
    }
   }
   if(event.action==='room')result=tryUpdate({room:'Корпус Г · ауд. 305'});
   if(event.action==='online')result=tryUpdate({demoRoom:true});
   if(event.action==='substitute')result=tryUpdate({teacherId:campus.teachers.find(teacher=>teacher.id!==lesson.teacherId&&teacher.department===campus.teachers.find(person=>person.id===lesson.teacherId).department)?.id});
   if(event.action==='cancel')result=tryUpdate({cancel:true});
   if(result)return result;
  }
 }
 throw new RejectedAcademicChange('Для сценария не найден свободный вариант.');
}

export function resolveAcademicEvent(event,changes,cohort,processedAt=event.at){
 if(event.kind==='notice'){
  requireValue(cohort.some(account=>account.id===event.owner),'Аккаунт студента отключён.');
  return {effect:null,notices:[{owner:event.owner,at:processedAt,type:'Учебный офис',title:event.title,body:event.body,href:''}]};
 }
 if(event.kind==='bulletin')return {effect:null,notices:cohort.map(account=>({
  owner:account.id,at:event.at,...campusBulletin(event,campusWithChanges(account.id,event.at,changes)),
 }))};
 if(event.kind==='grade')return gradeUpdate({...event,at:processedAt},changes,cohort);
 const state=ownersByGroup.map(group=>campusWithChanges(group[0].id,event.at,changes));
 const result=event.kind==='demo'?demoChange(event,state,changes,cohort,processedAt):lessonUpdate({...event,at:processedAt},state,processedAt);
 if(result.notices)return result;
 return {effect:result.effect,notices:cohort.filter(student=>result.effect.groups.includes(student.groupIndex)).map(student=>({...result.notice,owner:student.id}))};
}

export function novemberScenario(){
 const actions={19:'room',20:'move',22:'current',23:'online',25:'substitute',27:'cancel',30:'final'};
 return Array.from({length:12},(_,index)=>index+19).flatMap(day=>{
  const prefix='november-2026-'+day;
  return [0,1].flatMap(slot=>{
   const start=slot===0?'09:10:00':'15:40:00';
   const at=new Date(Date.parse(`2026-11-${day}T${start}+03:00`)+offset(prefix+':'+slot,5400)*1000).toISOString();
   const bulletin={id:prefix+'-z-bulletin-'+slot,kind:'bulletin',slot,at};
   const action=slot===1&&actions[day];
   return action?[{id:prefix+'-'+action,kind:'demo',action,at},bulletin]:[bulletin];
  });
 });
}
