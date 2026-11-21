import { moscowDay } from './academic-year.mjs'

const monthNames=['январ','феврал','март','апрел','мая','июн','июл','август','сентябр','октябр','ноябр','декабр']
const weekdayNames=['воскресен','понедельник','вторник','сред','четверг','пятниц','суббот']
const vocabulary=['здравствуйте','привет','спасибо','расписание','экзамен','экзамены','зачетка','оценка','оценки','рейтинг',
  'выписка','справка','справку','заявка','заявки','заявку','общежитие','консультация','консультации','преподаватель',
  'сегодня','завтра','послезавтра','сессия','сессии','пересдача','пересдачи','пропуск','стипендия','уведомления',
  'кабинет','пароль','академический','онлайн','аудитория','документ','документы','медиалаборатория',
  'общага','заселение','библиотека','столовая','стипуха','пропустил','академка']
const familiar=/^(?:справ[коч]|выписк|заявк|расписан|оценк|консультац|преподават|общежит|экзамен|пересдач|сесси|уведомлен|аудитори|стипенди)/u
const layoutFrom="qwertyuiop[]asdfghjkl;'zxcvbnm,."
const layoutTo='йцукенгшщзхъфывапролджэячсмитьбю'
const aliases=new Map([
  ['распис','расписание'],['расписуха','расписание'],['экзы','экзамены'],['экз','экзамен'],
  ['зчетка','зачетка'],['оценик','оценки'],['зчт','зачет'],['препы','преподаватели'],
  ['док','документ'],['вкладыш','выписка'],['общяга','общага'],['общяге','общаге'],
  ['стипу','стипендия'],['зачку','зачетку'],['пересдак','пересдача'],['некст','следующая'],
  ['скок','сколько'],['скока','сколько'],
])
export const normalize=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё','е').trim()
export const words=value=>normalize(value).match(/[\p{L}\p{N}]+/gu)??[]

function distance(a,b) {
  let previous=Array.from({length:b.length+1},(_,i)=>i), before
  for(let i=1;i<=a.length;i++){
    const row=[i]
    for(let j=1;j<=b.length;j++){
      row[j]=Math.min(row[j-1]+1,previous[j]+1,previous[j-1]+Number(a[i-1]!==b[j-1]))
      if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],before[j-2]+1)
    }
    before=previous
    previous=row
  }
  return previous[b.length]
}

export function supportQuery(value) {
  return words(value).map(word=>{
    if(aliases.has(word))return aliases.get(word)
    if(/^[a-z]{5,}$/u.test(word)){
      const translated=[...word].map(char=>layoutTo[layoutFrom.indexOf(char)]??char).join('')
      if(vocabulary.includes(translated))return translated
    }
    if(word.length<5||word.length>21||!/^[а-я]+$/u.test(word)||familiar.test(word)||vocabulary.includes(word))return word
    const matches=vocabulary.map(candidate=>[candidate,distance(word,candidate)]).filter(([,score])=>score<=1)
    return matches.length===1?matches[0][0]:word
  }).join(' ')
}

const dayStamp=day=>Date.parse(day+'T12:00:00+03:00')
export const moveDay=(day,days)=>moscowDay(dayStamp(day)+days*86_400_000)
export function dateInQuestion(raw,query,at) {
  const today=moscowDay(at)
  const relative=[['послезавтра',2],['позавчера',-2],['завтра',1],['вчера',-1],['сегодня',0]].find(([word])=>query.split(' ').includes(word))
  if(relative)return moveDay(today,relative[1])
  const absolute=normalize(raw).match(/(?:^|\s)([0-9]{4})-([0-9]{2})-([0-9]{2})(?![\w-])/u)
  const numeric=normalize(raw).match(/(?:^|\s)(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?(?![\d./])/u)
  const verbal=query.match(new RegExp('(?:^| )(\\d{1,2}) ('+monthNames.join('|')+')[а-я]*(?: (\\d{4}))?(?: |$)','u'))
  if(absolute||numeric||verbal){
    const [year,month,day]=absolute?absolute.slice(1):numeric?[numeric[3],numeric[2],numeric[1]]:
      [verbal[3],monthNames.indexOf(verbal[2])+1,verbal[1]]
    const iso=String(year??today.slice(0,4))+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0')
    return Number.isFinite(dayStamp(iso))&&moscowDay(dayStamp(iso))===iso?iso:false
  }
  const weekday=weekdayNames.findIndex(name=>query.split(' ').some(word=>word.startsWith(name)))
  if(weekday!==-1){
    const current=new Date(dayStamp(today)).getUTCDay()
    let delta=(weekday-current+7)%7
    if(!delta&&/следующ/u.test(query))delta=7
    return moveDay(today,delta)
  }
  return null
}

const noise=new Set(['системы','систем','программного','обеспечения','программное','инженерия','основы','проект','программа'])
function similar(a,b) {
  if(a===b)return true
  const shorter=Math.min(a.length,b.length)
  let prefix=0
  while(prefix<shorter&&a[prefix]===b[prefix])prefix++
  return shorter>=5&&(prefix>=Math.max(4,shorter-2)||distance(a,b)<=1)
}

export function findSubjects(records,query) {
  const tokens=words(query)
  const scored=records.map(record=>{
    const keys=words(record.title).filter(word=>word.length>=4&&!noise.has(word))
    const matches=keys.filter(key=>tokens.some(token=>similar(key,token)))
    const score=matches.reduce((sum,key)=>sum+(tokens.includes(key)?3:2),0)
    return {record,score}
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score)
  return scored.filter(item=>item.score===scored[0]?.score).map(item=>item.record)
}

export function findTeachers(teachers,query,allowGiven) {
  const tokens=words(query)
  const ranked=teachers.map(teacher=>{
    const [given,surname]=words(teacher.shortName)
    const familyMatch=tokens.some(token=>similar(surname,token))
    const firstMatch=allowGiven&&tokens.includes(given)
    return {teacher,score:(familyMatch?4:0)+(firstMatch?1:0)}
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score)
  return ranked.filter(item=>item.score===ranked[0]?.score).map(item=>item.teacher)
}
