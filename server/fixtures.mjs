export const demoClock = '2026-11-23T10:05:00+03:00'

export const teachers = [
  { id: 'voronova', name: 'Надежда Леонидовна Воронова', shortName: 'Надежда Воронова', subject: 'Архитектура ПО', role: 'Доцент', office: 'Б · каб. 418', consultation: 'Четверг, 16:20', experience: '11 лет' },
  { id: 'krylov', name: 'Сергей Андреевич Крылов', shortName: 'Сергей Крылов', subject: 'Базы данных', role: 'Преподаватель', office: 'Б · каб. 308', consultation: 'Вторник, 16:20', experience: '8 лет' },
  { id: 'pavlova', name: 'Елена Михайловна Павлова', shortName: 'Елена Павлова', subject: 'Проектный семинар', role: 'Преподаватель', office: 'Б · каб. 506', consultation: 'Среда, 16:20', experience: '7 лет' },
  { id: 'sokolov', name: 'Михаил Андреевич Сафонов', shortName: 'Михаил Сафонов', subject: 'Алгоритмы', role: 'Преподаватель', office: 'А · каб. 204', consultation: 'Понедельник, 16:20', experience: '9 лет' },
].map((teacher) => ({ ...teacher, department: teacher.id === 'voronova' ? 'программной инженерии' : teacher.id === 'krylov' ? 'информационных систем' : teacher.id === 'pavlova' ? 'проектной деятельности' : 'информатики', subjects: teacher.id === 'voronova' ? [teacher.subject, 'Операционные системы'] : [teacher.subject], bio: teacher.id === 'voronova' ? 'Ведёт курсы по архитектуре приложений и распределённым системам. Помогает студентам проектировать надёжные программные решения и развивать исследовательские проекты.' : teacher.id === 'krylov' ? 'Занимается моделированием данных и информационными системами. На занятиях сочетает теоретические основы с практикой проектирования и работы с базами данных.' : teacher.id === 'pavlova' ? 'Курирует студенческие проекты: от первой идеи до работающего прототипа. Помогает с исследованием, командной работой и подготовкой презентаций.' : 'Преподаёт алгоритмы и теорию вычислений. Разбирает сложные темы на практических примерах и ведёт консультации по подготовке к экзаменам.', campus: 'Нижний Новгород', email: `${teacher.id}@altioris.example` }))

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


const additionalStudents = [
  ['c', 'orlova', 'Екатерина Андреевна Орлова', 'Екатерина Орлова', 'ЕО', '241', [10, 9, 9, 8, null]],
  ['d', 'gromov', 'Никита Павлович Громов', 'Никита Громов', 'НГ', '242', [7, 8, 9, 8, null]],
  ['e', 'belova', 'Кира Максимовна Белова', 'Кира Белова', 'КБ', '241', [8, 8, 7, 7, null]],
  ['f', 'serov', 'Тимур Ильич Серов', 'Тимур Серов', 'ТС', '242', [6, 7, 7, 5, null]],
  ['g', 'lanskaya', 'Мария Денисовна Ланская', 'Мария Ланская', 'МЛ', '241', [9, 7, 8, 9, null]],
  ['h', 'severin', 'Иван Александрович Северин', 'Иван Северин', 'ИС', '242', [8, 9, 6, 8, null]],
  ['i', 'rudin', 'Денис Михайлович Рудин', 'Денис Рудин', 'ДР', '241', [5, 6, 8, 7, null]],
  ['j', 'lesina', 'Виктория Олеговна Лесина', 'Виктория Лесина', 'ВЛ', '242', [10, 8, 10, 9, null]],
  ['k', 'melnikov', 'Артём Николаевич Мельников', 'Артём Мельников', 'АМ', '241', [6, 5, 7, 4, null]],
  ['l', 'safonova', 'Полина Игоревна Сафонова', 'Полина Сафонова', 'ПС', '242', [9, 10, 8, 10, null]],
  ['m', 'volkov', 'Алексей Сергеевич Волков', 'Алексей Волков', 'АВ', '241', [4, 6, 5, 3, null]],
]
for (const [index, [id, login, name, shortName, initials, group, marks]] of additionalStudents.entries()) {
  accounts.push({
    id, login, passwordEnv: `ALTIORIS_PASSWORD_${id.toUpperCase()}`, marks,
    profile: { ...sharedProfile, name, shortName, initials, group: `КНТ-${group}`,
      email: `${login}@altioris.example`, number: `ALT-${2501 + index}` },
  })
}

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

function summarize(grades) {
  const numeric = grades.filter(({ mark }) => mark !== null)
  const credits = numeric.reduce((sum, grade) => sum + grade.credits, 0)
  return {
    mean: numeric.length ? numeric.reduce((sum, grade) => sum + grade.mark, 0) / numeric.length : null,
    gpa: credits ? numeric.reduce((sum, grade) => sum + grade.mark * grade.credits, 0) / credits : null,
  }
}

export function rankingFor(account, grades, cohort = accounts) {
  const { mean, gpa } = summarize(grades)
  const peers = cohort.map((student) => {
    const [first, last] = student.profile.shortName.split(' ')
    return { id: student.id, name: student.profile.shortName, initials: student.profile.initials,
      gpa: student.id === account.id ? gpa : summarize(gradesFor(student)).gpa }
  }).filter((student) => student.gpa !== null)
    .sort((a, b) => b.gpa - a.gpa || a.name.localeCompare(b.name, 'ru'))
    .map((student, index) => ({ rank: index + 1, id: student.id, initials: student.initials, name: student.name, gpa: student.gpa, self: student.id === account.id }))
  return { mean, gpa, rank: peers.find((student) => student.self)?.rank ?? null, total: peers.length, peers }
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

