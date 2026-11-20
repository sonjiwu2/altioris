const birthDates = {
  a: '2006-04-17', b: '2006-01-26', c: '2006-05-21', d: '2006-08-03',
  e: '2006-02-14', f: '2006-07-28', g: '2005-11-09', h: '2006-03-11',
  i: '2006-06-19', j: '2005-10-25', k: '2006-03-12', l: '2006-08-25', m: '2005-12-07',
}

export const republic = 'Республика Вельтария'
export const lyceum = 'Лицей «Арден»'

export function profileDocumentsFor(account) {
  const { admissionYear, number } = account.profile
  const studentNumber = number.split('-')[1]
  const birthDate = birthDates[account.id]
  const birthYear = Number(birthDate.slice(0, 4))
  return [
    {
      id: `passport-${number.toLowerCase()}`, kind: 'passport', title: 'Паспорт',
      subtitle: republic, number: `VT-DEMO-${studentNumber}`, birthDate,
      issuedOn: (birthYear + 14) + birthDate.slice(4),
    },
    {
      id: `diploma-${number.toLowerCase()}`, kind: 'diploma', title: 'Аттестат о среднем общем образовании',
      subtitle: `${lyceum} · ${admissionYear}`, number: `AR-DEMO-${admissionYear}-${studentNumber}`,
      issuedOn: `${admissionYear}-06-25`,
    },
  ]
}
