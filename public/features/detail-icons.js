const artwork = {
 'request-enrollment':['#604495','#e4d8f3','<path d="M12 8h23l9 9v31H12z"/><path fill="none" d="M35 8v9h9m-24 8h16m-16 6h8"/><circle fill="#ddab50" cx="34" cy="39" r="5"/>'],
 'request-transcript':['#405f67','#c9e0de','<path d="M10 11h36v34H10z"/><path fill="none" d="M10 20h36m-23 0v25m-13-17h36m-36 8h36"/><path fill="none" stroke="#287864" stroke-width="3" d="m30 33 3 3 7-8"/>'],
 'request-leave':['#814b56','#f3c9c3','<path d="M8 15h40v31H8z"/><path fill="none" d="M18 10v10m19-10v10M8 24h40"/><path fill="#fcf0d9" d="M22 29h4v12h-4zm9 0h4v12h-4z"/>'],
 'request-housing':['#596c45','#c5d9aa','<path d="M11 28 28 9l17 19v18H11Z"/><path fill="#e3ae79" d="m7 30 21-20 21 20-4 4-17-16-17 16Z"/><path fill="#f9edcf" d="M24 32h8v14h-8z"/>'],
 'request-media':['#354d73','#c3cce8','<path d="M9 24h37v20H9zM9 24l-2-8 36-6 2 8z"/><path fill="none" d="m15 15 5 7m6-9 5 7m6-9 5 7"/><path fill="#f6d79c" d="m24 29 10 5-10 5z"/>'],
 'inbox-document-ready':['#386453','#c1dcc5','<path d="M11 10h24l9 9v27H11z"/><path fill="none" d="M35 12v8h8m-24 5h15"/><path fill="none" stroke-width="3" d="m21 36 5 5 11-12"/>'],
 'passport-book':['#173d42','#6d9e8a','<path d="M15 8h28a4 4 0 0 1 4 4v34H15a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z"/><path fill="#edd7aa" d="M15 40h32v8H15a4 4 0 1 1 0-8Z"/><path fill="none" stroke="#ecc379" d="M17 9v31M22 35h16"/><path fill="#ecc379" stroke="none" d="m30 14 2.5 6.5L39 23l-6.5 2.5L30 32l-2.5-6.5L21 23l6.5-2.5Z"/>'],
 'diploma-scroll':['#713f43','#f7e3b8','<path d="M9 11h33l6 6v24H9z"/><path fill="none" stroke="#ad754c" d="M15 17h19M15 23h25M15 29h19M15 35h13"/><path fill="#9e5648" d="m35 38-3 12 6-3 6 3-3-12Z"/><circle fill="#d8a355" cx="38" cy="38" r="7"/><circle fill="none" stroke="#fff0c6" cx="38" cy="38" r="3.5"/>'],
 'faculty-tenure':['#754536','#e6a954','<path fill="#ffe3a4" d="M27 7 42 15v12c0 10-6 16-15 20-9-4-15-10-15-20V15Z"/><path fill="#b55e51" d="m21 34-2 13 8-5 8 5-2-13Z"/><circle cx="27" cy="23" r="10"/><path fill="#fff0ba" stroke="none" d="m27 15 2 5 6 .4-4.4 3.8 1.3 5.8-4.9-3.2-4.9 3.2 1.3-5.8-4.4-3.8 6-.4Z"/>'],
 'faculty-office':['#355271','#d4af7c','<path d="M11 45V23l17-10 17 10v22Z"/><path fill="#7295a8" d="M7 24 28 9l21 15Z"/><path fill="#fff2d7" d="M23 30h11v15H23zM14 30h5v7h-5zM38 30h4v7h-4z"/><circle fill="#edbd67" cx="28" cy="20" r="3"/>'],
 'faculty-letter':['#5c416a','#b7a4cb','<path d="M8 19h40v25H8z"/><path fill="#f6e8cf" d="M16 11h24v20H16z"/><path fill="none" d="M21 17h14M21 22h9"/><path d="m8 19 20 15 20-15v25H8Z"/><circle fill="#a85766" cx="28" cy="34" r="4"/>'],
 'faculty-consult':['#376253','#92b38f','<path d="M12 12h32a5 5 0 0 1 5 5v17a5 5 0 0 1-5 5H27l-12 9v-9h-3a5 5 0 0 1-5-5V17a5 5 0 0 1 5-5Z"/><path fill="#ffeed4" d="M20 25c0-5 3-8 8-8s8 3 8 7c0 3-3 6-6 7l-2 2h-5l1-4c-2-1-4-2-4-4Z"/><circle cx="27" cy="35" r="1"/>'],
 'inbox-schedule':['#765037','#efba80','<path d="M9 14h36v30H9z"/><path fill="none" d="M17 9v10m20-10v10M9 23h36"/><path fill="none" stroke="#fff3d8" stroke-width="3" d="M18 33h20m-5-5 5 5-5 5"/>'],
 'inbox-online':['#32546f','#a5c4d6','<rect x="7" y="13" width="42" height="30" rx="6"/><path fill="#fff1cc" d="m24 22 12 6-12 7Z"/>'],
 'inbox-deadline':['#80553d','#f4d789','<path d="M16 9h24l-2 6-8 12 8 12 2 7H16l2-7 8-12-8-12Z"/><path fill="#b97852" d="m21 39 7-8 7 8Z"/>'],
 'inbox-grade':['#5d4c78','#d0c0df','<path d="M13 8h22l8 8v32H13Z"/><path fill="none" d="M35 8v9h8m-22 8h14m-14 6h11"/><path fill="none" stroke="#426850" stroke-width="3" d="m23 38 4 4 10-10"/>'],
 'inbox-ranking':['#785638','#dfaa5d','<path d="M8 32h12v13H8Zm13-12h14v25H21Zm15 6h12v19H36Z"/><path fill="#fff0be" d="m28 5 2 5 5 .4-4 3.3 1 5-4-3-4 3 1-5-4-3.3 5-.4Z"/>'],
 'inbox-library':['#435b4e','#a4b98f','<path d="M8 13q11-5 20 4 9-9 20-4v29q-11-4-20 4-9-8-20-4Z"/><path fill="none" d="M28 17v29m-14-25 8 2m-8 5 8 2m12-7 8-2m-8 9 8-2"/>'],
 'inbox-event':['#884e52','#e9a892','<path d="m8 17 38-6 2 7c-5 1-4 7 1 7l2 10-38 7-2-9c5-2 4-8-1-8Z"/><path fill="none" d="m30 16 4 23m5-20 4 1m-3 7 4 1"/>'],
 'inbox-opportunity':['#63566c','#c4b3d3','<path d="M29 7c9 0 14 7 12 16-1 6-7 8-7 15H23c0-7-7-9-8-16C14 14 20 7 29 7Z"/><path fill="none" d="M25 45h8M29 37V21m-5-2 5 4 4-4"/>'],
 'inbox-office':['#856344','#e9cca0','<path d="M9 14h38v29H9Z"/><path fill="none" d="m9 15 19 16 19-16"/><circle fill="#a95d52" cx="28" cy="32" r="6"/>'],
 'inbox-received':['#59728b','#d3e3e7','<circle cx="28" cy="27" r="19"/><path fill="none" d="M28 14v14l8 5m-14 13 6-4 6 4"/>'],
};

export function detailIcon(name){
 const [ink,fill,shape]=artwork[name];
 return `<svg class="icon detail-icon" data-glyph="${name}" viewBox="0 0 56 56" aria-hidden="true" fill="${fill}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${shape}</svg>`;
}
