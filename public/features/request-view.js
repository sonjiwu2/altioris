import { badge, calendarDate, empty, escape as e, icon } from '../ui.js?v=20261120-15';
import { detailIcon } from './detail-icons.js?v=20261121-1';

const presentation = {
 certificate:['request-enrollment','Подтверждение обучения с программой, курсом и группой.'],
 transcript:['request-transcript','Итоговые оценки, кредиты и GPA по завершённым контролям.'],
 'academic-leave':['request-leave','Подтверждение регистрации обращения об отпуске.'],
 dormitory:['request-housing','Подтверждение статуса студента для жилищной службы.'],
 'media-lab':['request-media','Подтверждение регистрации запроса на посещение.'],
};
export const requestFinished=item=>/готов|заверш|отклон|ошибка/iu.test(item.status);
const glyph=type=>detailIcon((presentation[type]??presentation.certificate)[0]);
const statusBadge=item=>badge(item.status,item.documentId?'sage':item.status==='В обработке'?'lavender':'peach');
export const requestNumber=id=>id.slice(0,8).toUpperCase();
const clock=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',second:'2-digit'});
const compactDate=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',year:'numeric'});
function requestDate(value,showTime=false){
 const date=new Date(value);
 const time=showTime?' · '+clock.format(date):'';
 return '<time datetime="'+e(value)+'"><span class="request-date-full">'+calendarDate.format(date)+time+
  '</span><span class="request-date-compact">'+compactDate.format(date)+time+'</span></time>';
}

function requestForm(types,selected){
 const options=types.map(([type,title],index)=>{
  const description=(presentation[type]??presentation.certificate)[1];
  return '<label class="request-option"><input type="radio" name="type" value="'+e(type)+'" required'+
   (selected===type||(!selected&&index===0)?' checked':'')+'>'+glyph(type)+
   '<span><strong>'+e(title)+'</strong><small>'+e(description)+'</small></span></label>';
 }).join('');
 return '<dialog id="request-dialog" aria-labelledby="request-title"'+(selected?' data-auto-open':'')+'>'+
  '<div class="section-heading"><h2 id="request-title">Новая заявка</h2>'+
  '<button type="button" class="icon-button" data-close aria-label="Закрыть">'+icon('close')+'</button></div>'+
  '<form data-mutation="request"><fieldset class="request-options"><legend>Вид заявки</legend>'+options+'</fieldset>'+
  '<p class="request-wait">Подготовка занимает около 2–3 минут. Когда PDF будет готов, придёт уведомление.</p>'+
  '<p class="form-error" role="alert" hidden></p><button class="button">Отправить заявку</button></form></dialog>';
}

function requestDetails(item){
 const history=[...item.history].reverse().map((step,index,events)=>{
  const latest=index===events.length-1;
  return '<li'+(latest?' aria-current="step"':'')+'><span class="request-stage-dot" aria-hidden="true"></span>'+
   '<strong>'+e(step.label)+'</strong>'+requestDate(step.at,true)+'</li>';
 }).join('');
 const file=item.documentId?'/api/documents/'+encodeURIComponent(item.documentId):null;
 const deliverable=file?'<section class="request-result"><div>'+icon('pdf')+
  '<span><strong>'+e(item.title)+'</strong><small>Учебный образец · PDF</small></span></div>'+
  '<div class="request-result-actions"><a class="button" href="'+file+'?view=1" target="_blank" rel="noopener">Открыть PDF</a>'+
  '<a class="button button-outline" href="'+file+'" download>Скачать</a></div></section>':
  '<p class="request-wait">'+(requestFinished(item)?'Не удалось подготовить PDF. Можно отправить новую заявку.':
   'PDF появится здесь после оформления. О готовности сообщит учебный офис.')+'</p>';
 return '<header class="request-title">'+glyph(item.type)+'<div><h2>'+e(item.title)+'</h2><p>Заявка № '+
  e(requestNumber(item.id))+'</p></div>'+statusBadge(item)+'</header>'+
  '<h3 class="request-history-title">История заявки</h3><ol class="request-history">'+history+'</ol>'+deliverable;
}

export function requests({requests:items,requestTypes:types},params){
 const query=params.get('q')?.trim()??'',filter=params.get('filter')??'';
 const visible=items.filter(item=>item.title.toLowerCase().includes(query.toLowerCase())&&
  (filter==='open'?!requestFinished(item):filter==='done'?requestFinished(item):true));
 const selected=visible.find(item=>item.id===params.get('item'))??visible[0];
 const newType=types.find(([type])=>type===params.get('new'))?.[0];
 const href=(name,value)=>{
  const next=new URLSearchParams();
  if(query)next.set('q',query);
  if(filter&&name!=='filter')next.set('filter',filter);
  if(value)next.set(name,value);
  return '/requests'+(next.size?'?'+e(next):'');
 };
 const tabs=[['','Все заявки'],['open','В работе'],['done','Завершённые']].map(([value,label])=>
  '<a href="'+href('filter',value)+'"'+(filter===value?' aria-current="page"':'')+'>'+label+'</a>').join('');
 const rows=visible.map(item=>'<a class="service-row '+(item.id===selected?.id?'active':'')+'" href="'+href('item',item.id)+'"'+
  (item.id===selected?.id?' aria-current="true"':'')+'>'+glyph(item.type)+'<span class="request-row-copy"><strong>'+e(item.title)+
  '</strong><small>'+requestDate(item.createdAt)+'</small></span>'+statusBadge(item)+'</a>').join('');
 return '<div class="section-heading"><h1>Заявки</h1><button type="button" class="button" data-dialog="request-dialog">'+
  icon('plus')+'Новая заявка</button></div><div class="split work-layout"><section class="panel list-panel" aria-label="Список заявок">'+
  '<nav class="pills" aria-label="Состояние заявки">'+tabs+'</nav>'+
  (rows||empty(filter?'Нет заявок с таким статусом.':'Заявок пока нет.'))+'</section><aside class="panel request-inspector">'+
  (selected?requestDetails(selected):empty('Выберите заявку, чтобы увидеть историю.'))+'</aside></div>'+requestForm(types,newType);
}
