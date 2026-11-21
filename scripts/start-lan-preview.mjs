import { readFile } from 'node:fs/promises'
import { createServer, request } from 'node:http'
import { BlockList } from 'node:net'
import { networkInterfaces } from 'node:os'

const [host, portText = '60872', upstreamFile] = process.argv.slice(2)
const port = Number(portText)
const adapter = Object.values(networkInterfaces()).flat().find(item =>
  item.address === host && item.family === 'IPv4' && !item.internal)
const privateAddresses = new BlockList()
privateAddresses.addSubnet('10.0.0.0', 8)
privateAddresses.addSubnet('172.16.0.0', 12)
privateAddresses.addSubnet('192.168.0.0', 16)
if (!adapter?.cidr || !privateAddresses.check(host) || !Number.isInteger(port) || port < 1024 || port > 65_535) {
  throw new Error('Pass a private IPv4 address on this computer and a TCP port between 1024 and 65535.')
}

const localNetwork = new BlockList()
const mask = adapter.netmask.split('.').map(Number)
const subnet = host.split('.').map((component, index) => Number(component) & mask[index]).join('.')
localNetwork.addSubnet(subnet, Number(adapter.cidr.split('/')[1]))
const phone = new URL(`http://${host}:${port}`)
const serverFile = upstreamFile ?? new URL('../runtime/local-server.json', import.meta.url)
const { url } = JSON.parse(await readFile(serverFile, 'utf8'))
const backend = new URL(url)
if (backend.protocol !== 'http:' || backend.hostname !== '127.0.0.1' || !backend.port) {
  throw new Error('The Altioris upstream must be an HTTP service on loopback.')
}

const hopHeaders = [
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'proxy-connection', 'te', 'trailer', 'transfer-encoding', 'upgrade',
]
function endToEndHeaders(headers) {
  const next = { ...headers }
  const named = String(next.connection ?? '').toLowerCase().split(',').map(name => name.trim())
  for (const name of [...hopHeaders, ...named]) delete next[name]
  return next
}

function fail(res, status, error) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify({ error }))
}

const bridge = createServer({ headersTimeout: 10_000, requestTimeout: 20_000 }, (req, res) => {
  const origin = req.headers.origin
  const readOnly = ['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  if (req.headers.host !== phone.host || !req.url.startsWith('/') || req.url.startsWith('//') ||
      (origin && origin !== phone.origin) || (!readOnly && (origin !== phone.origin || req.headers['sec-fetch-site'] === 'cross-site'))) {
    req.resume()
    fail(res, 403, 'Откройте кабинет по локальной ссылке и повторите действие.')
    return
  }

  const headers = endToEndHeaders(req.headers)
  headers.host = backend.host
  if (origin) headers.origin = backend.origin
  const upstream = request(backend, { method: req.method, path: req.url, headers }, response => {
    res.writeHead(response.statusCode, endToEndHeaders(response.headers))
    response.on('error', () => res.destroy())
    response.pipe(res)
  })
  upstream.on('error', () => {
    if (res.headersSent) res.destroy()
    else fail(res, 502, 'Кабинет на компьютере сейчас недоступен.')
  })
  req.on('aborted', () => upstream.destroy())
  res.on('close', () => upstream.destroy())
  req.pipe(upstream)
})
bridge.prependListener('connection', socket => {
  if (!socket.remoteAddress || !localNetwork.check(socket.remoteAddress)) socket.destroy()
})
bridge.listen(port, host, () => console.log(`Altioris on Wi-Fi: ${phone.origin}`))
