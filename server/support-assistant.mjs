import { academicDateTime, academicTimeRange, moscowDay } from './academic-year.mjs'
import { requestTypes } from './fixtures.mjs'
import { faq } from './support-faq.mjs'
import { dateInQuestion, findSubjects, findTeachers, moveDay, normalize, supportQuery } from './support-language.mjs'

export const supportActions=new Map([
 ['message',''],['certificate','Заказать справку'],['status','Проверить заявку'],['faq','Найти ответ'],
 ['specialist','Написать специалисту'],['schedule','Пары сегодня'],['exams','Ближайший экзамен'],['grades','Мои оценки'],
])
const help='Могу найти пары по дате, экзамен по предмету, оценку, консультацию преподавателя, пропуск или статус заявки. Напишите, например, «Какие пары завтра?»'
const greeting=/^(?:привет|здравствуй|здравствуйте|добр(?:ый день|ый вечер|ое утро|ого времени суток)|салют)(?: |$)/u
const personal=/чужи[ехй]|одногруппни[кц]|другого студент|другой аккаунт|однокурсни[кц]/u
const numberPattern=/\b[0-9a-f]{8}(?:-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?\b/u
const schoolDate=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long',year:'numeric'})
const dayLabel=day=>schoolDate.format(new Date(day+'T12:00:00+03:00'))
const pretty=value=>new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)
const reply=(text,href=null,context=null)=>({text,href,context})
const topics=[['transcript',/выписк|справк.*успеваем/u],['dormitory',/общежит|жилищн|общаг/u],['academic-leave',/академ.*отпуск|академка|академ взять|взять академ/u],
 ['media-lab',/медиалаб|медиа лаб/u],['certificate',/справ[коч]|подтверд.*обучен/u]]
const classWords=/расписан|заняти|лекци|семинар|аудитори|(?:^| )пар(?:а|ы|у|ами|ах)?(?: |$)/u
const examWords=/экзамен|сесси|зачет(?:ы|у|а|ов)?(?: |$)|контрол/u
const gradeWords=/оценк|балл|зачетк|кредит|успеваем|мои результат|покажи.*результат/u
const askTeacher=/преподават|препод|консультац|профессор|доцент|почта|почту|кабинет|контакт/u

function status(raw,type,data,prior){
  const number=normalize(raw).match(numberPattern)?.[0]
  const owned=data.requests
  const numbered=number?owned.filter(item=>item.id.toLowerCase().startsWith(number)):[]
  if(number&&numbered.length!==1){
    return reply(numbered.length?'Номер совпадает с несколькими вашими заявками. Откройте список или пришлите полный номер.':
      'В вашем кабинете заявки с таким номером нет. Сверьте номер в разделе «Заявки».','/requests')
  }
  const item=numbered[0]??(type?owned.find(item=>item.type===type):
    owned.find(item=>item.id===prior?.requestId)??owned[0])
  if(!item)return reply(type?'Заявки этого вида у вас пока нет. Её можно подать в разделе «Заявки».':'У вас пока нет заявок. Здесь можно открыть форму новой заявки.','/requests'+(type?'?new='+type:''))
  const explanation=item.documentId?'PDF уже можно открыть или скачать.':
    item.status==='Ошибка подготовки'?'При подготовке не удалось сформировать документ. Можно отправить новую заявку.':
     'Документ обычно готовится 2–3 минуты с момента подачи. Когда PDF появится, кабинет пришлёт уведомление.'
  return reply(item.title+' № '+item.id.slice(0,8).toUpperCase()+' — '+item.status+'. '+explanation,
    '/requests?item='+item.id,{intent:'status',requestId:item.id})
}

function documentOrder(type){
  const receipt=['academic-leave','media-lab'].includes(type)?' PDF подтвердит регистрацию обращения.':''
  return reply('В «Заявках» выберите «'+requestTypes.get(type)+'» и подтвердите отправку. Подготовка занимает около 2–3 минут.'+receipt+
    ' По готовности придёт уведомление, а PDF появится в карточке заявки.','/requests?new='+type,{intent:'status',requestType:type})
}

function findSeason(query,terms,today,published=false){
  const suffix=/зимн/u.test(query)?'autumn':'spring'
  const seasons=terms.filter(term=>term.id.endsWith(suffix))
  const year=query.match(/20\d{2}/u)?.[0]
  if(year)return seasons.find(term=>term.start.startsWith(year))??seasons.find(term=>term.end.startsWith(year))
  if(published||/прошл|последн|был/u.test(query))return seasons.findLast(term=>term.end<today)
  return seasons.find(term=>term.end>=today)??seasons.at(-1)
}

function ambiguousCourse(matches,href){
  const titles=[...new Set(matches.map(item=>item.title))]
  if(titles.length>1)return reply('Подходят несколько дисциплин: '+titles.join(', ')+'. Напишите название целиком, чтобы я выбрал нужную.',href)
}

function schedule(query,day,data,prior){
  const {campus,at}=data
  const today=moscowDay(at)
  const nextWeek=/следующ.*недел/u.test(query), week=/недел/u.test(query)
  const online=/онлайн|подключ|видеосвяз|ссылк/u.test(query)
  const subjects=findSubjects(data.grades,query)
  const ambiguous=ambiguousCourse(subjects,'/schedule')
  if(ambiguous)return ambiguous
  const subject=subjects[0]?.title??(prior?.intent==='schedule'?prior.subject:null)
  const future=/ближайш|следующ|когда|во сколько|где/u.test(query)||Boolean(subject)||online
  const monday=date=>moveDay(date,-((new Date(date+'T12:00:00Z').getUTCDay()+6)%7))
  const start=week?moveDay(monday(day??today),nextWeek?7:0):day??today
  const end=week?moveDay(start,6):start
  if(start<campus.terms[0].start||start>campus.terms.at(-1).end)return reply('На эту дату учебный календарь ещё не опубликован. В разделе «Расписание» можно выбрать доступный период.','/schedule')
  const candidates=campus.lessons.filter(item=>(!online||item.format==='online')&&(!subject||item.title===subject))
  const dated=candidates.filter(item=>moscowDay(item.start)>=start&&moscowDay(item.start)<=end)
  const entries=!day&&!week&&future?candidates.filter(item=>Date.parse(item.start)>=Date.parse(at)).slice(0,1):dated
  const context={intent:'schedule',subject,date:start}
  if(!entries.length){
    const next=candidates.find(item=>moscowDay(item.start)>end)
    const hint=next?' Ближайшее занятие — '+academicDateTime(next.start,next.end)+'.':''
    const text=online?'На выбранное время онлайн-занятия не найдены. Ссылки на подтверждённые встречи ищите в карточках занятий.':
      (start===today&&!week?'Сегодня':week?'На этой неделе':dayLabel(start))+' в расписании '+(subject?'по предмету «'+subject+'» ':'')+'занятий нет.'+hint
    return reply(text,start===today?'/schedule':'/schedule?day='+start,context)
  }
  if(online&&!day&&!week){
    const item=entries[0]
    return reply('Ближайшее онлайн-занятие — '+item.title+', '+academicDateTime(item.start,item.end)+'. '+
     (item.onlineUrl?'Кнопка входа находится в карточке пары.':'Ссылка ещё не указана. Видеоконференции для этого занятия не подключены.'),'/schedule?lesson='+item.id,context)
  }
  const wholeDay=!day&&!week&&!future
  const title=wholeDay?'Сегодня в расписании':week?'Расписание с '+dayLabel(start)+' по '+dayLabel(end):day?'Расписание на '+dayLabel(start):'Ближайшее занятие'
  const rows=entries.slice(0,5).map(item=>'• '+(week||!day&&!wholeDay?academicDateTime(item.start,item.end):academicTimeRange(item.start,item.end))+
    ' · '+item.title+' · '+item.room)
  return reply(title+':\n'+rows.join('\n')+(entries.length>rows.length?'\nОстальные занятия есть в расписании.':''),
    wholeDay||day===today&&!week?'/schedule':week||day?'/schedule?day='+start:'/schedule?lesson='+entries[0].id,context)
}

function exams(query,day,data,prior){
  const {campus,at}=data
  const matches=findSubjects(data.grades,query)
  const ambiguous=ambiguousCourse(matches,'/schedule/exams')
  if(ambiguous)return ambiguous
  const subject=matches[0]?.title??(prior?.intent==='exams'?prior.subject:null)
  const specificSeason=/зимн|летн/u.test(query)
  const period=specificSeason?findSeason(query,campus.terms,moscowDay(at)):
    campus.terms.find(item=>item.id===campus.examTerm)
  if(specificSeason&&!period)return reply('Такой сессии нет в опубликованном календаре. Можно выбрать доступный период в разделе «Экзамены».','/schedule/exams')
  const selected=campus.exams.filter(item=>(!subject||item.title===subject)&&(!day||moscowDay(item.start)===day)&&
   (!specificSeason||item.termId===period.id)&&(specificSeason||day||Date.parse(item.end)>=Date.parse(at)))
  const first=selected[0],href=first?'/schedule/exams?item='+first.id:'/schedule/exams'
  const context={intent:'exams',subject,date:day}
  if(!first)return reply('По этому запросу запланированного контроля не нашёл. Расписание экзаменов и зачётов можно проверить по семестрам.','/schedule/exams',context)
  if(!subject&&!day&&/(?:сесси|экзамены|зачеты)/u.test(query)&&!/(?:ближайш|следующ)/u.test(query)){
    const dates=campus.exams.filter(item=>item.termId===period.id)
    return reply(period.sessionLabel+' — с '+dayLabel(period.sessionStart)+' по '+dayLabel(period.end)+
      '. В расписании вашей группы '+dates.length+' мероприятий. Первый контроль: '+dates[0].title+' · '+
      academicDateTime(dates[0].start,dates[0].end)+'.','/schedule/exams?term='+period.id,context)
  }
  return reply('Ближайший контроль: '+first.title+' · '+first.type+'. '+academicDateTime(first.start,first.end)+' · '+first.room+'.',href,context)
}

function grades(query,data,prior){
  const {grades,campus}=data
  const latest=[...campus.terms].reverse().find(term=>grades.some(grade=>grade.termId===term.id&&grade.published))
  const bySeason=/летн|зимн/u.test(query)
  const term=bySeason?findSeason(query,campus.terms,moscowDay(data.at),true):null
  if(bySeason&&!term)return reply('Такой сессии нет в зачётке. Выберите доступный учебный период.','/grades')
  const termGrades=grades.filter(grade=>!term||grade.termId===term.id)
  const matches=findSubjects(termGrades,query)
  const ambiguous=ambiguousCourse(matches,'/grades')
  if(ambiguous)return ambiguous
  const subject=matches[0]?.title??(prior?.intent==='grades'?prior.subject:null)
  if(/пересдач|долг|незачет/u.test(query)){
    const debts=termGrades.filter(grade=>grade.published&&typeof grade.mark==='number'&&grade.mark<4)
    return reply((debts.length?'В зачётке есть оценки, требующие пересдачи: '+debts.map(item=>item.title+' ('+item.mark+'/10)').join(', ')+'.':
      'По опубликованным итоговым оценкам задолженностей не видно.')+' Дату пересдачи можно уточнить у преподавателя.','/grades',{intent:'grades'})
  }
  if(subject){
    const matches=termGrades.filter(grade=>grade.title===subject)
    const grade=matches.at(-1)
    if(grade){
      const info=grade.published?'Итог: '+(grade.mark==null?grade.result:grade.mark+' из 10 · '+grade.result)+'.':
        grade.currentMark==null?'Итог пока не опубликован. Контроль пройдёт '+academicDateTime(grade.assessmentStart,grade.assessedAt)+'.':
          'Текущая оценка — '+grade.currentMark+' из 10. Итог ещё не опубликован.'
      return reply(grade.title+'. '+info+' '+grade.credits+' зачётных ед.',
        '/grades?term='+grade.termId+'&item='+grade.id,{intent:'grades',subject})
    }
  }
  const reported=term??latest
  const marks=grades.filter(grade=>grade.termId===reported?.id&&grade.published)
  const earned=marks.filter(grade=>grade.mark===null||grade.mark>=4).reduce((sum,grade)=>sum+grade.credits,0)
  if(reported&&marks.length&&/(?:мои|какие|покажи|результат|балл|оценк|кредит)/u.test(query)){
    const lines=marks.map(grade=>'• '+grade.title+' — '+(grade.mark==null?grade.result:grade.mark+'/10'))
    return reply(reported.sessionLabel+'. Получено зачётных единиц: '+earned+'.\n'+lines.join('\n'),'/grades?term='+reported.id,{intent:'grades'})
  }
  const detail=reported&&!marks.length?' По выбранной сессии оценок пока нет.':''
  return reply('В зачётке можно выбрать учебный год или семестр, посмотреть опубликованные результаты и зачётные единицы.'+detail,
    '/grades'+(reported?'?term='+reported.id:''),{intent:'grades'})
}

function schoolReply(raw,query,data,prior,forced) {
 const {student,campus}=data
 const type=topics.find(([,pattern])=>pattern.test(query))?.[0]
 const day=dateInQuestion(raw,query,data.at)
 const follow=prior&&query.split(' ').length<=8&&/^(?:а |и |тогда |а также )?(?:когда|где|во сколько|а на|на |тогда|готов|сколько|покажи|подробнее|завтра|послезавтра|сегодня)/u.test(query)
 const teachers=findTeachers(campus.teachers,query,askTeacher.test(query))
 if(personal.test(query)&&/оценк|заявк|адрес|документ|успеваем|паспорт|фамили|почт/u.test(query)){
  return reply('Могу показать учебные данные только вашего аккаунта. Контакты преподавателей опубликованы в каталоге.','/teachers')
 }
 if(day===false)return reply('Не удалось распознать дату. Напишите её в формате 23.11.2026 или словами, например «23 ноября».')
 if(/(?:моя|мне|у меня|мой).*почт|(?:свою|своя).*почт/u.test(query)){
  return reply('Ваша учебная почта — '+student.email+'. Она также указана в учебных данных профиля.','/profile')
 }
 if(forced==='specialist'||/оператор|живой человек|специалист|связаться.*учебн.*офис/u.test(query)){
  return reply('Я автоматический помощник. В этом чате специалист не получает сообщения. Для преподавателей доступны учебная почта и время консультаций.','/teachers')
 }
 const hasRequestNumber=numberPattern.test(normalize(raw))
 if(forced==='status'||hasRequestNumber&&(type||/заявк|статус/u.test(query)||follow)||/статус.*(?:заяв|справ|выписк)|заяв.*статус|готов.*справ|справ.*готов|провер.*заяв|заявк.*готов|сколько.*(?:дела|жда).*справ|где.*моя.*(?:справк|заявк)|скача.*(?:справ|выписк)/u.test(query)){
  return status(raw,type,data,follow?prior:null)
 }
 if(forced==='certificate'||type&&(!/пересдач|долг/u.test(query))||/заказ.*документ|подать.*заяв|оформ.*заяв/u.test(query))return documentOrder(type??'certificate')
 if(/рейтинг|gpa|средний балл/u.test(query)&&!/когда.*(?:экзамен|пара)/u.test(query)){
  const stats=data.ranking()
  const summary=stats.rank===null?'Пока ни одна сессия не опубликована в рейтинге.':
   stats.label+'. Ваш средний балл — '+pretty(stats.mean)+', GPA — '+pretty(stats.gpa)+'. Место: '+stats.rank+' из '+stats.total+'.'
  const next=stats.nextSeason?' Следующая публикация — '+schoolDate.format(new Date(stats.nextSeason.publishedAt))+'.':''
  return reply(summary+next,'/grades/ranking',{intent:'grades'})
 }
 if(/заболел|болезн|пропуст.*(?:пару|заняти|экзамен|зачет)|уважительн.*причин/u.test(query)){
  const [,answer,href]=faq.find(([pattern])=>pattern.test(query))
  return reply(answer,href)
 }
 if(gradeWords.test(query)||/пересдач|долг/u.test(query)||forced==='grades')return grades(query,data,follow?prior:null)
 if(examWords.test(query)||forced==='exams')return exams(query,day,data,follow?prior:null)
 if(classWords.test(query)||/онлайн|подключ|послезавтра|завтра|вчера/u.test(query)&&!follow||forced==='schedule'){
  return schedule(query,day,data,follow?prior:null)
 }
 if(teachers.length||askTeacher.test(query)||follow&&prior.intent==='teacher'){
  if(teachers.length>1)return reply('Нашёл несколько преподавателей: '+teachers.map(item=>item.shortName).join(', ')+'. Уточните фамилию.','/teachers')
  const person=teachers[0]??campus.teachers.find(item=>follow&&item.id===prior.teacherId)
  if(!person)return reply('Уточните фамилию преподавателя. В каталоге есть предметы, кабинеты и консультации.','/teachers')
  return reply(person.name+' · '+person.subject+'. Консультации: '+person.consultation+'. Кабинет: '+person.office+
    '. Учебная почта: '+person.email+'.','/teachers?item='+person.id,{intent:'teacher',teacherId:person.id})
 }
 const publishedHelp=faq.find(([pattern])=>pattern.test(query))
 if(publishedHelp)return reply(publishedHelp[1],publishedHelp[2])
 if(/пропуск|студенческ.*билет|qr|паспорт|аттестат|аватар|фото|мой.*профил|(?:моя|у меня).*групп/u.test(query)){
  if(/групп/u.test(query))return reply('Ваша группа — '+student.group+'.','/profile')
  if(/паспорт|аттестат/u.test(query))return reply('Паспорт и аттестат доступны в блоке «Мои документы» на странице профиля.','/profile')
  if(/аватар|фото/u.test(query))return reply('В профиле нажмите «Добавить фото» или «Изменить фото». Там можно загрузить изображение или вернуться к инициалам.','/profile')
  return reply('Студенческий пропуск находится в профиле. Нажмите «Показать оборот», чтобы увидеть QR-код и срок действия.','/profile')
 }
 if(/уведомлен|непрочитан|зву[кч]/u.test(query)){
  const unread=data.notifications.filter(item=>!item.read).length
  return reply((unread?'Непрочитанных уведомлений: '+unread+'. ':'Непрочитанных уведомлений пока нет. ')+
    'В ленте можно включить звук и открыть сообщение целиком. Новые уведомления сохраняются в кабинете.','/notifications')
 }
 if(/тем[ауеы] |темн.*тем|светл.*тем|шрифт|размер.*текст|масштаб|настройк/u.test(query+' '))return reply('Тему и размер текста можно изменить в «Настройках». Выбор сохраняется в этом браузере для вашего аккаунта.','/settings')
 if(forced==='faq'||/что.*умеешь|кто ты|помощь|помоги|что можно/u.test(query))return reply(help)
 if(follow){
  if(prior.intent==='status')return status(raw,prior.requestType,data,prior)
  if(prior.intent==='exams')return exams(query,day,data,prior)
  if(prior.intent==='grades')return grades(query,data,prior)
  if(prior.intent==='schedule')return schedule(query,day,data,prior)
 }
 if(day)return schedule(query,day,data,null)
 if(/^(?:благодарю|спасибо|мерси|спс)(?: |$)/u.test(query))return reply('Пожалуйста! Если понадобится ещё что-то по учёбе, напишите 🙂')
 if(/^(?:пока|до свидания|до встречи)(?: |$)/u.test(query))return reply('До встречи! Удачи с учёбой.')
 return reply('Не понял, какая информация нужна. '+help)
}

export function answerSupport(action,input,data,prior) {
 const raw=action==='message'?input:supportActions.get(action)
 const cleaned=supportQuery(raw)
 const hello=greeting.test(cleaned)
 const opening=hello?'Здравствуйте, '+data.student.shortName.split(' ')[0]+'! ':''
 if(hello&&!cleaned.replace(greeting,'').trim())return reply(opening+'Чем вам помочь?')
 const parts=action==='message'?raw.split(/(?:[?;]\s+|\n+|\s+(?:и|а)\s+(?=(?:когда|где|какие|сколько|во сколько)\s))/iu).filter(part=>part.trim()).slice(0,3):[raw]
 const answers=parts.map(part=>{
   const query=supportQuery(part).replace(greeting,'').trim()
   return schoolReply(part,query,data,prior,action)
 })
 return reply(opening+answers.map(answer=>answer.text).join('\n\n'),answers.find(answer=>answer.href)?.href??null,
   [...answers].reverse().find(answer=>answer.context)?.context??null)
}
