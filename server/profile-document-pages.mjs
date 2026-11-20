import { lyceum, republic } from './profile-documents.mjs'

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  timeZone:'Europe/Moscow', day:'numeric', month:'long', year:'numeric',
})
const date = value => dateFormat.format(new Date(value + 'T12:00:00+03:00'))
const frame = (canvas,x,y,w,h,ink,weight=1) => canvas.outline([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],ink,weight)

function leaf(canvas,x,y,size,angle,fill) {
  const cos=Math.cos(angle), sin=Math.sin(angle)
  const turn=([u,v])=>[x+size*(u*cos-v*sin),y+size*(u*sin+v*cos)]
  const shape=[[[.29,-.38],[.73,-.21],[1,0]],[[.73,.21],[.29,.38],[0,0]]]
  canvas.curves([x,y],shape.map(segment=>segment.map(turn)),fill)
  canvas.outline([[x,y],turn([.75,0])],'#c7c5a0',.35)
}

function sprig(canvas,x,y,scale,direction) {
  const olive='#74804c', sage='#a1a779'
  canvas.outline([[x,y],[x+direction*22*scale,y-12*scale],[x+direction*46*scale,y-16*scale]],olive,.8)
  for (const [distance,drop] of [[6,4],[20,10],[34,14]]) {
    const px=x+distance*scale*direction, py=y-drop*scale
    leaf(canvas,px,py,16*scale,direction>0?-1.04:-2.10,olive)
    leaf(canvas,px,py,14*scale,direction>0?.3:2.84,sage)
  }
}

function star(canvas,x,y,size,ink) {
  canvas.outline([[x,y-size],[x+size*.16,y-size*.16],[x+size,y],[x+size*.16,y+size*.16],
    [x,y+size],[x-size*.16,y+size*.16],[x-size,y],[x-size*.16,y-size*.16]],ink,.8,ink)
}

function passport(canvas, document, name) {
  const {rect,outline,text,center,portrait,width}=canvas
  const paper='#ebdcd8', cream='#f7ede6', wine='#492f44', gold='#a87856', muted='#6f4a59'
  rect(0,0,842,595,'#f8efe3')
  rect(22,22,798,551,wine)
  rect(32,32,385,531,paper)
  rect(425,32,385,531,cream)
  frame(canvas,41,41,367,513,gold,1.25)
  frame(canvas,434,41,367,513,gold,1.25)
  frame(canvas,48,48,353,499,'#c7a69d',.55)
  frame(canvas,441,48,353,499,'#c7a69d',.55)
  for (const radius of [46,61,78]) {
    const points=Array.from({length:49},(_,step)=>{
      const angle=step*Math.PI/24
      return [224+radius*Math.cos(angle),172+radius*Math.sin(angle)]
    })
    outline(points,'#ad8574',.55)
  }
  star(canvas,224,172,40,'#916149')
  star(canvas,136,125,7,gold)
  star(canvas,311,132,5,gold)
  center('Республика',224,303,23,wine)
  center('Вельтария',224,349,39,wine)
  outline([[48,473],[105,420],[134,442],[190,390],[238,438],[270,413],[300,439],[347,408],[401,458],
    [401,496],[48,496]],'#b38d89',.8,'#d9bebb')
  outline([[49,483],[95,451],[122,470],[197,431],[246,472],[286,445],[324,469],[368,439],[401,470],
    [401,501],[49,501]],'#a88485',.6,'#cfafad')
  rect(57,501,334,28,wine)
  center('ВЫМЫШЛЕННЫЙ ДОКУМЕНТ',224,519,11,cream)

  center('Паспорт',618,112,38,wine)
  outline([[478,129],[600,129]],gold)
  star(canvas,618,129,8,gold)
  outline([[636,129],[758,129]],gold)
  frame(canvas,458,184,128,168,gold,1.05)
  portrait(462,188,120,160)
  let y=205
  for (const word of name.split(' ')) {
    text(word,607,y,Math.min(20,166/width(word,1)),wine)
    y+=25
  }
  for (const [label,value,top] of [
    ['Номер',document.number,292],
    ['Дата рождения',date(document.birthDate),372],
    ['Дата выдачи',date(document.issuedOn),452],
  ]) {
    outline([[607,top-16],[774,top-16]],'#d3b6a5',.7)
    text(label,607,top,10,muted)
    text(value,607,top+23,14,wine)
  }
  center('Вымышленный документ · Altioris University',618,521,9.5,muted)
}

function diploma(canvas, document, name) {
  const {rect,outline,center,width,text}=canvas
  const paper='#fbf1dd', olive='#424a2b', brick='#933f2d', gold='#ac8851', sage='#90996b'
  rect(0,0,842,595,paper)
  frame(canvas,16,16,810,563,sage,2)
  frame(canvas,23,23,796,549,brick,.9)
  frame(canvas,31,31,780,533,gold,.6)
  for (const [x,direction] of [[38,1],[804,-1]]) {
    sprig(canvas,x,101,2.5,direction)
    sprig(canvas,x,177,1.4,direction)
    sprig(canvas,x,517,1.05,direction)
    sprig(canvas,x,548,1.25,direction)
  }
  sprig(canvas,462,108,1.37,1)
  sprig(canvas,380,108,1.37,-1)
  outline([[373,82],[389,70],[408,71],[421,82],[433,71],[453,70],[469,82],[469,106],[449,99],[431,102],[421,109],[411,102],[392,99],[373,106]],gold,1.4,'#f6dfba')
  outline([[421,83],[421,107]],gold,.85)
  center(republic,421,137,13,olive)
  center(lyceum,421,166,20,olive)
  outline([[318,188],[404,188]],sage)
  star(canvas,421,188,8,gold)
  outline([[438,188],[524,188]],sage)
  center('Аттестат',421,247,49,brick)
  center('о среднем общем образовании',421,282,25,brick)
  rect(116,308,610,3,'#e8d9b4')
  center(name,421,365,Math.min(33,650/width(name,1)),olive)
  center('Освоена программа среднего общего образования',421,406,14,olive)
  center(lyceum,421,434,14,olive)
  outline([[300,463],[400,463]],sage)
  star(canvas,421,463,9,gold)
  outline([[442,463],[542,463]],sage)
  text(date(document.issuedOn),108,523,13,olive)
  center('ВЫМЫШЛЕННЫЙ ДОКУМЕНТ',421,523,11.5,brick)
  text(document.number,590,523,13,olive)
}

export function drawProfileDocument(canvas, document, name) {
  if (document.kind==='passport') passport(canvas,document,name)
  else diploma(canvas,document,name)
}
