import { escape as e, badge, calendarDate, detailedDate, empty, icon, safeLink, when } from '../ui.js?v=20261120-15';
import { detailIcon } from './detail-icons.js?v=20261121-1';
import { noticeSoundEnabled } from './live-notices.js';
import { requestNumber } from './request-view.js';
export { requests } from './request-view.js';
const noticeTypes={
 'Документы':['inbox-document-ready','Учебный офис'],
 'Расписание':['inbox-schedule','Учебный офис'], 'Изменение':['inbox-schedule','Учебный офис'],
 'Онлайн':['inbox-online','Учебный офис'], 'Дедлайн':['inbox-deadline','Учебный офис'],
 'Результат':['inbox-grade','Учебный офис'], 'Рейтинг':['inbox-ranking','Учебный офис'],
 'Библиотека':['inbox-library','Библиотека Altioris'], 'Событие':['inbox-event','Студенческий центр'],
 'Возможности':['inbox-opportunity','Студенческий центр'], 'Новость':['inbox-event','Студенческий центр'],
 'Учебный офис':['inbox-office','Учебный офис'],
};
const noticeType=item=>Object.hasOwn(noticeTypes,item.type)?noticeTypes[item.type]:noticeTypes['Учебный офис'];
const receivedFormat=new Intl.DateTimeFormat('ru-RU',{
 timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',second:'2-digit',
});

function messageDetails(item){
 const [,sender]=noticeType(item),url=safeLink(item.href);
 const label=url.startsWith('/requests')?'Открыть заявку':url.startsWith('/schedule/exams')?'Открыть расписание сессии':url.startsWith('/grades/ranking')?'Открыть рейтинг':
  url.startsWith('/grades')?'Открыть зачётку':url.includes('lesson=')?'Открыть занятие':'Открыть расписание';
 return `<header class="inbox-detail-header">${badge(item.type,'sage')}
  <h2>${e(item.title)}</h2>${sender===item.type?'':`<span class="inbox-sender">${e(sender)}</span>`}</header>
  <div class="notice-body">${item.body.split(/\n\s*\n/u).map(paragraph=>'<p>'+e(paragraph)+'</p>').join('')}</div>
  <div class="info-line inbox-arrival">${detailIcon('inbox-received')}<span>Получено по Москве
   <time datetime="${e(item.at)}">${calendarDate.format(new Date(item.at))} · ${receivedFormat.format(new Date(item.at))}</time></span></div>
  <div class="inbox-actions">${url?`<a class="button" href="${url}">${label}</a>`:''}
   ${!item.read?`<button class="button button-outline" type="button" data-read="${e(item.id)}">Отметить прочитанным</button>`:''}
  </div>`;
}

export function notifications({notifications:items,student},params){
 const unread=items.filter(item=>!item.read),only=params.get('filter')==='unread',visible=only?unread:items;
 const selected=visible.find(item=>item.id===params.get('item'))??visible[0];
 const sound=noticeSoundEnabled(student);
 const rows=visible.map(item=>{
  const [glyph]=noticeType(item);
  const current=item.id===selected?.id;
  const preview=item.body.replace(/\s+/gu,' ');
  return `<a class="notification-row ${current?'active':''}" href="/notifications?item=${encodeURIComponent(item.id)}${only?'&amp;filter=unread':''}"${current?' aria-current="true"':''}>
   ${detailIcon(glyph)}<span><span class="inbox-row-topic">${e(item.type)}</span><strong>${e(item.title)}</strong>
   <small>${e(preview)}</small><time datetime="${e(item.at)}">${detailedDate(item.at)}</time></span>
   ${item.read?'':'<i class="unread-dot" aria-label="Не прочитано"></i>'}</a>`;
 }).join('');
 return `<h1>Уведомления</h1><div class="notifications-toolbar">
  <nav class="pills" aria-label="Фильтр уведомлений"><a href="/notifications"${!only?' aria-current="page"':''}>Все</a>
   <a href="/notifications?filter=unread"${only?' aria-current="page"':''}>Непрочитанные</a></nav>
  <div class="inbox-toolbar-actions"><button class="button button-outline" type="button" aria-pressed="${sound}" data-notice-sound><span>${sound?'Звук включён':'Звук выключен'}</span></button>
   ${unread.length?'<button type="button" class="button button-outline" data-read-all>Прочитать все</button>':''}</div>
  </div><div class="split notifications-layout"><section class="panel list-panel notification-inbox" aria-label="Список уведомлений">
   ${rows||empty(only?'Все уведомления прочитаны.':'Новых уведомлений пока нет.')}</section>
   ${selected?`<aside class="panel notification-detail" aria-label="Текст уведомления">${messageDetails(selected)}</aside>`:''}</div>`;
}
const assistant='<span class="assistant-icon support-avatar" aria-hidden="true">'+icon('assistant')+'</span>';
const topics=[['certificate','doc','Заказать справку'],['status','clipboard','Проверить заявку'],['faq','search','Найти ответ']];
function conversationMessage(item,data){
 const own=item.role==='student'||item.role==='user',href=safeLink(item.href);
 const id=href?new URL(href,'http://localhost').searchParams.get('item'):null;
 const request=data.requests.find(x=>x.id===id);
 const rich=request?'<div class="chat-request-card">'+icon(request.documentId?'check':'clipboard')+'<span>Заявка № '+e(requestNumber(request.id))+' · '+e(request.status)+'</span><a class="button button-green" href="'+href+'">Открыть заявку</a></div>':href?'<a class="text-link" href="'+href+'">'+(href.startsWith('/requests')?'Открыть заявки':href.startsWith('/grades')?'К успеваемости':href.startsWith('/teachers')?'К преподавателю':'Открыть раздел')+'</a>':'';
 const bubble='<div class="bubble'+(own?' own':'')+'"><p>'+e(item.text)+'</p>'+rich+'<time datetime="'+e(item.at)+'">'+when(item.at)+'</time></div>';
 return own?bubble:'<div class="message-row">'+assistant+bubble+'</div>';
}
export function support(data,params){
 const teacher=data.campus.teachers.find(x=>x.id===params.get('teacher')),request=data.requests.find(x=>x.id===params.get('request'));
 const draft=teacher?'Вопрос о преподавателе '+teacher.shortName+': ':request?'Статус заявки '+request.id:params.get('topic')==='online'?'Как подключиться к онлайн-занятию?':'';
 return '<h1>Чат поддержки</h1><div class="support-layout"><section class="panel chat"><header class="chat-header">'+assistant+'<div><h2>Помощник Altioris</h2><small>Автоматический помощник · отвечает по данным вашего кабинета</small></div></header><div class="chat-history" role="log" aria-label="История сообщений" tabindex="0"><div class="message-row">'+assistant+'<div class="bubble"><p>Чем помочь?</p></div></div><div class="quick-actions">'+topics.map(([action,glyph,title])=>'<button type="button" data-support="'+action+'">'+icon(glyph)+title+'</button>').join('')+'</div>'+data.support.map(item=>conversationMessage(item,data)).join('')+'</div><form class="chat-form" data-mutation="message"><label class="sr-only" for="chat-message">Ваш вопрос</label><textarea id="chat-message" name="text" rows="1" maxlength="500" required placeholder="Написать сообщение" autocomplete="off">'+e(draft)+'</textarea><button class="button" aria-label="Отправить вопрос">'+icon('send')+'</button><p class="form-error" role="alert" hidden></p></form></section></div>';
}

