import { createHash, randomBytes, randomUUID, scrypt, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { promisify } from 'node:util'
import { accounts, requestTypes, sessionSeasons, teachers } from './fixtures.mjs'
import { academicDateTime, academicNotices, academicTimeRange, moscowDay } from './academic-year.mjs'
import { profileDocumentsFor } from './profile-documents.mjs'
import { campusWithChanges, gradesWithChanges, rankingWithChanges } from './academic-events.mjs'
import { openAcademicQueue } from './academic-queue.mjs'

const derive = promisify(scrypt)
export const sessionLifetime = 60 * 60 * 12
const digest = (token) => createHash('sha256').update(token).digest('hex')

function migrate(db) {
  const { user_version: version } = db.prepare('PRAGMA user_version').get()
  if (version > 5) throw new Error('Unsupported database schema')
  if (version === 5) return
  if (version === 4) {
    db.exec(`BEGIN IMMEDIATE;
      DELETE FROM notifications WHERE type='Заявка' OR href='/requests' OR href LIKE '/requests?%';
      PRAGMA user_version = 5;
      COMMIT;`)
    return
  }
  if (version === 3) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS academic_events (
        id TEXT PRIMARY KEY, due_at INTEGER NOT NULL, payload TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','published','rejected')),
        effect TEXT, published_no INTEGER UNIQUE, reason TEXT
      );
      CREATE INDEX IF NOT EXISTS academic_events_due ON academic_events(state,due_at,id);
      CREATE INDEX IF NOT EXISTS notifications_owner ON notifications(owner);
      PRAGMA user_version = 4;
      COMMIT;`)
    migrate(db)
    return
  }
  if (version === 2) {
    // Previous releases reserved these exact owner/id pairs for fixtures.
    db.exec(`BEGIN IMMEDIATE;
      DELETE FROM request_history WHERE (owner='a' AND request_id IN ('020','024','025')) OR (owner='b' AND request_id='026');
      DELETE FROM requests WHERE (owner='a' AND id IN ('020','024','025')) OR (owner='b' AND id='026');
      DELETE FROM documents WHERE ((owner='a' AND id IN ('a-certificate','a-grades')) OR (owner='b' AND id IN ('b-certificate','b-grades')))
        AND NOT EXISTS (SELECT 1 FROM requests WHERE requests.owner=documents.owner AND document_id=documents.id);
      DELETE FROM notifications WHERE (owner='a' AND id IN ('a-report','a-change','a-consult','a-ready','a-signal'))
        OR (owner='b' AND id IN ('b-ready','b-change','b-signal'));
      PRAGMA user_version = 3;
      COMMIT;`)
    migrate(db)
    return
  }
  if (version === 1) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE profile_images (
        owner TEXT PRIMARY KEY REFERENCES accounts(id),
        data BLOB NOT NULL,
        revision TEXT NOT NULL
      );
      PRAGMA user_version = 2;
      COMMIT;`)
    migrate(db)
    return
  }

  db.exec(`
    BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      login TEXT UNIQUE NOT NULL,
      salt BLOB NOT NULL,
      password_hash BLOB NOT NULL,
      avatar TEXT NOT NULL DEFAULT 'initials' CHECK (avatar IN ('portrait', 'initials'))
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
  migrate(db)
}

export function openStore({ databasePath, passwords, clock, simulation = false }) {
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
    const insertAcademicNotice = db.prepare(`INSERT INTO notifications (id, owner, title, type, body, created_at, href, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(owner,id) DO NOTHING`)
    const selectNotifications = db.prepare(`SELECT id, title, type, body, created_at AS at, href, is_read AS read
      FROM notifications WHERE owner = ? ORDER BY julianday(created_at) DESC, rowid DESC`)
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

    transaction(() => {
      for (const account of accounts) {
        const password = passwords[account.id]
        if (password === undefined) {
          removeSessions.run(account.id)
          continue
        }
        const prior = selectAccount.get(account.login)
        if (prior && timingSafeEqual(scryptSync(password, prior.salt, 64), prior.password_hash)) continue

        const salt = randomBytes(16)
        const hash = scryptSync(password, salt, 64)
        if (prior) {
          updatePassword.run(salt, hash, account.id)
          removeSessions.run(account.id)
        } else {
          insertAccount.run(account.id, account.login, salt, hash)
        }
      }
    })

    const cohort=accounts.filter(({id})=>passwords[id]!==undefined)
    const academic=openAcademicQueue(db,{clock,cohort,transaction,recordNotice:(...args)=>insertAcademicNotice.run(...args),simulation})
    const campusView=(owner,at=clock(),changes=academic.changes())=>campusWithChanges(owner,at,changes)
    const gradeView=(owner,at=clock(),changes=academic.changes())=>gradesWithChanges(accounts.find(account=>account.id===owner),at,changes)
    const rankingView=(owner,at,changes,grades)=>rankingWithChanges(accounts.find(account=>account.id===owner),at,cohort,changes,grades)
    const noticeVersion=db.prepare('SELECT count(*) AS total, coalesce(sum(is_read),0) AS read, coalesce(max(rowid),0) AS newest FROM notifications WHERE owner=?')
    const existingNotice=db.prepare('SELECT 1 FROM notifications WHERE owner=? AND id=?')
    function inboxRevision(owner){
      const {total,read,newest}=noticeVersion.get(owner)
      return total+':'+read+':'+newest
    }

    const dummySalt = randomBytes(16)
    const dummyHash = randomBytes(64)
    const saveSession = db.prepare('INSERT INTO sessions (token_hash, owner, expires_at) VALUES (?, ?, ?)')
    const getSession = db.prepare('SELECT owner, expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?')
    const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?')
    const expireSessions = db.prepare('DELETE FROM sessions WHERE expires_at <= ?')

    function profile(owner) {
      const account = accounts.find(({ id }) => id === owner)
      const image = db.prepare('SELECT revision FROM profile_images WHERE owner = ?').get(owner)
      const expiresOn = `${account.profile.admissionYear + 4}-06-30`
      return { ...account.profile, avatar: image ? 'custom' : 'initials',
        campusPass: {
          photoUrl: `/assets/student-${account.login}.webp`,
          qrUrl: `/assets/pass-qr/${account.profile.number}.png`,
          expiresOn,
          active: moscowDay(clock()) <= expiresOn,
        },
        ...(image ? { avatarUrl: '/api/profile/avatar?v=' + image.revision } : {}) }
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
      const documentId = ['certificate','transcript'].includes(type) ? randomUUID() : null
      const status = documentId ? 'Готова' : 'На рассмотрении'
      return transaction(() => {
        if (documentId) insertDocument.run(documentId, owner, title, createdAt)
        insertRequest.run(id, owner, type, title, status, createdAt, documentId)
        insertHistory.run(id, owner, createdAt, 'Заявка принята')
        if (documentId) insertHistory.run(id, owner, createdAt, 'Учебный образец PDF готов')
        return { id, type, title, status, createdAt, documentId }
      })
    }

    function addSupport(owner, action, input) {
      academic.tick()
      const at = clock()
      const labels = {
        certificate: 'Заказать справку',
        status: 'Проверить заявку',
        faq: 'Найти ответ',
        specialist: 'Написать специалисту',
      }
      const message = action === 'message' ? input : labels[action]
      const query = String(input ?? '').toLocaleLowerCase('ru')
      const namedTeacher = teachers.find((teacher) => query.includes(teacher.shortName.split(' ').at(-1).toLocaleLowerCase('ru').slice(0, -1)))
      if (action === 'message') {
        if (/статус|провер.*заяв|готов.*справ|заявк.*[0-9a-f]{3}/u.test(query)) action = 'status'
        else if (/справк|документ|выписк/u.test(query)) action = 'certificate'
        else if (/зач[её]тк/u.test(query)) action = 'gradebook'
        else if (namedTeacher) action = 'teacher'
        else if (/оценк|рейтинг|успеваем|gpa|средний балл/u.test(query)) action = 'grades'
        else if (/расписан|заняти|экзамен|сесси|онлайн|подключ|пары|семинар|лекци/u.test(query)) action = 'schedule'
        else if (/оператор|специалист|сотрудник/u.test(query)) action = 'specialist'
        else if (/привет|здравств|добрый/u.test(query)) action = 'greeting'
      }
      let text
      let href = null
      if (action === 'certificate') {
        const transcript = /выписк|зач[её]тк/u.test(query)
        text = 'Откройте раздел «Заявки» и выберите «'+requestTypes.get(transcript?'transcript':'certificate')+'». Учебный PDF появится сразу после подачи.'
        href = '/requests?new='+(transcript?'transcript':'certificate')
      } else if (action === 'status') {
        const owned = requests(owner)
        const request = owned.find((item) => query.includes(item.id.toLocaleLowerCase('ru'))) ??
          (/справк/u.test(query) ? owned.find((item) => item.type === 'certificate') : null) ?? owned[0]
        text = request ? `${request.title} · ${request.status}. Откройте карточку, чтобы увидеть историю${request.documentId ? ' и скачать PDF' : ''}.` : 'У вас пока нет заявок. Создайте первую в разделе «Заявки».'
        href = request ? `/requests?item=${request.id}` : '/requests'
      } else if (action === 'grades') {
        const stats = rankingView(owner,at,academic.changes())
        const format = (value) => value == null ? '—' : value.toFixed(2).replace('.', ',')
        text = stats.rank===null ? 'Рейтинг появится после завершения первой сессии.' :
          `${stats.label}. Ваш средний балл — ${format(stats.mean)}, GPA — ${format(stats.gpa)}. Место в рейтинге: ${stats.rank} из ${stats.total}. Подробные результаты доступны в разделе «Успеваемость».`
        href = '/grades/ranking'
      } else if (action === 'gradebook') {
        text = 'В зачётке можно выбрать учебный год или семестр, посмотреть опубликованные результаты и зачётные единицы. Выписку в PDF можно заказать в разделе «Заявки».'
        href = '/grades'
      } else if (action === 'teacher') {
        text = `${namedTeacher.name}. ${namedTeacher.subject}. Консультации: ${namedTeacher.consultation}. Кабинет: ${namedTeacher.office}. Учебная почта: ${namedTeacher.email}.`
        href = `/teachers?item=${namedTeacher.id}`
      } else if (action === 'schedule') {
        if (/онлайн|подключ/u.test(query)) {
          text = 'Выберите занятие в расписании: в его карточке указан формат. Онлайн-занятие отмечено значком ноутбука. В демонстрационном портале видеоконференции не подключены.'
          const next = campusView(owner, at).lessons.find(lesson=>lesson.format==='online'&&Date.parse(lesson.start)>=Date.parse(at))
          href = next ? '/schedule?lesson='+next.id : '/schedule'
        } else if (/экзамен|сесси|зач[её]т|контрол/u.test(query)) {
          const next = campusView(owner, at).exams.find(item=>Date.parse(item.start)>=Date.parse(at))
          text = next ? `Ближайший контроль: ${next.title}, ${academicDateTime(next.start,next.end)}. ${next.room}. Остальные даты есть в разделе экзаменов.` : 'Назначенных экзаменов пока нет. Учебный офис опубликует их в расписании.'
          href = next ? '/schedule/exams?item='+next.id : '/schedule/exams'
        } else {
          const day = moscowDay(at)
          const lessons = campusView(owner, at).lessons.filter((item) => moscowDay(item.start) === day)
          text = lessons.length ? 'Сегодня в расписании:\n' + lessons.map((item) => `${academicTimeRange(item.start,item.end)} · ${item.title} · ${item.room}`).join('\n') : 'Сегодня занятий нет. Даты других занятий можно посмотреть в расписании.'
          href = '/schedule'
        }
      } else if (action === 'greeting') {
        text = 'Здравствуйте! Помогу со справками, статусом заявки, расписанием, оценками и информацией о преподавателях. Напишите вопрос или выберите быстрое действие.'
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

    function publishScheduledNotices(owner,campus,grades){
      const due = academicNotices(campus, grades)
      const now=Date.parse(campus.clock)
      const season=sessionSeasons.findLast(item=>Date.parse(item.publishedAt)<=now&&now-Date.parse(item.publishedAt)<7*86_400_000)
      if(season&&!existingNotice.get(owner,'season-'+season.id)){
        const standing=rankingView(owner,campus.clock,academic.changes(),grades).seasons.find(item=>item.id===season.id)
        if(standing?.rank)due.push({id:'season-'+season.id,title:'Опубликован рейтинг · '+season.label,type:'Рейтинг',
          body:'Ваше место — '+standing.rank+' из '+standing.total,at:season.publishedAt,href:'/grades/ranking?season='+season.id})
      }
      const pending=due.filter(item=>!existingNotice.get(owner,item.id))
      if (pending.length) transaction(()=>{
        for (const item of pending) insertAcademicNotice.run(item.id,owner,item.title,item.type,item.body,item.at,item.href)
      })
    }

    function notifications(owner){
      academic.tick()
      const campus=campusView(owner)
      publishScheduledNotices(owner,campus,gradeView(owner,campus.clock))
      return selectNotifications.all(owner).map(notice=>({...notice,read:Boolean(notice.read)}))
    }

    return {
      close: () => db.close(),
      profile,
      campus(owner){academic.tick();return campusView(owner)},
      grades:gradeView,
      enqueueAcademicEvent:academic.enqueue,
      academicEvents:academic.list,
      advanceAcademicEvents(publishReminders=false){
        academic.tick()
        if(publishReminders){
          const at=clock(),changes=academic.changes()
          for(const account of cohort)publishScheduledNotices(account.id,campusView(account.id,at,changes),gradeView(account.id,at,changes))
        }
      },
      noticeVersion:inboxRevision,
      notifications,
      async authenticate(login, password) {
        const account = selectAccount.get(login)
        const attempt = await derive(password, account?.salt ?? dummySalt, 64)
        return timingSafeEqual(attempt, account?.password_hash ?? dummyHash) && account && passwords[account.id] !== undefined ? account.id : null
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
        academic.tick()
        const account=accounts.find(account=>account.id===owner)
        const at=clock(),changes=academic.changes()
        const campus=campusView(owner,at,changes),grades=gradeView(owner,at,changes)
        publishScheduledNotices(owner,campus,grades)
        const documents = db.prepare(`
          SELECT id, title, created_at AS createdAt FROM documents WHERE owner = ? ORDER BY julianday(created_at) DESC, rowid DESC
        `).all(owner)
        const support = db.prepare(`
          SELECT id, role, text, created_at AS at, href FROM (
            SELECT id, role, text, created_at, href FROM support WHERE owner = ? ORDER BY id DESC LIMIT 100
          ) ORDER BY id
        `).all(owner)
        return {
          student: profile(owner), campus, grades, requestTypes:[...requestTypes],
          ranking: rankingView(owner,at,changes,grades),liveRevision:inboxRevision(owner),
          requests: requests(owner), documents, profileDocuments:profileDocumentsFor(account),
          notifications:selectNotifications.all(owner).map(notice=>({...notice,read:Boolean(notice.read)})), support,
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
      removeAvatarImage(owner) {
        db.prepare('DELETE FROM profile_images WHERE owner = ?').run(owner)
      },
      avatarImage: (owner) => db.prepare('SELECT data FROM profile_images WHERE owner = ?').get(owner)?.data,
      saveAvatarImage(owner, data) {
        db.prepare('INSERT INTO profile_images (owner, data, revision) VALUES (?, ?, ?) ON CONFLICT(owner) DO UPDATE SET data = excluded.data, revision = excluded.revision').run(owner, data, digest(data))
      },
      addSupport,
    }
  } catch (error) {
    db.close()
    throw error
  }
}

