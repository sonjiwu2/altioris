let previewUrl, generation=0;
export function disposePhotoPreview(){
 generation++;
 if(previewUrl)URL.revokeObjectURL(previewUrl);
 previewUrl=undefined;
}
export async function preparePhoto(input){
 disposePhotoPreview();
 const ticket=generation,form=input.form,error=form.querySelector('.form-error'),save=form.querySelector('[data-photo-save]');
 form.photoBlob=undefined;save.disabled=true;error.hidden=true;
 const file=input.files[0];if(!file)return;
 try{
  if(file.size>20*1024*1024)throw new Error('Выберите изображение до 20 МБ.');
  const image=await createImageBitmap(file,{imageOrientation:'from-image'});
  try{
   if(ticket!==generation)return;
   const size=Math.min(image.width,image.height),canvas=document.createElement('canvas');canvas.width=canvas.height=640;
   canvas.getContext('2d').drawImage(image,(image.width-size)/2,(image.height-size)/2,size,size,0,0,640,640);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   if(ticket!==generation)return;
   if(!blob||blob.size>2*1024*1024)throw new Error('Не удалось подготовить фото. Попробуйте другое изображение.');
   previewUrl=URL.createObjectURL(blob);form.querySelector('.photo-preview .portrait').outerHTML='<img class="portrait" alt="Предпросмотр выбранного фото" width="160" height="160">';
   form.querySelector('.photo-preview img').src=previewUrl;
   form.photoBlob=blob;save.disabled=false;
  }finally{image.close();}
 }catch(problem){
  if(ticket!==generation)return;
  error.textContent=problem instanceof Error&&/МБ|подготовить/.test(problem.message)?problem.message:'Этот файл не удалось открыть как изображение. Выберите другое фото.';error.hidden=false;
 }
}
