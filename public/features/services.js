import { escape as e, badge, calendarDate, detailedDate, empty, icon, safeLink } from '../ui.js?v=20261120-15';
import { detailIcon } from './detail-icons.js?v=20261121-1';
import { noticeSoundEnabled } from './live-notices.js';
export { support, updateConversation } from './support-view.js?v=20261121-12';
export { requests } from './request-view.js?v=20261121-11';
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
