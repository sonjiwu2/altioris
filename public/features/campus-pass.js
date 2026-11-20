import { escape as e, icon } from '../ui.js?v=20261120-12';

const expiryFormat = new Intl.DateTimeFormat('ru-RU', {
 timeZone:'Europe/Moscow', day:'numeric', month:'long', year:'numeric',
});

export function campusPass(student){
 const {photoUrl,qrUrl,expiresOn,active}=student.campusPass;
 const expiry=expiryFormat.format(new Date(expiresOn+'T12:00:00+03:00'));
 return `<section class="panel campus-pass-panel" aria-label="Студенческий пропуск">
  <div class="campus-pass-stage" id="campus-pass-stage" data-pass-stage>
   <div class="campus-pass-card">
    <div class="campus-pass-face pass-front" data-pass-front>
     <header class="pass-brand">
      <img src="/assets/crest.webp" width="52" height="64" alt="">
      <div><strong>Altioris University</strong><span>Студенческий пропуск</span></div>
     </header>
     <img class="pass-photo" src="${e(photoUrl)}" width="150" height="190" alt="">
     <div class="pass-identity">
      <p class="pass-name">${e(student.shortName)}</p>
      <div class="pass-facts">
       <div><span class="pass-label">UID</span><div class="pass-uid"><strong>${e(student.number)}</strong><button class="icon-button" type="button" data-copy="${e(student.number)}" aria-label="Скопировать UID пропуска">${icon('copy')}</button></div></div>
       <div><span class="pass-label">Статус</span><strong class="pass-status${active?'':' expired'}">${active?'Активен':'Истёк'}</strong></div>
      </div>
     </div>
    </div>
    <div class="campus-pass-face pass-back" data-pass-back aria-hidden="true" inert>
     <div class="pass-access">
      <img src="/assets/crest.webp" width="52" height="64" alt="">
      <span class="pass-label">Зона доступа</span><strong>Учебные корпуса</strong>
      <div class="pass-expiry"><span class="pass-label">Действует до</span><time datetime="${e(expiresOn)}">${e(expiry)}</time></div>
     </div>
     <figure class="pass-qr"><img src="${e(qrUrl)}" width="198" height="198" alt="QR-код пропуска ${e(student.number)}"><figcaption>Учебный образец</figcaption></figure>
    </div>
   </div>
  </div>
  <div class="pass-actions">
   <button class="button button-outline" type="button" data-pass-turn aria-controls="campus-pass-stage">Показать оборот</button>
   <span class="sr-only" role="status" data-pass-announcement></span>
  </div>
 </section>`;
}

export function turnCampusPass(panel){
 const stage=panel.querySelector('[data-pass-stage]');
 const front=panel.querySelector('[data-pass-front]');
 const back=panel.querySelector('[data-pass-back]');
 const button=panel.querySelector('[data-pass-turn]');
 const reversed=stage.toggleAttribute('data-pass-reversed');
 const hidden=reversed?front:back;
 const visible=reversed?back:front;
 if(hidden.contains(document.activeElement))button.focus();
 hidden.inert=true;
 hidden.setAttribute('aria-hidden','true');
 visible.inert=false;
 visible.removeAttribute('aria-hidden');
 button.textContent=reversed?'Показать лицевую сторону':'Показать оборот';
 panel.querySelector('[data-pass-announcement]').textContent=reversed?'Оборот пропуска':'Лицевая сторона пропуска';
}
