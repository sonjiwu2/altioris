import { createHash, randomBytes, randomUUID, scrypt, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { promisify } from 'node:util'
import { accounts, baselines, campusFor, gradesFor, rankingFor, requestTypes } from './fixtures.mjs'

const derive = promisify(scrypt)
export const sessionLifetime = 60 * 60 * 12
const digest = (token) => createHash('sha256').update(token).digest('hex')

function migrate(db) {
  const { user_version: version } = db.prepare('PRAGMA user_version').get()
  if (version > 1) throw new Error('Unsupported database schema')
  if (version === 1) return

  db.exec(`
    BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      login TEXT UNIQUE NOT NULL,
      salt BLOB NOT NULL,
      password_hash BLOB NOT NULL,
      avatar TEXT NOT NULL DEFAULT 'portrait' CHECK (avatar IN ('portrait', 'initials'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      owner TEXT NOT NULL REFERENCES accounts(id),
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT NOT NULL,
      owner TEXT NOT NULL REFERENCES accounts(id),
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (owner, id)
    );
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT NOT NULL,
      owner TEXT NOT NULL REFERENCES accounts(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      document_id TEXT,
      PRIMARY KEY (owner, id),
      FOREIGN KEY (owner, document_id) REFERENCES documents(owner, id)
    );
    CREATE TABLE IF NOT EXISTS request_history (
      event_no INTEGER PRIMARY KEY,
      request_id TEXT NOT NULL,
      owner TEXT NOT NULL,
      created_at TEXT NOT NULL,
      label TEXT NOT NULL,
      FOREIGN KEY (owner, request_id) REFERENCES requests(owner, id)
    );
    CREATE INDEX IF NOT EXISTS history_request ON request_history(owner, request_id, event_no);
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT NOT NULL,
      owner TEXT NOT NULL REFERENCES accounts(id),
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      href TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
      PRIMARY KEY (owner, id)
    );
    CREATE TABLE IF NOT EXISTS support (
      id INTEGER PRIMARY KEY,
      owner TEXT NOT NULL REFERENCES accounts(id),
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      href TEXT
    );
    CREATE INDEX IF NOT EXISTS support_owner ON support(owner, id);
    PRAGMA user_version = 1;
    COMMIT;
  `)
}

export function openStore({ databasePath, passwords, clock }) {
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 })
  const db = new DatabaseSync(databasePath)
  db.exec('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;')
  try {
    migrate(db)

    const selectAccount = db.prepare('SELECT id, salt, password_hash FROM accounts WHERE login = ?')
    const insertAccount = db.prepare('INSERT INTO accounts (id, login, salt, password_hash) VALUES (?, ?, ?, ?)')
    const updatePassword = db.prepare('UPDATE accounts SET salt = ?, password_hash = ? WHERE id = ?')
    const removeSessions = db.prepare('DELETE FROM sessions WHERE owner = ?')
    const insertDocument = db.prepare('INSERT INTO documents (id, owner, title, created_at) VALUES (?, ?, ?, ?)')
    const insertRequest = db.prepare('INSERT INTO requests (id, owner, type, title, status, created_at, document_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    const insertHistory = db.prepare('INSERT INTO request_history (request_id, owner, created_at, label) VALUES (?, ?, ?, ?)')
    const insertNotification = db.prepare('INSERT INTO notifications (id, owner, title, type, body, created_at, href, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    const insertMessage = db.prepare('INSERT INTO support (owner, role, text, created_at, href) VALUES (?, ?, ?, ?, ?)')

    function transaction(work) {
      db.exec('BEGIN IMMEDIATE')
      try {
        const result = work()
        db.exec('COMMIT')
        return result
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    }

    function seedAccount(account) {
      const owner = account.id
      const baseline = baselines[owner]
      for (const document of baseline.documents) {
        insertDocument.run(document.id, owner, document.title, document.createdAt)
      }
      for (const request of baseline.requests) {
        insertRequest.run(request.id, owner, request.type, request.title, request.status, request.createdAt, request.documentId)
        for (const event of [...request.history].reverse()) {
          insertHistory.run(request.id, owner, event.at, event.label)
        }
      }
      for (const notice of baseline.notifications) {
        insertNotification.run(notice.id, owner, notice.title, notice.type, notice.body, notice.at, notice.href, Number(notice.read))
      }
    }

    transaction(() => {
      for (const account of accounts) {
        const password = passwords[account.id]
        const prior = selectAccount.get(account.login)
        if (prior && timingSafeEqual(scryptSync(password, prior.salt, 64), prior.password_hash)) continue

        const salt = randomBytes(16)
        const hash = scryptSync(password, salt, 64)
        if (prior) {
          updatePassword.run(salt, hash, account.id)
          removeSessions.run(account.id)
        } else {
          insertAccount.run(account.id, account.login, salt, hash)
          seedAccount(account)
        }
      }
    })

    const dummySalt = randomBytes(16)
    const dummyHash = randomBytes(64)
    const saveSession = db.prepare('INSERT INTO sessions (token_hash, owner, expires_at) VALUES (?, ?, ?)')
    const getSession = db.prepare('SELECT owner, expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?')
    const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?')
    const expireSessions = db.prepare('DELETE FROM sessions WHERE expires_at <= ?')

    function profile(owner) {
      const account = accounts.find(({ id }) => id === owner)
      const { avatar } = db.prepare('SELECT avatar FROM accounts WHERE id = ?').get(owner)
      return { ...account.profile, avatar }
    }

    function requests(owner) {
      const rows = db.prepare(`
        SELECT id, type, title, status, created_at AS createdAt, document_id AS documentId
        FROM requests WHERE owner = ? ORDER BY julianday(created_at) DESC, rowid DESC
      `).all(owner)
      const events = db.prepare(`
        SELECT request_id AS requestId, created_at AS at, label
        FROM request_history WHERE owner = ? ORDER BY event_no DESC
      `).all(owner)
      return rows.map((row) => ({
        ...row,
        history: events.filter(({ requestId }) => requestId === row.id).map(({ at, label }) => ({ at, label })),
      }))
    }

    function createRequest(owner, type) {
      const id = randomUUID()
      const createdAt = clock()
      const title = requestTypes.get(type)
      const documentId = type === 'certificate' ? randomUUID() : null
      const status = documentId ? 'Готова' : 'На рассмотрении'
      return transaction(() => {
        if (documentId) insertDocument.run(documentId, owner, title, createdAt)
        insertRequest.run(id, owner, type, title, status, createdAt, documentId)
        insertHistory.run(id, owner, createdAt, 'Заявка принята')
        if (documentId) insertHistory.run(id, owner, createdAt, 'Учебный образец PDF готов')
        insertNotification.run(
          randomUUID(), owner, documentId ? 'Справка об обучении готова' : 'Новая заявка принята', 'Заявка',
          documentId ? 'Учебный образец доступен для скачивания.' : 'Статус заявки доступен в личном кабинете.',
          createdAt, `/requests?item=${id}`, 0,
        )
        return { id, type, title, status, createdAt, documentId }
      })
    }

    function addSupport(owner, action, input) {
      const at = clock()
      const labels = {
        certificate: 'Заказать справку',
        status: 'Проверить заявку',
        faq: 'Найти ответ',
        specialist: 'Написать специалисту',
      }
      const message = action === 'message' ? input : labels[action]
      let text
      let href = null
      if (action === 'certificate') {
        text = 'Откройте раздел «Заявки» и выберите «Справка об обучении». Учебный PDF появится сразу после подачи.'
        href = '/requests?new=certificate'
      } else if (action === 'status') {
        const request = db.prepare('SELECT id, title, status FROM requests WHERE owner = ? ORDER BY julianday(created_at) DESC, rowid DESC LIMIT 1').get(owner)
        text = request ? `${request.title} · ${request.status}` : 'У вас пока нет заявок.'
        href = request ? `/requests?item=${request.id}` : '/requests'
      } else if (action === 'faq') {
        text = 'В «Заявках» можно открыть историю и скачать справки. Расписание экзаменов доступно в разделе «Расписание».'
        href = '/schedule/exams'
      } else if (action === 'specialist') {
        text = 'В конкурсном прототипе специалист не получает сообщения. Здесь можно проверить статус заявки и найти информацию о документах.'
      } else {
        text = 'Я отвечаю на типовые вопросы. Выберите действие выше, чтобы проверить заявку, заказать справку или найти расписание.'
      }
      transaction(() => {
        insertMessage.run(owner, 'user', message, at, null)
        insertMessage.run(owner, 'assistant', text, at, href)
      })
    }

    return {
      close: () => db.close(),
      profile,
      campus: (owner) => campusFor(owner, clock()),
      async authenticate(login, password) {
        const account = selectAccount.get(login)
        const attempt = await derive(password, account?.salt ?? dummySalt, 64)
        return timingSafeEqual(attempt, account?.password_hash ?? dummyHash) && account ? account.id : null
      },
      issueSession(owner) {
        const raw = randomBytes(32).toString('base64url')
        expireSessions.run(Date.now())
        saveSession.run(digest(raw), owner, Date.now() + sessionLifetime * 1000)
        return raw
      },
      session: (token) => getSession.get(digest(token), Date.now()),
      revokeSession: (token) => deleteSession.run(digest(token)),
      dashboard(owner) {
        const account = accounts.find(({ id }) => id === owner)
        const grades = gradesFor(account)
        const notifications = db.prepare(`
          SELECT id, title, type, body, created_at AS at, href, is_read AS read
          FROM notifications WHERE owner = ? ORDER BY julianday(created_at) DESC, rowid DESC
        `).all(owner).map((notice) => ({ ...notice, read: Boolean(notice.read) }))
        const documents = db.prepare(`
          SELECT id, title, created_at AS createdAt FROM documents WHERE owner = ? ORDER BY julianday(created_at) DESC, rowid DESC
        `).all(owner)
        const support = db.prepare(`
          SELECT id, role, text, created_at AS at, href FROM (
            SELECT id, role, text, created_at, href FROM support WHERE owner = ? ORDER BY id DESC LIMIT 100
          ) ORDER BY id
        `).all(owner)
        return {
          student: profile(owner), campus: campusFor(owner, clock()), grades, ranking: rankingFor(account, grades),
          requests: requests(owner), documents, notifications, support,
        }
      },
      document(owner, id) {
        return db.prepare('SELECT id, title, created_at AS createdAt FROM documents WHERE owner = ? AND id = ?').get(owner, id)
      },
      createRequest,
      markNotification(owner, id) {
        return db.prepare('UPDATE notifications SET is_read = 1 WHERE owner = ? AND id = ?').run(owner, id).changes > 0
      },
      readAllNotifications(owner) {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE owner = ? AND is_read = 0').run(owner)
      },
      setAvatar(owner, avatar) {
        db.prepare('UPDATE accounts SET avatar = ? WHERE id = ?').run(avatar, owner)
      },
      addSupport,
    }
  } catch (error) {
    db.close()
    throw error
  }
}

