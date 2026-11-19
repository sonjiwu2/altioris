import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'
import { gradesFor } from './fixtures.mjs'

const font = readFileSync(new URL('./fonts/GolosText-Regular.ttf', import.meta.url))
const metrics = JSON.parse(readFileSync(new URL('./fonts/GolosText-Regular.metrics.json', import.meta.url), 'utf8'))
const glyphMap = Buffer.alloc(65536 * 2)
for (const [code, [glyph]] of Object.entries(metrics.chars)) glyphMap.writeUInt16BE(glyph, Number(code) * 2)
const navy = '#092b50', gold = '#b78b35', ink = '#203248', muted = '#617080', cream = '#faf5e8'
const color = hex => hex.slice(1).match(/../g).map(value => (parseInt(value, 16) / 255).toFixed(4)).join(' ')
const encoded = text => Buffer.from(String(text), 'utf16le').swap16().toString('hex')
const width = (text, size) => [...String(text)].reduce((sum, char) => sum + (metrics.chars[char.codePointAt(0)]?.[1] ?? 600), 0) * size / 1000
function compressedStream(value, extra = '') {
  const data = deflateSync(Buffer.isBuffer(value) ? value : Buffer.from(value, 'ascii'))
  return Buffer.concat([Buffer.from('<< /Length ' + data.length + ' /Filter /FlateDecode ' + extra + ' >>\nstream\n'), data, Buffer.from('\nendstream')])
}

export function studentPdf(document, student, account) {
  const commands = []
  const text = (value, x, top, size = 11, fill = ink) => commands.push('BT /F1 ' + size + ' Tf ' + color(fill) + ' rg 1 0 0 1 ' + x + ' ' + (842 - top) + ' Tm <' + encoded(value) + '> Tj ET')
  const center = (value, top, size, fill = ink) => text(value, (595 - width(value, size)) / 2, top, size, fill)
  const rect = (x, y, w, h, fill, stroke) => commands.push('q ' + color(fill) + ' rg ' + (stroke ? color(stroke) + ' RG .7 w ' : '') + x + ' ' + (842 - y - h) + ' ' + w + ' ' + h + ' re ' + (stroke ? 'B' : 'f') + ' Q')
  const rule = (y, x1 = 42, x2 = 553, stroke = '#dfd8ca') => commands.push('q ' + color(stroke) + ' RG .6 w ' + x1 + ' ' + (842 - y) + ' m ' + x2 + ' ' + (842 - y) + ' l S Q')
  const paragraph = (value, x, top, maxWidth = 510, size = 11, fill = ink, leading = 17) => {
    let line = '', y = top
    for (const word of String(value).split(/\s+/u)) {
      const next = line ? line + ' ' + word : word
      if (line && width(next, size) > maxWidth) { text(line, x, y, size, fill); line = word; y += leading } else line = next
    }
    if (line) text(line, x, y, size, fill)
    return y + leading
  }
  const issued = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(document.createdAt))
  const number = 'ALT-' + new Date(document.createdAt).getUTCFullYear() + '-' + String(createHash('sha256').update(document.id).digest().readUInt32BE(0) % 1_000_000).padStart(6, '0')
  const transcript = /успеваемост/iu.test(document.title)
  rect(0, 0, 595, 111, navy)
  commands.push('q ' + color(gold) + ' RG 1.4 w 54 804 m 73 811 l 92 804 l 90 776 l 73 759 l 56 776 l h S Q')
  text('A', 64, 68, 27, '#e6c46e')
  text('ALTIORIS UNIVERSITY', 111, 51, 21, '#fff9e8')
  text('Учебный офис · Нижний Новгород', 112, 74, 10, '#e2d7b9')
  text('ДЕМОНСТРАЦИОННЫЙ ПОРТАЛ', 112, 94, 8.5, '#e2d7b9')
  rect(0, 111, 595, 3, gold)
  center(transcript ? 'ВЫПИСКА ОБ УСПЕВАЕМОСТИ' : 'СПРАВКА ОБ ОБУЧЕНИИ', 154, 18, navy)
  text('№ ' + number, 42, 181, 9.5, muted)
  text(issued, 553 - width(issued, 9.5), 181, 9.5, muted)
  rule(195, 42, 553, gold)

  if (transcript) {
    text(student.name, 42, 220, 14, navy)
    paragraph(student.program + ' · ' + student.year + ' курс · ' + student.group, 42, 240, 510, 9.5, muted, 14)
    const grades = gradesFor(account)
    const top = 271, rowHeight = 38
    rect(42, top, 511, 28, navy)
    text('Дисциплина', 53, top + 19, 9.5, '#ffffff')
    text('Кредиты', 355, top + 19, 9.5, '#ffffff')
    text('Оценка', 423, top + 19, 9.5, '#ffffff')
    text('Результат', 474, top + 19, 9.5, '#ffffff')
    for (const [index, grade] of grades.entries()) {
      const y = top + 28 + index * rowHeight
      if (index % 2 === 0) rect(42, y, 511, rowHeight, cream)
      text(grade.title, 53, y + 23, 9.2)
      text(String(grade.credits), 370, y + 23, 10)
      text(grade.mark == null ? '—' : String(grade.mark), 438, y + 23, 10)
      text(grade.retakeDate ? 'Пересдача' : grade.mark == null ? grade.result : grade.mark >= 4 ? 'Завершено' : 'Пересдача', 474, y + 23, 8)
      rule(y + rowHeight)
    }
    const numeric = grades.filter(grade => typeof grade.mark === 'number')
    const credits = numeric.reduce((sum, grade) => sum + grade.credits, 0)
    const mean = numeric.length ? numeric.reduce((sum, grade) => sum + grade.mark, 0) / numeric.length : null
    const gpa = credits ? numeric.reduce((sum, grade) => sum + grade.mark * grade.credits, 0) / credits : null
    const format = value => value == null ? '—' : value.toFixed(2).replace('.', ',')
    const summaryY = top + 28 + grades.length * rowHeight + 24
    rect(42, summaryY, 511, 62, cream, '#d7c399')
    text('СРЕДНИЙ БАЛЛ', 58, summaryY + 20, 8.5, muted)
    text(format(mean), 58, summaryY + 46, 18, navy)
    text('GPA С УЧЁТОМ КРЕДИТОВ', 250, summaryY + 20, 8.5, muted)
    text(format(gpa), 250, summaryY + 46, 18, navy)
    paragraph('GPA рассчитывается по числовым оценкам с учётом веса дисциплины в кредитах. Зачёты без числовой оценки не участвуют в расчёте. Данные соответствуют текущей демонстрационной учебной записи.', 42, summaryY + 87, 510, 9, muted, 14)
  } else {
    rect(42, 216, 511, 72, cream, '#e7dcc3')
    text('СТУДЕНТ', 58, 237, 8.5, muted)
    paragraph(student.name, 58, 263, 477, 15, navy, 20)
    let y = paragraph('Настоящим подтверждается, что указанный студент обучается в демонстрационном университете Altioris University по следующим учебным сведениям.', 42, 319, 510, 11, ink, 18)
    y += 17
    for (const [label, value] of [
      ['Факультет', student.faculty], ['Образовательная программа', student.program],
      ['Курс / группа', student.year + ' курс · ' + student.group], ['Форма обучения', student.form],
      ['Год поступления', student.admissionYear], ['Кампус', student.campus],
      ['Номер студенческого билета', student.number], ['Учебная почта', student.email],
    ]) {
      text(label, 42, y, 9.2, muted)
      const bottom = paragraph(String(value), 238, y, 315, 10.2, ink, 15)
      rule(bottom + 4)
      y = bottom + 23
    }
    paragraph('Справка сформирована автоматически по сведениям личного кабинета и предназначена для демонстрации работы сервиса. Все указанные сведения вымышлены.', 42, Math.min(y + 16, 708), 510, 9.5, muted, 15)
  }
  commands.push('q /Watermark gs ' + color('#76889a') + ' rg BT /F1 36 Tf .8192 .5736 -.5736 .8192 115 290 Tm <' + encoded('УЧЕБНЫЙ ОБРАЗЕЦ') + '> Tj ET Q')
  rule(758, 42, 553, gold)
  text('УЧЕБНЫЙ ОБРАЗЕЦ · СИНТЕТИЧЕСКИЕ ДАННЫЕ', 42, 780, 9, navy)
  paragraph('Не является официальным документом об обучении и не предназначен для предъявления в организации.', 42, 797, 511, 8, muted, 12)
  text('Altioris University · Сформировано автоматически', 42, 825, 7.5, muted)
  text('1 / 1', 533, 825, 7.5, muted)

  const objects = []
  const add = object => (objects.push(Buffer.isBuffer(object) ? object : Buffer.from(object, 'ascii')), objects.length)
  const fontFile = add(compressedStream(font, '/Length1 ' + font.length))
  const cidMap = add(compressedStream(glyphMap))
  const scale = value => Math.round(value * 1000 / metrics.units)
  const descriptor = add('<< /Type /FontDescriptor /FontName /GolosText-Regular /Flags 32 /FontBBox [' + metrics.bbox.map(scale).join(' ') + '] /ItalicAngle 0 /Ascent ' + scale(metrics.ascent) + ' /Descent ' + scale(metrics.descent) + ' /CapHeight ' + scale(metrics.capHeight) + ' /StemV 80 /FontFile2 ' + fontFile + ' 0 R >>')
  const widths = Object.entries(metrics.chars).map(([code, [, advance]]) => code + ' [' + advance + ']').join(' ')
  const descendant = add('<< /Type /Font /Subtype /CIDFontType2 /BaseFont /GolosText-Regular /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ' + descriptor + ' 0 R /CIDToGIDMap ' + cidMap + ' 0 R /DW 600 /W [' + widths + '] >>')
  const cmap = add(compressedStream('/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /AltiorisUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n1 beginbfrange\n<0000> <FFFF> <0000>\nendbfrange\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend'))
  const fontObject = add('<< /Type /Font /Subtype /Type0 /BaseFont /GolosText-Regular /Encoding /Identity-H /DescendantFonts [' + descendant + ' 0 R] /ToUnicode ' + cmap + ' 0 R >>')
  const opacity = add('<< /Type /ExtGState /ca .09 /CA .09 >>')
  const contents = add(compressedStream(commands.join('\n')))
  const page = add(''), pages = add('')
  objects[page - 1] = Buffer.from('<< /Type /Page /Parent ' + pages + ' 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ' + fontObject + ' 0 R >> /ExtGState << /Watermark ' + opacity + ' 0 R >> >> /Contents ' + contents + ' 0 R >>')
  objects[pages - 1] = Buffer.from('<< /Type /Pages /Kids [' + page + ' 0 R] /Count 1 >>')
  const catalog = add('<< /Type /Catalog /Pages ' + pages + ' 0 R >>')
  const info = add('<< /Producer (Altioris University) /Title <FEFF' + encoded(document.title) + '> >>')
  const chunks = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')], offsets = [0]
  let length = chunks[0].length
  for (const [index, object] of objects.entries()) {
    offsets.push(length)
    const chunk = Buffer.concat([Buffer.from((index + 1) + ' 0 obj\n'), object, Buffer.from('\nendobj\n')])
    chunks.push(chunk); length += chunk.length
  }
  const xref = 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n' + offsets.slice(1).map(offset => String(offset).padStart(10, '0') + ' 00000 n \n').join('')
  chunks.push(Buffer.from(xref + 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root ' + catalog + ' 0 R /Info ' + info + ' 0 R >>\nstartxref\n' + length + '\n%%EOF\n'))
  return Buffer.concat(chunks)
}

