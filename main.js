import {createAtlasMap} from './atlas-map.js';
import {createAmbience} from './ambient.js';
import {places, arrivalHeading} from './landmarks.js';

const $ = selector => document.querySelector(selector);
const paths = {
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.3"/>',
  muted: '<path d="m11 5-5 4H3v6h3l5 4zM16 9l5 6m0-6-5 6"/>',
  volume: '<path d="m11 5-5 4H3v6h3l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  expand: '<path d="M3.5 9V4h5.3m6.4 0h5.3v5M3.5 15v5h5.3m6.4 0h5.3v-5"/>',
  collapse: '<path d="M9 3v6H3m12-6v6h6M9 21v-6H3m12 6v-6h6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.4a2.65 2.65 0 0 1 5.2.6c0 1.9-2.6 2.1-2.6 4M12 17h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  'arrow-up-right': '<path d="M5 19 19 5M6 5h13v13"/>',
  'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  navigation:'<path d="m20 3-6.5 18-3.2-7.5L3 10.1 20 3Z"/>',
  return:'<path d="m7 5-5 5 5 5M3 10h12a5 5 0 0 1 0 10"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>',
  'expand-small':'<path d="M14 3h7v7M21 3l-7 7M10 21H3v-7m0 7 7-7"/>',
  layers:'<path d="m12 3 10 5.5L12 14 2 8.5 12 3ZM3 12.5l9 5 9-5M3 16.5l9 5 9-5"/>',
  mouse:'<rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/>',
  scroll:'<rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 5v5m-2-3 2-2 2 2"/>',
  crosshair:'<circle cx="12" cy="12" r="7"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>'
};
function icon(name) {
  return '<svg aria-hidden="true" class="icon" viewBox="0 0 24 24">' + paths[name] + '</svg>';
}
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });

const cards = $('#scene-cards');
const photos = [...document.querySelectorAll('.scene-photo')];
let sceneIndex = 0;
let heading = 6;
let pose = [0,7];
let explorer;
let unavailable = false;
let loading;
let atlasLarge;
let inWalk = false;
let soundEnabled = false;
let nearest = 0;
const ambience = createAmbience();
const panel = $('#panel');
const miniMap = createAtlasMap($('#map-drawing'), {interactive:false});
const viewOrigins = places.map(p=>[p.x,p.z]);

const ruler = $('#compass-ruler');
function setHeading(degrees) {
  heading = degrees;
  const names = {0:'N',45:'NE',90:'E',135:'SE',180:'S',225:'SW',270:'W',315:'NW'};
  const ticks = [];
  const start = Math.floor((degrees-56)/5)*5;
  for (let n = start; n <= degrees+56; n+=5) {
    const value = (n+720)%360;
    const isMajor = value%15 === 0;
    ticks.push('<span class="compass-tick '+(isMajor?'major ':'')+(names[value]?'cardinal':'')+'" style="left:'+((n-degrees)*1.04+50)+'%">'+(isMajor?'<b>'+(names[value]||value)+'</b>':'')+'</span>');
  }
  ruler.innerHTML=ticks.join('');
  updateMap();
}
function updateMap() {
  miniMap.setPose(...pose,heading);
  atlasLarge?.setPose(...pose,heading);
}
function atPosition(x,z) {
  pose = [x,z];
  updateMap();
  if (!inWalk) return;
  const distances = viewOrigins.map(([sx,sz])=>Math.hypot(sx-x,sz-z));
  const current = distances.indexOf(Math.min(...distances));
  if (current !== nearest) {
    nearest = current;
    ambience.setScene(current);
    $('#mini-name').textContent = places[current].name;
  }
}
function enterWalk() {
  inWalk=true;
  $('.atlas').classList.add('walking');
  $('#mode-label').textContent='自由漫遊';
}
async function loadExplorer() {
  if (!loading) loading = import('./explorer.js').then(({createExplorer})=>{
    explorer=createExplorer($('#world'),{onHeading:setHeading,onPosition:atPosition,onWalk:enterWalk});
    explorer.setScene(sceneIndex);
    if (panel.open) explorer.pause(true);
    $('#render-status').textContent='3D 引擎就緒';
    return explorer;
  }).catch(error=>{
    console.warn('3D renderer unavailable',error);
    unavailable=true;
    $('#render-status').textContent='景觀瀏覽模式';
    return null;
  });
  return loading;
}
function selectScene(id) {
  sceneIndex = nearest = id;
  const place = places[id];
  inWalk=false;
  $('.atlas').classList.remove('walking');
  $('#mode-label').textContent='景觀預覽';
  photos.forEach((img,i)=>img.classList.toggle('selected',i===id));
  [...cards.children].forEach((btn,i)=>{
    btn.classList.toggle('active',i===id);
    btn.setAttribute('aria-pressed',String(id===i));
  });
  $('#marker-name').textContent=place.name;
  $('#landmark').setAttribute('aria-label','查看'+place.name+'介紹');
  $('#landmark').style.setProperty('--marker-x',place.marker[0]+'%');
  $('#landmark').style.top=place.marker[1]+'%';
  $('#mini-name').textContent=place.name;
  pose=viewOrigins[id];
  miniMap.setScene(id);
  setHeading(Math.round(arrivalHeading(place)));
  ambience.setScene(id);
  explorer?.setScene(id);
}
places.forEach((place,i)=>{
  const btn=document.createElement('button');
  btn.className='place-card';
  btn.setAttribute('aria-label','前往'+place.name);
  btn.innerHTML='<img src="/images/'+place.key+'.webp" alt=""><span class="card-text"><span class="card-num">0'+(i+1)+'</span><strong>'+place.name+'</strong><small lang="en">'+place.en+'</small></span><span class="selected-dot"></span>';
  btn.onclick=()=>selectScene(i);
  cards.append(btn);
});
selectScene(0);

let messageTimer;
function notify(message) {
  clearTimeout(messageTimer);
  $('#message').textContent=message;
  $('#message').classList.add('visible');
  messageTimer=setTimeout(()=>$('#message').classList.remove('visible'),4200);
}
async function walk() {
  const engine=await loadExplorer();
  if(engine) { engine.setActive(true); $('#world').focus({preventScroll:true}); }
  else notify('目前瀏覽器無法啟用 WebGL 2，可切換下方的景觀取景點。');
}
$('#walk').onclick=walk;
$('#restore').onclick=()=>selectScene(sceneIndex);
function showPanel(title, content) {
  $('#panel-body').innerHTML=content;
  panel.setAttribute('aria-label',title);
  explorer?.pause(true);
  panel.showModal();
}
const keys = (...labels)=>labels.map(s=>'<kbd>'+s+'</kbd>').join(' ');
$('#help').onclick=()=>{
  showPanel('操作指南','<div class="dialog-kicker">FIELD GUIDE</div><h2>操作指南</h2>'+
    '<dl class="help-list">'+[
      ['前後左右移動',keys('W','A','S','D')+' 或方向鍵'],
      ['旋轉視角','按住滑鼠拖曳'],
      ['水平環視 / 上下望',keys('Q','E')+' / '+keys('R','F')],
      ['調整視野','滾動滑鼠滾輪'],
      ['加快步伐','按住 '+keys('Shift')],
      ['返回景觀預覽',keys('Esc')]
    ].map(([a,b])=>'<div><dt>'+a+'</dt><dd>'+b+'</dd></div>').join('')+'</dl>'+
    '<p>觸控裝置可點選「開始漫遊」，使用搖桿移動，滑動畫面轉向。</p><p class="fine-print">取景影像與 3D 地形依八大關地標重建。區域地圖採用場景內的相對位置。</p>');
};
$('#landmark').onclick=()=>{
  const p = places[sceneIndex];
  showPanel(p.name,'<img class="dialog-photo" src="/images/'+p.key+'.webp" alt="'+p.name+'景觀重建"><div class="dialog-kicker">FIELD NOTES / 0'+(sceneIndex+1)+'</div><h2>'+p.name+'</h2><div class="english-title">'+p.en+'</div><p>'+p.text+'</p><button id="detail-walk" class="walk-button">'+icon('navigation')+'從此處漫遊'+icon('arrow-right')+'</button><a class="source-link" href="'+p.source+'" target="_blank" rel="noopener noreferrer">青島市文化旅遊資料 '+icon('arrow-up-right')+'</a>');
  $('#detail-walk').onclick=()=>{panel.close(); explorer?.pause(false); walk();};
};
$('#open-map').onclick=()=>{
  showPanel('區域地圖','<div class="dialog-kicker">AREA MAP</div><h2>八大關漫遊地圖</h2><div id="big-map"></div><div class="dialog-locations"></div><p class="fine-print">點選地點即可前往該取景點。箭頭標示目前位置與視角方向。</p>');
  const go = index=>{panel.close(); selectScene(index);};
  atlasLarge=createAtlasMap($('#big-map'),{interactive:true,onSelect:go});
  atlasLarge.setScene(sceneIndex);
  updateMap();
  places.forEach((p,i)=>{
    const b=document.createElement('button');
    b.textContent=p.name; b.className=i===sceneIndex?'chosen':'';
    b.onclick=()=>go(i); $('.dialog-locations').append(b);
  });
};
$('#close-panel').onclick=()=>panel.close();
panel.addEventListener('click',e=>{if(e.target===panel)panel.close();});
panel.addEventListener('close',()=>{atlasLarge=undefined; explorer?.pause(false);});
document.addEventListener('keydown',e=>{
  if (panel.open) return;
  if (e.key==='Escape' && inWalk) selectScene(sceneIndex);
  if (!explorer && !e.altKey && !e.ctrlKey && !e.metaKey && /^(Key[WASDQERF]|Arrow(Up|Down|Left|Right))$/.test(e.code)) {
    e.preventDefault(); walk();
  }
});
$('#world').addEventListener('pointerdown',()=>{if(!explorer && !unavailable) loadExplorer();});
$('#sound').onclick=async()=>{
  const button=$('#sound');
  button.disabled=true;
  try {
    await ambience.setEnabled(!soundEnabled);
    soundEnabled=!soundEnabled;
    button.setAttribute('aria-pressed',String(soundEnabled));
    button.title=soundEnabled?'關閉環境音':'開啟環境音';
    button.querySelector('i').innerHTML=icon(soundEnabled?'volume':'muted');
    button.querySelector('small').textContent=soundEnabled?'ON':'OFF';
  } catch { notify('瀏覽器未能啟動環境音。'); }
  finally {button.disabled=false;}
};
$('#fullscreen').onclick=async()=>{
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {notify('目前瀏覽器不支援全螢幕顯示。');}
};
document.addEventListener('fullscreenchange',()=>{
  const full=!!document.fullscreenElement;
  $('#fullscreen').innerHTML=icon(full?'collapse':'expand');
  $('#fullscreen').setAttribute('aria-label',full?'離開全螢幕':'進入全螢幕');
});
if(!document.fullscreenEnabled) $('#fullscreen').hidden=true;
const stick=$('#joystick');
let stickPointer=null;
function tilt(e) {
  const box=stick.getBoundingClientRect();
  let x=(e.clientX-box.left-box.width/2)/(box.width/2);
  let y=(e.clientY-box.top-box.height/2)/(box.height/2);
  const len=Math.max(1,Math.hypot(x,y));
  x/=len; y/=len;
  stick.firstElementChild.style.transform='translate('+x*23+'px,'+y*23+'px)';
  explorer?.move(x,-y);
}
stick.onpointerdown=e=>{if(stickPointer!==null)return; stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);tilt(e);};
stick.onpointermove=e=>{if(stickPointer===e.pointerId)tilt(e);};
function releaseStick(e) {
  if(e.pointerId!==stickPointer) return;
  stickPointer=null; explorer?.move(0,0); stick.firstElementChild.style.transform='';
}
stick.onlostpointercapture=stick.onpointercancel=stick.onpointerup=releaseStick;
if('requestIdleCallback' in window) requestIdleCallback(()=>loadExplorer(),{timeout:800});
else setTimeout(()=>loadExplorer(),100);
