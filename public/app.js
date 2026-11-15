import { brand, escape as e, icon, portrait } from './ui.js';
import { exams, news, schedule } from './features/campus.js';
import { grades, profile, ranking, teachers } from './features/academic.js';
import { notifications, requests, support } from './features/services.js';
import { settings, applyPreferences, updatePreference, preferences } from './features/settings.js';

const app=document.querySelector('#app'), announcement=document.querySelector('#status');
const navigation=[['/schedule','Расписание','calendar'],['/grades','Успеваемость','grades'],['/teachers','Преподаватели','people'],['/requests','Заявки','doc'],['/support','Чат поддержки','chat'],['/notifications','Уведомления','bell'],['/settings','Настройки','settings']];
const pages=new Map([['/',schedule],['/schedule',schedule],['/schedule/exams',exams],['/grades',grades],['/grades/ranking',ranking],['/teachers',teachers],['/requests',requests],['/support',support],['/notifications',notifications],['/profile',profile],['/settings',settings]]);
let snapshot,busy=false;
async function api(path,method='GET',body) {
 const response=await fetch(path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined}).catch(()=>{throw new Error('Нет связи с кабинетом. Проверьте подключение и попробуйте ещё раз.');});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(typeof data.error==='string'?data.error:'Не удалось выполнить действие. Попробуйте ещё раз.');error.status=response.status;throw error;}
 return data;
}
function announce(message){announcement.textContent=message;}
function signIn() {
 document.documentElement.dataset.theme='light';
 document.title='Вход в кабинет · Altioris University';
 app.innerHTML='<main id="main" class="sign-in" tabindex="-1"><section class="sign-in-card">'+brand+'<div class="ornament" aria-hidden="true"><span>✦</span></div><h1>Вход в кабинет</h1><form data-mutation="login" class="login-form"><label for="username">Логин</label><div class="input-control">'+icon('person')+'<input id="username" name="login" placeholder="Введите логин" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="80" required></div><label for="password">Пароль</label><div class="input-control password-control">'+icon('lock')+'<input id="password" type="password" name="password" placeholder="Введите пароль" autocomplete="current-password" maxlength="128" required><button class="icon-button" type="button" data-password aria-label="Показать пароль" aria-pressed="false">'+icon('eye')+'</button></div><p class="form-error" role="alert" hidden></p><button class="button login-submit">Войти</button></form><button class="text-link help-link" type="button" data-dialog="login-help">Не получается войти?</button></section><footer>Конкурсный прототип</footer></main><dialog id="login-help" aria-labelledby="login-help-title"><div class="section-heading"><h2 id="login-help-title">Не получается войти?</h2><button type="button" class="icon-button" data-close aria-label="Закрыть">'+icon('close')+'</button></div><p>Введите логин и постоянный пароль демонстрационного аккаунта. Если у вас нет доступа, обратитесь к организатору демонстрации.</p></dialog>';
}
function render(focus=false) {
 if(!snapshot){signIn();if(focus)app.querySelector('#username').focus();return;}
 const pref=applyPreferences(snapshot.student);
 const {pathname,search}=location,params=new URLSearchParams(search);
 const visibleNotices=snapshot.notifications.filter(item=>item.type==='Новость'?pref.news:item.type==='Дедлайн'?pref.deadlines:item.type==='Изменение'?pref.schedule:true);
 const unread=visibleNotices.filter(item=>!item.read).length;
 const active=href=>(href==='/schedule'&&pathname==='/')||pathname===href||pathname.startsWith(href+'/');
 const nav=navigation.map(([href,label,glyph])=>'<a href="'+href+'"'+(active(href)?' aria-current="page"':'')+'>'+icon(glyph)+'<span>'+label+'</span>'+(href==='/notifications'&&unread?'<span class="nav-unread" aria-label="Есть новые уведомления"></span>':'')+'</a>').join('');
 const page=pages.get(pathname);
 const content=pathname.startsWith('/news/')?news(pathname):page?page({...snapshot,notifications:visibleNotices},params):'<h1>Страница не найдена</h1><a href="/schedule" class="button">К расписанию</a>';
 app.innerHTML='<header class="mobile-header"><a href="/schedule" aria-label="Altioris University">'+brand+'</a><button class="icon-button menu-toggle" type="button" data-menu aria-expanded="false" aria-controls="mobile-nav" aria-label="Открыть меню">'+icon('menu')+'</button></header><aside class="sidebar"><a class="brand-link" href="/schedule" aria-label="Altioris University · Расписание">'+brand+'</a><nav class="main-nav" aria-label="Основное меню">'+nav+'</nav><a class="sidebar-profile" href="/profile"'+(pathname==='/profile'?' aria-current="page"':'')+'>'+portrait(snapshot.student)+'<span>'+e(snapshot.student.shortName)+'<small>'+e(snapshot.student.group)+'</small></span>'+icon('down')+'</a></aside><nav id="mobile-nav" class="mobile-nav" aria-label="Основное меню" hidden>'+nav+'<a href="/profile">'+icon('person')+'Мой профиль</a></nav><div class="workspace"><main id="main" class="page" tabindex="-1">'+content+'</main><footer class="page-footer">Конкурсный прототип</footer></div>';
 document.title=(app.querySelector('h1')?.textContent||'Кабинет')+' · Altioris University';
 const dialog=app.querySelector('[data-auto-open]');if(dialog)dialog.showModal();else if(focus)document.querySelector('#main').focus({preventScroll:true});
 const chat=app.querySelector('.chat-history');if(chat&&snapshot.support.length)chat.scrollTop=chat.scrollHeight;
}
function go(href){
 const next=new URL(href,location.href),same=location.pathname===next.pathname;
 history.pushState(null,'',next);render(!same);if(!same)window.scrollTo(0,0);
}
async function load(){
 try{snapshot=await api('/api/dashboard');render();}
 catch(error){if(error.status===401){snapshot=undefined;render();}else app.innerHTML='<main id="main" class="page standalone-error"><h1>Кабинет недоступен</h1><p>'+e(error.message)+'</p><button class="button" data-retry>Повторить</button></main>';}
}
const mutations={login:['/api/login','POST'],request:['/api/requests','POST'],avatar:['/api/profile','PATCH'],message:['/api/support','POST'],support:['/api/support','POST'],read:['/api/notifications','PATCH'],logout:['/api/logout','POST']};
async function save(name,body,control,errorBox){
 if(busy)return;busy=true;
 if(control){control.disabled=true;control.setAttribute('aria-busy','true');}
 if(errorBox)errorBox.hidden=true;
 try{
  const [path,method]=mutations[name],result=await api(path,method,body);
  if(name==='logout'){snapshot=undefined;history.replaceState(null,'','/');render(true);return;}
  snapshot=await api('/api/dashboard');
  if(name==='request'){const id=result.request?.id??result.id??snapshot.requests[0]?.id;history.replaceState(null,'',id?'/requests?item='+encodeURIComponent(id):'/requests');}
  render(['login','request','avatar'].includes(name));
  if(name==='message')app.querySelector('#chat-message')?.focus();
  if(name==='avatar')app.querySelector('[data-dialog="avatar-dialog"]')?.focus();
  const confirmation={request:'Заявка подана',avatar:'Фото профиля сохранено',read:'Уведомления обновлены',support:'Помощник ответил',message:'Помощник ответил'};
  if(confirmation[name])announce(confirmation[name]);
 }catch(error){
  if(error.status===401&&name!=='login'){snapshot=undefined;render(true);announce('Сеанс завершён. Войдите снова.');}
  else if(errorBox){errorBox.hidden=false;errorBox.textContent=error.message;}
  else{app.querySelector('.action-error')?.remove();const banner=document.createElement('p');banner.className='form-error action-error';banner.setAttribute('role','alert');banner.textContent=error.message;document.querySelector('#main')?.prepend(banner);}
 }finally{if(control){control.disabled=false;control.removeAttribute('aria-busy');}busy=false;}
}
app.addEventListener('submit',event=>{
 const form=event.target;if(!(form instanceof HTMLFormElement))return;event.preventDefault();
 const fields=new FormData(form),kind=form.dataset.mutation;
 if(!kind){const query=new URLSearchParams(fields);for(const [name,value] of query)if(!value)query.delete(name);go(new URL(form.action).pathname+(query.size?'?'+query:''));return;}
 const body=Object.fromEntries(fields);if(kind==='message')body.action='message';
 void save(kind,body,event.submitter,form.querySelector('.form-error'));
});
app.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(button){
  if(button.dataset.theme||button.dataset.scale){updatePreference(snapshot.student,button.dataset.theme?'theme':'scale',button.dataset.theme||Number(button.dataset.scale));render();announce('Настройки сохранены');return;}
  if(button.dataset.copy){navigator.clipboard.writeText(button.dataset.copy).then(()=>announce('Скопировано')).catch(()=>announce('Не удалось скопировать. Выделите текст вручную.'));return;}
  if(button.hasAttribute('data-password')){const input=app.querySelector('#password'),show=input.type==='password';input.type=show?'text':'password';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',show?'Скрыть пароль':'Показать пароль');}
  if(button.dataset.dialog)document.getElementById(button.dataset.dialog)?.showModal();
  if(button.hasAttribute('data-close'))button.closest('dialog')?.close();
  if(button.hasAttribute('data-retry'))void load();
  if(button.hasAttribute('data-menu')){const menu=document.querySelector('#mobile-nav');menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));button.setAttribute('aria-label',menu.hidden?'Открыть меню':'Закрыть меню');}
  if(button.hasAttribute('data-logout'))void save('logout',undefined,button);
  if(button.hasAttribute('data-read-all'))void save('read',{all:true},button);
  if(button.dataset.read)void save('read',{id:button.dataset.read},button);
  if(button.dataset.support)void save('support',{action:button.dataset.support},button);
  return;
 }
 const link=event.target.closest('a[href]');
 if(!link||!snapshot||event.defaultPrevented||event.button||event.ctrlKey||event.shiftKey||event.metaKey||event.altKey)return;
 const url=new URL(link.href);
 if(url.origin===location.origin&&!url.pathname.startsWith('/api/')&&!link.hasAttribute('download')){event.preventDefault();go(link.href);}
});
app.addEventListener('change',event=>{const control=event.target.closest('[data-preference]');if(control&&snapshot){updatePreference(snapshot.student,control.dataset.preference,control.checked);announce('Настройки сохранены');}});
app.addEventListener('keydown',event=>{if(event.key==='Escape'){const toggle=app.querySelector('[data-menu][aria-expanded="true"]');if(toggle){toggle.click();toggle.focus();}}});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(snapshot&&preferences(snapshot.student).theme==='system')applyPreferences(snapshot.student);});
window.addEventListener('popstate',()=>render());
window.addEventListener('pageshow',event=>{if(event.persisted)void load();});
void load();

