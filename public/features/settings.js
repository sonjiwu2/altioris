import { escape as e, icon } from '../ui.js?v=20261120-12';

const scales = [100, 115, 130];
const themes = [
 ['light','Светлая'],
 ['dark','Тёмная'],
 ['system','Как в системе'],
];
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const preferenceKey = student => 'altioris-preferences-' + student.number;
let themeTransition;
let themeChange = 0;

function preferences(student) {
 let saved;
 try { saved = JSON.parse(localStorage.getItem(preferenceKey(student))); } catch {}
 return {
  scale: scales.includes(saved?.scale) ? saved.scale : 100,
  theme: themes.some(([value]) => value === saved?.theme) ? saved.theme : 'light',
  reduce: saved?.reduce === true,
 };
}

export function applyPreferences(student) {
 const { scale, reduce, theme } = preferences(student);
 const root = document.documentElement;
 root.dataset.theme = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
 root.dataset.motion = reduce ? 'reduce' : 'full';
 root.dataset.textScale = String(scale);
 root.style.setProperty('--text-scale', String(scale / 100));
}

export function setTextScale(student, scale) {
 if (!scales.includes(scale)) return;
 localStorage.setItem(preferenceKey(student), JSON.stringify({ ...preferences(student), scale }));
 applyPreferences(student);
}

export function setTheme(student, theme) {
 if (!themes.some(([value]) => value === theme) || preferences(student).theme === theme) return;
 const before = document.documentElement.dataset.theme;
 const after = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
 localStorage.setItem(preferenceKey(student), JSON.stringify({ ...preferences(student), theme }));
 const change = ++themeChange;
 themeTransition?.skipTransition();
 const update = () => {
  if (change === themeChange && document.querySelector('[data-logout]')) applyPreferences(student);
 };
 if (before !== after && !reducedMotion.matches && !preferences(student).reduce && document.startViewTransition) {
  const transition = document.startViewTransition(update);
  themeTransition = transition;
  // Canceling a superseded animation also rejects its ready promise.
  transition.ready.catch(() => {});
  transition.finished.finally(() => {
   if (themeTransition === transition) themeTransition = undefined;
  }).catch(() => {});
 } else {
  update();
 }
}

export function syncSystemTheme(student) {
 if (preferences(student).theme === 'system') applyPreferences(student);
}

export function settings({ student }) {
 const { scale, theme } = preferences(student);
 const scaleButtons = scales.map(value =>
  '<button type="button" data-scale="'+value+'" aria-pressed="'+(scale===value)+'"'+(scale===value?' class="selected"':'')+'>'+value+'%</button>'
 ).join('');
 const themeButtons = themes.map(([value, label]) => `
  <button type="button" class="theme-choice ${value}${theme===value?' selected':''}" data-theme-choice="${value}" aria-pressed="${theme===value}">
   <span class="theme-preview" aria-hidden="true"><i></i><span><i></i><i></i></span></span>
   <span class="theme-choice-label">${icon(value)}<span>${label}</span><span class="theme-mark" aria-hidden="true"></span></span>
  </button>`).join('');

 return `<h1>Настройки</h1>
 <div class="settings-stack">
  <section class="panel settings-panel appearance-panel" aria-labelledby="appearance-title">
   <h2 id="appearance-title">${icon('appearance')}Интерфейс</h2>
   <div class="settings-feature theme-feature">
    <h3 id="theme-title">Тема оформления</h3>
    <div class="theme-choices" role="group" aria-labelledby="theme-title">${themeButtons}</div>
   </div>
   <div class="settings-feature scale-feature">
    <h3>${icon('text-size')}Размер текста</h3>
    <div class="segmented" role="group" aria-label="Размер текста">${scaleButtons}</div>
   </div>
  </section>
  <section class="panel settings-panel access-panel" aria-labelledby="session-title">
   ${icon('session')}
   <div class="session-copy">
    <h2 id="session-title">Текущий сеанс</h2>
    <p>${e(student.shortName)} · этот браузер</p>
   </div>
   <button class="button button-danger" type="button" data-logout>${icon('logout')}Выйти из аккаунта</button>
  </section>
 </div>`;
}
