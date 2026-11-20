import assert from 'node:assert/strict'
import { once } from 'node:events'
import { request as send } from 'node:http'
import { Readable } from 'node:stream'
import { randomBytes } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { accounts, campusFor } from '../server/fixtures.mjs'
import { novemberScenario, resolveAcademicEvent } from '../server/academic-events.mjs'
import { openStore } from '../server/store.mjs'
import { createApplication, readConfig } from '../server/index.mjs'
import { moscowDay } from '../server/academic-year.mjs'

const initial='2026-11-20T12:00:00+03:00'
const passwords=Object.fromEntries(accounts.map(({id})=>[id,'virtual-academic-case-'+id]))
const move={id:'move',kind:'lesson',groups:[0],lessonId:'2026-11-23-2',day:'2026-11-24',start:'08:50',end:'10:10'}
const findLesson=(campus,id=move.lessonId)=>campus.lessons.find(lesson=>lesson.id===id)
const pair=(store,id)=>findLesson(store.campus(id))
const scheduledMove={...move,at:'2026-11-20T12:02:47+03:00'}

function checkCalendar(campuses){
 const reservations=new Map()
 for(const [group,campus] of campuses.entries())for(const item of [...campus.lessons,...campus.exams]){
  const signed=[group,item]
  const slots=['group-'+group]
  if(item.teacherId)slots.push('teacher-'+item.teacherId)
  if(item.format!=='online')slots.push('room-'+item.room)
  for(const slot of slots){
   const key=slot+'|'+item.start.slice(0,10)
   const used=reservations.get(key)??[]
   for(const [otherGroup,prior] of used){
    if(Date.parse(item.start)>=Date.parse(prior.end)||Date.parse(prior.start)>=Date.parse(item.end))continue
    assert.ok(group!==otherGroup&&item.id===prior.id&&item.type==='Лекция'&&prior.type==='Лекция'&&item.start===prior.start&&item.end===prior.end&&item.teacherId===prior.teacherId&&item.room===prior.room,
     'Unexpected overlap: '+[key,item.id,prior.id].join(' '))
   }
   used.push(signed)
   reservations.set(key,used)
  }
 }
}

test('a timed transfer atomically changes only the targeted lesson and group, and survives restart',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'altioris-campus-events-'))
 const databasePath=join(dir,'test.sqlite')
 let now=initial
 const open=()=>openStore({databasePath,passwords,clock:()=>now})
 let store=open()
 try{
  const originalA=store.campus('a'),originalB=store.campus('b')
  assert.equal(store.enqueueAcademicEvent(scheduledMove),true)
  assert.equal(store.enqueueAcademicEvent(scheduledMove),false)
  assert.throws(()=>store.enqueueAcademicEvent({...scheduledMove,end:'10:20'}),/идентификатор/)
  assert.deepEqual(store.notifications('a'),[])
  store.close();store=open()
  now='2026-11-20T12:02:46+03:00'
  assert.equal(pair(store,'a').start,findLesson(originalA).start)
  now=scheduledMove.at
  const after=store.campus('a')
  assert.equal(pair(store,'a').start,'2026-11-24T08:50:00+03:00')
  assert.equal(after.lessons.filter(lesson=>lesson.id===move.lessonId).length,1)
  assert.deepEqual(after.lessons.filter(lesson=>lesson.id!==move.lessonId),originalA.lessons.filter(lesson=>lesson.id!==move.lessonId))
  assert.deepEqual(store.campus('b').lessons,originalB.lessons)
  checkCalendar([after,store.campus('b')])
  const [notice]=store.notifications('a')
  assert.equal(notice.href,'/schedule?lesson='+move.lessonId)
  assert.equal(notice.at,new Date(scheduledMove.at).toISOString())
  assert.deepEqual(store.notifications('b'),[])
  assert.equal(store.markNotification('a',notice.id),true)
  store.close();store=open()
  assert.equal(pair(store,'a').start,'2026-11-24T08:50:00+03:00')
  assert.deepEqual(store.notifications('a'),[{...notice,read:true}])
 }finally{store.close();await rm(dir,{recursive:true,force:true})}
})

test('overlap validation rejects group, teacher, room, weekends and stale edits without alerts',()=>{
 const now=initial
 const store=openStore({databasePath:':memory:',passwords,clock:()=>now})
 try{
  const base=store.campus('a').lessons
  const submit=event=>{
   store.enqueueAcademicEvent(event)
   store.advanceAcademicEvents()
   return store.academicEvents().find(row=>row.id===event.id)
  }
  assert.equal(submit({...move,id:'group-busy',start:'10:20',end:'11:20'}).state,'rejected')
  assert.equal(submit({...move,id:'weekend',day:'2026-11-28'}).state,'rejected')
  assert.equal(submit({...move,id:'holiday',day:'2026-11-04'}).state,'rejected')
  assert.equal(submit({...move,id:'missing',lessonId:'not-found'}).state,'rejected')
  assert.deepEqual(store.campus('a').lessons,base)
  assert.deepEqual(store.notifications('a'),[])
  assert.equal(submit({id:'clear-test-slot',kind:'lesson',groups:[0],lessonId:'2026-11-23-3',cancel:true}).state,'published')
  const afterCancel=store.campus('a').lessons
  for(const trial of [
   {...move,id:'teacher-busy',day:'2026-11-23',start:'14:40',end:'16:00',room:'Корпус Г · ауд. 701'},
   {...move,id:'room-busy',day:'2026-11-23',start:'14:40',end:'16:00',teacherId:'sokolov',room:'корпус б ауд 412'},
   {id:'split-lecture',kind:'lesson',groups:[0],lessonId:'2026-11-23-0',room:'Корпус Г · ауд. 702'},
  ]){
   const result=submit(trial)
   assert.equal(result.state,'rejected')
   assert.match(result.reason,/заняты/)
   assert.deepEqual(store.campus('a').lessons,afterCancel)
  }
  assert.equal(store.notifications('a').length,1)
  assert.deepEqual(store.notifications('b'),[])
  checkCalendar([store.campus('a'),store.campus('b')])
 }finally{store.close()}
})

test('the November replay produces actual room, date, link, substitution, cancellation, grade and ranking updates',()=>{
 let now='2026-11-18T11:00:00+03:00'
 const store=openStore({databasePath:':memory:',passwords,clock:()=>now,simulation:true})
 try{
  const plan=novemberScenario()
  const kinds=new Set()
  const ranksAtStart=new Map(accounts.map(student=>[student.id,store.dashboard(student.id).ranking.rank]))
  for(const at of new Set(plan.map(event=>event.at))){
   const ids=plan.filter(event=>event.at===at).map(event=>event.id)
   now=new Date(Date.parse(at)-1).toISOString()
   store.advanceAcademicEvents()
   assert.ok(store.academicEvents().filter(item=>ids.includes(item.id)).every(item=>item.state==='pending'))
   now=at
   store.advanceAcademicEvents()
   const actual=store.academicEvents().filter(item=>ids.includes(item.id))
   assert.ok(actual.every(item=>item.state==='published'),JSON.stringify(actual))
   checkCalendar([store.campus('a'),store.campus('b')])
  }
  for(const student of accounts){
   const data=store.dashboard(student.id)
   const perDay=new Map()
   assert.equal(data.notifications.length,24)
   for(const notice of data.notifications){
    kinds.add(notice.type)
    const day=moscowDay(notice.at)
    perDay.set(day,(perDay.get(day)??0)+1)
    assert.ok(plan.some(slot=>slot.at===notice.at))
    if(notice.type==='Онлайн'){
     const lessonId=new URL(notice.href,'http://localhost').searchParams.get('lesson')
     assert.equal(findLesson(data.campus,lessonId).onlineUrl,'/schedule/online?lesson='+lessonId)
    }
    if(notice.title.startsWith('Текущая оценка')){
     const courseId=new URL(notice.href,'http://localhost').searchParams.get('item')
     const course=data.grades.find(grade=>grade.id===courseId)
     assert.equal(course.currentMark,9)
     assert.equal(course.published,false)
    }
    if(notice.type==='Рейтинг'){
     assert.notEqual(data.ranking.rank,ranksAtStart.get(student.id))
     assert.ok(notice.body.startsWith(ranksAtStart.get(student.id)+' → '+data.ranking.rank+' '))
    }
   }
   assert.equal(perDay.size,12)
   assert.ok([...perDay.values()].every(count=>count===2))
   assert.equal(data.requests.length,0)
  }
  assert.deepEqual(kinds,new Set(['Расписание','Онлайн','Результат','Рейтинг','Библиотека','Событие','Возможности','Учебный офис']))
 }finally{store.close()}
})

test('a real transfer waiting during an outage does not change a lesson that already started',()=>{
 let now=initial
 const store=openStore({databasePath:':memory:',passwords,clock:()=>now})
 try{
  store.enqueueAcademicEvent(scheduledMove)
  now='2026-11-23T13:00:00+03:00'
  assert.equal(pair(store,'a').start,'2026-11-23T12:10:00+03:00')
  assert.equal(store.academicEvents()[0].state,'rejected')
  assert.deepEqual(store.notifications('a'),[])
 }finally{store.close()}
})

test('upgrading a scheduled rehearsal preserves delivered slots and reschedules only pending rehearsal events',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'altioris-inbox-plan-'))
 const databasePath=join(directory,'test.sqlite')
 const plan=novemberScenario();
 const [delivered,pending]=plan.filter(item=>item.kind==='demo')
 const oldTime=event=>new Date(Date.parse(event.at)-3_600_000).toISOString()
 const options={databasePath,passwords,clock:()=>delivered.at}
 try{
  openStore(options).close()
  const db=new DatabaseSync(databasePath)
  try{
   const insert=db.prepare('INSERT INTO academic_events (id,due_at,payload,state,published_no) VALUES (?,?,?,?,?)')
   insert.run(delivered.id,Date.parse(oldTime(delivered)),JSON.stringify({...delivered,at:oldTime(delivered)}),'published',1)
   insert.run(pending.id,Date.parse(oldTime(pending)),JSON.stringify({...pending,at:oldTime(pending)}),'pending',null)
   db.prepare('INSERT INTO notifications VALUES (?,?,?,?,?,?,?,1)').run('old-academic','a','Расписание уточнено','Расписание','Сохранено ранее',oldTime(delivered),'')
  }finally{db.close()}
  const store=openStore({...options,simulation:true})
  try{
   store.advanceAcademicEvents()
   const events=store.academicEvents()
   assert.equal(events.find(item=>item.id===delivered.id).dueAt,Date.parse(oldTime(delivered)))
   assert.equal(events.find(item=>item.id===pending.id).dueAt,Date.parse(pending.at))
   const own=store.notifications('a')
   assert.equal(own.length,2)
   assert.equal(own.find(notice=>notice.id==='old-academic').read,true)
   assert.equal(store.notifications('b').length,2)
  }finally{store.close()}
 }finally{await rm(directory,{recursive:true,force:true})}
})

test('pseudorandom transfers revalidate alternative slots across many seeds',()=>{
 const seeds=Array.from({length:28},(_,index)=>index)
 for(const seed of seeds){
  const event={id:'stress-'+seed,kind:'demo',action:'move',at:initial}
  const result=resolveAcademicEvent(event,[],accounts)
  const [group]=result.effect.groups
  const original=findLesson(campusFor(group?'b':'a',initial),result.effect.lessonId)
  assert.notEqual(original.start,result.effect.lesson.start)
  const final=['a','b'].map((owner,index)=>{
   const campus=campusFor(owner,initial)
   return index===group?{...campus,lessons:campus.lessons.map(lesson=>lesson.id===original.id?result.effect.lesson:lesson)}:campus
  })
  checkCalendar(final)
 }
})

test('authenticated streaming sends the live revision and never reveals another group changes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'altioris-campus-sse-'))
 let now=initial
 const databasePath=join(dir,'test.sqlite')
 const env={ALTIORIS_DB:databasePath,...Object.fromEntries(accounts.map(account=>[account.passwordEnv,passwords[account.id]]))}
 const pipe=process.platform==='win32'?`\\\\.\\pipe\\altioris-sse-${randomBytes(6).toString('hex')}`:null
 const pipeOrigin='http://127.0.0.1:3000'
 const config={...readConfig(env),origin:pipe?pipeOrigin:undefined,clock:()=>now}
 const app=createApplication(config)
 if(pipe)app.listen(pipe)
 else app.listen(0,'127.0.0.1')
 await once(app,'listening')
 const base=pipe?pipeOrigin:'http://127.0.0.1:'+app.address().port
 const headers={'Content-Type':'application/json',Origin:base}
 const signal=AbortSignal.timeout(12_000)
 const request=(path,cookie='',options={})=>{
  const requestHeaders={...headers,Cookie:cookie}
  if(!pipe)return fetch(base+path,{signal,...options,headers:requestHeaders})
  if(options.body)requestHeaders['Content-Length']=Buffer.byteLength(options.body)
  return new Promise((resolve,reject)=>{
   const connection=send({socketPath:pipe,path,method:options.method,signal,headers:requestHeaders},incoming=>{
    const responseHeaders=new Headers()
    for(let i=0;i<incoming.rawHeaders.length;i+=2)responseHeaders.append(incoming.rawHeaders[i],incoming.rawHeaders[i+1])
    resolve(new Response(Readable.toWeb(incoming),{status:incoming.statusCode,headers:responseHeaders}))
   })
   connection.on('error',reject)
   connection.end(options.body)
  })
 }
 const login=async owner=>{
  const account=accounts.find(account=>account.id===owner)
  const response=await request('/api/login','',{method:'POST',body:JSON.stringify({login:account.login,password:passwords[owner]})})
  assert.equal(response.status,200)
  return response.headers.get('set-cookie').split(';')[0]
 }
 let reader
 try{
  const writer=openStore(config)
  const background={id:'background-check',kind:'notice',owner:'m',title:'Открытая лекция',body:'Встреча в читальном зале.',at:'2026-11-20T12:01:45+03:00'}
  try{writer.enqueueAcademicEvent(background)}finally{writer.close()}
  now=background.at
  const db=new DatabaseSync(databasePath,{readOnly:true})
  try{
   const delivered=db.prepare('SELECT owner,created_at FROM notifications WHERE title=?')
   for(let attempt=0;attempt<25&&!delivered.get(background.title);attempt++)await new Promise(resolve=>setTimeout(resolve,100))
   assert.deepEqual({...delivered.get(background.title)},{owner:'m',created_at:new Date(now).toISOString()})
  }finally{db.close()}
  const a=await login('a'),b=await login('b')
  assert.equal((await request('/api/notifications/stream')).status,401)
  const response=await request('/api/notifications/stream',a)
  assert.match(response.headers.get('content-type'),/text\/event-stream/)
  reader=response.body.getReader()
  let text=''
  const receive=async()=>{for(;;){
   const match=/event: inbox\ndata: "([^"]+)"\n\n/.exec(text)
   if(match){text=text.slice(match.index+match[0].length);return match[1]}
   const chunk=await reader.read()
   assert.equal(chunk.done,false)
   text+=Buffer.from(chunk.value).toString()
  }}
  assert.equal(await receive(),'0:0:0:0')
  const secondWriter=openStore(config)
  try{secondWriter.enqueueAcademicEvent(scheduledMove)}finally{secondWriter.close()}
  now=scheduledMove.at
  assert.match(await receive(),/^1:0:/)
  const own=await (await request('/api/dashboard',a)).json()
  assert.equal(findLesson(own.campus).start,'2026-11-24T08:50:00+03:00')
  assert.deepEqual((await (await request('/api/notifications',b)).json()).notifications,[])
  const mark=await request('/api/notifications',a,{method:'PATCH',body:JSON.stringify({id:own.notifications[0].id})})
  assert.equal(mark.status,200)
  assert.match(await receive(),/^1:1:/)
 }finally{
  if(reader)await reader.cancel()
  await new Promise(resolve=>app.close(resolve))
  await rm(dir,{recursive:true,force:true})
 }
})
