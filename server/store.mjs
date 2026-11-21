import { createHash, randomBytes, randomUUID, scrypt, scryptSync, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { promisify } from 'node:util'
import { accounts, requestTypes, sessionSeasons } from './fixtures.mjs'
import { academicNotices, moscowDay } from './academic-year.mjs'
import { profileDocumentsFor } from './profile-documents.mjs'
import { campusWithChanges, gradesWithChanges, rankingWithChanges } from './academic-events.mjs'
import { openAcademicQueue } from './academic-queue.mjs'
import { openRequestQueue } from './request-queue.mjs'
import { studentPdf } from './pdf.mjs'
import { answerSupport, supportActions } from './support-assistant.mjs'

const derive = promisify(scrypt)
export const sessionLifetime = 60 * 60 * 12
const digest = (token) => createHash('sha256').update(token).digest('hex')

function migrate(db) {
  const { user_version: version } = db.prepare('PRAGMA user_version').get()
  if (version > 7) throw new Error('Unsupported database schema')
  if (version === 7) return
  if (version === 6) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS support_context (
        owner TEXT PRIMARY KEY REFERENCES accounts(id), state TEXT NOT NULL
      );
      PRAGMA user_version = 7;
      COMMIT;`)
    return
  }
  if (version === 5) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS request_jobs (
        owner TEXT NOT NULL, request_id TEXT NOT NULL,
        started_at INTEGER NOT NULL, next_at INTEGER NOT NULL,
        stage INTEGER NOT NULL CHECK (stage BETWEEN 0 AND 2), failures INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY(owner,request_id), FOREIGN KEY(owner,request_id) REFERENCES requests(owner,id)
      );
      CREATE INDEX IF NOT EXISTS request_jobs_next ON request_jobs(next_at);
      CREATE TABLE IF NOT EXISTS document_files (
        owner TEXT NOT NULL, document_id TEXT NOT NULL, pdf BLOB NOT NULL,
        PRIMARY KEY(owner,document_id), FOREIGN KEY(owner,document_id) REFERENCES documents(owner,id)
      );
      PRAGMA user_version = 6;
      COMMIT;`)
    migrate(db)
    return
  }
  if (version === 4) {
    db.exec(`BEGIN IMMEDIATE;
      DELETE FROM notifications WHERE (type='Заявка' OR href='/requests' OR href LIKE '/requests?%') AND id NOT LIKE 'request-ready-%';
      PRAGMA user_version = 5;
      COMMIT;`)
    migrate(db)
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
  if (passwords === null && !existsSync(databasePath)) {
    throw new Error('SQLite authentication requires an existing database with all demo accounts.')
  }
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 })
  const db = new DatabaseSync(databasePath)
  try {
    db.exec('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;')
    migrate(db)

    const selectAccount = db.prepare('SELECT id, salt, password_hash FROM accounts WHERE login = ?')
    const insertAccount = db.prepare('INSERT INTO accounts (id, login, salt, password_hash) VALUES (?, ?, ?, ?)')
    const updatePassword = db.prepare('UPDATE accounts SET salt = ?, password_hash = ? WHERE id = ?')
    const removeSessions = db.prepare('DELETE FROM sessions WHERE owner = ?')
    const insertDocument = db.prepare('INSERT INTO documents (id, owner, title, created_at) VALUES (?, ?, ?, ?)')
    const insertDocumentFile = db.prepare('INSERT INTO document_files (owner,document_id,pdf) VALUES (?,?,?)')
    const insertRequest = db.prepare('INSERT INTO requests (id, owner, type, title, status, created_at, document_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    const insertHistory = db.prepare('INSERT INTO request_history (request_id, owner, created_at, label) VALUES (?, ?, ?, ?)')
    const insertAcademicNotice = db.prepare(`INSERT INTO notifications (id, owner, title, type, body, created_at, href, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(owner,id) DO NOTHING`)
    const selectNotifications = db.prepare(`SELECT id, title, type, body, created_at AS at, href, is_read AS read
      FROM notifications WHERE owner = ? ORDER BY julianday(created_at) DESC, rowid DESC`)
    const insertMessage = db.prepare('INSERT INTO support (owner, role, text, created_at, href) VALUES (?, ?, ?, ?, ?)')
    const selectSupport = db.prepare(`
      SELECT id, role, text, created_at AS at, href FROM (
        SELECT id, role, text, created_at, href FROM support WHERE owner = ? ORDER BY id DESC LIMIT 100
      ) ORDER BY id
    `)
    const readSupportContext = db.prepare('SELECT state FROM support_context WHERE owner=?')
    const saveSupportContext = db.prepare('INSERT INTO support_context (owner,state) VALUES (?,?) ON CONFLICT(owner) DO UPDATE SET state=excluded.state')
    const clearSupportContext = db.prepare('DELETE FROM support_context WHERE owner=?')

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

    if (passwords === null) {
      for (const { id, login } of accounts) {
        const stored = selectAccount.get(login)
        if (stored?.id !== id || !(stored.salt instanceof Uint8Array) || stored.salt.length !== 16 ||
            !(stored.password_hash instanceof Uint8Array) || stored.password_hash.length !== 64) {
          throw new Error('SQLite authentication requires a valid password hash for every fixed demo account.')
        }
      }
    } else {
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
    }

    const cohort = passwords === null ? accounts : accounts.filter(({ id }) => passwords[id] !== undefined)
    const enabledIds = new Set(cohort.map(({ id }) => id))
    const academic=openAcademicQueue(db,{clock,cohort,transaction,recordNotice:(...args)=>insertAcademicNotice.run(...args),simulation})
    const campusView=(owner,at=clock(),changes=academic.changes())=>campusWithChanges(owner,at,changes)
    const gradeView=(owner,at=clock(),changes=academic.changes())=>gradesWithChanges(accounts.find(account=>account.id===owner),at,changes)
    const rankingView=(owner,at,changes,grades)=>rankingWithChanges(accounts.find(account=>account.id===owner),at,cohort,changes,grades)
    const noticeVersion=db.prepare('SELECT count(*) AS total, coalesce(sum(is_read),0) AS read, coalesce(max(rowid),0) AS newest FROM notifications WHERE owner=?')
    const existingNotice=db.prepare('SELECT 1 FROM notifications WHERE owner=? AND id=?')
    const historyVersion=db.prepare('SELECT coalesce(max(event_no),0) AS version FROM request_history WHERE owner=?')
    const supportVersion=db.prepare('SELECT id FROM support WHERE owner=? ORDER BY id DESC LIMIT 1')
    const requestQueue=openRequestQueue(db,{clock,transaction,history:insertHistory,notify:insertAcademicNotice,issueDocument(job,at){
      const account=accounts.find(account=>account.id===job.owner)
      const document={id:randomUUID(),type:job.type,title:job.title,createdAt:at,requestId:job.id,requestedAt:job.createdAt}
      const pdf=studentPdf(document,account.profile,account,gradeView(job.owner,at))
      insertDocument.run(document.id,job.owner,document.title,at)
      insertDocumentFile.run(job.owner,document.id,pdf)
      return document.id
    }})
    function inboxRevision(owner){
      const {total,read,newest}=noticeVersion.get(owner)
      return total+':'+read+':'+newest+':'+historyVersion.get(owner).version+':'+(supportVersion.get(owner)?.id??0)
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

    function createRequest(owner, type, id = randomUUID()) {
      const createdAt = new Date(clock()).toISOString()
      const title = requestTypes.get(type)
      return transaction(() => {
        const prior = db.prepare('SELECT id,type,title,status,created_at AS createdAt,document_id AS documentId FROM requests WHERE owner=? AND id=?').get(owner,id)
        if (prior) return prior.type===type ? prior : null
        const status = 'Отправлена'
        insertRequest.run(id, owner, type, title, status, createdAt, null)
        insertHistory.run(id, owner, createdAt, 'Заявка отправлена')
        requestQueue.schedule(owner,id,createdAt)
        return { id, type, title, status, createdAt, documentId:null }
      })
    }

    function addSupport(owner, action, input) {
      academic.tick()
      requestQueue.tick()
      const at = new Date(clock()).toISOString()
      return transaction(() => {
        const changes=academic.changes()
        const prior=readSupportContext.get(owner)
        const result=answerSupport(action,input,{
          student:profile(owner), at, campus:campusView(owner,at,changes), grades:gradeView(owner,at,changes),
          requests:requests(owner), notifications:selectNotifications.all(owner),
          ranking:()=>rankingView(owner,at,changes),
        },prior?JSON.parse(prior.state):null)
        insertMessage.run(owner,'user',action==='message'?input:supportActions.get(action),at,null)
        insertMessage.run(owner,'assistant',result.text,at,result.href)
        if(result.context)saveSupportContext.run(owner,JSON.stringify(result.context))
        else if(!/^(?:спасибо|благодарю|спс|понял)[.!\s]*$/iu.test(String(input)))clearSupportContext.run(owner)
        return selectSupport.all(owner)
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
      advanceRequests:requestQueue.tick,
      noticeVersion:inboxRevision,
      notifications,
      async authenticate(login, password) {
        const account = selectAccount.get(login)
        const attempt = await derive(password, account?.salt ?? dummySalt, 64)
        return timingSafeEqual(attempt, account?.password_hash ?? dummyHash) && account && enabledIds.has(account.id) ? account.id : null
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
        requestQueue.tick()
        const account=accounts.find(account=>account.id===owner)
        const at=clock(),changes=academic.changes()
        const campus=campusView(owner,at,changes),grades=gradeView(owner,at,changes)
        publishScheduledNotices(owner,campus,grades)
        const documents = db.prepare(`
          SELECT id, title, created_at AS createdAt FROM documents WHERE owner = ? ORDER BY julianday(created_at) DESC, rowid DESC
        `).all(owner)
        return {
          student: profile(owner), campus, grades, requestTypes:[...requestTypes],
          ranking: rankingView(owner,at,changes,grades),liveRevision:inboxRevision(owner),
          requests: requests(owner), documents, profileDocuments:profileDocumentsFor(account),
          notifications:selectNotifications.all(owner).map(notice=>({...notice,read:Boolean(notice.read)})), support:selectSupport.all(owner),
        }
      },
      document(owner, id) {
        return db.prepare(`SELECT d.id,d.title,d.created_at AS createdAt,f.pdf,r.type,r.id AS requestId,r.created_at AS requestedAt
          FROM documents d LEFT JOIN document_files f ON f.owner=d.owner AND f.document_id=d.id
          LEFT JOIN requests r ON r.owner=d.owner AND r.document_id=d.id WHERE d.owner=? AND d.id=?`).get(owner,id)
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

