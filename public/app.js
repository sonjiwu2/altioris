import { brand, escape as e, icon } from './ui.js';
import { exams, home, news, schedule } from './features/campus.js';
import { grades, profile, ranking, teachers } from './features/academic.js';
import { notifications, requests, support } from './features/services.js';

const app = document.querySelector('#app');
const announcement = document.querySelector('#status');
const navigation = [
  ['/', 'Главная'], ['/schedule', 'Расписание'], ['/grades', 'Успеваемость'],
  ['/teachers', 'Преподаватели'], ['/requests', 'Заявки'], ['/support', 'Чат поддержки'],
];
const pages = new Map([
  ['/', home], ['/schedule', schedule], ['/schedule/exams', exams], ['/grades', grades],
  ['/grades/ranking', ranking], ['/teachers', teachers], ['/requests', requests],
  ['/support', support], ['/notifications', notifications], ['/profile', profile],
]);
let snapshot;
let busy = false;

async function api(path, method = 'GET', body) {
  const response = await fetch(path, {
    method, headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => {
    throw new Error('Нет связи с кабинетом. Проверьте подключение и попробуйте ещё раз.');
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(typeof data.error === 'string' ? data.error : 'Не удалось связаться с кабинетом. Попробуйте ещё раз.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function announce(message) {
  announcement.textContent = message;
}

function signIn() {
  document.title = 'Вход в кабинет · Altioris';
  app.innerHTML = `<main id="main" class="sign-in" tabindex="-1"><section class="sign-in-panel">
    <div class="sign-in-content">${brand}<h1>Вход в кабинет</h1>
    <form data-mutation="login" class="login-form">
      <label for="username">Логин</label><input id="username" name="login" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="80" required>
      <label for="password">Пароль</label><div class="password-control"><input id="password" type="password" name="password" autocomplete="current-password" maxlength="128" required><button class="icon-button" type="button" data-password aria-label="Показать пароль" aria-pressed="false">${icon('eye')}</button></div>
      <p class="form-error" role="alert" hidden></p><button class="button">Войти</button>
    </form><button class="text-link help-link" type="button" data-dialog="login-help">Не получается войти?</button>
    </div><footer>Конкурсный прототип</footer>
  </section><img class="sign-in-photo" src="/assets/reading-room.webp" width="863" height="819" alt="Читальный зал в тёплом свете"></main>
  <dialog id="login-help" aria-labelledby="login-help-title"><div class="section-heading"><h2 id="login-help-title">Не получается войти?</h2><button type="button" class="icon-button" data-close aria-label="Закрыть">${icon('close')}</button></div>
  <p>Для входа нужен демонстрационный аккаунт. Если у вас ещё нет логина и пароля, обратитесь к организатору демонстрации.</p></dialog>`;
}

function render(focus = false) {
  if (!snapshot) {
    signIn();
    if (focus) document.querySelector('#username').focus();
    return;
  }
  const { pathname, search, hash } = location;
  const params = new URLSearchParams(search);
  const active = href => href === '/' ? pathname === '/' || pathname.startsWith('/news/') : pathname === href || pathname.startsWith(href + '/');
  const unread = snapshot.notifications.filter(item => !item.read).length;
  const nav = navigation.map(([href, name]) => `<a href="${href}"${active(href) ? ' aria-current="page"' : ''}>${name}</a>`).join('');
  const content = pathname.startsWith('/news/') ? news(pathname) : (pages.get(pathname) || (() => '<h1>Страница не найдена</h1><a class="text-link" href="/">Вернуться на главную</a>'))(snapshot, params);
  app.innerHTML = `<header class="topbar"><div class="topbar-inner">
    <a class="brand-link" href="/" aria-label="Altioris · Главная">${brand}</a>
    <nav class="main-nav" aria-label="Основное меню">${nav}</nav>
    <div class="utilities"><button class="icon-button menu-toggle" type="button" data-menu aria-expanded="false" aria-controls="mobile-nav" aria-label="Открыть меню">${icon('menu')}</button>
      <a class="icon-button bell" href="/notifications" aria-label="Уведомления${unread ? `, новых: ${unread}` : ''}"${pathname === '/notifications' ? ' aria-current="page"' : ''}>${icon('bell')}${unread ? '<span aria-hidden="true"></span>' : ''}</a>
      <a class="profile-link" href="/profile" aria-label="Мой профиль"${pathname === '/profile' ? ' aria-current="page"' : ''}>${e(snapshot.student.initials)}</a>
    </div></div><nav id="mobile-nav" class="mobile-nav" aria-label="Основное меню" hidden>${nav}</nav></header>
    <main id="main" class="page" tabindex="-1">${content}</main><footer class="page-footer">Конкурсный прототип</footer>`;
  document.title = `${document.querySelector('h1')?.textContent || 'Кабинет'} · Altioris`;
  const autoDialog = app.querySelector('[data-auto-open]');
  if (autoDialog) autoDialog.showModal();
  else if (focus) {
    const target = hash === '#news-heading' ? document.getElementById('news-heading') : null;
    if (target) {
      target.tabIndex = -1;
      target.focus();
    } else {
      document.getElementById('main').focus({ preventScroll: true });
    }
  }
  const chat = app.querySelector('.chat-history');
  if (chat && snapshot.support.length) chat.scrollTop = chat.scrollHeight;
}

function go(href) {
  const next = new URL(href, location.href);
  const samePage = location.pathname === next.pathname;
  history.pushState(null, '', next);
  if (!samePage) window.scrollTo(0, 0);
  render(!samePage);
  if (samePage && !app.querySelector('dialog[open]')) {
    const matchingLink = [...app.querySelectorAll('main a[href]')].find(link => link.href === next.href);
    (matchingLink || document.getElementById('main')).focus({ preventScroll: true });
  }
}

async function load() {
  try {
    snapshot = await api('/api/dashboard');
    render();
  } catch (error) {
    if (error.status === 401) {
      snapshot = undefined;
      render();
    }
    else app.innerHTML = `<main id="main" tabindex="-1" class="page"><h1>Кабинет недоступен</h1><p>${e(error.message)}</p><button class="button" data-retry>Повторить</button></main>`;
  }
}

const mutations = {
  login: ['/api/login', 'POST'], request: ['/api/requests', 'POST'],
  avatar: ['/api/profile', 'PATCH'], message: ['/api/support', 'POST'],
  support: ['/api/support', 'POST'], read: ['/api/notifications', 'PATCH'],
  logout: ['/api/logout', 'POST'],
};

async function save(name, body, control, errorBox) {
  if (busy) return;
  busy = true;
  if (control) control.disabled = true;
  if (errorBox) errorBox.hidden = true;
  try {
    const [path, method] = mutations[name];
    const result = await api(path, method, body);
    if (name === 'logout') {
      snapshot = undefined;
      history.replaceState(null, '', '/');
      render(true);
      return;
    }
    snapshot = await api('/api/dashboard');
    if (name === 'request') {
      const id = result.request?.id ?? result.id ?? snapshot.requests[0]?.id;
      const url = id ? `/requests?item=${encodeURIComponent(id)}` : '/requests';
      history.replaceState(null, '', url);
    }
    render(name === 'login' || name === 'request' || name === 'avatar');
    if (name === 'message') app.querySelector('#chat-message')?.focus();
    if (name === 'avatar') app.querySelector('[data-dialog="avatar-dialog"]')?.focus();
    const confirmations = {
      request: 'Заявка подана', avatar: 'Фото профиля сохранено', read: 'Уведомления обновлены',
      support: 'Помощник ответил', message: 'Помощник ответил',
    };
    if (confirmations[name]) announce(confirmations[name]);
  } catch (error) {
    if (error.status === 401 && name !== 'login') {
      snapshot = undefined;
      render(true);
      announce('Сеанс завершён. Войдите снова.');
    } else if (errorBox) {
      errorBox.hidden = false;
      errorBox.textContent = error.message;
    } else {
      const previous = app.querySelector('.action-error');
      previous?.remove();
      const banner = document.createElement('p');
      banner.className = 'form-error action-error';
      banner.setAttribute('role', 'alert');
      banner.textContent = error.message;
      document.getElementById('main')?.prepend(banner);
    }
  } finally {
    if (control) control.disabled = false;
    busy = false;
  }
}

app.addEventListener('submit', event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const fields = new FormData(form);
  const kind = form.dataset.mutation;
  if (!kind) {
    const query = new URLSearchParams(fields);
    for (const [name, value] of query) if (!value) query.delete(name);
    go(`${new URL(form.action).pathname}${query.size ? '?' + query : ''}`);
    app.querySelector('.filters input[type="search"]')?.focus();
    return;
  }
  const body = Object.fromEntries(fields);
  if (kind === 'message') body.action = 'message';
  void save(kind, body, event.submitter, form.querySelector('.form-error'));
});

app.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button) {
    if (button.hasAttribute('data-password')) {
      const input = document.querySelector('#password');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
    }
    if (button.dataset.dialog) document.getElementById(button.dataset.dialog)?.showModal();
    if (button.hasAttribute('data-close')) button.closest('dialog')?.close();
    if (button.hasAttribute('data-retry')) void load();
    if (button.hasAttribute('data-menu')) {
      const menu = document.getElementById('mobile-nav');
      menu.hidden = !menu.hidden;
      button.setAttribute('aria-expanded', String(!menu.hidden));
      button.setAttribute('aria-label', menu.hidden ? 'Открыть меню' : 'Закрыть меню');
    }
    if (button.hasAttribute('data-logout')) void save('logout', undefined, button);
    if (button.hasAttribute('data-read-all')) void save('read', { all: true }, button);
    if (button.dataset.read) void save('read', { id: button.dataset.read }, button);
    if (button.dataset.support) void save('support', { action: button.dataset.support }, button);
    return;
  }
  const link = event.target.closest('a[href]');
  if (!link || !snapshot || event.defaultPrevented || event.button || event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) return;
  const url = new URL(link.href);
  if (url.origin === location.origin && !url.pathname.startsWith('/api/') && !link.hasAttribute('download')) {
    event.preventDefault();
    go(link.href);
  }
});

app.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const toggle = app.querySelector('[data-menu][aria-expanded="true"]');
  if (toggle) {
    toggle.click();
    toggle.focus();
  }
});

window.addEventListener('popstate', () => render());
window.addEventListener('pageshow', event => {
  if (event.persisted) void load();
});
void load();
