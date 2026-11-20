import { createReadStream } from 'node:fs'
import { realpath, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { accounts, demoClock, requestTypes } from './fixtures.mjs'
import { calendar, demoPdf } from './exports.mjs'
import { profileDocumentPdf } from './pdf.mjs'
import { profileDocumentsFor } from './profile-documents.mjs'
import { createNotificationStream } from './notification-stream.mjs'
import { openStore, sessionLifetime } from './store.mjs'
import { configuredPasswords } from './demo-accounts.mjs'

const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url))
const defaultDatabase = fileURLToPath(new URL('../runtime/altioris.sqlite', import.meta.url))
const bodyLimit = 4096
const avatarLimit = 2 * 1024 * 1024
const signInInterval = 60_000
const signInAttempts = 8
const supportActions = new Set(['certificate', 'status', 'faq', 'specialist', 'message'])
const avatars = new Set(['portrait', 'initials'])
const identifier = /^[\w-]{1,64}$/
const tokenShape = /^[A-Za-z0-9_-]{43}$/
const types = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'], ['.svg', 'image/svg+xml'], ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'], ['.jpg', 'image/jpeg'], ['.webp', 'image/webp'], ['.avif', 'image/avif'],
  ['.ttf', 'font/ttf'], ['.woff2', 'font/woff2'], ['.woff', 'font/woff'],
])

class HttpError extends Error {
  constructor(status, message, headers = {}) {
    super(message)
    this.status = status
    this.headers = headers
  }
}

export function readConfig(env = process.env) {
  const passwords = configuredPasswords(env)
  if (Object.values(passwords).some((value) => !value || value.length < 12 || value.length > 128)) {
    throw new Error('Set independent ALTIORIS_PASSWORD_A and ALTIORIS_PASSWORD_B values of 12–128 characters.')
  }
  if (new Set(Object.values(passwords)).size !== Object.keys(passwords).length) throw new Error('Demo accounts require different passwords.')
  const secure = env.NODE_ENV === 'production'
  let origin = null
  if (env.ALTIORIS_ORIGIN) {
    try {
      const configured = new URL(env.ALTIORIS_ORIGIN)
      if (!['http:', 'https:'].includes(configured.protocol) || configured.username || configured.password ||
          configured.pathname !== '/' || configured.search || configured.hash) throw new Error()
      origin = configured.origin
    } catch {
      throw new Error('ALTIORIS_ORIGIN must be one canonical HTTP or HTTPS origin.')
    }
  }
  if (secure && !origin?.startsWith('https://')) throw new Error('Production requires an HTTPS ALTIORIS_ORIGIN.')
  const port = Number(env.PORT || 3000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT is invalid.')
  return {
    passwords, secure, origin, port, host: env.HOST || '127.0.0.1',
    databasePath: env.ALTIORIS_DB || defaultDatabase,
    simulation: env.ALTIORIS_ACADEMIC_SIMULATION === '1',
    clock: env.ALTIORIS_CLOCK === 'demo' ? () => demoClock : () => new Date().toISOString(),
  }
}

function json(res, status, value, headers = {}) {
  const payload = JSON.stringify(value)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload), ...headers,
  })
  res.end(payload)
}

function badRequest(message = 'Проверьте данные и попробуйте снова.') {
  return new HttpError(400, message)
}

async function readJson(req) {
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    req.resume()
    throw new HttpError(415, 'Ожидаются данные в формате JSON.')
  }
  if (Number(req.headers['content-length']) > bodyLimit) {
    req.resume()
    throw new HttpError(413, 'Сообщение слишком большое.')
  }
  const chunks = []
  let length = 0
  for await (const chunk of req) {
    length += chunk.length
    if (length <= bodyLimit) chunks.push(chunk)
  }
  if (length > bodyLimit) throw new HttpError(413, 'Сообщение слишком большое.')
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (value && typeof value === 'object' && !Array.isArray(value)) return value
  } catch {
    throw badRequest()
  }
  throw badRequest()
}

function validateKeys(data, allowed) {
  if (Object.keys(data).some((key) => !allowed.includes(key))) throw badRequest()
}

async function readAvatar(req) {
  if (req.headers['content-type'] !== 'image/png') {
    req.resume()
    throw new HttpError(415, 'Выберите изображение через форму загрузки.')
  }
  if (Number(req.headers['content-length']) > avatarLimit) {
    req.resume()
    throw new HttpError(413, 'Изображение слишком большое.')
  }
  const chunks = []
  let length = 0
  for await (const chunk of req) {
    length += chunk.length
    if (length <= avatarLimit) chunks.push(chunk)
  }
  if (length > avatarLimit) throw new HttpError(413, 'Изображение слишком большое.')
  const data = Buffer.concat(chunks)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  if (data.length < 45 || !data.subarray(0, 8).equals(signature) ||
      data.readUInt32BE(8) !== 13 || data.toString('ascii', 12, 16) !== 'IHDR' ||
      !data.readUInt32BE(16) || !data.readUInt32BE(20) ||
      data.readUInt32BE(16) > 1024 || data.readUInt32BE(20) > 1024 ||
      data.toString('ascii', data.length - 8, data.length - 4) !== 'IEND') {
    throw badRequest('Не удалось прочитать изображение. Выберите другой файл.')
  }
  return data
}

function allowedOrigin(req, origin) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  const supplied = req.headers.origin
  if (!supplied) return req.headers['sec-fetch-site'] !== 'same-site'
  if (origin) return supplied === origin
  const port = req.socket.localPort
  const suffix = port === 80 ? '' : `:${port}`
  return ['localhost', '127.0.0.1', '[::1]'].some((host) => supplied === `http://${host}${suffix}`)
}

function readToken(req, name) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [key, raw] = part.trim().split('=')
    if (key === name && tokenShape.test(raw ?? '')) return raw
  }
  return null
}

function setHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'", "base-uri 'none'", "frame-ancestors 'none'", "object-src 'none'",
    "img-src 'self' data: blob:", "style-src 'self' 'unsafe-inline'", "form-action 'self'",
  ].join('; '))
}

function attachment(res, value, type, filename, disposition = 'attachment') {
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Disposition': `${disposition}; filename="${filename}"`,
    'Content-Length': Buffer.byteLength(value),
  })
  res.end(value)
}

function isInside(directory, target) {
  const part = relative(directory, target)
  return part !== '..' && !part.startsWith('../') && !part.startsWith('..\\') && !isAbsolute(part)
}

async function serveStatic(req, res, pathname, directory) {
  if (!['GET', 'HEAD'].includes(req.method)) throw new HttpError(405, 'Метод недоступен.', { Allow: 'GET, HEAD' })
  let path
  try {
    path = decodeURIComponent(pathname)
  } catch {
    throw badRequest('Ссылка некорректна.')
  }
  const missing = () => new HttpError(404, 'Страница не найдена.')
  if (path.includes('\\') || path.includes('\0') || path.split('/').some((part) => part.startsWith('.'))) throw missing()
  const extension = extname(path)
  const type = types.get(extension || '.html')
  if (!type) throw missing()
  const file = resolve(directory, extension ? `.${path}` : 'index.html')
  let target
  let information
  try {
    if (!isInside(directory, file)) throw missing()
    target = await realpath(file)
    if (!isInside(await realpath(directory), target)) throw missing()
    information = await stat(target)
    if (!information.isFile()) throw missing()
  } catch (error) {
    if (error instanceof HttpError || ['ENOENT', 'ENOTDIR'].includes(error.code)) throw missing()
    throw error
  }
  if (extension && extension !== '.html') res.setHeader('Cache-Control', 'public, max-age=300')
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': information.size })
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  await pipeline(createReadStream(target), res)
}

export function createApplication(config, { staticDirectory = publicDirectory } = {}) {
  const store = openStore(config)
  const notificationStream=createNotificationStream(store,config.clock)
  const cookieName = config.secure ? '__Host-altioris_session' : 'altioris_session'
  const cookie = (token, age) => [
    `${cookieName}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict',
    `Max-Age=${age}`, ...(config.secure ? ['Secure'] : []),
  ].join('; ')

  const attempts = new Map()
  let cleanupAt = 0
  function recordAttempt(address) {
    const now = Date.now()
    if (now >= cleanupAt) {
      for (const [ip, prior] of attempts) {
        if (prior.until <= now) attempts.delete(ip)
      }
      cleanupAt = now + signInInterval
    }
    const prior = attempts.get(address)
    if (!prior || prior.until <= now) {
      if (attempts.size >= 4096) {
        throw new HttpError(429, 'Много попыток входа. Подождите минуту.', { 'Retry-After': '60' })
      }
      attempts.set(address, { count: 1, until: now + signInInterval })
      return
    }
    if (prior.count >= signInAttempts) {
      const retryAfter = Math.ceil((prior.until - now) / 1000)
      throw new HttpError(429, 'Много попыток входа. Подождите минуту.', { 'Retry-After': String(retryAfter) })
    }
    prior.count += 1
  }

  const server = createServer({ requestTimeout: 15_000, headersTimeout: 10_000 }, async (req, res) => {
    setHeaders(res)
    try {
      const {pathname,searchParams} = new URL(req.url, 'http://altioris.example')
      if (pathname !== '/api' && !pathname.startsWith('/api/')) {
        await serveStatic(req, res, pathname, staticDirectory)
        return
      }
      const method = req.method
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !allowedOrigin(req, config.origin)) {
        req.resume()
        throw new HttpError(403, 'Действие отклонено. Вернитесь в кабинет и повторите попытку.')
      }
      const token = readToken(req, cookieName)
      if (method === 'POST' && pathname === '/api/login') {
        recordAttempt(req.socket.remoteAddress)
        const data = await readJson(req)
        validateKeys(data, ['login', 'password'])
        if (typeof data.login !== 'string' || typeof data.password !== 'string' ||
            data.login.length > 64 || data.password.length > 128 || !data.login.trim() || !data.password) {
          throw badRequest()
        }
        const owner = await store.authenticate(data.login.trim().toLowerCase(), data.password)
        if (!owner) throw new HttpError(401, 'Неверный логин или пароль.')
        if (token) store.revokeSession(token)
        const freshToken = store.issueSession(owner)
        json(res, 200, { student: store.profile(owner) }, { 'Set-Cookie': cookie(freshToken, sessionLifetime) })
        return
      }
      if (method === 'POST' && pathname === '/api/logout') {
        req.resume()
        if (token) store.revokeSession(token)
        json(res, 200, { ok: true }, { 'Set-Cookie': cookie('', 0) })
        return
      }
      const current = token ? store.session(token) : null
      if (!current) {
        req.resume()
        throw new HttpError(401, 'Войдите в личный кабинет.')
      }
      const { owner } = current
      if (method === 'GET' && pathname === '/api/me') {
        json(res, 200, { student: store.profile(owner) })
        return
      }
      if (method === 'GET' && pathname === '/api/dashboard') {
        json(res, 200, store.dashboard(owner))
        return
      }
      if (method === 'GET' && pathname === '/api/notifications') {
        json(res, 200, { notifications: store.notifications(owner) })
        return
      }
      if (method === 'GET' && pathname === '/api/notifications/stream') {
        if(!notificationStream.subscribe(owner,token,res))throw new HttpError(429,'Слишком много открытых кабинетов.')
        return
      }
      if (method === 'POST' && pathname === '/api/requests') {
        const data = await readJson(req)
        validateKeys(data, ['type'])
        if (!requestTypes.has(data.type)) throw badRequest('Выберите вид заявки.')
        json(res, 201, { request: store.createRequest(owner, data.type) })
        return
      }
      if (method === 'PATCH' && pathname === '/api/notifications') {
        const data = await readJson(req)
        validateKeys(data, ['id', 'all'])
        if (data.all === true && data.id === undefined) {
          store.readAllNotifications(owner)
        } else if (typeof data.id === 'string' && identifier.test(data.id) && data.all === undefined) {
          if (!store.markNotification(owner, data.id)) throw new HttpError(404, 'Уведомление не найдено.')
        } else {
          throw badRequest()
        }
        json(res, 200, { ok: true })
        return
      }
      if (method === 'PATCH' && pathname === '/api/profile') {
        const data = await readJson(req)
        validateKeys(data, ['avatar'])
        if (!avatars.has(data.avatar)) throw badRequest('Выберите доступный аватар.')
        store.removeAvatarImage(owner)
        json(res, 200, { student: store.profile(owner) })
        return
      }
      if (pathname === '/api/profile/avatar' && method === 'PUT') {
        store.saveAvatarImage(owner, await readAvatar(req))
        json(res, 200, { student: store.profile(owner) })
        return
      }
      if (pathname === '/api/profile/avatar' && method === 'DELETE') {
        req.resume()
        store.removeAvatarImage(owner)
        json(res, 200, { student: store.profile(owner) })
        return
      }
      if (pathname === '/api/profile/avatar' && method === 'GET') {
        const image = store.avatarImage(owner)
        if (!image) throw new HttpError(404, 'Фото профиля не загружено.')
        res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': image.length })
        res.end(Buffer.from(image))
        return
      }
      if (method === 'POST' && pathname === '/api/support') {
        const data = await readJson(req)
        validateKeys(data, ['action', 'text'])
        if (!supportActions.has(data.action)) throw badRequest('Выберите доступное действие.')
        const text = typeof data.text === 'string' ? data.text.trim() : ''
        if (data.action === 'message' && (!text || text.length > 500)) {
          throw badRequest('Напишите вопрос длиной до 500 символов.')
        }
        if (data.action !== 'message' && data.text !== undefined && typeof data.text !== 'string') throw badRequest()
        store.addSupport(owner, data.action, text)
        json(res, 200, { ok: true })
        return
      }
      if (method === 'GET' && pathname.startsWith('/api/documents/')) {
        const id = pathname.slice('/api/documents/'.length)
        const account = accounts.find(({ id: accountId }) => accountId === owner)
        const profileDocument = profileDocumentsFor(account).find(item => item.id === id)
        if (profileDocument) {
          attachment(res, profileDocumentPdf(profileDocument, account), 'application/pdf', `altioris-${id}.pdf`, 'inline')
          return
        }
        const document = identifier.test(id) && store.document(owner, id)
        if (!document) throw new HttpError(404, 'Документ не найден.')
        attachment(res, demoPdf(document, store.profile(owner), account, store.grades(owner,document.createdAt)), 'application/pdf', `altioris-${id}.pdf`)
        return
      }
      if (method === 'GET' && pathname === '/api/calendar/exams') {
        const campus = store.campus(owner)
        const term = searchParams.get('term') ?? campus.examTerm
        const period = [...campus.terms,...campus.years].find(item=>item.id===term)
        if (!period) throw badRequest('Выберите учебный период.')
        const termIds = period.termIds ?? [period.id]
        attachment(res, calendar(campus.exams.filter(event=>termIds.includes(event.termId)), campus.clock), 'text/calendar; charset=utf-8', 'altioris-exams.ics')
        return
      }
      req.resume()
      throw new HttpError(404, 'Действие недоступно.')
    } catch (error) {
      if (res.headersSent || res.destroyed) {
        res.destroy()
        return
      }
      if (error instanceof HttpError) {
        json(res, error.status, { error: error.message }, error.headers)
        return
      }
      console.error('Altioris could not complete an HTTP request.')
      json(res, 500, { error: 'Сервис временно недоступен. Попробуйте ещё раз.' })
    }
  })
  server.once('listening',()=>notificationStream.start())
  server.once('close', () => { notificationStream.stop();store.close() })
  return server
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let config
  try {
    config = readConfig()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
  if (config) {
    try {
      const server = createApplication(config)
      server.on('error', (error) => {
        console.error(`Altioris could not listen (${error.code ?? 'unknown error'}).`)
        process.exitCode = 1
      })
      server.listen(config.port, config.host, () => console.log(`Altioris listening on ${config.host}:${config.port}`))
    } catch {
      console.error('Altioris could not open the configured SQLite database.')
      process.exitCode = 1
    }
  }
}

