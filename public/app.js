import { preparePhoto, disposePhotoPreview } from './features/photo.js';
import { brand, escape as e, icon, portrait } from './ui.js?v=20261121-11';
import { exams, onlineRoom, schedule } from './features/campus.js?v=20261121-8';
import { grades, profile, ranking, teachers } from './features/academic.js?v=20261121-5';
import { turnCampusPass } from './features/campus-pass.js?v=20261120-14';
import { notifications, requests, support, updateConversation } from './features/services.js?v=20261121-11';
import { settings, applyPreferences, setTextScale, setTheme, syncSystemTheme } from './features/settings.js?v=20261120-12';
import { armNoticeSound, resetLiveNotice, showLiveNotice, toggleNoticeSound } from './features/live-notices.js';
import { copyText, outsidePhoneOverlay, phoneLayout, phoneOverlays, showPhoneDetail, showPhoneDrawer } from './features/phone-ui.js?v=20261121-12';

const app=document.querySelector('#app'), announcement=document.querySelector('#status');
const navigation=[['/schedule','Расписание','nav-schedule'],['/grades','Успеваемость','nav-grades'],['/teachers','Преподаватели','nav-faculty'],['/requests','Заявки','nav-requests'],['/support','Чат поддержки','nav-chat'],['/notifications','Уведомления','nav-alerts'],['/settings','Настройки','nav-settings']];
const pages=new Map([['/',schedule],['/schedule',schedule],['/schedule/exams',exams],['/schedule/online',onlineRoom],['/grades',grades],['/grades/ranking',ranking],['/teachers',teachers],['/requests',requests],['/support',support],['/notifications',notifications],['/profile',profile],['/settings',settings]]);
let snapshot,busy=false,loading=false;
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
const phoneDetailLabels=new Map([
 ['/schedule','Занятие'],['/schedule/exams','Экзамен или зачёт'],['/grades','Дисциплина'],
 ['/teachers','Преподаватель'],['/requests','Заявка'],['/notifications','Уведомление'],
]);
const detailParam=path=>path==='/schedule'?'lesson':'item';
let phoneDetailReturn;
let phoneTriggerHref;
let closingHistoryTarget;
let phoneClosePress;
const tabContent=new Map([
 ['/schedule','.schedule-layout'],['/schedule/exams','.exam-layout'],
 ['/grades','.academic-layout'],['/grades/ranking','.rank-heading,.rank-history,.rank-strip,.ranking-panel,.rank-meta'],
]);
const tabGroup=path=>path.startsWith('/schedule')?'schedule':path.startsWith('/grades')?'grades':null;
const viewPath=path=>path==='/'?'/schedule':path;
const selectableRows=new Map([
 ['/schedule','.lesson'],['/schedule/exams','.exam-event'],
 ['/grades','.grade-row'],['/teachers','.teacher-list .person-link'],
]);
const resultsPanels=new Map([
 ['/teachers','.directory'],['/requests','.work-layout'],['/notifications','.notifications-layout'],
 ['/grades/ranking','.rank-strip,.ranking-panel'],['/schedule','.calendar'],
 ['/grades','.grade-list'],['/schedule/exams','.exam-panel'],
]);

function readView(root,path,params){
 const active=root.querySelector('a[aria-current="true"]');
 const selected=active?new URL(active.getAttribute('href'),location.href).searchParams:null;
 return {
  path,
  selection:selected?.get('lesson')??selected?.get('item'),
  scope:path==='/schedule'
   ? root.querySelector('.week-title')?.textContent
   : ['q','office','filter','view','term','season'].map(key=>key==='term'?(root.querySelector('.term-picker select')?.value??''):(params.get(key)||'')).join('\n'),
 };
}

function updateSelectedDetails(content,path,params){
 const rowSelector=selectableRows.get(path);
 if(!rowSelector||lastView?.path!==path)return false;
 const template=document.createElement('template');
 template.innerHTML=content;
 const next=readView(template.content,path,params);
 if(next.scope!==lastView.scope)return false;
 const main=app.querySelector('#main');
 const nextRow=template.content.querySelector(rowSelector+'[aria-current="true"]');
 const row=[...main.querySelectorAll(rowSelector)].find(link=>link.getAttribute('href')===nextRow?.getAttribute('href'));
 const inspectorSelector=detailPanels.get(path);
 const panelSelector=inspectorSelector+' .detail-content';
 const nextPanel=template.content.querySelector(panelSelector);
 const inspector=main.querySelector(inspectorSelector);
 const panel=inspector?.querySelector('.detail-content');
 if(!row||!panel||!nextPanel)return false;
 if(next.selection!==lastView.selection){
  const previousRow=main.querySelector(rowSelector+'[aria-current="true"]');
  previousRow?.classList.remove('active');
  previousRow?.removeAttribute('aria-current');
  row.classList.add('active');
  row.setAttribute('aria-current','true');
  panel.replaceWith(nextPanel);
  inspector.scrollTop=0;
 }
 if(path==='/schedule'){
  const toolbar=main.querySelector('.calendar-tools');
  const nextToolbar=template.content.querySelector('.calendar-tools');
  if(toolbar.outerHTML!==nextToolbar.outerHTML)toolbar.replaceWith(nextToolbar);
 }
 animateNavigation(lastView,next);
 lastView=next;
 return true;
}

function animateNavigation(previous,current){
 const main=app.querySelector('#main');
 if(!previous||previous.path!==current.path){
  const group=previous&&tabGroup(previous.path);
  const target=group&&group===tabGroup(current.path)?tabContent.get(current.path):null;
  if(target)main.querySelectorAll(target).forEach(panel=>panel.classList.add('section-enter'));
  else main.classList.add('section-enter');
  return;
 }
 const scopeChanged=previous.scope!==current.scope;
 const resultsSelector=scopeChanged&&resultsPanels.get(current.path);
 const results=resultsSelector?main.querySelector(resultsSelector):null;
 if(results)results.classList.add('section-enter');
 if(previous.selection!==current.selection || scopeChanged){
  const target=detailPanels.get(current.path);
  const panel=target&&main.querySelector(target);
  const detail=panel?.querySelector('.detail-content')??panel;
  if(detail&&!results?.contains(detail))detail.classList.add('detail-enter');
 }
}
async function api(path,method='GET',body) {
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(path,{method,signal:controller.signal,headers:body?{'Content-Type':body instanceof Blob?'image/png':'application/json'}:{},body:body instanceof Blob?body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(error=>{if(controller.signal.aborted)throw error;return {};});
  if(!response.ok){const error=new Error(typeof data.error==='string'?data.error:'Не удалось выполнить действие. Попробуйте ещё раз.');error.status=response.status;throw error;}
  return data;
 }catch(error){
  if(controller.signal.aborted)throw new Error('Кабинет не успел ответить. Попробуйте ещё раз.');
  if(error instanceof TypeError)throw new Error('Нет связи с кабинетом. Проверьте подключение и попробуйте ещё раз.');
  throw error;
 }finally{clearTimeout(timeout);}
}
function announce(message){announcement.textContent=message;}
function signIn() {
 lastView=undefined;
 document.documentElement.dataset.theme='light';
 document.documentElement.style.removeProperty('--text-scale');
 document.title='Вход в кабинет · Altioris University';
 app.innerHTML='<main id="main" class="sign-in" tabindex="-1"><section class="sign-in-card">'+brand+'<div class="ornament" aria-hidden="true"><span>✦</span></div><h1>Вход в кабинет</h1><form data-mutation="login" class="login-form"><label for="username">Логин</label><div class="input-control">'+icon('nav-profile')+'<input id="username" name="login" placeholder="Введите логин" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="80" required></div><label for="password">Пароль</label><div class="input-control password-control">'+icon('lock')+'<input id="password" type="password" name="password" placeholder="Введите пароль" autocomplete="current-password" maxlength="128" required><button class="icon-button" type="button" data-password aria-controls="password" aria-label="Показать пароль" aria-pressed="false">'+icon('eye')+'</button></div><p class="form-error" role="alert" hidden></p><button class="button login-submit">Войти</button></form><button class="text-link help-link" type="button" data-dialog="login-help">Не получается войти?</button></section><footer>Конкурсный прототип</footer></main><dialog id="login-help" aria-labelledby="login-help-title"><div class="section-heading"><h2 id="login-help-title">Не получается войти?</h2><button type="button" class="icon-button" data-close aria-label="Закрыть">'+icon('close')+'</button></div><p>Введите логин и постоянный пароль демонстрационного аккаунта. Если у вас нет доступа, обратитесь к организатору демонстрации.</p></dialog>';
}
function render(focus=false,navigating=false) {
 disposePhotoPreview();
 const hadDeferredView=Boolean(deferredInboxView);
 deferredInboxView=undefined;
 connectNoticeStream();
 if(!snapshot){signIn();if(focus)app.querySelector('#username').focus();return;}
 applyPreferences(snapshot.student);
 const {pathname,search}=location,params=new URLSearchParams(search);
 const phone=phoneLayout.matches;
 const oldPageScroll=window.scrollY, oldPath=lastView?.path;
 const previousOverlay=app.querySelector('.phone-overlay[open]');
 const oldSheetScroll=previousOverlay?.querySelector('.phone-sheet-content')?.scrollTop;
 const previousChat=app.querySelector('.chat-history');
 const chatPosition=previousChat?.scrollTop??0;
 const atChatEnd=!previousChat||previousChat.scrollHeight-previousChat.clientHeight-chatPosition<32;
 const scroller=app.querySelector('.calendar-scroll,.teacher-list,.notification-inbox');
 const scrollLeft=scroller?.scrollLeft??0,scrollTop=scroller?.scrollTop??0;
 const active=href=>(href==='/schedule'&&pathname==='/')||pathname===href||pathname.startsWith(href+'/');
 const nav=navigation.map(([href,label,glyph])=>'<a href="'+href+'"'+(active(href)?' aria-current="page"':'')+'>'+icon(glyph)+'<span>'+label+'</span>'+(href==='/notifications'?'<span class="nav-unread" data-inbox-count hidden></span>':'')+'</a>').join('');
 const student=snapshot.student;
 const currentProfile=pathname==='/profile'?' aria-current="page"':'';
 const mobileProfile=`<a class="mobile-profile" href="/profile"${currentProfile}>${portrait(student)}<span>Мой профиль</span></a>`;
 const brandLink=`<a href="/schedule" aria-label="Altioris University">${brand}</a>`;
 const menuButton=`<button class="icon-button menu-toggle" type="button" data-menu aria-expanded="false" aria-controls="${phone?'phone-drawer':'mobile-nav'}" aria-label="Открыть меню">${icon('menu')}</button>`;
 const page=pages.get(pathname);
 const content=page?page(snapshot,params):'<h1>Страница не найдена</h1><a href="/schedule" class="button">К расписанию</a>';
 const path=viewPath(pathname);
 if(!phone&&navigating&&!hadDeferredView&&updateSelectedDetails(content,path,params))return;
 previousOverlay?.close();
 app.innerHTML=`<header class="mobile-header">${phone?menuButton+brandLink:brandLink+menuButton}</header>
  <aside class="sidebar"><a class="brand-link" href="/schedule" aria-label="Altioris University · Расписание">${brand}</a>
   <nav class="main-nav" aria-label="Основное меню">${nav}</nav>
   <div class="sidebar-account"><a class="sidebar-profile" href="/profile" aria-label="Мой профиль · ${e(student.shortName)}"${currentProfile}>
    ${portrait(student)}<span>${e(student.shortName)}<small>${e(student.group)}</small></span></a></div>
  </aside>
  ${phone?'':`<nav id="mobile-nav" class="mobile-nav" aria-label="Основное меню" hidden>${nav}${mobileProfile}</nav>`}
  <div class="workspace"><main id="main" class="page" tabindex="-1">${content}</main><footer class="page-footer">Конкурсный прототип</footer></div>
  ${phone?phoneOverlays(nav,mobileProfile):''}`;
 updateInboxIndicators();
 const activeItem=app.querySelector('main a[aria-current="true"]');
 const currentView=readView(app.querySelector('#main'),path,params);
 if(lastView?.path===path&&lastView.scope===currentView.scope&&(scrollLeft||scrollTop)){
  const nextScroller=app.querySelector('.calendar-scroll,.teacher-list,.notification-inbox');
  if(nextScroller)nextScroller.scrollTo(scrollLeft,scrollTop);
 }else if(!phone&&path==='/teachers'&&activeItem){
  const list=activeItem.parentElement;
  const bounds=list.getBoundingClientRect(),item=activeItem.getBoundingClientRect();
  list.scrollTo(Math.max(0,item.right-bounds.right),Math.max(0,item.bottom-bounds.bottom));
 }
 if(navigating||!lastView)animateNavigation(lastView,currentView);
 lastView=currentView;
 const dialog=app.querySelector('[data-auto-open]');
 if(phone&&oldPath===path)window.scrollTo({top:oldPageScroll,behavior:'instant'});
 if(dialog)dialog.showModal();
 else if(phone&&history.state?.phoneDrawer)showPhoneDrawer();
 else if(phone&&phoneDetailLabels.has(path)&&params.get(detailParam(path))&&currentView.selection===params.get(detailParam(path))){
  const panel=app.querySelector(detailPanels.get(path));
  phoneDetailReturn=history.state?.phoneDetailFrom??null;
  phoneTriggerHref=activeItem?.href;
  showPhoneDetail(panel,phoneDetailLabels.get(path));
  if(!navigating&&oldSheetScroll)app.querySelector('.phone-sheet-content').scrollTop=oldSheetScroll;
 }else if(focus)document.querySelector('#main').focus({preventScroll:true});
 const chat=app.querySelector('.chat-history');
 if(chat)chat.scrollTop=atChatEnd?chat.scrollHeight:chatPosition;
}
function go(href,restoreFocus,replace=false){
 const next=new URL(href,location.href),path=viewPath(next.pathname);
 const same=viewPath(location.pathname)===path;
 const drawer=phoneLayout.matches&&app.querySelector('#phone-drawer[open]');
 if(drawer&&next.href===location.href){dismissPhoneOverlay(drawer);return;}
 closingHistoryTarget=undefined;
 const state=phoneLayout.matches&&same&&phoneDetailLabels.has(path)&&next.searchParams.has(detailParam(path))&&next.href!==location.href
  ?{phoneDetailFrom:location.href}:null;
 history[replace||drawer?'replaceState':'pushState'](state,'',next);
 if(!same&&phoneLayout.matches)window.scrollTo({top:0,behavior:'instant'});
 render(!same,true);
 if(!same&&!phoneLayout.matches)window.scrollTo({top:0,behavior:'instant'});
 if(app.querySelector('.phone-sheet[open]'))return;
 if(restoreFocus){app.querySelector(restoreFocus)?.focus({preventScroll:true});}
 else if(same){const selected=[...app.querySelectorAll('main a[href]')].find(link=>link.href===next.href);(selected||app.querySelector('main'))?.focus({preventScroll:true});}
 if(!same&&path==='/notifications')void refreshNotices(true);
 if(path==='/grades/ranking')void refreshPublishedRanking();
}

function closePhoneOverlay(dialog){
 dialog.close();
 if(dialog.id==='phone-drawer'){
  const button=app.querySelector('[data-menu]');
  button?.setAttribute('aria-expanded','false');
  button?.focus({preventScroll:true});
  return;
 }
 const trigger=[...app.querySelectorAll('main a[href]')].find(link=>link.href===phoneTriggerHref);
 (trigger??app.querySelector('#main'))?.focus({preventScroll:true});
 phoneDetailReturn=null;
 phoneTriggerHref=null;
}

function dismissPhoneOverlay(dialog){
 if(!dialog?.open)return;
 const drawer=dialog.id==='phone-drawer';
 const overlayEntry=drawer?Boolean(history.state?.phoneDrawer):Boolean(phoneDetailReturn);
 const next=new URL((drawer?null:phoneDetailReturn)??location.href);
 if(!drawer&&!phoneDetailReturn)next.searchParams.delete(detailParam(viewPath(next.pathname)));
 const previous=location.href;
 closePhoneOverlay(dialog);
 history.replaceState(null,'',next);
 if(deferredInboxView===previous)deferredInboxView=next.href;
 if(overlayEntry){
  // The dialog is already closed if the browser suppresses history traversal.
  closingHistoryTarget=next.href;
  history.back();
 }
}

function updateOpenRequest(dialog,updated){
 const params=new URLSearchParams(location.search);
 const content=document.createElement('template');
 content.innerHTML=requests(updated,params);
 const next=readView(content.content,'/requests',params);
 const id=params.get('item');
 if(!updated.requests.some(item=>item.id===id))return false;
 const inspector=detailPanels.get('/requests');
 let panel=content.content.querySelector(inspector);
 if(next.selection!==id){
  // A completed request can leave the «В работе» list while its details are open.
  const detail=document.createElement('template');
  detail.innerHTML=requests(updated,new URLSearchParams({item:id}));
  panel=detail.content.querySelector(inspector);
 }
 const body=dialog.querySelector('.phone-sheet-content');
 const scroll=body.scrollTop;
 const focusedLink=body.contains(document.activeElement)?document.activeElement.closest('a[href]')?.href:null;
 body.replaceChildren(panel);
 body.scrollTop=scroll;
 if(focusedLink)[...body.querySelectorAll('a[href]')].find(link=>link.href===focusedLink)?.focus({preventScroll:true});
 app.querySelector('#main').replaceChildren(content.content);
 lastView=next;
 updateInboxIndicators();
 return true;
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
  const requestsChanged=JSON.stringify(updated.requests)!==JSON.stringify(prior.requests);
  const chatChanged=updated.support.at(-1)?.id!==prior.support.at(-1)?.id;
  const liveView=path==='/notifications'||(path==='/requests'&&requestsChanged)||
   (path.startsWith('/schedule')&&JSON.stringify(updated.campus.lessons)!==JSON.stringify(prior.campus.lessons))||
   (path.startsWith('/grades')&&JSON.stringify(updated.grades)!==JSON.stringify(prior.grades))||
   (path==='/grades/ranking'&&JSON.stringify(updated.ranking)!==JSON.stringify(prior.ranking));
  if(path==='/support'&&(chatChanged||requestsChanged)){
   const focused=document.activeElement?.closest('.chat-history a[href]')?.href;
   updateConversation(app,updated);
   if(focused)[...app.querySelectorAll('.chat-history a[href]')].find(link=>link.href===focused)?.focus({preventScroll:true});
   updateInboxIndicators();
  }else if(liveView){
   const focused=document.activeElement;
   const href=focused?.closest('a[href]')?.href;
   const dialog=document.querySelector('dialog[open]');
   const liveRequest=path==='/requests'&&dialog?.id==='phone-detail';
   if(liveRequest&&!phoneClosePress&&updateOpenRequest(dialog,updated)){
    deferredInboxView=undefined;
   }else if(focused?.matches('input,select,textarea')||dialog){
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
 if(loading)return;
 loading=true;
 const retry=app.querySelector('[data-retry]');
 if(retry)retry.disabled=true;
 try{snapshot=await api('/api/dashboard');render();}
 catch(error){if(error.status===401){snapshot=undefined;render();}else app.innerHTML='<main id="main" class="page standalone-error"><h1>Кабинет недоступен</h1><p>'+e(error.message)+'</p><button class="button" data-retry>Повторить</button></main>';}
 finally{loading=false;}
}
const mutations={login:['/api/login','POST'],request:['/api/requests','POST'],avatar:['/api/profile','PATCH'],photo:['/api/profile/avatar','PUT'],removePhoto:['/api/profile/avatar','DELETE'],message:['/api/support','POST'],support:['/api/support','POST'],read:['/api/notifications','PATCH'],logout:['/api/logout','POST']};
function newSubmissionId(){
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 // getRandomValues works for the local HTTP version on a phone.
 const bytes=crypto.getRandomValues(new Uint8Array(16));
 bytes[6]=(bytes[6]&0x0f)|0x40;
 bytes[8]=(bytes[8]&0x3f)|0x80;
 const hex=Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
 return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}
async function save(name,body,control,errorBox){
 if(busy)return;busy=true;
 const requestDialog=name==='request'?errorBox?.closest('dialog'):null;
 if(control){control.disabled=true;control.setAttribute('aria-busy','true');}
 if(errorBox)errorBox.hidden=true;
 try{
  const [path,method]=mutations[name],result=await api(path,method,body);
  if(name==='logout'){snapshot=undefined;history.replaceState(null,'','/');render(true);return;}
  if(Array.isArray(result.support))snapshot={...snapshot,support:result.support};
  else snapshot=await api('/api/dashboard');
  const chatDraft=name==='support'?app.querySelector('#chat-message')?.value:null;
  if(requestDialog?.open&&requestDialog.isConnected){
   const id=result.request?.id??result.id??snapshot.requests[0]?.id;
   history.replaceState(null,'',id?'/requests?item='+encodeURIComponent(id):'/requests');
  }else if(name==='request'&&(location.pathname!=='/requests'||app.querySelector('dialog[open]'))){
   updateInboxIndicators();
   announce('Заявка подана');
   return;
  }
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
   form.dataset.submissionId=newSubmissionId();
  }
  body.submissionId=form.dataset.submissionId;
 }
 void save(kind,body,event.submitter,form.querySelector('.form-error'));
});
app.addEventListener('pointerdown',event=>{
 if(event.isPrimary&&event.target.closest('[data-phone-dismiss]'))phoneClosePress=event;
});
for(const type of ['pointerup','pointercancel','blur'])window.addEventListener(type,event=>{
 const press=phoneClosePress;
 if(!press||(type!=='blur'&&event.pointerId!==press.pointerId))return;
 // Let the click reach the close control before applying a change in sheet height.
 setTimeout(()=>{
  if(phoneClosePress!==press)return;
  phoneClosePress=undefined;
  const dialog=app.querySelector('#phone-detail[open]');
  if(dialog&&snapshot&&location.pathname==='/requests'&&deferredInboxView===location.href&&updateOpenRequest(dialog,snapshot)){
   deferredInboxView=undefined;
  }
 },0);
});
app.addEventListener('click',event=>{
 if(outsidePhoneOverlay(event)){dismissPhoneOverlay(event.target);return;}
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
  if(button.dataset.copy){
   copyText(button).then(()=>{
    announce('Скопировано');
    button.dataset.copied='true';
    setTimeout(()=>delete button.dataset.copied,1200);
   }).catch(()=>announce('Не удалось скопировать. Выделите текст вручную.'));
   return;
  }
  if(button.dataset.chatQuestion){
   const composer=app.querySelector('#chat-message');
   button.closest('dialog').close();
   composer.value=button.dataset.chatQuestion;
   composer.dispatchEvent(new Event('input',{bubbles:true}));
   composer.focus({preventScroll:true});
   return;
  }
  if(button.hasAttribute('data-password')){
   const input=app.querySelector('#password'),visible=input.type==='password';
   const {selectionStart,selectionEnd,selectionDirection}=input;
   input.type=visible?'text':'password';
   input.setSelectionRange(selectionStart,selectionEnd,selectionDirection);
   button.setAttribute('aria-pressed',String(visible));
   button.setAttribute('aria-label',visible?'Скрыть пароль':'Показать пароль');
  }
  if(button.dataset.dialog)document.getElementById(button.dataset.dialog)?.showModal();
  if(button.hasAttribute('data-close'))button.closest('dialog')?.close();
  if(button.hasAttribute('data-phone-dismiss')){dismissPhoneOverlay(button.closest('dialog'));return;}
  if(button.hasAttribute('data-retry'))void load();
  if(button.hasAttribute('data-menu')){
   if(phoneLayout.matches){
    closingHistoryTarget=undefined;
    history.pushState({phoneDrawer:true},'',location.href);
    showPhoneDrawer();
   }else{
    const menu=document.querySelector('#mobile-nav');
    menu.hidden=!menu.hidden;
    button.setAttribute('aria-expanded',String(!menu.hidden));
    button.setAttribute('aria-label',menu.hidden?'Открыть меню':'Закрыть меню');
   }
  }
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
app.addEventListener('cancel',event=>{
 if(!event.target.matches('.phone-overlay'))return;
 event.preventDefault();
 dismissPhoneOverlay(event.target);
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
app.addEventListener('keydown',event=>{if(event.target.id==='chat-message'&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();event.target.form.requestSubmit();return;}if(!phoneLayout.matches&&event.key==='Escape'){const toggle=app.querySelector('[data-menu][aria-expanded="true"]');if(toggle){toggle.click();toggle.focus();}}});
phoneLayout.addEventListener('change',()=>{if(snapshot)render();});
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
window.addEventListener('popstate',()=>{
 const target=closingHistoryTarget;
 closingHistoryTarget=undefined;
 const drawer=app.querySelector('#phone-drawer[open]');
 if(drawer&&!history.state?.phoneDrawer&&drawer.dataset.source===location.href){
  closePhoneOverlay(drawer);
  return;
 }
 const detail=app.querySelector('#phone-detail[open]');
 if(detail&&phoneDetailReturn===location.href){
  closePhoneOverlay(detail);
  return;
 }
 if(target===location.href&&!drawer&&!detail)return;
 render(false,true);
 void refreshPublishedRanking();
});
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden){void refreshNotices(true);void refreshPublishedRanking();}
});
window.addEventListener('pageshow',event=>{if(event.persisted){if(snapshot)void refreshNotices(true);else void load();}});
void load();

