import { gradesFor } from './fixtures.mjs'

const utf8Size = (text) => Buffer.byteLength(text, 'utf8')

function calendarText(value) {
  return value.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll(/\r?\n/g, '\\n')
}

function foldLine(line) {
  const lines = ['']
  let byteCount = 0
  for (const char of line) {
    const charSize = utf8Size(char)
    if (byteCount + charSize > 75) {
      lines.push(' ')
      byteCount = 1
    }
    lines[lines.length - 1] += char
    byteCount += charSize
  }
  return lines
}

function utcStamp(value) {
  return new Date(value).toISOString().replaceAll(/[-:]|\.\d{3}/g, '')
}

export function calendar(events, clock) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Altioris//Campus Calendar//RU', 'CALSCALE:GREGORIAN']
  for (const event of events) {
    if (!event.start || !event.end) continue
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@altioris.example`,
      `DTSTAMP:${utcStamp(clock)}`,
      `DTSTART:${utcStamp(event.start)}`,
      `DTEND:${utcStamp(event.end)}`,
      `SUMMARY:${calendarText(event.title)}`,
      `LOCATION:${calendarText(event.room)}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR', '')
  return lines.flatMap(foldLine).join('\r\n')
}

// An authored 5 × 7 vector alphabet renders on any PDF viewer without an external font.
const alphabet = {
  ' ': '', А: '0E11111F111111', Б: '1F101E1111111E', В: '1E11111E11111E',
  Г: '1F101010101010', Д: '07151515151F11', Е: '1F10101E10101F', Ё: '0A001F101E101F',
  Ж: '1515150E151515', З: '1E01010601011E', И: '11131519111111', Й: '0A041113151911',
  К: '11121418141211', Л: '07151111111111', М: '111B1515111111', Н: '1111111F111111',
  О: '0E11111111110E', П: '1F111111111111', Р: '1E11111E101010', С: '0F10101010100F',
  Т: '1F040404040404', У: '1111110F01010E', Ф: '041F1515151F04', Х: '11110A040A1111',
  Ц: '12121212121F01', Ч: '1111110F010101', Ш: '1515151515151F', Щ: '15151515151F01',
  Ъ: '1810080E09090E', Ы: '1111111D15151D', Ь: '1010101E11111E', Э: '1E01010F01011E',
  Ю: '1215151D151512', Я: '0F11110F050911',
  A: '0E11111F111111', L: '1010101010101F', T: '1F040404040404', O: '0E11111111110E',
  R: '1E11111E141211', I: '0E04040404040E', S: '0F10100E01011E',
  0: '0E11131519110E', 1: '040C040404040E', 2: '0E11010204081F', 3: '1E01010601011E',
  4: '02060A121F0202', 5: '1F101E0101011E', 6: '0E10101E11110E', 7: '1F010204080808',
  8: '0E11110E11110E', 9: '0E11110F01010E', '-': '0000001F000000', '—': '0000001F000000',
  '·': '00000004000000', '.': '00000000000004', '/': '01020204080810', ':': '00040000040000',
}
const glyphs = new Map(Object.entries(alphabet).map(([character, rows], index) => [character, {
  rows, code: (index + 1).toString(16).padStart(2, '0').toUpperCase(), name: `letter${index + 1}`,
}]))

function show(text, x, y, size) {
  const encoded = [...text.toUpperCase()].map((char) => (glyphs.get(char) ?? glyphs.get(' ')).code).join('')
  return `BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm <${encoded}> Tj ET`
}

function drawGlyph(rows) {
  const shapes = []
  for (const [y, row] of (rows.match(/../g) ?? []).entries()) {
    for (let x = 0; x < 5; x += 1) {
      if (parseInt(row, 16) & (1 << (4 - x))) shapes.push(`${x * 90} ${(6 - y) * 90} 90 90 re`)
    }
  }
  return ['540 0 0 0 450 630 d1', ...shapes, shapes.length ? 'f' : ''].join('\n')
}

const stream = (contents) => `<< /Length ${utf8Size(contents)} >>\nstream\n${contents}\nendstream`

export function demoPdf(document, student, account) {
  const day = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow' }).format(new Date(document.createdAt))
  const academicRecord = document.title === 'Выписка об успеваемости'
  const lines = [
    '0.97 0.95 0.94 rg 54 677 487 108 re f',
    '0.24 0.12 0.22 rg',
    show('Altioris', 75, 752, 25),
    show(document.title, 75, 707, 22),
    show(student.name, 75, 627, 15),
    show(`Группа ${student.group} · ${day}`, 75, 595, 12),
  ]
  if (academicRecord) {
    for (const [i, grade] of gradesFor(account).entries()) {
      lines.push(show(`${grade.title}  ${grade.mark ?? grade.result}`, 75, 540 - i * 28, 12))
    }
  } else {
    lines.push(show('Студент учится по очной форме', 75, 540, 12))
  }
  lines.push(
    '0.34 0.16 0.26 RG 75 123 m 520 123 l S',
    show('Учебный образец · Конкурсный прототип', 75, 99, 13),
    show('Данные вымышлены. Образец не имеет юридической силы.', 75, 77, 11),
  )
  const glyphObjects = [...glyphs.values()]
  const font = `<< /Type /Font /Subtype /Type3 /FontBBox [0 0 450 630] /FontMatrix [.001 0 0 .001 0 0]
    /CharProcs << ${glyphObjects.map(({ name }, index) => `/${name} ${8 + index} 0 R`).join(' ')} >>
    /Encoding << /Type /Encoding /Differences [1 ${glyphObjects.map(({ name }) => `/${name}`).join(' ')}] >>
    /FirstChar 1 /LastChar ${glyphObjects.length} /Widths [${glyphObjects.map(() => '540').join(' ')}]
    /Resources << >> /ToUnicode 7 0 R >>`
  const cmap = [
    '/CIDInit /ProcSet findresource begin', '12 dict begin', 'begincmap',
    '/CIDSystemInfo << /Registry (Altioris) /Ordering (Letters) /Supplement 0 >> def',
    '/CMapName /AltiorisLetters def', '/CMapType 2 def',
    '1 begincodespacerange', '<00> <FF>', 'endcodespacerange', `${glyphs.size} beginbfchar`,
    ...[...glyphs].map(([char, { code }]) => `<${code}> <${char.codePointAt(0).toString(16).padStart(4, '0')}>`),
    'endbfchar', 'endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end',
  ].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    stream(lines.join('\n')), font, '<< /Creator (Altioris) >>', stream(cmap),
    ...glyphObjects.map(({ rows }) => stream(drawGlyph(rows))),
  ]
  let output = '%PDF-1.4\n'
  const offsets = []
  for (const [index, object] of objects.entries()) {
    offsets.push(utf8Size(output))
    output += `${index + 1} 0 obj\n${object}\nendobj\n`
  }
  const xref = utf8Size(output)
  output += [
    'xref', `0 ${objects.length + 1}`, '0000000000 65535 f ',
    ...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
    'trailer', `<< /Root 1 0 R /Info 6 0 R /Size ${objects.length + 1} >>`, 'startxref', String(xref), '%%EOF\n',
  ].join('\n')
  return Buffer.from(output, 'utf8')
}

