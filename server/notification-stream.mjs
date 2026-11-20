export function createNotificationStream(store,clock){
 const clients=new Set();
 let lastMinute=null;
 let timer;
 function send(client){
  const version=store.noticeVersion(client.owner);
  if(client.version===version)return;
  client.version=version;
  if(!client.response.write('event: inbox\ndata: '+JSON.stringify(version)+'\n\n'))client.response.end();
 }
 function tick(){
  const minute=Math.floor(Date.parse(clock())/60_000);
  store.advanceAcademicEvents(minute!==lastMinute);
  store.advanceRequests();
  lastMinute=minute;
  const now=Date.now();
  for(const client of clients){
   if(!store.session(client.token)||now-client.openedAt>=90_000){client.response.end();continue;}
   send(client);
   if(now-client.heartbeat>=15_000){
    client.heartbeat=now;
    if(!client.response.write(': heartbeat\n\n'))client.response.end();
   }
  }
 }
 return {
  start(){
   timer=setInterval(()=>{
    try{tick();}catch(error){console.error('Background queue:',error.message);}
   },1000);
   timer.unref();
  },
  stop(){clearInterval(timer);},
  subscribe(owner,token,response){
   const count=[...clients].filter(client=>client.owner===owner).length;
   if(count>=8)return false;
   response.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store, no-transform','X-Accel-Buffering':'no'});
   response.write('retry: 2000\n\n');
   const client={owner,token,response,version:null,openedAt:Date.now(),heartbeat:Date.now()};
   clients.add(client);
   response.once('close',()=>clients.delete(client));
   send(client);
   return true;
  },
 };
}
