import { createHash } from 'node:crypto'
import { normalizeAcademicEvent, novemberScenario, RejectedAcademicChange, resolveAcademicEvent } from './academic-events.mjs'

export function openAcademicQueue(db,{clock,cohort,transaction,recordNotice,simulation}){
 const insert=db.prepare('INSERT INTO academic_events (id,due_at,payload) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING');
 const byId=db.prepare('SELECT payload,state FROM academic_events WHERE id=?');
 const rescheduleDemo=db.prepare("UPDATE academic_events SET due_at=?,payload=? WHERE id=? AND state='pending'");
 const due=db.prepare("SELECT id,payload FROM academic_events WHERE state='pending' AND due_at<=? ORDER BY due_at,id LIMIT 40");
 const applied=db.prepare("SELECT effect FROM academic_events WHERE state='published' AND effect IS NOT NULL ORDER BY published_no");
 const alreadyDelivered=db.prepare('SELECT 1 FROM notifications WHERE owner=? AND created_at=? LIMIT 1');
 const maxSequence=db.prepare('SELECT coalesce(max(published_no),0) AS seq FROM academic_events');
 const publish=db.prepare("UPDATE academic_events SET state='published',effect=?,published_no=? WHERE id=?");
 const reject=db.prepare("UPDATE academic_events SET state='rejected',reason=? WHERE id=?");
 const list=db.prepare('SELECT id,due_at AS dueAt,state,reason FROM academic_events ORDER BY due_at,id');
 let cachedSequence=-1,cachedChanges=[];

 function changes(){
  const {seq}=maxSequence.get();
  if(seq!==cachedSequence){cachedSequence=seq;cachedChanges=applied.all().map(row=>JSON.parse(row.effect));}
  return cachedChanges;
 }

 function add(event){
  const payload=JSON.stringify(event);
  const result=insert.run(event.id,Date.parse(event.at),payload);
  if(!result.changes&&byId.get(event.id).payload!==payload)throw new RejectedAcademicChange('Этот идентификатор уже использован для другого события.');
  return Boolean(result.changes);
 }

 if(simulation)transaction(()=>{
  const now=clock();
  const publishedSlots=new Map();
  for(const entry of novemberScenario()){
   const prior=byId.get(entry.id);
   if(entry.kind==='demo'&&prior?.state==='published'){
    publishedSlots.set(entry.at,JSON.parse(prior.payload).at);
   }
   const event=normalizeAcademicEvent({...entry,at:publishedSlots.get(entry.at)??entry.at},now,{demo:true});
   if(!prior)add(event);
   else if(prior.state==='pending'&&prior.payload!==JSON.stringify(event)){
    rescheduleDemo.run(Date.parse(event.at),JSON.stringify(event),event.id);
   }
  }
 });

 function tick(){
  const processedAt=new Date(clock()).toISOString(),now=Date.parse(processedAt);
  if(!due.get(now))return;
  transaction(()=>{
   const effects=[...changes()];
   let sequence=maxSequence.get().seq;
   for(const row of due.all(now)){
    const event=JSON.parse(row.payload);
    let result;
    try{result=resolveAcademicEvent(event,effects,cohort,processedAt);}
    catch(error){
     if(!(error instanceof RejectedAcademicChange))throw error;
     reject.run(error.message,row.id);continue;
    }
    if(result.effect)effects.push(result.effect);
    publish.run(result.effect?JSON.stringify(result.effect):null,++sequence,row.id);
    for(const item of result.notices){
     if((event.kind==='bulletin'||event.kind==='demo')&&alreadyDelivered.get(item.owner,item.at))continue;
     const id='academic-'+createHash('sha256').update(row.id+'|'+item.type).digest('hex').slice(0,32);
     recordNotice(id,item.owner,item.title,item.type,item.body,item.at,item.href);
    }
   }
  });
 }

 return {
  changes,tick,list:()=>list.all(),
  enqueue(entry){
   const now=clock();
   return transaction(()=>{
    const prior=entry&&typeof entry.id==='string'?byId.get(entry.id):null;
    const event=normalizeAcademicEvent(prior&&entry.at===undefined?{...entry,at:JSON.parse(prior.payload).at}:entry,prior?'1970-01-01T00:00:00Z':now);
    return add(event);
   });
  },
 };
}
