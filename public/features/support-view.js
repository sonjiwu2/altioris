import { calendarDate, escape as e, icon, safeLink, when } from '../ui.js?v=20261120-15';
import { requestNumber } from './request-view.js?v=20261121-2';

const avatar='<span class="assistant-icon support-avatar" aria-hidden="true">'+icon('assistant')+'</span>';
const shortcuts=[
 ['schedule','nav-schedule','Пары сегодня'],['exams','doc','Ближайший экзамен'],
 ['grades','nav-grades','Мои оценки'],['status','clipboard','Проверить заявку'],
];
const sectionLabels={
 '/schedule':'К расписанию','/schedule/exams':'К экзаменам','/teachers':'К преподавателям',
 '/grades':'К зачётке','/grades/ranking':'К рейтингу','/requests':'К заявкам',
 '/profile':'К профилю','/notifications':'К уведомлениям','/settings':'К настройкам',
};

function messageLink(item,requests){
 const href=safeLink(item.href);
 if(!href)return '';
 const url=new URL(item.href,location.origin);
 if(url.pathname==='/requests'){
  const request=requests.find(request=>request.id===url.searchParams.get('item'));
  if(request)return `<div class="chat-request-card">${icon('clipboard')}<span>Заявка № ${e(requestNumber(request.id))} · ${e(request.status)}</span><a class="button button-green" href="${href}">Открыть заявку</a></div>`;
 }
 return `<a class="text-link" href="${href}">${sectionLabels[url.pathname]??'Открыть раздел'}</a>`;
}

function message(item,requests,answered){
 const own=item.role!=='assistant';
 const status=answered?'Прочитано помощником':'Отправлено';
 const readMark=own?`<span class="chat-read-mark" role="img" aria-label="${status}" title="${status}"><svg viewBox="0 0 20 16" width="20" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 8 4 4 8-8"/>${answered?'<path d="m10 11 1 1 7-7"/>':''}</svg></span>`:'';
 const bubble=`<div class="bubble${own?' own':''}"><p>${e(item.text)}</p>${messageLink(item,requests)}
  <div class="chat-message-meta"><time datetime="${e(item.at)}">${when(item.at)}</time>${readMark}</div></div>`;
 return own?bubble:`<div class="message-row">${avatar}${bubble}</div>`;
}

function history(data){
 let previousDay;
 return data.support.map((item,index)=>{
  const day=calendarDate.format(new Date(item.at));
  const separator=day===previousDay?'':`<div class="chat-day"><span>${e(day)}</span></div>`;
  previousDay=day;
  return separator+message(item,data.requests,data.support[index+1]?.role==='assistant');
 }).join('');
}

export function support(data,params){
 const teacher=data.campus.teachers.find(item=>item.id===params.get('teacher'));
 const request=data.requests.find(item=>item.id===params.get('request'));
 const draft=teacher?'Вопрос о преподавателе '+teacher.shortName+': ':request?'Статус заявки '+request.id:
  params.get('topic')==='online'?'Как подключиться к онлайн-занятию?':'';
 const firstName=data.student.shortName.split(' ')[0];
 const welcome=`<div class="message-row">${avatar}<div class="bubble chat-welcome">
  <p><strong>Здравствуйте, ${e(firstName)}!</strong></p>
  <p>Чем вам помочь?</p>
  </div></div>`;
 return `<h1>Чат поддержки</h1><div class="support-layout"><section class="panel chat" aria-label="Помощник Altioris">
  <header class="chat-header">${avatar}<div class="chat-identity"><h2>Помощник Altioris</h2>
   <small>Автоматический помощник</small></div>
   <nav class="chat-jumps" aria-label="Навигация по переписке"${data.support.length?'':' hidden'}>
    <button class="icon-button" type="button" data-chat-jump="start" aria-controls="chat-history" aria-label="К началу переписки" title="К началу переписки">${icon('down')}</button>
    <button class="icon-button" type="button" data-chat-jump="end" aria-controls="chat-history" aria-label="К последним сообщениям" title="К последним сообщениям">${icon('down')}</button>
   </nav>
  </header>
  <div class="chat-history" id="chat-history" role="log" aria-label="История сообщений" tabindex="0">${history(data)||welcome}</div>
  <div class="chat-shortcuts" role="group" aria-label="Быстрые вопросы">${shortcuts.map(([action,glyph,title])=>
   `<button type="button" data-support="${action}">${icon(glyph)}${title}</button>`).join('')}</div>
  <form class="chat-form" data-mutation="message"><label class="sr-only" for="chat-message">Ваш вопрос</label>
   <textarea id="chat-message" name="text" rows="1" maxlength="500" required placeholder="Написать сообщение" autocomplete="off">${e(draft)}</textarea>
   <button class="button" aria-label="Отправить сообщение">${icon('send')}</button><p class="form-error" role="alert" hidden></p>
  </form></section></div>`;
}
