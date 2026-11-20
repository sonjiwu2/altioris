// Lucide geometry for chat controls. See assets/icons/LICENSE.txt.
const paths = {
  "send": "<path d=\"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z\" />\n  <path d=\"m21.854 2.147-10.94 10.939\" />",
  "doc": "<path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\" />\n  <path d=\"M14 2v5a1 1 0 0 0 1 1h5\" />\n  <path d=\"M10 9H8\" />\n  <path d=\"M16 13H8\" />\n  <path d=\"M16 17H8\" />",
  "clipboard": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" />\n  <path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" />\n  <path d=\"m9 14 2 2 4-4\" />",
  "search": "<path d=\"m21 21-4.34-4.34\" />\n  <circle cx=\"11\" cy=\"11\" r=\"8\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />"
};

export function accentIcon(name) {
 const plain=name==='send'||name==='check';
 const shape=plain?paths[name]:'<rect width="24" height="24" rx="6" fill="#eaf0f2" stroke="none"/><g transform="translate(3 3) scale(.75)">'+paths[name]+'</g>';
 return '<svg class="icon icon-'+name+'" viewBox="0 0 24 24" fill="none" stroke="'+(plain?'currentColor':'#4b6273')+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg>';
}
