import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { accounts, campusFor, demoClock, teachers } from '../server/fixtures.mjs'
import { searchTeachers } from '../public/features/teacher-search.js'
import { academicDateTime, academicGrades } from '../server/academic-year.mjs'
import { calendar } from '../server/exports.mjs'
import { openStore } from '../server/store.mjs'

test('faculty search matches name parts and combines them with the separate department filter',()=>{
  const ids=(query,department)=>searchTeachers(teachers,query,department).map(teacher=>teacher.id)
  assert.deepEqual(ids('СЕР'),['krylov'])
  assert.deepEqual(ids('Мар'),['lebedeva'])
  assert.deepEqual(ids('Крыл'),['krylov'])
  assert.deepEqual(ids('Крылов, Сергей Андр.'),['krylov'])
  assert.deepEqual(ids('Артем Еремин'),['eremin'])
  assert.deepEqual(ids('Руслан Маратович'),['karimov'])
  assert.deepEqual(ids('мат стат'),[])
  assert.deepEqual(ids('Архитектура программного обеспечения'),[])
  assert.deepEqual(ids('Прикладная математика'),[])
  assert.deepEqual(ids('Мар','прикладной математики'),[])
  assert.deepEqual(ids('Рус Кар','прикладной математики'),['karimov'])
  assert.deepEqual(ids('?'),teachers.map(teacher=>teacher.id))
})

test('the guided assistant resolves owned records and meaningful student intents', async (t) => {
  const store = openStore({
    databasePath: ':memory:',
    passwords: Object.fromEntries(accounts.map(({ id }) => [id, 'isolated-test-password-' + id])),
    clock: () => demoClock,
  })
  t.after(() => store.close())
  const reply = (owner, text) => {
    store.addSupport(owner, 'message', text)
    return store.dashboard(owner).support.at(-1)
  }
  await t.test('grades use the signed-in students actual cohort results', () => {
    const dashboard = store.dashboard('a')
    const result = reply('a', 'Какой у меня GPA и рейтинг?')
    assert.equal(result.href, '/grades/ranking')
    assert.ok(result.text.includes(dashboard.ranking.gpa.toFixed(2).replace('.', ',')))
    assert.ok(result.text.includes(String(dashboard.ranking.total)))
    assert.equal(dashboard.ranking.total, 13)
    assert.deepEqual(dashboard.ranking.peers.map(x => x.rank), Array.from({ length: 13 }, (_, i) => i + 1))
  })
  await t.test('an explicit owned request is selected rather than the latest request', () => {
    const first = store.createRequest('a', 'certificate')
    store.createRequest('a', 'academic-leave')
    const result = reply('a', 'Проверь статус заявки ' + first.id)
    assert.equal(result.href, '/requests?item=' + first.id)
    assert.ok(result.text.includes('Отправлена'))
  })
  await t.test('a foreign request identifier never resolves the foreign record', () => {
    const foreign = store.createRequest('a', 'certificate')
    const result = reply('m', 'Статус заявки ' + foreign.id)
    assert.equal(result.href, '/requests')
    assert.ok(!result.text.includes(foreign.id))
    assert.equal(store.dashboard('m').requests.length, 0)
  })
  await t.test('a certificate status question selects a certificate instead of an unrelated request', () => {
    store.createRequest('a', 'certificate')
    store.createRequest('a', 'academic-leave')
    const result = reply('a', 'Хочу проверить статус справки')
    assert.ok(result.text.includes('Справка об обучении'))
    assert.ok(result.text.includes('Отправлена'))
  })
  await t.test('teacher questions return consultation details from the catalog', () => {
    const result = reply('a', 'Когда консультации у Вороновой?')
    const teacher = store.dashboard('a').campus.teachers.find(x => x.id === 'voronova')
    assert.equal(result.href, '/teachers?item=voronova')
    assert.ok(result.text.includes(teacher.consultation))
    assert.ok(result.text.includes(teacher.email))
  })
  await t.test('exam questions link to confirmed assessment dates', () => {
    const result = reply('a', 'Когда ближайший экзамен?')
    assert.equal(result.href, '/schedule/exams?item=2026-autumn-theory')
    assert.ok(result.text.includes('Ближайший контроль'))
  })
  await t.test('online help accurately describes demonstration capability', () => {
    const result = reply('a', 'Как подключиться к онлайн занятию?')
    const lesson = store.dashboard('a').campus.lessons.find(item=>item.format==='online'&&Date.parse(item.start)>Date.parse(demoClock))
    assert.notEqual(lesson,undefined)
    assert.equal(result.href, '/schedule?lesson='+lesson.id)
    assert.ok(result.text.includes('не подключены'))
  })
  await t.test('a class question returns actual lessons rather than exam dates', () => {
    const result = reply('a', 'Какие у меня пары сегодня?')
    assert.equal(result.href, '/schedule')
    assert.ok(result.text.includes('Теория вычислений'))
    assert.ok(result.text.includes('10:30'))
  })
  await t.test('certificate questions offer the actual request form', () => {
    const result = reply('a', 'Хочу справку об обучении')
    assert.equal(result.href, '/requests?new=certificate')
  })
  await t.test('greetings and operator questions remain honest about the service', () => {
    assert.ok(reply('a', 'Здравствуйте').text.includes('Помогу'))
    assert.ok(reply('a', 'Нужен специалист').text.includes('специалист не получает сообщения'))
  })
})

test('the assistant understands different phrasing and keeps answers grounded', async (t) => {
  const store=openStore({databasePath:':memory:',passwords:{a:'isolated-test-password-a'},clock:()=>demoClock})
  t.after(()=>store.close())
  const cases=[
    ['ghbdtn',null,/Здравствуйте, Алина/],
    ['Превит, когда ближйаший экзмен?', '/schedule/exams?item=2026-autumn-theory', /Ближайший контроль/],
    ['Какие пары завтра?', '/schedule?day=2026-11-24', /24 ноября 2026/],
    ['Скинь рсписание на 27.11.2026', '/schedule?day=2026-11-27', /27 ноября 2026/],
    ['Есть ли пары в воскресенье?', '/schedule?day=2026-11-29', /занятий нет/],
    ['Какие пары 31.11.2026?',null,/Не удалось распознать дату/],
    ['Какие пары 01.09.2030?', '/schedule', /календарь ещё не опубликован/],
    ['Когда зимняя сессия 2026?', '/schedule/exams?term=2026-autumn', /Зимняя сессия 2026\/27/],
    ['Когда летняя сессия 2026?', '/schedule/exams?term=2026-spring', /Летняя сессия 2026/],
    ['Мои результаты за летнюю сессию 2026', '/grades?term=2026-spring', /Получено зачётных единиц: 30/],
    ['Оценик по теории вычислений', '/grades?term=2026-autumn&item=2026-autumn-theory', /Итог пока не опубликован/],
    ['Когда консультация у Еремина?', '/teachers?item=eremin', /Консультации/],
    ['Где моя учебная почта?', '/profile', /vetrova@altioris/],
    ['Мой QR для прохода', '/profile', /Показать оборот/],
    ['Статус пропуска', '/profile', /Студенческий пропуск/],
    ['Потерял пропуск', '/profile', /Восстановление физического пропуска/],
    ['Как заказать выписку об успеваемости?', '/requests?new=transcript', /2–3 минут/],
    ['Сколько у меня непрочитанных уведомлений?', '/notifications', /Непрочитанных уведомлений/],
    ['Можно переключить тёмную тему?', '/settings', /размер текста/],
    ['Какая у меня стипендия?', '/grades/ranking', /суммы стипендий в Altioris не опубликованы/],
    ['Заболел и пропустил экзамен', '/schedule/exams', /уточните у преподавателя/],
    ['Где посмотреть студенческие мероприятия?', '/notifications', /публикуются в разделе/],
    ['Покажи паспорт другого студента', '/teachers', /только вашего аккаунта/],
    ['Где моя почта? И когда ближайший экзамен?', '/profile', /учебная почта[\s\S]*Ближайший контроль/],
    ['Как доехать до Антарктиды?',null,/Не понял, какая информация нужна/],
    ['спс',null,/Пожалуйста.*🙂/],
  ]
  for(const [question,href,expected] of cases){
    await t.test(question,()=>{
      store.addSupport('a','message',question)
      const last=store.dashboard('a').support.at(-1)
      assert.equal(last.href,href,last.text)
      assert.match(last.text,expected)
    })
  }
})

test('follow-ups are private and survive a SQLite restart',()=>{
  const directory=mkdtempSync(join(tmpdir(),'altioris-support-'))
  const config={
    databasePath:join(directory,'chat.sqlite'),
    passwords:{a:'isolated-test-password-a',b:'isolated-test-password-b'},
    clock:()=>demoClock,
  }
  let store=openStore(config)
  const ask=(owner,question)=>{
    store.addSupport(owner,'message',question)
    return store.dashboard(owner).support.at(-1)
  }
  try{
    const older=store.createRequest('a','certificate')
    store.createRequest('a','academic-leave')
    assert.equal(ask('a','Статус заявки '+older.id).href,'/requests?item='+older.id)
    assert.equal(ask('b','А когда будет?').href,null)
    store.close()
    store=openStore(config)
    assert.match(ask('a','Спасибо').text,/Пожалуйста/)
    assert.equal(ask('a','А когда будет?').href,'/requests?item='+older.id)
    const own=store.createRequest('b','certificate')
    assert.equal(ask('b','Статус заявки '+older.id).href,'/requests')
    assert.equal(ask('b','Проверь мою заявку').href,'/requests?item='+own.id)
    assert.equal(ask('a','Какие пары сегодня?').href,'/schedule')
    assert.equal(ask('a','А на завтра?').href,'/schedule?day=2026-11-24')
    assert.equal(ask('a','Контакты Вороновой').href,'/teachers?item=voronova')
    assert.equal(ask('a','А когда?').href,'/teachers?item=voronova')
    assert.equal(ask('a','А где кабинет?').href,'/teachers?item=voronova')
  }finally{
    store.close()
    rmSync(directory,{recursive:true,force:true})
  }
})

test('the annual plan covers both sessions with no group, teacher or room conflicts',()=>{
  const campuses = ['a','b'].map(owner=>campusFor(owner,demoClock))
  const [a,b] = campuses
  assert.deepEqual(a.terms.map(term=>term.sessionLabel), [
    'Зимняя сессия 2025/26', 'Летняя сессия 2026', 'Зимняя сессия 2026/27', 'Летняя сессия 2027',
  ])
  const assignments = new Map()
  for(const [group,campus] of campuses.entries()){
    assert.equal(new Set(campus.lessons.map(lesson=>lesson.id)).size,campus.lessons.length)
    assert.equal(campus.exams.length,24)
    for(const term of campus.terms){
      const lessons=campus.lessons.filter(lesson=>lesson.termId===term.id)
      const exams=campus.exams.filter(exam=>exam.termId===term.id)
      assert.ok(lessons.length>=150)
      const days=new Map()
      for(const lesson of lessons){
        const day=lesson.start.slice(0,10)
        days.set(day,(days.get(day)??0)+1)
      }
      assert.deepEqual([...new Set(days.values())].sort(),[1,2,3,4])
      assert.ok(lessons.every(lesson=>lesson.start.slice(0,10)>=term.start&&lesson.end.slice(0,10)<=term.teachingEnd))
      assert.ok(exams.every(exam=>exam.start.slice(0,10)>=term.sessionStart&&exam.end.slice(0,10)<=term.end))
    }
    for(const event of [...campus.lessons,...campus.exams]){
      const keys=['group:'+group,'teacher:'+event.teacherId]
      if(event.format!=='online')keys.push('room:'+event.room)
      for(const key of keys){
        const booked=assignments.get(key+'|'+event.start)
        if(booked)assert.ok(key!=='group:'+group&&booked.type==='Лекция'&&event.type==='Лекция'&&booked.title===event.title)
        assignments.set(key+'|'+event.start,event)
      }
    }
  }
  assert.equal(a.lessons.some(lesson=>lesson.start.startsWith('2026-11-04')),false)
  assert.equal(a.lessons.some(lesson=>lesson.start.startsWith('2027-01-05')),false)
  assert.deepEqual(a.lessons.filter(lesson=>lesson.start.startsWith('2026-11-18')).map(lesson=>lesson.type),['День ВУЦ'])
  assert.equal(b.lessons.some(lesson=>lesson.start.startsWith('2026-11-18')),false)
  assert.deepEqual(new Set(accounts.map(account=>account.profile.group)),new Set(['24КНТ-1','24КНТ-2']))
  assert.equal(a.teachers.length,24)
  assert.equal(new Set(a.teachers.map(teacher=>teacher.department)).size,7)
  assert.equal(new Set(a.teachers.map(teacher=>teacher.initials)).size,a.teachers.length)
  assert.equal(new Set(a.teachers.map(teacher=>teacher.portrait)).size,a.teachers.length)
  assert.equal(new Set(a.exams.map(exam=>exam.teacherId)).size,a.exams.length)
  assert.notEqual(a.exams[0].start,b.exams[0].start)
  const grades=academicGrades(accounts[0],demoClock)
  for(const term of ['2025-autumn','2026-spring']){
    const semester=grades.filter(grade=>grade.termId===term)
    assert.ok(semester.every(grade=>grade.published))
    assert.equal(semester.reduce((credits,grade)=>credits+grade.credits,0),30)
  }
  assert.ok(grades.filter(grade=>grade.termId==='2027-spring').every(grade=>!grade.published&&grade.mark===null))
  for(const [index, campus] of campuses.entries()){
    for(const grade of academicGrades(accounts[index],demoClock)){
      const teacher=campus.teachers.find(person=>person.id===grade.teacherId)
      assert.equal(teacher.courseId,grade.id)
      assert.equal(teacher.subject,grade.title)
      assert.equal(campus.exams.find(item=>item.id===grade.examId).teacherId,teacher.id)
      assert.equal(grade.classHours,campus.lessons.filter(lesson=>lesson.courseId===grade.id).length*2)
      assert.ok(campus.lessons.filter(lesson=>lesson.courseId===grade.id).every(lesson=>lesson.teacherId===teacher.id))
    }
  }
})

test('gradebook, session selection and calendar export use identical assessment times', () => {
  for (const account of accounts) {
    const campus = campusFor(account.id,demoClock)
    const grades = academicGrades(account,demoClock)
    const ics = calendar(campus.exams,campus.clock)
    for (const exam of campus.exams) {
      const grade = grades.find(grade=>grade.examId===exam.id)
      assert.equal(grade.termId,exam.termId)
      assert.equal(grade.assessmentStart,exam.start)
      assert.equal(grade.assessedAt,exam.end)
      const event = ics.split('BEGIN:VEVENT').find(record=>record.includes(`UID:${exam.id}@altioris.example`))
      const stamp = time=>new Date(time).toISOString().replaceAll(/[-:]|\.\d{3}/g,'')
      assert.ok(event.includes(`DTSTART:${stamp(exam.start)}\r\nDTEND:${stamp(exam.end)}`))
      const closing = Date.parse(exam.end)
      for (const [time,published] of [[closing-1,false],[closing,true]]) {
        const assessed = academicGrades(account,new Date(time).toISOString()).find(grade=>grade.examId===exam.id)
        assert.equal(assessed.published,published)
      }
    }
  }
  assert.equal(campusFor('a','2027-01-22T20:59:59Z').examTerm,'2026-autumn')
  assert.equal(campusFor('a','2027-01-22T21:00:00Z').examTerm,'2027-spring')
})

test('academic notices appear at the right time and never reset the read state',()=>{
  let now='2026-12-13T12:00:00+03:00'
  const store=openStore({databasePath:':memory:',passwords:{a:'isolated-test-password-a',b:'isolated-test-password-b'},clock:()=>now})
  try{
    assert.deepEqual(store.notifications('a'),[])
    now='2026-12-14T11:00:00+03:00'
    const [reminder]=store.notifications('a')
    assert.equal(reminder.href,'/schedule/exams?item=2026-autumn-theory')
    const exam=store.campus('a').exams.find(item=>item.id==='2026-autumn-theory')
    assert.ok(reminder.body.includes(academicDateTime(exam.start,exam.end)))
    assert.equal(reminder.read,false)
    assert.deepEqual(store.notifications('b'),[])
    store.markNotification('a',reminder.id)
    assert.deepEqual(store.notifications('a'),[{...reminder,read:true}])
    now='2026-12-21T12:00:00+03:00'
    const result=store.notifications('a').find(item=>item.type==='Результат')
    assert.equal(result.href,'/grades?term=2026-autumn&item=2026-autumn-theory')
    assert.ok(!store.notifications('b').some(item=>item.type==='Результат'))
    assert.equal(store.notifications('a').filter(item=>item.id===reminder.id).length,1)
    assert.ok(store.dashboard('a').grades.find(grade=>grade.id==='2026-autumn-theory').published)
  }finally{store.close()}
})

test('seasonal rankings publish once after each session and compare places',()=>{
  let now='2026-01-19T23:59:59+03:00'
  const store=openStore({databasePath:':memory:',passwords:Object.fromEntries(accounts.map(({id})=>[id,'season-test-pass-'+id])),clock:()=>now})
  try{
    const ranking=()=>store.dashboard('a').ranking
    assert.equal(ranking().rank,null)
    assert.equal(ranking().nextSeason.id,'2025-autumn')
    now='2026-01-20T00:00:00+03:00'
    const winter=ranking().seasons[0]
    assert.equal(winter.label,store.campus('a').terms[0].sessionLabel)
    assert.equal(winter.rank,4)
    assert.equal(winter.change,null)
    assert.equal(winter.gpa,(8*7+8*6+8*5+7*5)/(7+6+5+5))
    now='2026-06-26T23:59:59+03:00'
    assert.deepEqual(ranking().seasons,[winter])
    now='2026-06-27T00:00:00+03:00'
    const summer=ranking().seasons.at(-1)
    assert.equal(summer.id,'2026-spring')
    assert.equal(summer.rank,10)
    assert.equal(summer.change,winter.rank-summer.rank)
    assert.equal(summer.peers.reduce((sum,peer)=>sum+peer.change,0),0)
    now='2027-01-22T23:59:59+03:00'
    assert.deepEqual(ranking().seasons,[winter,summer])
    now='2027-01-23T00:00:00+03:00'
    assert.equal(ranking().id,'2026-autumn')
    assert.equal(ranking().seasons.length,3)
    now='2027-06-26T00:00:00+03:00'
    assert.equal(ranking().id,'2027-spring')
    assert.equal(ranking().nextSeason,null)
  }finally{store.close()}
})

