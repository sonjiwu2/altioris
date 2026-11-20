const words=value=>value.normalize('NFC').toLocaleLowerCase('ru').replaceAll('ё','е').match(/[\p{L}\p{N}]+/gu)??[];
const startsWithAny=(words,term)=>words.some(word=>word.startsWith(term));

function matchPriority(teacher,terms){
 const name=words(teacher.shortName),fullName=words(teacher.name);
 if(terms.length===1&&name.includes(terms[0]))return 0;
 if(terms.every(term=>startsWithAny(name,term)))return 1;
 const anchoredName=terms.some(term=>startsWithAny(name,term));
 if(terms.length>1&&anchoredName&&terms.every(term=>startsWithAny(fullName,term)))return 2;

 const subject=words(teacher.subject);
 const withAbbreviations=subject.join(' ').replaceAll('программного обеспечения','по').replaceAll('баз данных','бд').split(' ');
 if(terms.every(term=>startsWithAny(subject,term)||withAbbreviations.includes(term)))return 3;
 if(terms.length===1&&fullName.includes(terms[0]))return 4;
 return Infinity;
}

export function searchTeachers(teachers,query,department=''){
 const terms=[...new Set(words(query))];
 const candidates=department?teachers.filter(teacher=>teacher.department===department):teachers;
 if(!terms.length)return candidates;
 return candidates.map(teacher=>({teacher,priority:matchPriority(teacher,terms)}))
  .filter(result=>Number.isFinite(result.priority))
  .sort((a,b)=>a.priority-b.priority)
  .map(result=>result.teacher);
}
