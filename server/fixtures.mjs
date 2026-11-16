export const demoClock = '2026-11-23T10:05:00+03:00'

export const teachers = [
  { id: 'voronova', name: 'Надежда Леонидовна Воронова', shortName: 'Надежда Воронова', subject: 'Архитектура ПО', role: 'Доцент', office: 'Б · каб. 418', consultation: 'Четверг, 16:20', experience: '11 лет' },
  { id: 'krylov', name: 'Сергей Андреевич Крылов', shortName: 'Сергей Крылов', subject: 'Базы данных', role: 'Преподаватель', office: 'Б · каб. 308', consultation: 'Вторник, 16:20', experience: '8 лет' },
  { id: 'pavlova', name: 'Елена Михайловна Павлова', shortName: 'Елена Павлова', subject: 'Проектный семинар', role: 'Преподаватель', office: 'Б · каб. 506', consultation: 'Среда, 16:20', experience: '7 лет' },
  { id: 'sokolov', name: 'Илья Петрович Соколов', shortName: 'Илья Соколов', subject: 'Алгоритмы', role: 'Преподаватель', office: 'А · каб. 204', consultation: 'Понедельник, 16:20', experience: '9 лет' },
].map((teacher) => ({ ...teacher, campus: 'Нижний Новгород', email: `${teacher.id}@altioris.example` }))

const dt = (date, time) => `${date}T${time}:00+03:00`
const lessons = [
  ['23', '10:30', '11:50', 'Архитектура ПО', 'Лекция', 'Б', 412, 'voronova'],
  ['23', '12:10', '13:30', 'Базы данных', 'Лекция', 'Б', 308, 'krylov'],
  ['23', '14:40', '16:00', 'Проектный семинар', 'Семинар', 'Б', 506, 'pavlova'],
  ['24', '10:30', '11:50', 'Алгоритмы', 'Семинар', 'А', 204, 'sokolov'],
  ['24', '14:40', '16:00', 'Компьютерные сети', 'Лекция', 'Б', 318, 'krylov'],
  ['25', '10:30', '11:50', 'Проектный практикум', 'Семинар', 'Б', 506, 'pavlova'],
  ['25', '12:10', '13:30', 'Архитектура ПО', 'Лекция', 'Б', 412, 'voronova'],
  ['26', '10:30', '11:50', 'Базы данных', 'Семинар', 'Б', 308, 'krylov'],
  ['26', '14:40', '16:00', 'Алгоритмы', 'Семинар', 'А', 204, 'sokolov'],
  ['27', '10:30', '11:50', 'Компьютерные сети', 'Лекция', 'Б', 318, 'krylov'],
].map(([day, start, end, title, type, building, room, teacherId], index) => ({
  id: `lesson-${index + 1}`, title, type,
  start: dt(`2026-11-${day}`, start), end: dt(`2026-11-${day}`, end),
  room: `Корпус ${building} · ауд. ${room}`, teacherId,
}))

const exams = [
  { id: 'project-assessment', title: 'Проектный практикум', type: 'Зачёт', start: dt('2026-11-27', '14:40'), end: dt('2026-11-27', '16:00'), room: 'Корпус Б · ауд. 506' },
  { id: 'os-exam', title: 'Операционные системы', type: 'Экзамен', start: dt('2026-11-30', '10:30'), end: dt('2026-11-30', '11:50'), room: 'Корпус Б · ауд. 412' },
  { id: 'theory-retake', title: 'Теория вычислений', type: 'Пересдача', start: dt('2026-12-02', '12:10'), end: dt('2026-12-02', '13:30'), room: 'Корпус А · ауд. 204' },
  { id: 'security-exam', title: 'Информационная безопасность', type: 'Экзамен', start: null, end: null, room: null, announcement: 'Дату, время и аудиторию объявят 30 ноября' },
]

export const signal = {
  id: 'signal-2026', title: 'СИГНАЛ — вечер студенческих проектов', start: dt('2026-11-27', '18:00'),
  end: dt('2026-11-27', '19:30'), room: 'Атриум корпуса Б',
}

const sharedProfile = {
  faculty: 'Цифровых технологий', program: 'Компьютерные науки и технологии',
  year: 3, form: 'Очная', campus: 'Нижний Новгород', admissionYear: 2024,
}

export const accounts = [
  {
    id: 'a', login: 'vetrova', passwordEnv: 'ALTIORIS_PASSWORD_A',
    profile: {
      ...sharedProfile, name: 'Алина Романовна Ветрова', shortName: 'Алина Ветрова', initials: 'АВ',
      group: 'КНТ-241', email: 'a.vetrova@altioris.example', number: 'ALT-02481',
    },
    marks: [9, 8, 7, 3, null],
  },
  {
    id: 'b', login: 'zolotov', passwordEnv: 'ALTIORIS_PASSWORD_B',
    profile: {
      ...sharedProfile, name: 'Мирон Олегович Золотов', shortName: 'Мирон Золотов', initials: 'МЗ',
      group: 'КНТ-242', email: 'm.zolotov@altioris.example', number: 'ALT-02496',
    },
    marks: [7, 9, 8, 6, null],
  },
]

export function campusFor(owner, clock) {
  return {
    clock, teachers,
    lessons: owner === 'a' ? lessons : lessons.filter((lesson) => lesson.id !== 'lesson-1'),
    exams: owner === 'a' ? exams : exams.filter((exam) => exam.id !== 'theory-retake'),
  }
}

const subjects = [
  ['architecture', 'Архитектура ПО', 4, 'Экзамен', 'voronova'],
  ['databases', 'Базы данных', 5, 'Экзамен', 'krylov'],
  ['algorithms', 'Алгоритмы', 5, 'Экзамен', 'sokolov'],
  ['theory', 'Теория вычислений', 3, 'Экзамен', 'sokolov'],
  ['networks', 'Компьютерные сети', 3, 'Зачёт', 'krylov'],
]

export function gradesFor(account) {
  return subjects.map(([id, title, credits, assessment, teacherId], index) => {
    const mark = account.marks[index]
    const result = mark === null ? 'Зачтено' : mark >= 8 ? 'Отлично'
      : mark >= 6 ? 'Хорошо' : mark >= 4 ? 'Удовлетворительно' : 'Требуется пересдача'
    return {
      id, title, mark, result, credits, hours: credits * 36, classHours: credits * 12,
      assessment, teacherId, retakeDate: mark !== null && mark < 4 ? dt('2026-12-02', '12:10') : null,
    }
  })
}

const nearbyPeers = [
  ['Е. Орлова', 7.38], ['Н. Громов', 7.29], ['М. Ланская', 7.21], ['И. Северин', 7.13],
  ['Д. Рудин', 7.02], ['В. Лесина', 6.98], ['К. Белова', 6.91], ['Т. Серов', 6.86],
]
const firstNames = ['А.', 'Н.', 'П.', 'Е.', 'М.', 'Л.', 'И.', 'С.']
const surnames = ['Таль', 'Ладин', 'Сириус', 'Лирин', 'Вельский', 'Вехов', 'Ренский', 'Горин', 'Витин', 'Ивин', 'Силов']
const peers = [
  ...Array.from({ length: 13 }, (_, index) => [null, (920 - 13 * index) / 100]),
  ...nearbyPeers,
  ...Array.from({ length: 74 }, (_, index) => [null, (678 - 4 * index) / 100]),
].map(([name, gpa], index) => ({
  id: `peer-${index}`, name: name ?? `${firstNames[index % firstNames.length]} ${surnames[index % surnames.length]}`,
  gpa,
}))

export function rankingFor(account, grades) {
  const numeric = grades.filter(({ mark }) => mark !== null)
  const mean = numeric.reduce((sum, { mark }) => sum + mark, 0) / numeric.length
  const credits = numeric.reduce((sum, grade) => sum + grade.credits, 0)
  const gpa = numeric.reduce((sum, grade) => sum + grade.mark * grade.credits, 0) / credits
  const nameParts = account.profile.shortName.split(' ')
  const selfName = `${nameParts[0][0]}. ${nameParts[1]}`
  const entries = [...peers, { id: account.id, name: selfName, gpa }]
    .sort((a, b) => b.gpa - a.gpa || a.id.localeCompare(b.id))
    .map(({ id, name, gpa: score }, index) => ({ rank: index + 1, name, gpa: score, self: id === account.id }))
  const rank = entries.findIndex((entry) => entry.self) + 1
  const offset = Math.max(0, Math.min(rank - 5, entries.length - 9))
  return { mean, gpa, rank, total: entries.length, peers: entries.slice(offset, offset + 9) }
}

export const requestTypes = new Map([
  ['certificate', 'Справка об обучении'],
  ['academic-leave', 'Академический отпуск'],
  ['dormitory', 'Справка для общежития'],
  ['media-lab', 'Запись в медиалабораторию'],
])

const seedDate = dt('2026-11-20', '11:24')
const readyDate = dt('2026-11-23', '09:17')
const studentRequest = (id, type, status, createdAt, documentId = null) => ({
  id, type, title: requestTypes.get(type), status, createdAt, documentId,
  history: [
    ...(status === 'Готова' ? [{ at: readyDate, label: 'Документ готов' }] : []),
    ...(status === 'Завершена' ? [{ at: seedDate, label: 'Заявка завершена' }] : []),
    { at: createdAt, label: 'Заявка принята' },
  ],
})

const doc = (id, title, createdAt) => ({ id, title, createdAt })
const notification = (id, title, type, body, at, href, read = false) => ({ id, title, type, body, at, href, read })
export const baselines = {
  a: {
    requests: [
      studentRequest('024', 'certificate', 'Готова', seedDate, 'a-certificate'),
      studentRequest('025', 'academic-leave', 'На рассмотрении', dt('2026-11-22', '12:00')),
      studentRequest('020', 'dormitory', 'Завершена', dt('2026-11-14', '10:00')),
    ],
    documents: [
      doc('a-certificate', 'Справка об обучении', readyDate),
      doc('a-grades', 'Выписка об успеваемости', seedDate),
    ],
    notifications: [
      notification('a-report', 'Отчёт по практике', 'Дедлайн', 'Загрузите отчёт по производственной практике до 26 ноября, 23:59. Отправка отчёта недоступна в конкурсном прототипе.', dt('2026-11-23', '09:45'), '/support'),
      notification('a-change', 'Перенос проектного семинара', 'Изменение', '23 ноября семинар перенесён с 13:40 на 14:40. Новая аудитория: корпус Б, ауд. 506.', dt('2026-11-23', '08:40'), '/schedule'),
      notification('a-consult', 'График консультаций на сессию', 'Объявление деканата', 'Учебный офис опубликовал время консультаций перед сессией.', dt('2026-11-22', '09:00'), '/news/consultations', true),
      notification('a-ready', 'Справка об обучении готова', 'Заявка', 'Откройте заявку, чтобы скачать учебный образец PDF.', readyDate, '/requests?item=024', true),
      notification('a-signal', signal.title, 'Новость', 'Встречаемся 27 ноября в атриуме корпуса Б.', dt('2026-11-21', '15:00'), '/news/signal', true),
    ],
  },
  b: {
    requests: [studentRequest('026', 'certificate', 'Готова', seedDate, 'b-certificate')],
    documents: [
      doc('b-certificate', 'Справка об обучении', readyDate),
      doc('b-grades', 'Выписка об успеваемости', seedDate),
    ],
    notifications: [
      notification('b-ready', 'Справка об обучении готова', 'Заявка', 'Откройте заявку, чтобы скачать учебный образец PDF.', readyDate, '/requests?item=026'),
      notification('b-change', 'Перенос проектного семинара', 'Изменение', '23 ноября семинар начнётся в 14:40 в корпусе Б, ауд. 506.', dt('2026-11-23', '08:40'), '/schedule'),
      notification('b-signal', signal.title, 'Новость', 'Встречаемся 27 ноября в атриуме корпуса Б.', dt('2026-11-21', '15:00'), '/news/signal', true),
    ],
  },
}

