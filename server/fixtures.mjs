import { faculty } from './faculty.mjs'
import { academicGrades, academicTerms, courseForTeacher, timetableFor } from './academic-year.mjs'

export const demoClock = '2026-11-23T10:05:00+03:00'

export const teachers = faculty.map(teacher => {
  const course = courseForTeacher(teacher.id)
  return { ...teacher, subject: course.title, courseId: course.id }
})

const sharedProfile = {
  faculty: 'Цифровых технологий', program: 'Компьютерные науки и технологии',
  year: 3, form: 'Очная', campus: 'Нижний Новгород', admissionYear: 2024,
}
const groupName = index => `${String(sharedProfile.admissionYear).slice(-2)}КНТ-${index+1}`

export const accounts = [
  {
    id: 'a', login: 'vetrova', passwordEnv: 'ALTIORIS_PASSWORD_A', groupIndex: 0,
    profile: {
      ...sharedProfile, name: 'Алина Романовна Ветрова', shortName: 'Алина Ветрова', initials: 'АВ',
      group: groupName(0), email: 'a.vetrova@altioris.example', number: 'ALT-02481',
    },
    marks: [9, 8, 7, 3, null],
  },
  {
    id: 'b', login: 'zolotov', passwordEnv: 'ALTIORIS_PASSWORD_B', groupIndex: 1,
    profile: {
      ...sharedProfile, name: 'Мирон Олегович Золотов', shortName: 'Мирон Золотов', initials: 'МЗ',
      group: groupName(1), email: 'm.zolotov@altioris.example', number: 'ALT-02496',
    },
    marks: [7, 9, 8, 6, null],
  },
]


const additionalStudents = [
  ['c', 'orlova', 'Екатерина Андреевна Орлова', 'Екатерина Орлова', 'ЕО', 0, [10, 9, 9, 8, null]],
  ['d', 'gromov', 'Никита Павлович Громов', 'Никита Громов', 'НГ', 1, [7, 8, 9, 8, null]],
  ['e', 'belova', 'Кира Максимовна Белова', 'Кира Белова', 'КБ', 0, [8, 8, 7, 7, null]],
  ['f', 'serov', 'Тимур Ильич Серов', 'Тимур Серов', 'ТС', 1, [6, 7, 7, 5, null]],
  ['g', 'lanskaya', 'Мария Денисовна Ланская', 'Мария Ланская', 'МЛ', 0, [9, 7, 8, 9, null]],
  ['h', 'severin', 'Иван Александрович Северин', 'Иван Северин', 'ИС', 1, [8, 9, 6, 8, null]],
  ['i', 'rudin', 'Денис Михайлович Рудин', 'Денис Рудин', 'ДР', 0, [5, 6, 8, 7, null]],
  ['j', 'lesina', 'Виктория Олеговна Лесина', 'Виктория Лесина', 'ВЛ', 1, [10, 8, 10, 9, null]],
  ['k', 'melnikov', 'Артём Николаевич Мельников', 'Артём Мельников', 'АМ', 0, [6, 5, 7, 4, null]],
  ['l', 'safonova', 'Полина Игоревна Сафонова', 'Полина Сафонова', 'ПС', 1, [9, 10, 8, 10, null]],
  ['m', 'volkov', 'Алексей Сергеевич Волков', 'Алексей Волков', 'АВ', 0, [4, 6, 5, 3, null]],
]
for (const [index, [id, login, name, shortName, initials, groupIndex, marks]] of additionalStudents.entries()) {
  accounts.push({
    id, login, passwordEnv: `ALTIORIS_PASSWORD_${id.toUpperCase()}`, groupIndex, marks,
    profile: { ...sharedProfile, name, shortName, initials, group: groupName(groupIndex),
      email: `${login}@altioris.example`, number: `ALT-${2501 + index}` },
  })
}

export function campusFor(owner, clock) {
  const account = accounts.find(({ id }) => id === owner)
  return { ...timetableFor(account, clock), teachers }
}

export function gradesFor(account, clock = demoClock) {
  return academicGrades(account, clock)
}

function summarize(grades) {
  const numeric = grades.filter(({ mark }) => mark !== null)
  const credits = numeric.reduce((sum, grade) => sum + grade.credits, 0)
  return {
    mean: numeric.length ? numeric.reduce((sum, grade) => sum + grade.mark, 0) / numeric.length : null,
    gpa: credits ? numeric.reduce((sum, grade) => sum + grade.mark * grade.credits, 0) / credits : null,
  }
}

const sessionSeasons = academicTerms.map(term=>({
  id:term.id,
  label:term.sessionLabel,
  publishedAt:new Date(Date.parse(term.end+'T00:00:00+03:00')+86_400_000).toISOString(),
}))

export function rankingFor(account, grades, cohort = accounts, clock = demoClock) {
  const now=Date.parse(clock)
  const nextSeason=sessionSeasons.find(season=>Date.parse(season.publishedAt)>now)??null
  const records=cohort.map(student=>({student, grades:student.id===account.id?grades:gradesFor(student,clock)}))
  const seasons=[]
  let previousPlaces=new Map()
  for(const season of sessionSeasons){
    if(Date.parse(season.publishedAt)>now) break
    const standings=records.map(({student,grades})=>({student,...summarize(grades.filter(grade=>grade.termId===season.id))}))
      .filter(record=>record.gpa!==null)
      .sort((a,b)=>b.gpa-a.gpa || a.student.profile.shortName.localeCompare(b.student.profile.shortName,'ru') || a.student.id.localeCompare(b.student.id))
    const peers=standings.map(({student,gpa},index)=>{
      const rank=index+1,previous=previousPlaces.get(student.id)
      return {rank,change:previous===undefined?null:previous-rank,id:student.id,initials:student.profile.initials,
        name:student.profile.shortName,gpa,self:student.id===account.id}
    })
    const own=peers.find(peer=>peer.self)
    const mean=own?standings[own.rank-1].mean:null
    seasons.push({...season,mean,gpa:own?.gpa??null,rank:own?.rank??null,change:own?.change??null,total:peers.length,peers})
    previousPlaces=new Map(peers.map(peer=>[peer.id,peer.rank]))
  }
  const latest=seasons.at(-1)??{mean:null,gpa:null,rank:null,change:null,total:0,peers:[]}
  return {...latest,seasons,nextSeason}
}

export const requestTypes = new Map([
  ['certificate', 'Справка об обучении'],
  ['transcript', 'Выписка об успеваемости'],
  ['academic-leave', 'Академический отпуск'],
  ['dormitory', 'Справка для общежития'],
  ['media-lab', 'Запись в медиалабораторию'],
])
