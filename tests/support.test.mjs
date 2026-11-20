import assert from 'node:assert/strict'
import test from 'node:test'
import { accounts, campusFor, demoClock, teachers } from '../server/fixtures.mjs'
import { searchTeachers } from '../public/features/teacher-search.js'
import { academicGrades } from '../server/academic-year.mjs'
import { openStore } from '../server/store.mjs'

test('faculty search respects word boundaries, name intent, course aliases and department filters',()=>{
  const ids=(query,department)=>searchTeachers(teachers,query,department).map(teacher=>teacher.id)
  assert.deepEqual(ids('СЕР'),['krylov'])
  assert.deepEqual(ids('Мар'),['lebedeva'])
  assert.deepEqual(ids('Крыл'),['krylov'])
  assert.deepEqual(ids('Крылов, Сергей Андр.'),['krylov'])
  assert.deepEqual(ids('Артем Еремин'),['eremin'])
  assert.deepEqual(ids('мат стат'),['karimov'])
  assert.deepEqual(ids('арх по'),['voronova'])
  assert.deepEqual(ids('БД'),['krylov'])
  assert.deepEqual(ids('Мар','прикладной математики'),[])
  assert.deepEqual(ids('мат стат','прикладной математики'),['karimov'])
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
    assert.ok(result.text.includes('Готова'))
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
    assert.ok(result.text.includes('Готова'))
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

test('the annual plan covers both sessions with no group, teacher or room conflicts',()=>{
  const campuses = ['a','b'].map(owner=>campusFor(owner,demoClock))
  const [a,b] = campuses
  assert.equal(a.terms.length,4)
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

test('academic notices appear at the right time and never reset the read state',()=>{
  let now='2026-12-13T12:00:00+03:00'
  const store=openStore({databasePath:':memory:',passwords:{a:'isolated-test-password-a',b:'isolated-test-password-b'},clock:()=>now})
  try{
    assert.deepEqual(store.notifications('a'),[])
    now='2026-12-14T11:00:00+03:00'
    const [reminder]=store.notifications('a')
    assert.equal(reminder.href,'/schedule/exams?item=2026-autumn-theory')
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

