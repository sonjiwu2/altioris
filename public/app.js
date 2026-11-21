import { preparePhoto, disposePhotoPreview } from './features/photo.js';
import { brand, escape as e, icon, portrait } from './ui.js?v=20261120-15';
import { exams, onlineRoom, schedule } from './features/campus.js?v=20261120-16';
import { grades, profile, ranking, teachers } from './features/academic.js?v=20261120-16';
import { turnCampusPass } from './features/campus-pass.js?v=20261120-14';
import { notifications, requests, support } from './features/services.js?v=20261121-3';
import { settings, applyPreferences, setTextScale, setTheme, syncSystemTheme } from './features/settings.js?v=20261120-12';
import { armNoticeSound, resetLiveNotice, showLiveNotice, toggleNoticeSound } from './features/live-notices.js';

const app=document.querySelector('#app'), announcement=document.querySelector('#status');
const navigation=[['/schedule','Расписание','nav-schedule'],['/grades','Успеваемость','nav-grades'],['/teachers','Преподаватели','nav-faculty'],['/requests','Заявки','nav-requests'],['/support','Чат поддержки','nav-chat'],['/notifications','Уведомления','nav-alerts'],['/settings','Настройки','nav-settings']];
const pages=new Map([['/',schedule],['/schedule',schedule],['/schedule/exams',exams],['/schedule/online',onlineRoom],['/grades',grades],['/grades/ranking',ranking],['/teachers',teachers],['/requests',requests],['/support',support],['/notifications',notifications],['/profile',profile],['/settings',settings]]);
let snapshot,busy=false;
let lastView;
let teacherSearchTimer;
let noticeStream,streamOwner,pendingRevision,refreshingInbox=false,deferredInboxView;
const toast=document.querySelector('#notice-toast');
const favicon=document.querySelector('link[rel="icon"]');
const crestIcon=favicon.href;
let badgeIcon;

function updateInboxIndicators(){
 const count=snapshot.notifications.filter(item=>!item.read).length;
 for(const badge of app.querySelectorAll('[data-inbox-count]')){
  badge.hidden=count===0;
  badge.textContent=count>99?'99+':String(count);
  badge.setAttribute('aria-label','Непрочитанных: '+count);
 }
 document.title=(count?'('+count+') ':'')+(app.querySelector('h1')?.textContent||'Кабинет')+' · Altioris University';
 favicon.type=count&&badgeIcon?'image/png':'image/webp';
 favicon.href=count&&badgeIcon?badgeIcon:crestIcon;
}

const badgeCrest=new Image();
badgeCrest.onload=()=>{
 const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
 const context=canvas.getContext('2d');
 if(!context)return;
 context.drawImage(badgeCrest,3,1,25,30);
 context.beginPath();context.arc(25,7,5.5,0,2*Math.PI);
 context.fillStyle='#b94029';context.fill();context.strokeStyle='#fff4dc';context.lineWidth=1.5;context.stroke();
 badgeIcon=canvas.toDataURL('image/png');
 if(snapshot)updateInboxIndicators();
};
badgeCrest.src=crestIcon;

function connectNoticeStream(){
 const owner=snapshot?.student.number;
 if(owner===streamOwner)return;
 noticeStream?.close();noticeStream=undefined;pendingRevision=undefined;streamOwner=owner;
 resetLiveNotice();favicon.type='image/webp';favicon.href=crestIcon;
 if(!owner)return;
 noticeStream=new EventSource('/api/notifications/stream');
 noticeStream.addEventListener('inbox',event=>{
  pendingRevision=JSON.parse(event.data);
  void refreshNotices();
 });
}
const detailPanels=new Map([
 ['/schedule','.schedule-inspector'],['/schedule/exams','.schedule-inspector'],['/grades','.grade-inspector'],
 ['/teachers','.teacher-details'],['/requests','.request-inspector'],['/notifications','.notification-detail'],
]);
const tabContent=new Map([
 ['/schedule','.schedule-layout'],['/schedule/exams','.exam-layout'],
 ['/grades','.academic-layout'],['/grades/ranking','.rank-heading,.rank-history,.rank-strip,.ranking-panel,.rank-meta'],
]);
const tabGroup=path=>path.startsWith('/schedule')?'schedule':path.startsWith('/grades')?'grades':null;
const viewPath=path=>path==='/'?'/schedule':path;
const resultsPanels=new Map([
 ['/teachers','.directory'],['/requests','.work-layout'],['/notifications','.notifications-layout'],
 ['/grades/ranking','.rank-strip,.ranking-panel'],['/schedule','.calendar'],
 ['/grades','.academic-layout'],['/schedule/exams','.exam-layout'],
]);

function animateNavigation(previous,current){
 const main=app.querySelector('#main');
 if(!previous||previous.path!==current.path){
  const group=previous&&tabGroup(previous.path);
  const target=group&&group===tabGroup(current.path)?tabContent.get(current.path):null;
  if(target)main.querySelectorAll(target).forEach(panel=>panel.classList.add('section-enter'));
  else main.classList.add('section-enter');
  return;
 }
 if(previous.scope!==current.scope){
  const results=resultsPanels.get(current.path);
  if(results)main.querySelector(results)?.classList.add('section-enter');
 }
 if(previous.selection!==current.selection || (current.path==='/schedule' && previous.scope!==current.scope)){
  const target=detailPanels.get(current.path);
  const detail=target&&main.querySelector(target);
  if(detail&&!detail.closest('.section-enter'))detail.classList.add('detail-enter');
 }
}
async function api(path,method='GET',body) {
 const response=await fetch(path,{method,headers:body?{'Content-Type':body instanceof Blob?'image/png':'application/json'}:{},body:body instanceof Blob?body:body?JSON.stringify(body):undefined}).catch(()=>{throw new Error('Нет связи с кабинетом. Проверьте подключение и попробуйте ещё раз.');});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(typeof data.error==='string'?data.error:'Не удалось выполнить действие. Попробуйте ещё раз.');error.status=response.status;throw error;}
 return data;
}
function announce(message){announcement.textContent=message;}
function signIn() {
 lastView=undefined;
 document.documentElement.dataset.theme='light';
 document.documentElement.style.removeProperty('--text-scale');
 document.title='Вход в кабинет · Altioris University';
 app.innerHTML='<main id="main" class="sign-in" tabindex="-1"><section class="sign-in-card">'+brand+'<div class="ornament" aria-hidden="true"><span>✦</span></div><h1>Вход в кабинет</h1><form data-mutation="login" class="login-form"><label for="username">Логин</label><div class="input-control">'+icon('nav-profile')+'<input id="username" name="login" placeholder="Введите логин" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="80" required></div><label for="password">Пароль</label><div class="input-control password-control">'+icon('lock')+'<input id="password" type="password" name="password" placeholder="Введите пароль" autocomplete="current-password" maxlength="128" required><button class="icon-button" type="button" data-password aria-label="Показать пароль" aria-pressed="false">'+icon('eye')+'</button></div><p class="form-error" role="alert" hidden></p><button class="button login-submit">Войти</button></form><button class="text-link help-link" type="button" data-dialog="login-help">Не получается войти?</button></section><footer>Конкурсный прототип</footer></main><dialog id="login-help" aria-labelledby="login-help-title"><div class="section-heading"><h2 id="login-help-title">Не получается войти?</h2><button type="button" class="icon-button" data-close aria-label="Закрыть">'+icon('close')+'</button></div><p>Введите логин и постоянный пароль демонстрационного аккаунта. Если у вас нет доступа, обратитесь к организатору демонстрации.</p></dialog>';
}
function render(focus=false,navigating=false) {
 disposePhotoPreview();
 deferredInboxView=undefined;
 connectNoticeStream();
 if(!snapshot){signIn();if(focus)app.querySelector('#username').focus();return;}
 applyPreferences(snapshot.student);
 const {pathname,search}=location,params=new URLSearchParams(search);
 const previousChat=app.querySelector('.chat-history');
 const chatPosition=previousChat?.scrollTop??0;
 const atChatEnd=!previousChat||previousChat.scrollHeight-previousChat.clientHeight-chatPosition<32;
 const scroller=app.querySelector('.calendar-scroll,.teacher-list,.notification-inbox');
 const scrollLeft=scroller?.scrollLeft??0,scrollTop=scroller?.scrollTop??0;
 const active=href=>(href==='/schedule'&&pathname==='/')||pathname===href||pathname.startsWith(href+'/');
 const nav=navigation.map(([href,label,glyph])=>'<a href="'+href+'"'+(active(href)?' aria-current="page"':'')+'>'+icon(glyph)+'<span>'+label+'</span>'+(href==='/notifications'?'<span class="nav-unread" data-inbox-count hidden></span>':'')+'</a>').join('');
 const student=snapshot.student;
 const currentProfile=pathname==='/profile'?' aria-current="page"':'';
 const page=pages.get(pathname);
 const content=page?page(snapshot,params):'<h1>Страница не найдена</h1><a href="/schedule" class="button">К расписанию</a>';
 app.innerHTML=`<header class="mobile-header"><a href="/schedule" aria-label="Altioris University">${brand}</a>
  <button class="icon-button menu-toggle" type="button" data-menu aria-expanded="false" aria-controls="mobile-nav" aria-label="Открыть меню">${icon('menu')}</button></header>
  <aside class="sidebar"><a class="brand-link" href="/schedule" aria-label="Altioris University · Расписание">${brand}</a>
   <nav class="main-nav" aria-label="Основное меню">${nav}</nav>
   <div class="sidebar-account"><a class="sidebar-profile" href="/profile" aria-label="Мой профиль · ${e(student.shortName)}"${currentProfile}>
    ${portrait(student)}<span>${e(student.shortName)}<small>${e(student.group)}</small></span></a></div>
  </aside>
  <nav id="mobile-nav" class="mobile-nav" aria-label="Основное меню" hidden>${nav}<a class="mobile-profile" href="/profile"${currentProfile}>${portrait(student)}<span>Мой профиль</span></a></nav>
  <div class="workspace"><main id="main" class="page" tabindex="-1">${content}</main><footer class="page-footer">Конкурсный прототип</footer></div>`;
 updateInboxIndicators();
 const path=viewPath(pathname);
 const activeItem=app.querySelector('main a[aria-current="true"]');
 const selected=activeItem?new URL(activeItem.href).searchParams:null;
 const currentView={
  path,
  selection:selected?.get('lesson')??selected?.get('item'),
  scope:path==='/schedule'
   ? app.querySelector('.week-title')?.textContent
   : ['q','office','filter','view','term','season'].map(key=>key==='term'?(app.querySelector('.term-picker select')?.value??''):(params.get(key)||'')).join('\n'),
 };
 if(lastView?.path===path&&lastView.scope===currentView.scope&&(scrollLeft||scrollTop)){
  const nextScroller=app.querySelector('.calendar-scroll,.teacher-list,.notification-inbox');
  if(nextScroller)nextScroller.scrollTo(scrollLeft,scrollTop);
 }else if(path==='/teachers'&&activeItem){
  const list=activeItem.parentElement;
  const bounds=list.getBoundingClientRect(),item=activeItem.getBoundingClientRect();
  list.scrollTo(Math.max(0,item.right-bounds.right),Math.max(0,item.bottom-bounds.bottom));
 }
 if(navigating||!lastView)animateNavigation(lastView,currentView);
 lastView=currentView;
 const dialog=app.querySelector('[data-auto-open]');if(dialog)dialog.showModal();else if(focus)document.querySelector('#main').focus({preventScroll:true});
 const chat=app.querySelector('.chat-history');
 if(chat)chat.scrollTop=atChatEnd?chat.scrollHeight:chatPosition;
}
function go(href,restoreFocus,replace=false){
 const next=new URL(href,location.href),path=viewPath(next.pathname);
 const same=viewPath(location.pathname)===path;
 history[replace?'replaceState':'pushState'](null,'',next);render(!same,true);if(!same)window.scrollTo(0,0);
 const detailSelector=detailPanels.get(path);
 const selectedDetail=detailSelector&&matchMedia('(max-width:680px)').matches&&(next.searchParams.has('item')||next.searchParams.has('lesson'))&&app.querySelector(detailSelector);
 if(restoreFocus){app.querySelector(restoreFocus)?.focus({preventScroll:true});}
 else if(selectedDetail){selectedDetail.tabIndex=-1;selectedDetail.focus({preventScroll:true});selectedDetail.scrollIntoView({block:'start'});}
 else if(same){const selected=[...app.querySelectorAll('main a[href]')].find(link=>link.href===next.href);(selected||app.querySelector('main'))?.focus({preventScroll:true});}
 if(!same&&path==='/notifications')void refreshNotices(true);
 if(path==='/grades/ranking')void refreshPublishedRanking();
}
async function refreshPublishedRanking(){
 const prior=snapshot,next=prior?.ranking.nextSeason;
 if(busy||location.pathname!=='/grades/ranking'||!next||Date.now()<Date.parse(next.publishedAt))return;
 try{
  const {ranking}=await api('/api/dashboard');
  if(snapshot!==prior||busy||location.pathname!=='/grades/ranking'||ranking.id===prior.ranking.id)return;
  const focusedLink=document.activeElement?.closest('.rank-season,.rank-meta a')?.href;
  snapshot={...prior,ranking};
  render();
  if(focusedLink)[...app.querySelectorAll('main a')].find(link=>link.href===focusedLink)?.focus({preventScroll:true});
 }catch{/* Keep the last published standings if the refresh fails. */}
}
async function refreshNotices(force=false){
 const prior=snapshot;
 if(!prior||busy||refreshingInbox||(!force&&(!pendingRevision||pendingRevision===prior.liveRevision)))return;
 refreshingInbox=true;
 pendingRevision=undefined;
 try{
  const updated=await api('/api/dashboard');
  if(snapshot!==prior||busy||updated.liveRevision===prior.liveRevision)return;
  const known=new Set(prior.notifications.map(item=>item.id));
  const fresh=updated.notifications.filter(item=>!item.read&&!known.has(item.id));
  snapshot=updated;
  const path=viewPath(location.pathname);
  const liveView=path==='/notifications'||(['/requests','/support'].includes(path)&&JSON.stringify(updated.requests)!==JSON.stringify(prior.requests))||
   (path.startsWith('/schedule')&&JSON.stringify(updated.campus.lessons)!==JSON.stringify(prior.campus.lessons))||
   (path.startsWith('/grades')&&JSON.stringify(updated.grades)!==JSON.stringify(prior.grades))||
   (path==='/grades/ranking'&&JSON.stringify(updated.ranking)!==JSON.stringify(prior.ranking));
  if(liveView){
   const focused=document.activeElement;
   const href=focused?.closest('a[href]')?.href;
   if(focused?.matches('input,select,textarea')||document.querySelector('dialog[open]')){
    deferredInboxView=location.href;
    updateInboxIndicators();
   }
   else{
    render(focused===app.querySelector('#main'));
    if(href)[...app.querySelectorAll('a[href]')].find(link=>link.href===href)?.focus({preventScroll:true});
   }
  }else updateInboxIndicators();
  showLiveNotice(updated.student,fresh);
 }catch(error){
  if(error.status===401&&snapshot===prior){snapshot=undefined;render(true);}
 }
 finally{
  refreshingInbox=false;
  if(pendingRevision&&pendingRevision!==snapshot?.liveRevision)void refreshNotices();
 }
}
async function load(){
 try{snapshot=await api('/api/dashboard');render();}
 catch(error){if(error.status===401){snapshot=undefined;render();}else app.innerHTML='<main id="main" class="page standalone-error"><h1>Кабинет недоступен</h1><p>'+e(error.message)+'</p><button class="button" data-retry>Повторить</button></main>';}
}
const mutations={login:['/api/login','POST'],request:['/api/requests','POST'],avatar:['/api/profile','PATCH'],photo:['/api/profile/avatar','PUT'],removePhoto:['/api/profile/avatar','DELETE'],message:['/api/support','POST'],support:['/api/support','POST'],read:['/api/notifications','PATCH'],logout:['/api/logout','POST']};
async function save(name,body,control,errorBox){
 if(busy)return;busy=true;
 if(control){control.disabled=true;control.setAttribute('aria-busy','true');}
 if(errorBox)errorBox.hidden=true;
 try{
  const [path,method]=mutations[name],result=await api(path,method,body);
  if(name==='logout'){snapshot=undefined;history.replaceState(null,'','/');render(true);return;}
  if(Array.isArray(result.support))snapshot={...snapshot,support:result.support};
  else snapshot=await api('/api/dashboard');
  const chatDraft=name==='support'?app.querySelector('#chat-message')?.value:null;
  if(name==='request'){const id=result.request?.id??result.id??snapshot.requests[0]?.id;history.replaceState(null,'',id?'/requests?item='+encodeURIComponent(id):'/requests');}
  render(['login','request','avatar'].includes(name));
  if(name==='message'||name==='support'){
   const chat=app.querySelector('.chat-history');
   if(chat)chat.scrollTop=chat.scrollHeight;
   const composer=app.querySelector('#chat-message');
   if(composer){
    if(chatDraft!=null)composer.value=chatDraft;
    composer.focus({preventScroll:true});
   }
  }
  if(['avatar','photo','removePhoto'].includes(name))app.querySelector('[data-dialog="avatar-dialog"]')?.focus();
  const confirmation={request:'Заявка подана',avatar:'Фото профиля сохранено',photo:'Фото профиля сохранено',removePhoto:'В профиле отображаются инициалы',read:'Уведомления обновлены',support:'Помощник ответил',message:'Помощник ответил'};
  if(confirmation[name])announce(confirmation[name]);
 }catch(error){
  if(error.status===401&&name!=='login'){snapshot=undefined;render(true);announce('Сеанс завершён. Войдите снова.');}
  else if(errorBox){errorBox.hidden=false;errorBox.textContent=error.message;}
  else{app.querySelector('.action-error')?.remove();const banner=document.createElement('p');banner.className='form-error action-error';banner.setAttribute('role','alert');banner.textContent=error.message;document.querySelector('#main')?.prepend(banner);}
 }finally{if(control){control.disabled=false;control.removeAttribute('aria-busy');}busy=false;void refreshNotices();}
}
function submitTeacherFilters(form,focusSelector,live=false){
 clearTimeout(teacherSearchTimer);
 const input=form.elements.q;
 const value=input.value;
 const start=input.selectionStart,end=input.selectionEnd;
 const query=new URLSearchParams();
 const search=value.trim();
 const department=form.elements.office.value;
 if(search)query.set('q',search);
 if(department)query.set('office',department);
 const url='/teachers'+(query.size?'?'+query:'');
 if(url!==location.pathname+location.search){
  go(url,focusSelector,live);
  if(live){
   const next=app.querySelector('.teacher-filters input');
   next.value=value;
   next.setSelectionRange(start,end);
  }
 }
 const count=app.querySelectorAll('.teacher-list .person-link').length;
 announce('Найдено преподавателей: '+count);
}

function scheduleTeacherSearch(event){
 const input=event.target;
 if(event.isComposing||!input.matches('.teacher-filters input'))return;
 clearTimeout(teacherSearchTimer);
 teacherSearchTimer=setTimeout(()=>{
  if(input.isConnected&&document.activeElement===input)submitTeacherFilters(input.form,'.teacher-filters input',true);
 },180);
}

function submitQuickFilter(form){
 if(!form.reportValidity())return;
 const control=form.querySelector('select,input');
 if(!control.value)return;
 const query=new URLSearchParams([[control.name,control.value]]);
 const url=new URL(form.action).pathname+'?'+query;
 if(url!==location.pathname+location.search)go(url,'[data-quick-filter] [name="'+control.name+'"]');
}

app.addEventListener('submit',event=>{
 const form=event.target;if(!(form instanceof HTMLFormElement))return;event.preventDefault();
 if(form.matches('[data-teacher-filters]')){
  submitTeacherFilters(form,document.activeElement===form.elements.q?'.teacher-filters input':'.teacher-filters button');
  return;
 }
 if(form.matches('[data-quick-filter]')){submitQuickFilter(form);return;}
 const fields=new FormData(form),kind=form.dataset.mutation;
 if(!kind){const query=new URLSearchParams(fields);for(const [name,value] of query)if(!value)query.delete(name);go(new URL(form.action).pathname+(query.size?'?'+query:''));return;}
 if(kind==='photo'){if(form.photoBlob)void save('photo',form.photoBlob,event.submitter,form.querySelector('.form-error'));return;}
 const body=Object.fromEntries(fields);if(kind==='message')body.action='message';
 if(kind==='request'){
  if(form.dataset.submissionType!==body.type){
   form.dataset.submissionType=body.type;
   form.dataset.submissionId=crypto.randomUUID();
  }
  body.submissionId=form.dataset.submissionId;
 }
 void save(kind,body,event.submitter,form.querySelector('.form-error'));
});
app.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(button?.hasAttribute('data-pass-turn')||(!button&&event.target.closest('[data-pass-stage]'))){
  turnCampusPass(event.target.closest('.campus-pass-panel'));
  return;
 }
 if(button){
  if(button.hasAttribute('data-notice-sound')){
   if(button.disabled)return;
   button.disabled=true;
   void toggleNoticeSound(snapshot.student).then(enabled=>{
    button.setAttribute('aria-pressed',String(enabled));
    button.querySelector('span').textContent=enabled?'Звук включён':'Звук выключен';
    button.disabled=false;
   });
   return;
  }
  if(button.dataset.themeChoice){
   if(button.getAttribute('aria-pressed')==='true')return;
   setTheme(snapshot.student,button.dataset.themeChoice);
   for(const option of app.querySelectorAll('[data-theme-choice]')){
    option.classList.toggle('selected',option===button);
    option.setAttribute('aria-pressed',String(option===button));
   }
   announce('Тема оформления сохранена');return;
  }
  if(button.dataset.scale){
   setTextScale(snapshot.student,Number(button.dataset.scale));
   for(const option of app.querySelectorAll('[data-scale]')){
    option.classList.toggle('selected',option===button);
    option.setAttribute('aria-pressed',String(option===button));
   }
   announce('Размер текста сохранён');return;
  }
  if(button.dataset.copy){navigator.clipboard.writeText(button.dataset.copy).then(()=>announce('Скопировано')).catch(()=>announce('Не удалось скопировать. Выделите текст вручную.'));return;}
  if(button.hasAttribute('data-password')){const input=app.querySelector('#password'),show=input.type==='password';input.type=show?'text':'password';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',show?'Скрыть пароль':'Показать пароль');}
  if(button.dataset.dialog)document.getElementById(button.dataset.dialog)?.showModal();
  if(button.hasAttribute('data-close'))button.closest('dialog')?.close();
  if(button.hasAttribute('data-retry'))void load();
  if(button.hasAttribute('data-menu')){const menu=document.querySelector('#mobile-nav');menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));button.setAttribute('aria-label',menu.hidden?'Открыть меню':'Закрыть меню');}
  if(button.hasAttribute('data-remove-photo'))void save('removePhoto',undefined,button,button.closest('dialog').querySelector('.form-error'));
  if(button.hasAttribute('data-logout'))void save('logout',undefined,button);
  if(button.hasAttribute('data-read-all'))void save('read',{all:true},button);
  if(button.dataset.read)void save('read',{id:button.dataset.read},button);
  if(button.dataset.chatJump){
   const chat=app.querySelector('.chat-history');
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   chat.scrollTo({top:button.dataset.chatJump==='start'?0:chat.scrollHeight,behavior:reduced?'instant':'smooth'});
  }
  if(button.dataset.support)void save('support',{action:button.dataset.support},button);
  return;
 }
 const link=event.target.closest('a[href]');
 if(!link||!snapshot||event.defaultPrevented||event.button||event.ctrlKey||event.shiftKey||event.metaKey||event.altKey)return;
 const url=new URL(link.href);
 if(url.origin===location.origin&&!url.pathname.startsWith('/api/')&&!link.hasAttribute('download')){event.preventDefault();go(link.href);}
});
function restorePhotoPreview(form){
 form.querySelector('.photo-preview .portrait').outerHTML=portrait(snapshot.student);
}
app.addEventListener('close',event=>{
 if(event.target.id==='request-dialog'){
  const url=new URL(location.href);
  if(url.searchParams.has('new')){
   const pending=deferredInboxView===url.href;
   url.searchParams.delete('new');history.replaceState(null,'',url);
   if(pending)deferredInboxView=url.href;
  }
 }
 const form=event.target.querySelector?.('.photo-form');
 if(!form||!snapshot||!form.isConnected)return;
 disposePhotoPreview();
 form.reset();
 form.photoBlob=undefined;
 form.querySelector('[data-photo-save]').disabled=true;
 form.querySelector('.form-error').hidden=true;
 restorePhotoPreview(form);
},true);
app.addEventListener('change',event=>{
 if(event.target.form?.matches('[data-quick-filter]')){
  submitQuickFilter(event.target.form);
  return;
 }
 if(event.target.matches('.teacher-filters select')){
  submitTeacherFilters(event.target.form,'.teacher-filters select');
  return;
 }
 if(!event.target.matches('[data-photo-file]'))return;
 restorePhotoPreview(event.target.form);
 void preparePhoto(event.target);
});
app.addEventListener('input',event=>{if(event.target.id==='chat-message'){event.target.style.height='auto';event.target.style.height=Math.min(event.target.scrollHeight,150)+'px';}});
app.addEventListener('input',scheduleTeacherSearch);
app.addEventListener('compositionend',scheduleTeacherSearch);
app.addEventListener('keydown',event=>{if(event.target.id==='chat-message'&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();event.target.form.requestSubmit();return;}if(event.key==='Escape'){const toggle=app.querySelector('[data-menu][aria-expanded="true"]');if(toggle){toggle.click();toggle.focus();}}});
matchMedia('(max-width:680px)').addEventListener('change',()=>{if(snapshot&&(location.pathname==='/'||location.pathname==='/schedule'))render();});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(snapshot)syncSystemTheme(snapshot.student);});
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>armNoticeSound(snapshot?.student));
for(const event of ['focusout','close'])document.addEventListener(event,()=>{
 if(deferredInboxView!==location.href)return;
 setTimeout(()=>{
  if(deferredInboxView===location.href&&!document.activeElement?.matches('input,select,textarea')&&!document.querySelector('dialog[open]'))render();
 },0);
},true);
toast.addEventListener('click',event=>{
 if(event.target.closest('button')){toast.hidden=true;return;}
 const link=event.target.closest('a');
 if(link&&snapshot){event.preventDefault();toast.hidden=true;go(link.href);}
});
window.addEventListener('popstate',()=>{render(false,true);void refreshPublishedRanking();});
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden){void refreshNotices(true);void refreshPublishedRanking();}
});
window.addEventListener('pageshow',event=>{if(event.persisted)void load();});
void load();

