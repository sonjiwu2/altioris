import { escape as e, icon } from '../ui.js?v=20261120-5';
import { accentIcon } from './accent-icons.js';

const scales = [100, 115, 130];
const preferenceKey = student => 'altioris-preferences-' + student.number;

function preferences(student) {
 let saved;
 try { saved = JSON.parse(localStorage.getItem(preferenceKey(student))); } catch {}
 return {
  scale: scales.includes(saved?.scale) ? saved.scale : 100,
  reduce: saved?.reduce === true,
 };
}

export function applyPreferences(student) {
 const { scale, reduce } = preferences(student);
 const root = document.documentElement;
 root.dataset.theme = 'light';
 root.dataset.motion = reduce ? 'reduce' : 'full';
 root.dataset.textScale = String(scale);
 root.style.setProperty('--text-scale', String(scale / 100));
}

export function setTextScale(student, scale) {
 if (!scales.includes(scale)) return;
 localStorage.setItem(preferenceKey(student), JSON.stringify({ ...preferences(student), scale }));
 applyPreferences(student);
}

export function settings({ student }) {
 const { scale } = preferences(student);
 const scaleButtons = scales.map(value =>
  '<button type="button" data-scale="'+value+'" aria-pressed="'+(scale===value)+'"'+(scale===value?' class="selected"':'')+'>'+value+'%</button>'
 ).join('');

 return `<h1>Настройки</h1>
 <div class="settings-stack">
  <section class="panel settings-panel appearance-panel" aria-labelledby="appearance-title">
   <h2 id="appearance-title">${icon('computer')}Интерфейс</h2>
   <div class="settings-feature theme-feature">
    <div><h3>Тема оформления</h3><p>Светлая</p></div>
    <span class="theme-preview" aria-hidden="true"><i></i><span><i></i><i></i></span></span>
   </div>
   <div class="settings-feature scale-feature">
    <h3>${icon('text')}Размер текста</h3>
    <div class="segmented" role="group" aria-label="Размер текста">${scaleButtons}</div>
   </div>
  </section>
  <section class="panel settings-panel access-panel" aria-labelledby="session-title">
   ${accentIcon('shield')}
   <div class="session-copy">
    <h2 id="session-title">Текущий сеанс</h2>
    <p>${e(student.shortName)} · этот браузер</p>
   </div>
   <button class="button button-danger" type="button" data-logout>${accentIcon('exit')}Выйти из аккаунта</button>
  </section>
 </div>`;
}
