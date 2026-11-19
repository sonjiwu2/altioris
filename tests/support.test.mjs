import assert from 'node:assert/strict'
import test from 'node:test'
import { accounts, demoClock } from '../server/fixtures.mjs'
import { openStore } from '../server/store.mjs'

test('the guided assistant resolves owned records and meaningful student intents', async (t) => {
  const store = openStore({
    databasePath: ':memory:',
    passwords: Object.fromEntries(accounts.map(({ id }) => [id, 'isolated-test-password-' + id])),
    clock: () => demoClock,
  })
  t.after(() => store.close())
  const reply = (owner, text) => {
    store.addSupport(owner, 'message', text)
    return store.dashboard(owner).support.at(-1)
  }
  await t.test('grades use the signed-in students actual cohort results', () => {
    const dashboard = store.dashboard('a')
    const result = reply('a', 'Какой у меня GPA и рейтинг?')
    assert.equal(result.href, '/grades/ranking')
    assert.ok(result.text.includes(dashboard.ranking.gpa.toFixed(2).replace('.', ',')))
    assert.ok(result.text.includes(String(dashboard.ranking.total)))
    assert.equal(dashboard.ranking.total, 13)
    assert.deepEqual(dashboard.ranking.peers.map(x => x.rank), Array.from({ length: 13 }, (_, i) => i + 1))
  })
  await t.test('an explicit owned request is selected rather than the latest request', () => {
    const first = store.createRequest('a', 'certificate')
    store.createRequest('a', 'academic-leave')
    const result = reply('a', 'Проверь статус заявки ' + first.id)
    assert.equal(result.href, '/requests?item=' + first.id)
    assert.ok(result.text.includes('Готова'))
  })
  await t.test('a foreign request identifier never resolves the foreign record', () => {
    const foreign = store.createRequest('a', 'certificate')
    const result = reply('m', 'Статус заявки ' + foreign.id)
    assert.equal(result.href, '/requests')
    assert.ok(!result.text.includes(foreign.id))
    assert.equal(store.dashboard('m').requests.length, 0)
  })
  await t.test('a certificate status question selects a certificate instead of an unrelated request', () => {
    store.createRequest('a', 'certificate')
    store.createRequest('a', 'academic-leave')
    const result = reply('a', 'Хочу проверить статус справки')
    assert.ok(result.text.includes('Справка об обучении'))
    assert.ok(result.text.includes('Готова'))
  })
  await t.test('teacher questions return consultation details from the catalog', () => {
    const result = reply('a', 'Когда консультации у Вороновой?')
    const teacher = store.dashboard('a').campus.teachers.find(x => x.id === 'voronova')
    assert.equal(result.href, '/teachers?item=voronova')
    assert.ok(result.text.includes(teacher.consultation))
    assert.ok(result.text.includes(teacher.email))
  })
  await t.test('exam questions link to confirmed assessment dates', () => {
    const result = reply('a', 'Когда ближайший экзамен?')
    assert.equal(result.href, '/schedule/exams')
    assert.ok(result.text.includes('Ближайший контроль'))
  })
  await t.test('online help accurately describes demonstration capability', () => {
    const result = reply('a', 'Как подключиться к онлайн занятию?')
    assert.equal(result.href, '/schedule?lesson=lesson-4')
    assert.ok(result.text.includes('не подключены'))
  })
  await t.test('a class question returns actual lessons rather than exam dates', () => {
    const result = reply('a', 'Какие у меня пары сегодня?')
    assert.equal(result.href, '/schedule')
    assert.ok(result.text.includes('Архитектура ПО'))
    assert.ok(result.text.includes('10:30'))
  })
  await t.test('certificate questions offer the actual request form', () => {
    const result = reply('a', 'Хочу справку об обучении')
    assert.equal(result.href, '/requests?new=certificate')
  })
  await t.test('greetings and operator questions remain honest about the service', () => {
    assert.ok(reply('a', 'Здравствуйте').text.includes('Помогу'))
    assert.ok(reply('a', 'Нужен специалист').text.includes('специалист не получает сообщения'))
  })
})

