import { academicTimeRange, moscowDay } from './academic-year.mjs'

const paper = '#fbf7ee', ink = '#142b43', muted = '#575854', rule = '#d6c7af'
const moscow = { timeZone:'Europe/Moscow' }
const date = new Intl.DateTimeFormat('ru-RU',{ ...moscow,day:'numeric',month:'long',year:'numeric' })
const shortDate = new Intl.DateTimeFormat('ru-RU',{ ...moscow,day:'2-digit',month:'2-digit',year:'numeric' })
const formatted = value => date.format(new Date(value))

const templates = {
  certificate: { accent:'#9a7140', prefix:'ST', title:'Справка об обучении', heading:'Подтверждение зачисления',
    description:'Учебный офис подтверждает, что указанный студент обучается в Altioris University. Сведения приведены на дату оформления справки.' },
  transcript: { accent:'#6e537c', prefix:'TR', title:'Выписка об успеваемости', heading:'Академические результаты' },
  dormitory: { accent:'#536a4b', prefix:'DR', title:'Справка для общежития', heading:'Для жилищной службы кампуса',
    description:'Учебный офис подтверждает статус студента для обращения в жилищную службу кампуса. Справка не содержит решения о предоставлении места.' },
  'academic-leave': { accent:'#874b59', prefix:'AL', title:'Академический отпуск', heading:'Подтверждение регистрации обращения',
    description:'Учебный офис зарегистрировал обращение об академическом отпуске. Для решения по существу потребуются основания, документы и отдельное рассмотрение.' },
  'media-lab': { accent:'#396a72', prefix:'ML', title:'Запись в медиалабораторию', heading:'Подтверждение регистрации запроса',
    description:'Запрос на посещение медиалаборатории зарегистрирован. Дату и время посещения необходимо согласовать с координатором лаборатории.' },
}

function footer(canvas,accent,index,total,building){
  const {text,outline,image}=canvas
  text('Руководитель учебного офиса',63,662,9.2,muted)
  text('Вероника Львовна Ланская',63,684,14,ink,'F2')
  image('Signature',406,640,122,37)
  outline([[399,686],[532,686]],accent,.45)
  if(building)image('Campus',147,697,301,101)
  outline([[63,802],[532,802]],accent,.55)
  text('ДЕМОНСТРАЦИОННЫЙ ДОКУМЕНТ',63,819,8.2,muted)
  if(total>1)text(`${index} / ${total}`,503,819,8.2,muted)
}

function transcriptBody(canvas,period,accent){
  const {text,rect,paragraph}=canvas
  text(period.label,63,294,16,accent,'F2')
  const top=310, rowHeight=32
  rect(63,top,469,27,accent)
  for(const [label,x] of [['Дисциплина',73],['Контроль (МСК)',277],['Кредиты',364],['Балл',416],['Результат',458]]){
    text(label,x,top+18,8.5,'#fffaf1')
  }
  for(const [index,grade] of period.grades.entries()){
    const y=top+27+index*rowHeight
    if(index%2===0)rect(63,y,469,rowHeight,'#f0e8df')
    paragraph(grade.title,73,y+13,196,8.8,ink,11)
    text(shortDate.format(new Date(grade.assessmentStart)),277,y+13,8.3,ink)
    text(academicTimeRange(grade.assessmentStart,grade.assessedAt),277,y+24,8,muted)
    text(String(grade.credits),379,y+19,9,ink)
    text(grade.mark===null?'—':String(grade.mark),423,y+19,9,ink)
    paragraph(grade.result,458,y+13,71,7.5,ink,10)
  }
  if(!period.grades.length)text('На дату оформления итоговых результатов нет.',73,362,10,muted)
  const numeric=period.grades.filter(grade=>grade.mark!==null)
  const credits=numeric.reduce((sum,grade)=>sum+grade.credits,0)
  const mean=numeric.length?numeric.reduce((sum,grade)=>sum+grade.mark,0)/numeric.length:null
  const gpa=credits?numeric.reduce((sum,grade)=>sum+grade.mark*grade.credits,0)/credits:null
  const display=value=>value==null?'—':value.toFixed(2).replace('.',',')
  const y=top+27+Math.max(1,period.grades.length)*rowHeight+19
  for(const [x,label,value] of [[63,'Средний балл',mean],[304,'Взвешенный GPA',gpa]]){
    rect(x,y,228,51,'#eee4ef')
    text(label,x+12,y+17,9,muted)
    text(display(value),x+12,y+40,19,ink,'F2')
  }
  text('В GPA оценки взвешены по кредитам. Зачёты без числовой оценки исключены.',63,y+69,8.5,muted)
}

export function drawRequestPage(canvas,document,student,type,period,index,total){
  const view=templates[type]??templates.certificate
  const {text,rect,outline,image,paragraph,width}=canvas
  const {accent}=view
  const id=String(document.id).replace(/[^a-z0-9]/gi,'').slice(0,12).toUpperCase()
  const number=`ALT-${view.prefix}-${moscowDay(document.createdAt).slice(0,4)}-${id}`
  const horizontal=(top,color=rule)=>outline([[63,top],[532,top]],color,.55)
  const right=(value,x,y,size,color)=>text(value,x-width(value,size),y,size,color)
  rect(0,0,595,842,paper)
  outline([[28,28],[567,28],[567,828],[28,828],[28,28]],rule,.6)
  for(const [x,y,dx,dy] of [[37,37,1,1],[558,37,-1,1],[37,819,1,-1],[558,819,-1,-1]]){
    outline([[x+25*dx,y],[x,y],[x,y+25*dy]],accent,.7)
  }
  image('Crest',63,57,56,67)
  outline([[135,65],[135,115]],accent,.55)
  text('Altioris University',152,89,29,ink,'F2')
  text('Учебный офис',153,109,11,muted)
  horizontal(138,accent)
  text(view.title,63,187,Math.min(38,468/width(view.title,1,'F2')),ink,'F2')
  text('№ '+number,63,215,9.4,muted)
  right(formatted(document.createdAt),532,215,9.4,muted)
  if(period){
    text(student.name,63,245,20,ink,'F2')
    text(`${student.program} · ${student.year} курс · ${student.group}`,63,265,9.7,muted)
    transcriptBody(canvas,period,accent)
  }else{
    text(view.heading,63,260,11,accent)
    text(student.name,63,299,Math.min(28,467/width(student.name,1,'F2')),ink,'F2')
    paragraph(view.description,63,330,465,11.6,ink,17)
    horizontal(383)
    text('Образовательная программа',63,406,9.5,muted)
    paragraph(student.program,63,431,466,18,ink,20,'F2')
    horizontal(453)
    outline([[296,465],[296,522]],rule,.55)
    text('Факультет',63,480,9.4,muted)
    text('Форма обучения и группа',314,480,9.4,muted)
    text('Факультет '+student.faculty.toLocaleLowerCase('ru-RU'),63,502,12.5,ink,'F2')
    text(`${student.form} · ${student.year} курс · ${student.group}`,314,502,12.5,ink,'F2')
    horizontal(535)
    if(type==='certificate')text('Кампус: '+student.campus+' · поступление: '+student.admissionYear+' г.',63,565,10.5,muted)
    else if(type==='dormitory'){
      rect(63,549,469,67,'#e8ebdd')
      text('Кампус',76,571,9,accent)
      text(student.campus,76,598,14,ink,'F2')
      text('UID студенческого пропуска',314,571,9,accent)
      text(student.number,314,598,14,ink,'F2')
    }else{
      const leave=type==='academic-leave'
      rect(63,549,469,67,leave?'#f2e1df':'#e1ecea')
      text('РЕГИСТРАЦИЯ ОБРАЩЕНИЯ',76,568,9,accent)
      text('Подано: '+formatted(document.requestedAt??document.createdAt),76,589,11,ink)
      text(leave?'Следующий этап: рассмотрение учебным офисом':'Следующий этап: согласование с координатором',76,606,9.5,muted)
    }
  }
  footer(canvas,accent,index,total,!period)
  return canvas.result()
}
