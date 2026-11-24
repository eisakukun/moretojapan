import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {readRoomCollisions, clear, inThreshold, walk} from './walk.js';
import * as audio from './audio.js';
import {addDisplay} from './display.js';
let exhibit=null, exhibitStart=0;
const q=id=>document.getElementById(id);
const stage=q('stage');
const scene=new T.Scene();scene.background=new T.Color(0x080918);
const camera=new T.PerspectiveCamera(57,1,.035,130);
const v=(x,y,z)=>new T.Vector3(x,y,z);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let r;
try {
 r=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.23;
 r.setPixelRatio(Math.min(devicePixelRatio,1.65));r.outputColorSpace=T.SRGBColorSpace;
 stage.prepend(r.domElement);
}catch {
 q('loading').innerHTML='<b>3Dを表示できません</b><span>WebGL 2対応のブラウザで開いてください。</span>';
 q('view-status').textContent='3D非対応';
 document.querySelectorAll('button').forEach(b=>b.disabled=true);
 throw new Error('WebGL 2 unavailable');
}
function resize(){const {width:w,height:h}=stage.getBoundingClientRect(); if(w&&h){camera.aspect=w/h;camera.fov=w<600?70:57;camera.updateProjectionMatrix();r.setSize(w,h,false);}}
new ResizeObserver(resize).observe(stage);resize();
const mats={};
function mat(name, color, props={}) {return mats[name]??=new T.MeshStandardMaterial({color,roughness:.72,...props});}
const bronze=mat('bronze',0x413034,{metalness:.18,roughness:.43});
const floor=mat('floor',0x7c4f45);
const glass=new T.MeshBasicMaterial({color:0xb8d1f9,transparent:true,opacity:.080,depthWrite:false,side:T.DoubleSide});
const leafGlass=glass.clone();leafGlass.opacity=.135;
const deck=mat('deck',0x232332);
const amber=mat('amber',0xf1b077,{emissive:0xae4c23,emissiveIntensity:.42});
const ivory=new T.MeshBasicMaterial({color:0xffdeac});
function box(p,color,x,y,z,w,h,d){const o=new T.Mesh(new T.BoxGeometry(w,h,d),color);o.position.set(x,y,z);p.add(o);return o;}
function pane(p,color,x,y,z,w,h){const o=new T.Mesh(new T.PlaneGeometry(w,h),color);o.position.set(x,y,z);p.add(o);return o;}
function disk(p,color,x,y,z,r,h){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,18),color);o.position.set(x,y,z);p.add(o);return o;}
function light(x,y,z,c,power,dist){const p=new T.PointLight(c,power,dist,1.68);p.position.set(x,y,z);scene.add(p);}
scene.add(new T.HemisphereLight(0xffe3c7,0x6e6a9b,2.10));
light(0,2.23,-.6,0xffbc74,12,7);light(-1.95,2.34,.58,0xffc989,9.5,6);light(1.95,2.35,-.87,0xffae70,7.5,6);
light(-2.38,2.35,3.77,0xca98df,5.0,6);
const front=2.68;
const beams=[-2.98,-1.68,-.105,1.42,2.98];
box(scene,floor,0,-.06,2.581,6.0,.11,.37);
box(scene,bronze,0,2.43,front,6.04,.128,.135);
box(scene,bronze,.65,.056,front,4.68,.105,.139);
for(const x of beams)box(scene,bronze,x,1.245,front,.064,2.39,.085);
for(let j=1;j<beams.length-1;j++){
 const a=beams[j],b=beams[j+1];pane(scene,glass,(a+b)/2,1.22,front,b-a-.05,2.27);
}
const leaf=new T.Group();const closedX=-2.33, openX=-1.01;leaf.position.set(closedX,0,front+.075);scene.add(leaf);
pane(leaf,leafGlass,0,1.24,0,1.30,2.225);
for(const x of [-.65,.65])box(leaf,bronze,x,1.24,0,.053,2.34,.060);
for(const y of [.08,2.40])box(leaf,bronze,0,y,0,1.35,.075,.068);
box(leaf,amber,-.52,1.15,0,.034,.22,.10);
const picks=[];
function act(mesh,action){mesh.userData.action=action;picks.push(mesh);return mesh;}
for(const z of [front-.099,front+.143]){
 act(box(scene,amber,-1.666,1.20,z,.092,.15,.036),'door');
}
box(scene,floor,-2.31,-.067,3.40,1.37,.115,1.48);
for(const x of [-2.99,-1.63]){
 box(scene,bronze,x,.84,3.43,.045,.06,1.46);
 for(const z of [3.05,4.10])box(scene,bronze,x,.42,z,.045,.85,.045);
}
box(scene,bronze,-2.31,.84,4.13,1.39,.058,.05);
const dj=new T.Group();dj.position.set(-1.38,1.071,-.82);dj.rotation.y=Math.PI/2;scene.add(dj);
box(dj,deck,0,.035,0,.57,.07,.31);
for(const x of [-.17,.17]){
 disk(dj,deck,x,.083,.045,.070,.017);disk(dj,amber,x,.094,.045,.028,.006);
}
for(const x of [-.035,0,.035])box(dj,bronze,x,.084,.045,.009,.019,.10);
const buttons=[];
for(const [i,x] of [-.18,0,.18].entries()){
 const button=act(box(dj,i===2?mat('stop',0xa34244):mat('key',0x3c5f80),x,.08,-.084,.126,.032,.069),i===2?'stop':'track'+(i+1));
 buttons.push(button);for(let k=0;k<(i===2?1:i+1);k++)box(dj,ivory,x+(k-i*.5)*.013,.098,-.083,.003,.003,.024);
}
// Deterministic, in-house star field. Every geometry asset on this page is original.
let seed=19571;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function stars(count,size,brightness){
 const p=[],cs=[];
 for(let i=0;i<count;i++){
  const z=15+rand()*42;
  p.push((rand()-.5)*z*3,(rand()-.44)*z*1.75,z);
  const tint=rand();cs.push((.7+.3*tint)*brightness,(.76+.19*tint)*brightness,brightness);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(cs,3));
 const m=new T.PointsMaterial({size,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.84,toneMapped:false});
 scene.add(new T.Points(g,m));
}
stars(2200,1.05,.68);stars(260,2.25,.90);stars(36,3.2,1);
const planet=new T.Group();planet.position.set(-3.18,3.05,16.5);scene.add(planet);
const shadow=new T.Mesh(new T.CircleGeometry(.45,48),new T.MeshBasicMaterial({color:0x030309,side:T.DoubleSide,toneMapped:false}));
planet.add(shadow);
const ring=new T.Mesh(new T.RingGeometry(.63,.765,80),new T.MeshBasicMaterial({color:0xd98f59,transparent:true,opacity:.66,side:T.DoubleSide,toneMapped:false}));
ring.rotation.set(.90,-.21,-.37);planet.add(ring);
const halo=new T.Mesh(new T.RingGeometry(.43,.49,72),new T.MeshBasicMaterial({color:0xb6735c,transparent:true,opacity:.42,side:T.DoubleSide,toneMapped:false}));
planet.add(halo);
const meteor=new T.Line(new T.BufferGeometry().setFromPoints([v(0,0,0),v(1.14,.23,0)]),new T.LineBasicMaterial({color:0xe8f0ff,transparent:true,toneMapped:false}));
scene.add(meteor);
const views={
 bar:{eye:v(.24,1.66,-.73),at:v(0,1.44,4.4),label:'窓辺'},
 hall:{eye:v(-2.08,1.58,2.06),at:v(-2.08,1.45,4.42),label:'右のドア'},
 outside:{eye:v(-2.08,1.60,3.79),at:v(-.62,1.33,1.01),label:'星空デッキ'},
 dj:{eye:v(-2.51,1.66,-.79),at:v(-1.32,1.12,-.79),label:'右側のDJブース'}
};
let active='bar',yaw=0,pitch=0,ready=false,doorUntil=0,doorState=false,doorValue=0,legs=[],trackMode=-1,audioTicket=0;
const currentEye=views.bar.eye.clone(),currentAt=views.bar.at.clone();
const forward=v(0,0,0);
const outside=()=>currentEye.z>2.77;
function syncView(id){
 active=id;
 q('outside').textContent=outside()?'バーの中へ':'外のデッキへ';
 q('view-status').textContent=views[id]?.label??(outside()?'星空デッキ':'自由に移動中');
 document.body.dataset.view=id;
}
function jumpTo(id){
 const target=views[id];currentEye.copy(target.eye); currentAt.copy(target.at);yaw=0;pitch=0;syncView(id);
}
function begin(id){
 const into=id==='outside';
 if(into===outside()){legs=[];jumpTo(id);return;}
 if(!outside())jumpTo('hall');
 legs=[{x:-2.08,z:into?3.68:2.12,id}];openDoor();
}
function openDoor(){doorUntil=performance.now()+8300;setDoor(true);}
function setDoor(x){
 if(!x&&inThreshold(currentEye.x,currentEye.z)){doorUntil=performance.now()+850;return;}
 if(x===doorState)return;
 doorState=x;q('door').textContent=x?'ドアを閉じる':'右のドアを開く';q('door').setAttribute('aria-pressed',x);document.body.dataset.door=x?'open':'closed';
}
async function track(id){
 const ticket=++audioTicket;
 if(id<0)audio.stop();
 try{
  if(id>=0 && !(await audio.play(id)))return;
  if(ticket!==audioTicket)return;
  trackMode=id;
  q('track').textContent=id>=0?audio.labels[id]+' 再生中':'音楽は停止中';
  q('track1').setAttribute('aria-pressed',id===0);q('track2').setAttribute('aria-pressed',id===1);
  document.body.dataset.track=id>=0?String(id+1):'off';
 }catch{if(ticket===audioTicket)q('track').textContent='音楽を再生できません。ボタンでもう一度お試しください。';}
}
function command(name){
 if(!ready)return;
 if(name==='door'){if(doorState && legs.length===0){doorUntil=0;setDoor(false);}else openDoor();return;}
 if(name==='track1'||name==='track2'){track(+name.at(-1)-1);return;}
 if(name==='stop'){track(-1);return;}
 if(name==='outside'){begin(outside()?'bar':'outside');return;}
 begin(name);
}
for(const id of ['bar','door','outside','dj','track1','track2','stop'])q(id).addEventListener('click',()=>command(id));
document.body.dataset.door='closed';document.body.dataset.track='off';document.body.dataset.view='bar';
const held=new Set();
const keydir={w:'up',a:'left',s:'down',d:'right',arrowup:'up',arrowleft:'left',arrowdown:'down',arrowright:'right'};
window.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(e.altKey||e.ctrlKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
 if(keydir[k]){held.add(k);e.preventDefault();}
 if(k==='e'&&!e.repeat)command('door');
});
window.addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{held.clear();resetStick();});
const joystick=q('stick'),nub=q('stick-nub');let stickId=null, sx=0,sz=0;
function resetStick(){stickId=null;sx=sz=0;nub.style.transform='translate(0,0)';}
function aimStick(e){
 const b=joystick.getBoundingClientRect(),range=b.width*.31;
 let x=(e.clientX-b.left-b.width/2)/range,z=(e.clientY-b.top-b.height/2)/range;
 const mag=Math.max(1,Math.hypot(x,z));x/=mag;z/=mag;
 sx=Math.abs(x)<.11?0:x;sz=Math.abs(z)<.11?0:z;
 nub.style.transform='translate('+x*range+'px,'+z*range+'px)';
}
joystick.addEventListener('pointerdown',e=>{if(stickId!==null||e.button!==0)return;e.preventDefault();e.stopPropagation();stickId=e.pointerId;joystick.setPointerCapture(stickId);aimStick(e);});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===stickId){e.stopPropagation();aimStick(e);}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(type,e=>{if(e.pointerId===stickId){e.stopPropagation();resetStick();}});
let drag=null;const cast=new T.Raycaster();
stage.addEventListener('pointerdown',e=>{if(e.button!==0||drag||e.target.closest('#stick'))return;if(e.pointerType==='mouse')stage.focus({preventScroll:true});stage.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,bx:e.clientX,by:e.clientY};});
stage.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.0049;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.0048,-.54,.58);drag.x=e.clientX;drag.y=e.clientY;});
stage.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId)drag=null;});
stage.addEventListener('pointerup',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 if(Math.hypot(e.clientX-drag.bx,e.clientY-drag.by)<7){
  const rect=stage.getBoundingClientRect(),pt=new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);
  cast.setFromCamera(pt,camera);const hit=cast.intersectObjects(picks,false)[0];
  if(hit)command(hit.object.userData.action);
 }
 drag=null;
});
let lastTime=0;
function animate(t){
 const dt=Math.min(.05,Math.max(0,(t-lastTime)/1000));lastTime=t;
 if(!document.hidden) {
  if(doorState&&t>doorUntil&&legs.length===0)setDoor(false);
  doorValue=T.MathUtils.lerp(doorValue,+doorState,reduced?1:1-Math.exp(-dt*7.7));
  leaf.position.x=T.MathUtils.lerp(closedX,openX,doorValue);
  // Move on the horizontal plane relative to the selected view, not the camera pitch.
  forward.copy(currentAt).sub(currentEye).setY(0).normalize().applyAxisAngle(v(0,1,0),yaw);
  if(ready){
   const kx=sx+Number(held.has('d')||held.has('arrowright'))-Number(held.has('a')||held.has('arrowleft'));
   const kz=-sz+Number(held.has('w')||held.has('arrowup'))-Number(held.has('s')||held.has('arrowdown'));
   const mag=Math.max(1,Math.hypot(kx,kz));
   const oldX=currentEye.x,oldZ=currentEye.z;
   if(kx||kz){
    legs=[];const step=dt*1.72/mag;
    walk(currentEye,(forward.x*kz-forward.z*kx)*step,(forward.z*kz+forward.x*kx)*step,leaf.position.x);
    currentAt.x+=currentEye.x-oldX;currentAt.z+=currentEye.z-oldZ;
    if(active!=='walk'||((oldZ>2.77)!==outside()))syncView('walk');
   }else if(legs.length){
    const a=legs[0],dx=a.x-currentEye.x,dz=a.z-currentEye.z,len=Math.hypot(dx,dz),step=Math.min(1,dt*2.20/(len||1));
    if(doorValue>.94)walk(currentEye,dx*step,dz*step,leaf.position.x);
    currentAt.x+=currentEye.x-oldX;currentAt.z+=currentEye.z-oldZ;
    if(len<.075){legs.shift();jumpTo(a.id);}
   }
   document.body.dataset.pos=currentEye.x.toFixed(3)+','+currentEye.z.toFixed(3);
  }
  const dir=currentAt.clone().sub(currentEye);
  dir.applyAxisAngle(v(0,1,0),yaw);
  dir.y+=pitch*Math.hypot(dir.x,dir.z);
  camera.position.copy(currentEye);camera.lookAt(currentEye.clone().add(dir));
  const phase=(t*.001+8)%15;meteor.visible=!reduced&&phase<.79;
  meteor.position.set(4.7-phase*4,3.65-phase*1.0,15);
  meteor.material.opacity=Math.sin(Math.min(1,phase/.79)*Math.PI)*.82;
  for(const [i,b] of buttons.entries())b.position.y=i===trackMode?.075:.080;
  exhibit?.update((t-exhibitStart)*.001);
  r.render(scene,camera);
 }
 requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
try {
 const resp=await fetch('./room.glb.gz');
 if(!resp.ok||!resp.body)throw new Error('Model download failed');
 const stream=resp.body.pipeThrough(new DecompressionStream('gzip'));
 const buffer=await new Response(stream).arrayBuffer();
 const gltf=await new GLTFLoader().parseAsync(buffer,'');
 scene.add(gltf.scene);readRoomCollisions(gltf.scene,T.Vector3);
 for(const [id,p] of Object.entries(views)){if(!clear(p.eye.x,p.eye.z,closedX))console.warn('Preset intersects collider:',id);}
 ready=true;q('view-status').textContent='窓辺';q('loading').hidden=true;document.body.dataset.ready='true';
}catch(e){
 console.error(e);q('loading').innerHTML='<b>バーを読み込めませんでした</b><span>ページを更新して、もう一度お試しください。</span>';
 q('view-status').textContent='読み込みエラー';document.querySelectorAll('button').forEach(b=>b.disabled=true);
}

try{exhibit=await addDisplay(scene);exhibitStart=performance.now();}
catch(e){console.error(e);document.body.dataset.display='error';}
