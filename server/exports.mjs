export { studentPdf as demoPdf } from './pdf.mjs'

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

