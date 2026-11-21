import { icon } from '../ui.js?v=20261120-15';

export const phoneLayout=matchMedia('(max-width:680px)');

export function phoneOverlays(nav,profile){
 return `<dialog id="phone-drawer" class="phone-overlay phone-drawer" aria-labelledby="phone-drawer-title">
  <div class="phone-overlay-heading"><h2 id="phone-drawer-title">Личный кабинет</h2>
   <button class="icon-button" type="button" data-phone-dismiss aria-label="Закрыть меню" autofocus>${icon('close')}</button></div>
  <nav class="phone-drawer-links" aria-label="Основное меню">${nav}</nav>
  ${profile}
 </dialog>
 <dialog id="phone-detail" class="phone-overlay phone-sheet" aria-labelledby="phone-detail-title">
  <div class="phone-overlay-heading"><h2 id="phone-detail-title"></h2>
   <button class="icon-button" type="button" data-phone-dismiss aria-label="Закрыть подробности" autofocus>${icon('close')}</button></div>
  <div class="phone-sheet-content"></div>
 </dialog>`;
}

export function showPhoneDrawer(){
 const drawer=document.querySelector('#phone-drawer');
 if(!drawer||drawer.open)return;
 delete drawer.dataset.closing;
 drawer.dataset.source=location.href;
 drawer.showModal();
 document.querySelector('[data-menu]')?.setAttribute('aria-expanded','true');
}

export function showPhoneDetail(panel,title){
 const sheet=document.querySelector('#phone-detail');
 if(!panel||!sheet)return;
 sheet.querySelector('#phone-detail-title').textContent=title;
 sheet.querySelector('.phone-sheet-content').replaceChildren(panel);
 sheet.showModal();
}

export function outsidePhoneOverlay(event){
 const dialog=event.target;
 if(!dialog.matches?.('.phone-overlay[open]'))return false;
 const bounds=dialog.getBoundingClientRect();
 return event.clientX<bounds.left||event.clientX>=bounds.right||
  event.clientY<bounds.top||event.clientY>=bounds.bottom;
}

export async function copyText(button){
 const text=button.dataset.copy;
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
 // The LAN preview is served over HTTP. Keep the selectable field inside any active modal.
 const field=document.createElement('textarea');
 field.className='sr-only';
 field.value=text;
 field.readOnly=true;
 (button.closest('dialog')??document.body).append(field);
 let copied;
 try{
  field.select();
  copied=document.execCommand('copy');
 }finally{
  field.remove();
  button.focus({preventScroll:true});
 }
 if(!copied)throw new Error('Clipboard unavailable');
}
