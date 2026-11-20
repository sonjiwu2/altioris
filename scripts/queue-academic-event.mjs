import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { readConfig } from '../server/index.mjs'
import { accounts } from '../server/fixtures.mjs'
import { openStore } from '../server/store.mjs'

const [command,group,day]=process.argv.slice(2);
if(!command){
 console.log('node scripts/queue-academic-event.mjs <event.json> [--enqueue-only] | --list | --lessons <0|1> <YYYY-MM-DD>');
 process.exit(0);
}
const localAccounts=fileURLToPath(new URL('../runtime/demo-accounts.json',import.meta.url));
const env={...process.env,ALTIORIS_ACCOUNTS_FILE:process.env.ALTIORIS_ACCOUNTS_FILE??(existsSync(localAccounts)?localAccounts:undefined)};
try{
 const store=openStore(readConfig(env));
 try{
  if(command==='--list')console.table(store.academicEvents().map(row=>({...row,dueAt:new Date(row.dueAt).toISOString()})));
  else if(command==='--lessons'){
   const account=accounts.find(account=>String(account.groupIndex)===group);
   if(!account||!/^\d{4}-\d{2}-\d{2}$/.test(day??''))throw new Error('Укажите 0 или 1 и дату.');
   console.table(store.campus(account.id).lessons.filter(lesson=>lesson.start.startsWith(day))
    .map(({id,title,start,end,room})=>({id,title,start,end,room})));
  }else{
   const event=JSON.parse(readFileSync(command,'utf8'));
   const queued=store.enqueueAcademicEvent(event);
   if(group!=='--enqueue-only')store.advanceAcademicEvents();
   const result=store.academicEvents().find(row=>row.id===event.id);
   console.log(JSON.stringify({id:event.id,queued,state:result.state,reason:result.reason}));
   if(result.state==='rejected')process.exitCode=1;
  }
 }finally{store.close();}
}catch(error){console.error(error.message);process.exitCode=1;}
