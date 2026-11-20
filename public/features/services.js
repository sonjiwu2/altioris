import { escape as e, badge, calendarDate, date, detailedDate, empty, icon, safeLink, when } from '../ui.js?v=20261120-15';
import { detailIcon } from './detail-icons.js';
import { noticeSoundEnabled } from './live-notices.js';
const completed=status=>/готов|заверш|отклон/iu.test(status);
const statusBadge=status=>badge(status,completed(status)&&!/отклон/iu.test(status)?'sage':'peach');
const requestGlyph=type=>({'certificate':'doc','academic-leave':'calendar',dormitory:'home','media-lab':'camera'}[type]||'doc');
function requestNumber(id){return id.length<10?id: id.slice(0,8).toUpperCase();}
export function requests({requests:items,requestTypes},params){
 const search=params.get('q')?.trim()??'',filter=params.get('filter')??'';
 const filtered=items.filter(item=>item.title.toLowerCase().includes(search.toLowerCase())&&(filter==='open'?!completed(item.status):filter==='done'?completed(item.status):true));
 const selected=filtered.find(x=>x.id===params.get('item'))||filtered.find(x=>x.documentId)||filtered[0],newType=params.get('new');
 const urlFor=(name,value)=>{const q=new URLSearchParams();if(search)q.set('q',search);if(filter&&name!=='filter')q.set('filter',filter);if(value)q.set(name,value);return '/requests'+(q.size?'?'+e(q):'');};
 const history=selected?[...selected.history].reverse():[];
 return '<div class="section-heading"><h1>Заявки</h1><button type="button" class="button" data-dialog="request-dialog">'+icon('plus')+'Новая заявка</button></div><div class="split work-layout"><section class="panel list-panel" aria-label="Список заявок"><nav class="pills" aria-label="Состояние заявки">'+[['','Все заявки'],['open','В работе'],['done','Завершённые']].map(([value,label])=>'<a href="'+urlFor('filter',value)+'"'+(filter===value?' aria-current="page"':'')+'>'+label+'</a>').join('')+'</nav>'+filtered.map(item=>'<a class="service-row '+(item.id===selected?.id?'active':'')+'" href="'+urlFor('item',item.id)+'"'+(item.id===selected?.id?' aria-current="true"':'')+'>'+icon(requestGlyph(item.type))+'<span><strong>'+e(item.title)+'</strong><small>'+date(item.createdAt)+'</small></span>'+statusBadge(item.status)+'</a>').join('')+(!filtered.length?empty('Заявок пока нет. Создайте новую — она появится здесь.'):'')+'</section><aside class="panel request-inspector">'+(selected?'<header class="request-title">'+icon(requestGlyph(selected.type))+'<div><h2>'+e(selected.title)+'</h2><p>Заявка № '+e(requestNumber(selected.id))+' · '+date(selected.createdAt)+'</p></div>'+statusBadge(selected.status)+'</header><h3>История заявки</h3><ol class="timeline">'+history.map((step,i)=>'<li><span class="step-icon">'+icon(i===history.length-1&&completed(selected.status)?'check':i===0?'clipboard':'doc')+'</span><strong>'+e(step.label)+'</strong><time datetime="'+e(step.at)+'">'+detailedDate(step.at)+'</time></li>').join('')+'</ol><p class="request-format">Получение<span>'+(selected.documentId?'Электронный документ':'Электронная заявка')+'</span></p>'+(selected.documentId?'<div class="file-row">'+icon('pdf')+'<span><strong>'+e(selected.title)+'.pdf</strong><small>Учебный образец документа</small></span><a class="button" href="/api/documents/'+encodeURIComponent(selected.documentId)+'" download>Скачать PDF</a></div>':'<p class="notice">Заявка сохранена. Статус и история отображаются в этом разделе.</p>')+'<div class="request-help"><span>Вопрос по заявке?</span><a class="text-link" href="/support?request='+encodeURIComponent(selected.id)+'">'+icon('nav-chat')+'Чат поддержки</a></div>':empty('Выберите заявку, чтобы увидеть статус и историю.'))+'</aside></div><dialog id="request-dialog" aria-labelledby="request-title"'+(requestTypes.some(([value])=>value===newType)?' data-auto-open':'')+'><div class="section-heading"><h2 id="request-title">Новая заявка</h2><button type="button" class="icon-button" data-close aria-label="Закрыть">'+icon('close')+'</button></div><form data-mutation="request"><label>Вид заявки<select name="type" required>'+requestTypes.map(([value,label])=>'<option value="'+value+'"'+(value===newType?' selected':'')+'>'+label+'</option>').join('')+'</select></label><p class="muted">Справка об обучении и выписка из зачётки формируются сразу как учебные PDF. Остальные заявки сохраняются со статусом «На рассмотрении».</p><p class="form-error" role="alert" hidden></p><button class="button">Подать заявку</button></form></dialog>';
}
const noticeTypes={
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
 const label=url.startsWith('/schedule/exams')?'Открыть расписание сессии':url.startsWith('/grades/ranking')?'Открыть рейтинг':
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
 const rich=request?'<div class="chat-request-card">'+icon(completed(request.status)?'check':'clipboard')+'<span>Заявка № '+e(requestNumber(request.id))+'</span><a class="button button-green" href="'+href+'">Открыть заявку</a></div>':href?'<a class="text-link" href="'+href+'">'+(href.startsWith('/requests')?'Открыть заявки':href.startsWith('/grades')?'К успеваемости':href.startsWith('/teachers')?'К преподавателю':'Открыть раздел')+'</a>':'';
 const bubble='<div class="bubble'+(own?' own':'')+'"><p>'+e(item.text)+'</p>'+rich+'<time datetime="'+e(item.at)+'">'+when(item.at)+'</time></div>';
 return own?bubble:'<div class="message-row">'+assistant+bubble+'</div>';
}
export function support(data,params){
 const teacher=data.campus.teachers.find(x=>x.id===params.get('teacher')),request=data.requests.find(x=>x.id===params.get('request'));
 const draft=teacher?'Вопрос о преподавателе '+teacher.shortName+': ':request?'Статус заявки '+request.id:params.get('topic')==='online'?'Как подключиться к онлайн-занятию?':'';
 return '<h1>Чат поддержки</h1><div class="support-layout"><section class="panel chat"><header class="chat-header">'+assistant+'<div><h2>Помощник Altioris</h2><small>Автоматический помощник · отвечает по данным вашего кабинета</small></div></header><div class="chat-history" role="log" aria-label="История сообщений" tabindex="0"><div class="message-row">'+assistant+'<div class="bubble"><p>Чем помочь?</p></div></div><div class="quick-actions">'+topics.map(([action,glyph,title])=>'<button type="button" data-support="'+action+'">'+icon(glyph)+title+'</button>').join('')+'</div>'+data.support.map(item=>conversationMessage(item,data)).join('')+'</div><form class="chat-form" data-mutation="message"><label class="sr-only" for="chat-message">Ваш вопрос</label><textarea id="chat-message" name="text" rows="1" maxlength="500" required placeholder="Написать сообщение" autocomplete="off">'+e(draft)+'</textarea><button class="button" aria-label="Отправить вопрос">'+icon('send')+'</button><p class="form-error" role="alert" hidden></p></form></section></div>';
}

