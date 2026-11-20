import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { request as send } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { createApplication, readConfig } from '../server/index.mjs'

const newPassword = () => randomBytes(24).toString('base64url')

function credentials() {
  return { ALTIORIS_PASSWORD_A: newPassword(), ALTIORIS_PASSWORD_B: newPassword() }
}

async function launch(config) {
  const pipe = process.platform === 'win32' ? `\\\\.\\pipe\\altioris-test-${process.pid}-${randomBytes(5).toString('hex')}` : null
  const pipeOrigin = 'http://127.0.0.1:3000'
  const server = createApplication({ ...config, origin: config.origin ?? (pipe && pipeOrigin) })
  if (pipe) server.listen(pipe)
  else server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = pipe ? pipeOrigin : `http://127.0.0.1:${server.address().port}`
  return {
    base,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    }),
    request(path, { body, raw, token, method = 'GET', origin = base, headers = {} } = {}) {
      const options = { method, headers }
      if (origin) options.headers.Origin = origin
      if (token) options.headers.Cookie = token
      if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json'
        options.body = JSON.stringify(body)
      }
      if (raw !== undefined) options.body = raw
      if (pipe) {
        if (options.body) options.headers['Content-Length'] = Buffer.byteLength(options.body)
        return new Promise((resolve, reject) => {
          const request = send({ socketPath: pipe, path, method, headers }, (response) => {
            const chunks = []
            response.on('data', (chunk) => chunks.push(chunk))
            response.on('error', reject)
            response.on('end', () => {
              const entries = new Headers()
              for (let index = 0; index < response.rawHeaders.length; index += 2) {
                entries.append(response.rawHeaders[index], response.rawHeaders[index + 1])
              }
              resolve(new Response(Buffer.concat(chunks), { status: response.statusCode, headers: entries }))
            })
          })
          request.on('error', reject)
          request.end(options.body)
        })
      }
      return fetch(`${base}${path}`, options)
    },
  }
}

async function login(app, env, loginId, origin) {
  const password = env[loginId === 'vetrova' ? 'ALTIORIS_PASSWORD_A' : 'ALTIORIS_PASSWORD_B']
  const response = await app.request('/api/login', { method: 'POST', body: { login: loginId, password }, origin })
  assert.equal(response.status, 200)
  const cookie = response.headers.get('set-cookie')
  assert.match(cookie, /; HttpOnly; SameSite=Strict;/)
  const token = cookie.split(';')[0]
  return { token, cookie, student: (await response.json()).student }
}

async function dashboard(app, token) {
  const response = await app.request('/api/dashboard', { token })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  return response.json()
}

test('private records, workspace actions and sessions are isolated and survive an actual server restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'altioris-test-'))
  const env = { ...credentials(), ALTIORIS_DB: join(directory, 'integration.sqlite') }
  let app = await launch(readConfig(env))
  try {
    const unauthorized = await app.request('/api/dashboard')
    assert.equal(unauthorized.status, 401)
    assert.equal((await app.request('/api/documents/a-certificate')).status, 401)
    const wrongLogin = await app.request('/api/login', {
      method: 'POST',
      body: { login: 'vetrova', password: newPassword() },
    })
    assert.equal(wrongLogin.status, 401)
    assert.equal(wrongLogin.headers.has('set-cookie'), false)

    const a = await login(app, env, 'vetrova')
    const b = await login(app, env, 'zolotov')
    assert.notEqual(a.student.name, b.student.name)
    assert.notEqual(a.token, b.token)
    assert.equal(a.student.email.endsWith('@altioris.example'), true)
    const snapshotA = await dashboard(app, a.token)
    const snapshotB = await dashboard(app, b.token)
    assert.notDeepEqual(snapshotA.grades, snapshotB.grades)
    assert.notDeepEqual(snapshotA.campus.lessons, snapshotB.campus.lessons)
    assert.equal(snapshotA.ranking.rank, 2)
    assert.equal(snapshotA.ranking.total, 2)
    assert.equal(snapshotA.ranking.mean, 6.75)
    assert.equal(snapshotA.ranking.gpa.toFixed(2), '7.06')

    const foreignPdf = await app.request('/api/documents/a-certificate', { token: b.token })
    assert.equal(foreignPdf.status, 404)
    const pdf = await app.request('/api/documents/a-certificate', { token: a.token })
    assert.equal(pdf.status, 200)
    assert.equal(pdf.headers.get('content-type'), 'application/pdf')
    assert.match(pdf.headers.get('content-disposition'), /^attachment;/)
    assert.match(Buffer.from(await pdf.arrayBuffer()).toString('utf8'), /^%PDF-1\.4/)

    const letter = await app.request('/api/requests', {
      method: 'POST', token: a.token, body: { type: 'certificate' },
    })
    assert.equal(letter.status, 201)
    const { request } = await letter.json()
    assert.equal(request.status, 'Готова')
    assert.ok(request.documentId)

    const otherAccountNotice = await app.request('/api/notifications', {
      method: 'PATCH', token: b.token, body: { id: 'a-change' },
    })
    assert.equal(otherAccountNotice.status, 404)
    const originDenied = await app.request('/api/profile', {
      method: 'PATCH', token: a.token, body: { avatar: 'initials' }, origin: 'https://another.example',
    })
    assert.equal(originDenied.status, 403)
    assert.equal((await dashboard(app, a.token)).student.avatar, 'portrait')

    assert.equal((await app.request('/api/profile', {
      method: 'PATCH', token: a.token, body: { avatar: 'initials' },
    })).status, 200)
    assert.equal((await app.request('/api/notifications', {
      method: 'PATCH', token: a.token, body: { all: true },
    })).status, 200)
    assert.equal((await app.request('/api/support', {
      method: 'POST', token: a.token, body: { action: 'status' },
    })).status, 200)

    const examA = await app.request('/api/calendar/exams', { token: a.token })
    const examB = await app.request('/api/calendar/exams', { token: b.token })
    const eventsA = await examA.text()
    const eventsB = await examB.text()
    assert.equal(examA.headers.get('content-type'), 'text/calendar; charset=utf-8')
    assert.match(eventsA, /DTSTART:20261127T114000Z\r\n/)
    assert.match(eventsA, /theory-retake/)
    assert.doesNotMatch(eventsA, /security-exam/)
    assert.doesNotMatch(eventsB, /theory-retake/)
    assert.ok(eventsA.split('\r\n').every((line) => Buffer.byteLength(line) <= 75))
    assert.match(await (await app.request('/api/calendar/signal', { token: a.token })).text(), /DTSTART:20261127T150000Z/)

    await app.close()
    app = await launch(readConfig(env))
    const saved = await dashboard(app, a.token)
    const owned = saved.requests.find(({ id }) => id === request.id)
    assert.equal(owned.history.length, 2)
    assert.equal(saved.requests.length, snapshotA.requests.length + 1)
    assert.equal(saved.student.avatar, 'initials')
    assert.ok(saved.notifications.every(({ read }) => read))
    assert.equal(saved.support.at(-1).href, `/requests?item=${request.id}`)
    const other = await dashboard(app, b.token)
    assert.equal(other.requests.length, snapshotB.requests.length)
    assert.equal(other.student.avatar, 'portrait')
    assert.equal(other.support.length, 0)
    assert.ok(other.notifications.some(({ read }) => !read))
    assert.equal((await app.request(`/api/documents/${request.documentId}`, { token: b.token })).status, 404)
    assert.equal((await app.request(`/api/documents/${request.documentId}`, { token: a.token })).status, 200)

    const logout = await app.request('/api/logout', { method: 'POST', token: a.token })
    assert.equal(logout.status, 200)
    assert.match(logout.headers.get('set-cookie'), /Max-Age=0/)
    assert.equal((await app.request('/api/me', { token: a.token })).status, 401)
    assert.equal((await app.request(`/api/documents/${request.documentId}`, { token: a.token })).status, 401)
    assert.equal((await app.request('/api/me', { token: b.token })).status, 200)
  } finally {
    await app.close()
    await rm(directory, { recursive: true, force: true })
  }
})

test('the API validates small requests, canonical write origin, secure cookies and sign-in limits', async () => {
  const origin = 'https://demo.altioris.example'
  const env = { ...credentials(), ALTIORIS_DB: ':memory:', NODE_ENV: 'production', ALTIORIS_ORIGIN: origin }
  const app = await launch(readConfig(env))
  try {
    const denied = await app.request('/api/login', { method: 'POST', body: {}, origin: app.base })
    assert.equal(denied.status, 403)
    const { token, cookie } = await login(app, env, 'vetrova', origin)
    assert.match(cookie, /^__Host-altioris_session=/)
    assert.match(cookie, /; Secure$/)
    const invalidType = await app.request('/api/support', { method: 'POST', token, origin })
    assert.equal(invalidType.status, 415)
    const tooLarge = await app.request('/api/support', {
      method: 'POST', token, origin, body: { action: 'message', text: 'а'.repeat(3000) },
    })
    assert.equal(tooLarge.status, 413)
    const callerOwner = await app.request('/api/requests', {
      method: 'POST', token, origin, body: { type: 'certificate', owner: 'b' },
    })
    assert.equal(callerOwner.status, 400)
    for (let attempt = 1; attempt < 8; attempt += 1) {
      const response = await app.request('/api/login', {
        method: 'POST', origin, body: { login: 'unknown', password: newPassword() },
      })
      assert.equal(response.status, 401)
    }
    const limited = await app.request('/api/login', { method: 'POST', origin, body: {} })
    assert.equal(limited.status, 429)
    assert.ok(Number(limited.headers.get('retry-after')) > 0)
  } finally {
    await app.close()
  }
})



test('profile image uploads migrate existing data, validate bounds and stay private across restarts', async () => {
 const directory=await mkdtemp(join(tmpdir(),'altioris-avatar-'));
 const env={...credentials(),ALTIORIS_DB:join(directory,'avatar.sqlite')};
 let app=await launch(readConfig(env));
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aOCcAAAAASUVORK5CYII=','base64');
 try{
  await app.close();
  const db=new DatabaseSync(env.ALTIORIS_DB);db.exec('DROP TABLE profile_images; PRAGMA user_version=1');db.close();
  app=await launch(readConfig(env));
  const a=await login(app,env,'vetrova'),b=await login(app,env,'zolotov');
  const upload=(raw=png,extra={})=>app.request('/api/profile/avatar',{method:'PUT',token:a.token,raw,headers:{'Content-Type':'image/png'},...extra});
  assert.equal((await upload(png,{token:undefined})).status,401);
  assert.equal((await upload(png,{origin:'https://foreign.example'})).status,403);
  assert.equal((await upload(Buffer.from('<svg onload="alert(1)"/>'))).status,400);
  assert.equal((await upload(png,{headers:{'Content-Type':'image/svg+xml'}})).status,415);
  assert.equal((await upload(Buffer.alloc(2*1024*1024+1))).status,413);
  const large=Buffer.from(png);large.writeUInt32BE(50000,16);assert.equal((await upload(large)).status,400);
  assert.equal((await upload()).status,200);
  const student=(await dashboard(app,a.token)).student;
  assert.equal(student.avatar,'custom');assert.match(student.avatarUrl,/^\/api\/profile\/avatar\?v=[a-f0-9]{64}$/);
  const image=await app.request(student.avatarUrl,{token:a.token});assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.equal(image.headers.get('cache-control'),'no-store');assert.deepEqual(Buffer.from(await image.arrayBuffer()),png);
  assert.equal((await app.request(student.avatarUrl,{token:b.token})).status,404);
  assert.equal((await app.request(student.avatarUrl)).status,401);
  assert.equal((await dashboard(app,b.token)).student.avatarUrl,undefined);
  await app.close();app=await launch(readConfig(env));
  assert.equal((await dashboard(app,a.token)).student.avatarUrl,student.avatarUrl);
  assert.equal((await app.request(student.avatarUrl,{token:a.token})).status,200);
  assert.equal((await app.request('/api/profile/avatar',{method:'DELETE',token:b.token})).status,200);
  assert.equal((await app.request(student.avatarUrl,{token:a.token})).status,200);
  assert.equal((await app.request('/api/profile/avatar',{method:'DELETE',token:a.token})).status,200);
  assert.equal((await dashboard(app,a.token)).student.avatar,'portrait');
  assert.equal((await app.request(student.avatarUrl,{token:a.token})).status,404);
 }finally{await app.close();await rm(directory,{recursive:true,force:true});}
});
