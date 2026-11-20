let audio;
let lastToast=0;
let hideToast;
const soundKey=student=>'altioris-notice-sound-'+student.number;

export function noticeSoundEnabled(student){
 try{return localStorage.getItem(soundKey(student))==='on'}catch{return false}
}

export function armNoticeSound(student){
 if(!student||!noticeSoundEnabled(student)||audio?.state==='running')return;
 try{audio??=new AudioContext();void audio.resume().catch(()=>{});}catch{}
}

export async function toggleNoticeSound(student){
 const enable=!noticeSoundEnabled(student);
 if(enable){
  try{audio??=new AudioContext();await audio.resume()}catch{return false}
 }
 try{localStorage.setItem(soundKey(student),enable?'on':'off')}catch{return false}
 if(enable)chime();
 return enable;
}

function chime(){
 if(audio?.state!=='running')return;
 const time=audio.currentTime;
 for(const [offset,hertz] of [[0,587],[.10,784]]){
  const note=audio.createOscillator(),gain=audio.createGain();
  note.type='sine';note.frequency.value=hertz;
  gain.gain.setValueAtTime(.001,time+offset);
  gain.gain.exponentialRampToValueAtTime(.07,time+offset+.025);
  gain.gain.exponentialRampToValueAtTime(.001,time+offset+.24);
  note.connect(gain);gain.connect(audio.destination);
  note.start(time+offset);note.stop(time+offset+.25);
 }
}

export function showLiveNotice(student,notices){
 if(!notices.length||document.hidden||Date.now()-lastToast<45_000)return;
 lastToast=Date.now();
 const toast=document.querySelector('#notice-toast');
 const first=notices[0];
 toast.querySelector('strong').textContent=notices.length===1?first.title:'Новые академические уведомления';
 toast.querySelector('p').textContent=notices.length===1?first.body:'В кабинете обновились учебные данные · '+notices.length;
 const link=toast.querySelector('a');
 link.href=notices.length===1?'/notifications?item='+encodeURIComponent(first.id):'/notifications';
 toast.hidden=false;
 clearTimeout(hideToast);
 hideToast=setTimeout(()=>{if(!toast.contains(document.activeElement))toast.hidden=true},8000);
 if(document.hasFocus()&&noticeSoundEnabled(student))chime();
}

export function resetLiveNotice(){
 const toast=document.querySelector('#notice-toast');
 toast.hidden=true;
 lastToast=0;
 clearTimeout(hideToast);
}
