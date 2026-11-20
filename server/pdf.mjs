import { readFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { gradesFor } from './fixtures.mjs'
import { academicTerms } from './academic-year.mjs'
import { drawProfileDocument } from './profile-document-pages.mjs'
import { drawRequestPage } from './request-pdf-pages.mjs'

const color = hex => hex.slice(1).match(/../g).map(value => (parseInt(value, 16) / 255).toFixed(4)).join(' ')
const encoded = text => Buffer.from(String(text), 'utf16le').swap16().toString('hex')
const stream = (data, extras) => Buffer.concat([
  Buffer.from('<< /Length '+data.length+' '+extras+' >>\nstream\n'),data,Buffer.from('\nendstream'),
])
const compressed = (data, extras='') => stream(deflateSync(data), '/Filter /FlateDecode '+extras)

function loadFont(name) {
  const program=readFileSync(new URL('./fonts/'+name+'.ttf',import.meta.url))
  const metrics=JSON.parse(readFileSync(new URL('./fonts/'+name+'.metrics.json',import.meta.url),'utf8'))
  const glyphs=Buffer.alloc(65536*2)
  for(const [code,[glyph]] of Object.entries(metrics.chars))glyphs.writeUInt16BE(glyph,Number(code)*2)
  return {name,metrics,program:compressed(program,'/Length1 '+program.length),mapping:compressed(glyphs)}
}

const fonts={F1:loadFont('GolosText-Regular'),F2:loadFont('Philosopher-Regular')}
const width=(text,size,font='F1')=>[...String(text)].reduce((sum,char)=>sum+(fonts[font].metrics.chars[char.codePointAt(0)]?.[1]??600),0)*size/1000
const readJpeg=(path,width,height)=>({width,height,data:readFileSync(new URL(path,import.meta.url))})
const sizes=JSON.parse(readFileSync(new URL('./document-art/sizes.json',import.meta.url),'utf8'))
const requestImages=Object.fromEntries(Object.entries(sizes).map(([key,size])=>[key,readJpeg('./document-art/'+key+'.jpg',...size)]))
const unicode=compressed('/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /AltiorisUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n1 beginbfrange\n<0000> <FFFF> <0000>\nendbfrange\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend')

function fontReference(add,key,cmap) {
  const {name,metrics,program,mapping}=fonts[key]
  const scale=value=>Math.round(value*1000/metrics.units)
  const font=add(program), glyphs=add(mapping)
  const descriptor=add('<< /Type /FontDescriptor /FontName /'+name+' /Flags 32 /FontBBox ['+metrics.bbox.map(scale).join(' ')+
    '] /ItalicAngle 0 /Ascent '+scale(metrics.ascent)+' /Descent '+scale(metrics.descent)+' /CapHeight '+scale(metrics.capHeight)+
    ' /StemV 80 /FontFile2 '+font+' 0 R >>')
  const widths=Object.entries(metrics.chars).map(([code,[,advance]])=>code+' ['+advance+']').join(' ')
  const descendant=add('<< /Type /Font /Subtype /CIDFontType2 /BaseFont /'+name+' /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>'+
    ' /FontDescriptor '+descriptor+' 0 R /CIDToGIDMap '+glyphs+' 0 R /DW 600 /W ['+widths+'] >>')
  const object=add('<< /Type /Font /Subtype /Type0 /BaseFont /'+name+' /Encoding /Identity-H /DescendantFonts ['+descendant+
    ' 0 R] /ToUnicode '+cmap+' 0 R >>')
  return '/'+key+' '+object+' 0 R'
}

function makePdf(title, pageSpecs, images={}, fontKeys=['F1']) {
  const objects=[]
  const add=object=>(objects.push(Buffer.isBuffer(object)?object:Buffer.from(object,'ascii')),objects.length)
  const cmap=add(unicode)
  const fontRefs=fontKeys.map(key=>fontReference(add,key,cmap)).join(' ')
  const imageRefs=Object.entries(images).map(([key,{data,width,height}])=>{
    const object=add(stream(data,'/Type /XObject /Subtype /Image /Width '+width+' /Height '+height+
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode'))
    return '/'+key+' '+object+' 0 R'
  }).join(' ')
  const pages=add('')
  const kids=pageSpecs.map(({pageWidth,pageHeight,draw})=>{
    const contents=add(compressed(draw))
    return add('<< /Type /Page /Parent '+pages+' 0 R /MediaBox [0 0 '+pageWidth+' '+pageHeight+
      '] /Resources << /Font << '+fontRefs+' >> /XObject << '+imageRefs+' >> >> /Contents '+contents+' 0 R >>')
  })
  objects[pages-1]=Buffer.from('<< /Type /Pages /Kids ['+kids.map(id=>id+' 0 R').join(' ')+'] /Count '+kids.length+' >>')
  const catalog=add('<< /Type /Catalog /Pages '+pages+' 0 R >>')
  const info=add('<< /Producer (Altioris University) /Title <FEFF'+encoded(title)+'> >>')
  const chunks=[Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n','latin1')], offsets=[]
  let length=chunks[0].length
  for(const [index,object] of objects.entries()){
    offsets.push(length)
    const chunk=Buffer.concat([Buffer.from((index+1)+' 0 obj\n'),object,Buffer.from('\nendobj\n')])
    chunks.push(chunk)
    length+=chunk.length
  }
  const xref='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'+offsets.map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')
  chunks.push(Buffer.from(xref+'trailer\n<< /Size '+(objects.length+1)+' /Root '+catalog+' 0 R /Info '+info+' 0 R >>\nstartxref\n'+length+'\n%%EOF\n'))
  return Buffer.concat(chunks)
}

function createCanvas(pageWidth,pageHeight) {
  const commands=[]
  const text=(value,x,y,size,fill,font='F1')=>commands.push('BT /'+font+' '+size+' Tf '+color(fill)+' rg 1 0 0 1 '+x+' '+(pageHeight-y)+' Tm <'+encoded(value)+'> Tj ET')
  const image=(key,x,y,w,h)=>commands.push('q '+w+' 0 0 '+h+' '+x+' '+(pageHeight-y-h)+' cm /'+key+' Do Q')
  return {
    pageWidth,pageHeight,text,width,image,
    center:(value,x,y,size,fill)=>text(value,x-width(value,size)/2,y,size,fill),
    rect:(x,y,w,h,fill)=>commands.push(color(fill)+' rg '+x+' '+(pageHeight-y-h)+' '+w+' '+h+' re f'),
    outline:(points,stroke,thickness=1,fill)=>{
      const path=points.map(([x,y],i)=>x+' '+(pageHeight-y)+' '+(i===0?'m':'l')).join(' ')
      commands.push('q '+color(stroke)+' RG '+thickness+' w '+(fill?color(fill)+' rg ':'')+path+(fill?' h B':' S')+' Q')
    },
    curves:(start,segments,fill)=>{
      const point=([x,y])=>x.toFixed(2)+' '+(pageHeight-y).toFixed(2)
      const path=segments.map(segment=>segment.map(point).join(' ')+' c').join(' ')
      commands.push(color(fill)+' rg '+point(start)+' m '+path+' h f')
    },
    paragraph(value,x,y,maxWidth,size,fill,leading,font){
      let line=''
      for(const word of String(value).split(/\s+/u)){
        const next=line?line+' '+word:word
        if(line&&width(next,size,font)>maxWidth){
          text(line,x,y,size,fill,font)
          line=word
          y+=leading
        }else line=next
      }
      if(line)text(line,x,y,size,fill,font)
    },
    portrait:(x,y,w,h)=>image('Portrait',x,y,w,h),
    result:()=>commands.join('\n'),
  }
}

export function studentPdf(document,student,account,grades=gradesFor(account,document.createdAt)) {
  const type=document.type??(/успеваемост/iu.test(document.title)?'transcript':'certificate')
  let period=null
  if(type==='transcript'){
    const issued=Date.parse(document.createdAt)
    const published=grades.filter(grade=>grade.published&&Date.parse(grade.assessedAt)<=issued)
    const term=academicTerms.findLast(term=>published.some(grade=>grade.termId===term.id))
    period={label:term?.sessionLabel??'Итоговые результаты',grades:published.filter(grade=>grade.termId===term?.id)}
  }
  return makePdf(document.title,[{
    pageWidth:595,pageHeight:842,
    draw:drawRequestPage(createCanvas(595,842),document,student,type,period),
  }],requestImages,['F1','F2'])
}

export function profileDocumentPdf(document,account) {
  const pageWidth=842,pageHeight=595
  const canvas=createCanvas(pageWidth,pageHeight)
  drawProfileDocument(canvas,document,account.profile.name)
  const images=document.kind==='passport'?{Portrait:readJpeg('./portraits/'+account.login+'.jpg',240,320)}:{}
  return makePdf(document.title,[{pageWidth,pageHeight,draw:canvas.result()}],images)
}
