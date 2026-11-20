const paths = {
 calendar:'<rect x="4" y="5" width="24" height="24" rx="3" fill="#fff6e4"/><path d="M4 13h24V8a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3Z" fill="#77b8f5"/><path d="M10 2v7m12-7v7"/><path d="M10 18h1m5 0h1m5 0h1m-13 6h1m5 0h1m5 0h1" stroke="#db9a20" stroke-width="3"/>',
 grades:'<rect x="3" y="19" width="7" height="11" rx="1" fill="#91d19d"/><rect x="12" y="12" width="7" height="18" rx="1" fill="#62b975"/><rect x="21" y="4" width="7" height="26" rx="1" fill="#b6e8b2"/>',
 people:'<circle cx="11" cy="10" r="6" fill="#bea0f0"/><circle cx="24" cy="10" r="5" fill="#a27ce2"/><path d="M1 29v-3a10 10 0 0 1 20 0v3Z" fill="#ba93ef"/><path d="M21 20a9 9 0 0 1 11 9H22" fill="#9e7cd7"/>',
 person:'<circle cx="16" cy="9" r="6" fill="#edc6a6"/><path d="M5 29v-3a11 11 0 0 1 22 0v3Z" fill="#e7c89e"/>',
 doc:'<path d="M7 2h14l7 7v21H7Z" fill="#ffe9b4"/><path d="M21 2v8h7M12 15h10m-10 5h10m-10 5h7"/><circle cx="25" cy="26" r="5" fill="#e6755c"/>',
 chat:'<path d="M29 15c0 8-7 12-14 12l-9 4 2-8C-1 14 5 3 16 3c8 0 13 5 13 12Z" fill="#8e9fff"/><path d="M9 10c4-4 11-4 15 0" stroke="#c5d7ff"/><g fill="white" stroke="none"><circle cx="10" cy="16" r="1.7"/><circle cx="17" cy="16" r="1.7"/><circle cx="24" cy="16" r="1.7"/></g>',
 bell:'<path d="M5 25h24l-4-5v-7c0-13-18-13-18 0v7Z" fill="#ffcf62"/><path d="M12 29a5 5 0 0 0 9 0M15 2h3" stroke="#996119"/>',
 settings:'<path d="m12 3 1-3h6l1 3 3 2 4-1 3 5-2 3v5l2 3-3 5-4-1-3 2-1 4h-6l-1-4-4-2-3 1-3-5 2-3v-5L2 9l3-5 4 1Z" transform="translate(1 1)" fill="#c8b5e9"/><circle cx="17" cy="15" r="5" fill="#fffaf1"/>',
 books:'<path d="m2 11 14-8 15 8-15 8Z" fill="#a6d58d"/><path d="m3 17 13 7 14-7M3 23l13 7 14-7" stroke="#478b64" stroke-width="3"/>',
 database:'<path d="M4 8v17c0 7 24 7 24 0V8Z" fill="#bc9ae5"/><ellipse cx="16" cy="8" rx="12" ry="6" fill="#dbbafa"/><path d="M4 17c0 7 24 7 24 0"/><rect x="19" y="21" width="13" height="10" rx="2" fill="#6bb6ff"/><path d="M22 25h7m-7 3h7" stroke="white"/>',
 network:'<rect x="12" y="2" width="9" height="8" rx="1" fill="#f9c660"/><path d="M16 10v8M6 22v-4h21v4"/><rect x="1" y="22" width="10" height="9" rx="2" fill="#7dd2ae"/><rect x="22" y="22" width="10" height="9" rx="2" fill="#9be3c1"/>',
 theory:'<path d="m7 25 9-20 11 20Z"/><g fill="#65cdb2"><circle cx="16" cy="5" r="5"/><circle cx="7" cy="25" r="5"/><circle cx="27" cy="25" r="5"/></g><path d="m26 20 7 6-7 6Z" fill="#f9c347"/>',
 project:'<path d="M3 3v27h26Z" fill="#ffad9e"/><path d="M8 15v10h10Z" fill="#fff3df"/><path d="m15 28 12-24 5 3-12 24-6 1Z" fill="#ffd35a"/>',
 computer:'<rect x="4" y="3" width="25" height="20" rx="2" fill="#8bcaff"/><path d="M1 28h31l-4-5H5Z" fill="#a8d9ff"/><path d="M10 10c4-4 10-4 14 0m-10 4c2-2 4-2 6 0" stroke="white"/>',
 chip:'<rect x="6" y="6" width="21" height="21" rx="3" fill="#75a6cf"/><rect x="11" y="11" width="11" height="11" rx="2" fill="#98d7b0"/><path d="M1 10h5m-5 7h5m-5 7h5m21-14h5m-5 7h5m-5 7h5M10 1v5m7-5v5m7-5v5M10 27v5m7-5v5m7-5v5"/>',
 trophy:'<path d="M9 3h15v10c0 9-15 9-15 0Z" fill="#fbd275"/><path d="M9 6H3v5c0 6 6 6 6 6m15-11h6v5c0 6-6 6-6 6M16 21v7m-7 3h15" stroke="#9c6417"/>',
 podium:'<path d="M2 23h9v9H2Zm9-9h10v18H11Zm10-9h10v27H21Z" fill="#9ad091"/><path d="M26 5V0l9 3-9 4" fill="#ffd36c"/>',
 cap:'<path d="m1 11 16-8 16 8-16 8Z" fill="#c09ae6"/><path d="M7 15v9c8 6 14 6 20 0v-9" fill="#d3b4ee"/><path d="M31 12v15" stroke="#ac7c1b"/><circle cx="31" cy="29" r="2" fill="#ffcf60"/>',
 clock:'<circle cx="17" cy="17" r="14" fill="#ffe5a2" stroke="#a76b1b"/><circle cx="17" cy="17" r="10" fill="#fff9e7" stroke="#e3ae40"/><path d="M17 9v9l7 3"/>',
 pin:'<path d="M28 13c0 9-12 19-12 19S4 22 4 13a12 12 0 0 1 24 0Z" fill="#f89886"/><circle cx="16" cy="13" r="5" fill="#ffeddd"/>',
 mail:'<rect x="2" y="6" width="29" height="23" rx="3" fill="#c9b4f4"/><path d="m3 8 13 11L30 8" stroke="#5942a2"/>',
 check:'<circle cx="16" cy="16" r="14" fill="#80b65c" stroke="#4c863d"/><path d="m8 16 6 6 11-13" stroke="white" stroke-width="3"/>',
 clipboard:'<rect x="5" y="6" width="24" height="26" rx="3" fill="#fff3cf"/><path d="M12 5V3c0-5 10-5 10 0v2h3v6H9V5Z" fill="#eac57c"/><path d="m11 21 5 5 9-10" stroke="#45874a"/>',
 pdf:'<path d="M7 2h15l8 8v21H7Z" fill="#ffe9d8" stroke="#b64d36"/><path d="M22 2v9h8" stroke="#b64d36"/><rect x="1" y="17" width="25" height="12" rx="2" fill="#d76048" stroke="#b64d36"/><text x="13" y="25.5" font-family="Arial" font-size="8" text-anchor="middle" fill="white" stroke="none">PDF</text>',
 home:'<path d="m1 14 15-12 16 12Z" fill="#f7aa82"/><path d="M5 14h23v17H5Z" fill="#fff1c6"/><path d="M13 31V21h7v10"/>',
 megaphone:'<path d="m5 12 21-8v23L5 20Z" fill="#b2d79c"/><path d="M5 12H1v8h4m5 1 4 11h5l-4-9M30 5l4-4m-3 12h5m-6 11 5 3" stroke="#8ba75a"/>',
 headset:'<path d="M4 18v-5a13 13 0 0 1 26 0v5" stroke-width="3"/><rect x="1" y="14" width="7" height="12" rx="3" fill="#ad8ee3"/><rect x="26" y="14" width="7" height="12" rx="3" fill="#ad8ee3"/><path d="M29 26c0 6-9 6-11 6"/><rect x="12" y="29" width="8" height="4" rx="2" fill="#b8a1e8"/>',
 lock:'<rect x="6" y="14" width="23" height="18" rx="3" fill="#f9d288"/><path d="M10 14V9a7 7 0 0 1 14 0v5" stroke="#a16b20"/><circle cx="17" cy="21" r="2" fill="#a16b20"/><path d="M17 23v4" stroke="#a16b20"/>',
 search:'<circle cx="13" cy="13" r="10" fill="#c2e6fa"/><path d="m21 21 11 11" stroke="#e2af49" stroke-width="6"/><path d="m21 21 11 11" stroke="#574125" stroke-width="1"/>',
 camera:'<path d="M3 8h7l3-5h10l3 5h7v21H3Z" fill="#fac3b3"/><circle cx="18" cy="18" r="7" fill="#91b1db"/>',
 sparkle:'<path d="M16 1c2 10 5 13 15 15-10 2-13 5-15 15C14 21 11 18 1 16 11 14 14 11 16 1Z" fill="#ffe1a2" stroke="#b57b28"/>',
 text:'<path d="m3 30 12-28h4l12 28M8 20h17" stroke="#4283cd" stroke-width="3"/>',
 shield:'<path d="m16 1 13 5v10c0 10-13 16-13 16S3 26 3 16V6Z" fill="#79b9dd"/><rect x="10" y="13" width="12" height="12" rx="2" fill="#ffdc68"/><path d="M12 13V9a4 4 0 0 1 8 0v4"/>',
 arrow:'<path d="M5 16h24m-9-9 9 9-9 9"/>',send:'<path d="m3 13 28-11-8 29-8-12-12-6Zm12 6L31 2"/>',
 back:'<path d="M29 16H4m10-10L4 16l10 10"/>',out:'<path d="M18 3h13v13M31 3 14 20M25 20v10H3V8h10"/>',
 left:'<path d="m22 5-12 11 12 11"/>',right:'<path d="m10 5 12 11-12 11"/>',down:'<path d="m7 12 10 10 10-10"/>',
 eye:'<path d="M2 16S7 7 17 7s15 9 15 9-5 9-15 9S2 16 2 16Z"/><circle cx="17" cy="16" r="5"/>',
 plus:'<path d="M16 3v26M3 16h26"/>',close:'<path d="m6 6 22 22M28 6 6 28"/>',exit:'<path d="M14 3H4v28h10m6-21 9 7-9 7m-8-7h17" stroke="#ac4f32"/>',
 copy:'<rect x="10" y="3" width="17" height="23" rx="3"/><path d="M20 30H5V9h5"/>',menu:'<path d="M3 8h27M3 17h27M3 26h27"/>',
 flask:'<path d="M12 2h11m-9 0v11L4 29h27L21 13V2M9 23h17" fill="#d3baf4"/>',
 ticket:'<rect x="3" y="7" width="28" height="22" rx="3" fill="#f7d99e"/><path d="M13 7v22" stroke-dasharray="2 3"/>'
};
export function icon(name) { return '<svg class="icon icon-'+name+'" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]??paths.doc)+'</svg>'; }
export function escape(value) { return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export const brand='<span class="brand"><img src="/assets/crest.webp" alt="" width="94" height="112"><span>Altioris<small>University</small></span></span>';
const zone={timeZone:'Europe/Moscow'};
export const when=value=>value?new Intl.DateTimeFormat('ru-RU',{...zone,hour:'2-digit',minute:'2-digit'}).format(new Date(value)):'';
export const date=value=>value?new Intl.DateTimeFormat('ru-RU',{...zone,day:'numeric',month:'long'}).format(new Date(value)):'';
export const dayName=value=>new Intl.DateTimeFormat('ru-RU',{...zone,weekday:'long',day:'numeric',month:'long'}).format(new Date(value));
export const key=value=>new Intl.DateTimeFormat('en-CA',{...zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export const decimal=value=>value==null?'—':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2,minimumFractionDigits:2}).format(value);
export const range=(start,end)=>when(start)+'–'+when(end);
export const detailedDate=value=>value?date(value)+' · '+when(value):'—';
export const empty=message=>'<div class="empty">'+icon('books')+'<p>'+escape(message)+'</p></div>';
export const safeLink=href=>typeof href==='string'&&/^\/(?!\/)[a-z0-9/]+(?:\?[a-z0-9=&%_-]+)?$/i.test(href)?escape(href):'';
export const line=(glyph,text)=>'<div class="info-line">'+icon(glyph)+'<span>'+text+'</span></div>';
export const badge=(text,tone='')=>'<span class="badge '+tone+'">'+escape(text)+'</span>';
export const tab=(path,title,selected,glyph='')=>'<a class="tab" href="'+path+'"'+(selected?' aria-current="page"':'')+'>'+(glyph?icon(glyph):'')+title+'</a>';
export const fields=entries=>'<dl class="fields">'+entries.map(([label,value,glyph])=>'<div>'+(glyph?icon(glyph):'')+'<dt>'+escape(label)+'</dt><dd>'+escape(value??'—')+'</dd></div>').join('')+'</dl>';
export const subjectIcon=id=>({architecture:'computer',databases:'database',algorithms:'network',theory:'theory',networks:'project','project-assessment':'project','os-exam':'chip','theory-retake':'theory','security-exam':'shield'}[id]||'books');
const portraits={voronova:'teacher-voronova',sokolov:'teacher-safonov',krylov:'teacher-krylov',pavlova:'teacher-pavlova'};
const studentFaces={a:'vetrova',b:'zolotov',c:'orlova',d:'gromov',e:'belova',f:'serov',g:'lanskaya',h:'severin',i:'rudin',j:'lesina',k:'melnikov',l:'safonova',m:'volkov'};
const studentNames={'Ветрова':'vetrova','Золотов':'zolotov','Орлова':'orlova','Громов':'gromov','Белова':'belova','Серов':'serov','Ланская':'lanskaya','Северин':'severin','Рудин':'rudin','Лесина':'lesina','Мельников':'melnikov','Сафонова':'safonova','Волков':'volkov'};
export function portrait(person,className='') {
 if(person.avatar==='custom'&&/^\/api\/profile\/avatar\?v=[a-f0-9]{64}$/.test(person.avatarUrl||''))return '<img class="portrait '+className+'" src="'+escape(person.avatarUrl)+'" alt="" width="160" height="160">';
 const login=studentFaces[person.id]||Object.entries(studentNames).find(([last])=>person.name?.includes(last))?.[1];
 const source=portraits[person.id]||(login?'student-'+login:null);
 const initials=person.initials||person.shortName?.split(' ').map(p=>p[0]).join('')||'?';
 return source&&person.avatar!=='initials'?'<img class="portrait '+className+'" src="/assets/'+source+'.webp" alt="" width="160" height="160">':'<span class="portrait initials '+className+'" aria-hidden="true">'+escape(initials)+'</span>';
}

