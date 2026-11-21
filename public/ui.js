const controls = {
 left:'<path d="m14.5 5.5-6 6.5 6 6.5"/>',
 right:'<path d="m9.5 5.5 6 6.5-6 6.5"/>',
 down:'<path d="m6.5 9.5 5.5 5 5.5-5"/>',
 close:'<path d="m6.5 6.5 11 11m0-11-11 11"/>',
 menu:'<path d="M4.5 7h15m-15 5h15m-15 5h15"/>',
 eye:'<g class="password-eye-open"><path d="M3 12c4.5-7 13.5-7 18 0-4.5 7-13.5 7-18 0Z"/><circle cx="12" cy="12" r="2.5"/></g><g class="password-eye-closed"><path d="M3 10.5c4.5 5.6 13.5 5.6 18 0M7.5 14l-1.5 2M12 15v2.5m4.5-3.5 1.5 2"/></g>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 copy:'<rect x="8" y="3.5" width="12" height="13" rx="2"/><path d="M15 20.5H6a2 2 0 0 1-2-2V8.5"/>',
 out:'<path d="M13 4h7v7m0-7-9 9m9 1v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/>',
 send:'<path d="M3.5 10.5 20.5 4l-5 16-4.4-6-7.6-3.5Zm7.6 3.5L20.5 4"/>',
 logout:'<path d="M11.5 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h6.5m-1-8h10m-4-4 4 4-4 4"/>',
};

function sticker(name,extra=''){
 return '<img class="icon sticker icon-'+escape(name)+extra+'" src="/assets/stickers/'+escape(name)+'.webp" width="144" height="144" decoding="async" alt="">';
}
export function icon(name){
 if(!Object.hasOwn(controls,name))return sticker(name);
 return '<svg class="icon icon-'+name+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+controls[name]+'</svg>';
}
export function escape(value) { return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export const brand='<span class="brand"><img src="/assets/crest.webp" alt="" width="94" height="112"><span>Altioris<small>University</small></span></span>';
const zone={timeZone:'Europe/Moscow'};
export const when=value=>value?new Intl.DateTimeFormat('ru-RU',{...zone,hour:'2-digit',minute:'2-digit'}).format(new Date(value)):'';
export const date=value=>value?new Intl.DateTimeFormat('ru-RU',{...zone,day:'numeric',month:'long'}).format(new Date(value)):'';
export const calendarDate = new Intl.DateTimeFormat('ru-RU',{...zone,day:'numeric',month:'long',year:'numeric'});
export const dayName=value=>new Intl.DateTimeFormat('ru-RU',{...zone,weekday:'long',day:'numeric',month:'long'}).format(new Date(value));
export const key=value=>new Intl.DateTimeFormat('en-CA',{...zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export const decimal=value=>value==null?'—':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2,minimumFractionDigits:2}).format(value);
export const range=(start,end)=>when(start)+'–'+when(end);
export const assessmentDateTime=(start,end)=>calendarDate.format(new Date(start))+' · '+range(start,end);
export const detailedDate=value=>value?calendarDate.format(new Date(value))+' · '+when(value):'—';
export const empty=message=>'<div class="empty">'+icon('books')+'<p>'+escape(message)+'</p></div>';
export const safeLink=href=>typeof href==='string'&&/^\/(?!\/)[a-z0-9/]+(?:\?[a-z0-9=&%_-]+)?$/i.test(href)?escape(href):'';
export const line=(glyph,text)=>'<div class="info-line">'+icon(glyph)+'<span>'+text+'</span></div>';
export const badge=(text,tone='')=>'<span class="badge '+tone+'">'+escape(text)+'</span>';
export const tab=(path,title,selected,glyph='')=>'<a class="tab" href="'+path+'"'+(selected?' aria-current="page"':'')+'>'+(glyph?icon(glyph):'')+title+'</a>';
export const academicPeriods=({years,terms})=>years.flatMap(year=>[
 year,...terms.filter(term=>year.termIds.includes(term.id)).map(term=>({...term,label:term.sessionLabel})),
]);
export function termPicker(path, terms, selected){
 return '<form class="term-picker" action="'+path+'" data-quick-filter>'+
  '<label><span class="sr-only">Учебный период</span><select name="term">'+
  terms.map(term=>'<option value="'+escape(term.id)+'"'+(term.id===selected?' selected':'')+'>'+escape(term.label)+'</option>').join('')+
  '</select></label></form>';
}
export const fields=entries=>'<dl class="fields">'+entries.map(([label,value,glyph])=>'<div>'+(glyph?icon(glyph):'')+'<dt>'+escape(label)+'</dt><dd>'+escape(value??'—')+'</dd></div>').join('')+'</dl>';
export const subjectIllustration=id=>sticker('subject-'+id,' subject-illustration');
export function portrait(person,className='') {
 if(person.avatar==='custom'&&/^\/api\/profile\/avatar\?v=[a-f0-9]{64}$/.test(person.avatarUrl||''))return '<img class="portrait '+className+'" src="'+escape(person.avatarUrl)+'" alt="" width="160" height="160">';
 if(/^teacher-[a-z]+$/.test(person.portrait??''))return '<img class="portrait '+className+'" src="/assets/'+person.portrait+'.webp" alt="" width="160" height="160">';
 const initials=person.initials||person.shortName?.split(' ').map(p=>p[0]).join('')||'?';
 return '<span class="portrait initials '+className+'" aria-hidden="true">'+escape(initials)+'</span>';
}

