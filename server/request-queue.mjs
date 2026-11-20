const stages = [
  ['Принята', 'Заявка принята учебным офисом'],
  ['В обработке', 'Документ оформляется'],
  ['Готова', 'Документ готов'],
]

function delays(id) {
  const spread = parseInt(id.slice(0, 4), 16) || 0
  return [6_000, 24_000, 125_000 + (spread % 40) * 1_000]
}

export function openRequestQueue(db, { clock, transaction, issueDocument, history, notify }) {
  const enqueue = db.prepare(`INSERT INTO request_jobs (owner,request_id,started_at,next_at,stage)
    VALUES (?,?,?,?,?) ON CONFLICT(owner,request_id) DO NOTHING`)
  const due = db.prepare(`SELECT j.owner,j.request_id AS id,j.started_at AS started,j.stage,j.failures,r.type,r.title,r.created_at AS createdAt
    FROM request_jobs j JOIN requests r ON r.owner=j.owner AND r.id=j.request_id
    WHERE j.next_at<=? ORDER BY j.next_at LIMIT 20`)
  const current = db.prepare('SELECT next_at,stage FROM request_jobs WHERE owner=? AND request_id=?')
  const advance = db.prepare('UPDATE request_jobs SET stage=?,next_at=?,failures=0 WHERE owner=? AND request_id=?')
  const retry = db.prepare('UPDATE request_jobs SET failures=failures+1,next_at=? WHERE owner=? AND request_id=?')
  const remove = db.prepare('DELETE FROM request_jobs WHERE owner=? AND request_id=?')
  const save = db.prepare('UPDATE requests SET status=?,document_id=? WHERE owner=? AND id=?')
  const legacy = db.prepare(`SELECT owner,id FROM requests WHERE document_id IS NULL AND status='На рассмотрении'`)

  function schedule(owner, id, at, stage = 0) {
    const started = Date.parse(at)
    enqueue.run(owner, id, started, started + delays(id)[stage], stage)
  }

  const pendingLegacy = legacy.all()
  if (pendingLegacy.length) transaction(() => {
    const at = clock()
    for (const row of pendingLegacy) schedule(row.owner, row.id, at, 1)
  })

  function tick() {
    const at = new Date(clock()).toISOString(), now = Date.parse(at)
    for (const job of due.all(now)) {
      try {
        transaction(() => {
          const row = current.get(job.owner, job.id)
          if (!row || row.stage !== job.stage || row.next_at > now) return
          const [status, label] = stages[job.stage]
          const ready = job.stage === stages.length - 1
          const documentId = ready ? issueDocument(job, at) : null
          save.run(status, documentId, job.owner, job.id)
          history.run(job.id, job.owner, at, label)
          if (ready) {
            remove.run(job.owner, job.id)
            notify.run('request-ready-' + job.id, job.owner, 'Готов документ · ' + job.title,
              'Документы', 'Учебный PDF готов. Его можно открыть или скачать в карточке заявки.', at, '/requests?item=' + job.id)
          } else {
            advance.run(job.stage + 1, job.started + delays(job.id)[job.stage + 1], job.owner, job.id)
          }
        })
      } catch (error) {
        console.error('Request processing:', error.message)
        transaction(() => {
          const row = current.get(job.owner, job.id)
          if (!row || row.stage !== job.stage || row.next_at > now) return
          if (job.failures < 2) retry.run(now + 30_000 * (job.failures + 1), job.owner, job.id)
          else {
            save.run('Ошибка подготовки', null, job.owner, job.id)
            history.run(job.id, job.owner, at, 'Не удалось подготовить документ')
            remove.run(job.owner, job.id)
          }
        })
      }
    }
  }

  return { schedule, tick }
}
