import { escape as e, icon, portrait } from '../ui.js';
export function preferences(student) {
 const defaults={theme:'light',scale:100,reduce:false,schedule:true,deadlines:true,news:false};
 try { return {...defaults,...JSON.parse(localStorage.getItem('altioris-preferences-'+student.number)||'{}')}; } catch { return defaults; }
}
export function applyPreferences(student) {
 const p=preferences(student);
 document.documentElement.dataset.theme=p.theme==='dark'||(p.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';
 document.documentElement.dataset.motion=p.reduce?'reduce':'full';
 document.documentElement.style.setProperty('--text-scale',String(p.scale/100));
 return p;
}
export function updatePreference(student,key,value) {
 const p=preferences(student); p[key]=value;
 localStorage.setItem('altioris-preferences-'+student.number,JSON.stringify(p));
 applyPreferences(student);
}
const toggle=(p,key,title,glyph)=>'<label class="setting-row">'+icon(glyph)+'<span>'+title+'</span><input class="switch" type="checkbox" data-preference="'+key+'"'+(p[key]?' checked':'')+'></label>';
export function settings({student}) {
 const p=preferences(student);
 return '<h1>Настройки</h1><div class="settings-layout"><div class="settings-main"><section class="panel settings-panel"><h2>Внешний вид</h2><p>Оформление портала и параметры интерфейса.</p><div class="theme-options">'+[['light','Светлая'],['dark','Тёмная'],['system','Как в системе']].map(([value,label])=>'<button class="theme-option '+value+(p.theme===value?' selected':'')+'" type="button" data-theme="'+value+'" aria-pressed="'+(p.theme===value)+'"><span class="theme-preview"><i></i><span><i></i><i></i></span></span><span class="theme-label"><span class="radio-dot"></span>'+label+'</span></button>').join('')+'</div><div class="setting-row">'+icon('text')+'<span>Размер текста</span><div class="segmented" role="group" aria-label="Размер текста">'+[100,115,130].map(value=>'<button type="button" data-scale="'+value+'" aria-pressed="'+(p.scale===value)+'" class="'+(p.scale===value?'selected':'')+'">'+value+'%</button>').join('')+'</div></div>'+toggle(p,'reduce','Уменьшить анимацию','sparkle')+'</section><section class="panel settings-panel"><h2>Уведомления</h2><p>Управление важными оповещениями в портале.</p>'+toggle(p,'schedule','Изменения расписания','calendar')+toggle(p,'deadlines','Напоминания о дедлайнах','clock')+toggle(p,'news','Новости кампуса','megaphone')+'<small class="settings-note">Настройки сохраняются для вашего аккаунта в этом браузере.</small></section></div><aside class="settings-side"><section class="panel settings-panel"><h2>Аккаунт</h2><p>Личные данные и профиль студента.</p><div class="settings-identity">'+portrait(student)+'<div><h3>'+e(student.shortName)+'</h3><a class="button button-outline" href="/profile">'+icon('person')+'Открыть профиль</a></div></div></section><section class="panel settings-panel"><h2>Доступ</h2><p>Управление сеансом в системе.</p><div class="session-info">'+icon('computer')+'<span>Сеанс<small>Текущий браузер</small></span></div><button class="button button-danger" type="button" data-logout>'+icon('exit')+'Выйти из аккаунта</button></section><p class="saved-state" role="status">'+icon('check')+'Настройки сохранены</p></aside></div>';
}

