const iconPaths = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6 6-6-6 6-6"/>',
  out: '<path d="M7 17 17 7M7 7h10v10"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9m-8 12a2 2 0 0 0 4 0"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.4"/>',
  flask: '<path d="M9 3h6m-5 0v7l-5.4 8a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3L14 10V3M8 15h8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  ticket: '<path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  doc: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 13h6m-6 4h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  camera: '<path d="M3 7h5l2-3h4l2 3h5v13H3z"/><circle cx="12" cy="13" r="3"/>',
  chat: '<path d="M4 5h16v11H9l-5 4zM8 10h8"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  exit: '<path d="M10 4H5v16h5m3-8h7m-3-3 3 3-3 3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
};

export function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] ?? iconPaths.doc}</svg>`;
}

export function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export const brand = `<span class="brand"><img src="/assets/mark.svg" alt="" width="39" height="36">Altioris</span>`;
const zone = { timeZone: 'Europe/Moscow' };
const time = new Intl.DateTimeFormat('ru-RU', { ...zone, hour: '2-digit', minute: '2-digit' });
const fullDay = new Intl.DateTimeFormat('ru-RU', { ...zone, weekday: 'long', day: 'numeric', month: 'long' });
const shortDay = new Intl.DateTimeFormat('ru-RU', { ...zone, day: 'numeric', month: 'long' });
const dayKey = new Intl.DateTimeFormat('en-CA', { ...zone, year: 'numeric', month: '2-digit', day: '2-digit' });
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export const when = value => value ? time.format(new Date(value)) : '';
export const date = value => value ? shortDay.format(new Date(value)) : '';
export const dayName = value => fullDay.format(new Date(value));
export const key = value => dayKey.format(new Date(value));
export const decimal = value => value == null ? '—' : number.format(value);
export const range = (start, end) => `${when(start)}–${when(end)}`;
export const detailedDate = value => value ? `${date(value)}, ${when(value)}` : '—';

export function empty(message) {
  return `<p class="empty">${escape(message)}</p>`;
}

export function safeLink(href) {
  return typeof href === 'string' && /^\/(?!\/)[a-z0-9/]+(?:\?[a-z0-9=&%_-]+)?$/i.test(href) ? escape(href) : '';
}

export function line(name, text) {
  return `<div class="info-line">${icon(name)}<span>${text}</span></div>`;
}

export function badge(text, tone = '') {
  return `<span class="badge ${tone}">${escape(text)}</span>`;
}

export function tab(path, title, selected) {
  return `<a class="tab" href="${path}"${selected ? ' aria-current="page"' : ''}>${title}</a>`;
}

export function fields(entries) {
  return `<dl class="fields">${entries.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value ?? '—')}</dd></div>`).join('')}</dl>`;
}

const portraits = {
  'Надежда': 'voronova',
  'Сергей': 'krylov',
  'Елена': 'pavlova',
  'Алина': 'vetrova',
};

export function portrait(person, className = '') {
  const source = portraits[person.name.split(' ')[0]];
  const initials = person.initials || person.shortName?.split(' ').map(part => part[0]).join('') || '?';
  if (source && person.avatar !== 'initials') {
    return `<img class="portrait ${className}" src="/assets/${source}.webp" alt="" width="110" height="110">`;
  }
  const style = person.avatar === 'portrait' ? ' initials-pattern' : '';
  return `<span class="portrait initials${style} ${className}" aria-hidden="true">${escape(initials)}</span>`;
}
