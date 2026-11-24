import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import * as audio from './audio.js';
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
 hall:{eye:v(-2.28,1.58,1.94),at:v(-2.29,1.45,4.42),label:'右のドア'},
 outside:{eye:v(-2.33,1.60,3.96),at:v(-.62,1.33,1.01),label:'星空デッキ'},
 dj:{eye:v(-2.30,1.66,-.79),at:v(-1.32,1.12,-.79),label:'右側のDJブース'}
};
let active='bar', yaw=0,pitch=0,ready=false,doorUntil=0,doorState=false,doorValue=0,legs=[],moveT=0,trackMode=-1, audioTicket=0;
const currentEye=views.bar.eye.clone(), currentAt=views.bar.at.clone();
function begin(id){
 const out=active==='outside', into=id==='outside';
 if(into===out&&id===active)return;
 const target=views[id];
 // Walk through the single right-hand opening along the apron instead of through fixed glass.
 legs=into?[views.hall,target]:out?[views.hall,target]:[target];
 if(into||out)openDoor();
 active=id; q('outside').textContent=into?'バーの中へ':'外のデッキへ';
 q('view-status').textContent=target.label;
 document.body.dataset.view=id;
 moveT=performance.now();yaw=0;pitch=0;
}
function openDoor(){doorUntil=performance.now()+8300; setDoor(true);}
function setDoor(x){if(x===doorState)return;doorState=x;q('door').textContent=x?'ドアを閉じる':'右のドアを開く';q('door').setAttribute('aria-pressed',x);document.body.dataset.door=x?'open':'closed';}
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
 if(name==='outside'){begin(active==='outside'?'bar':'outside');return;}
 begin(name);
}
for(const id of ['bar','door','outside','dj','track1','track2','stop'])q(id).addEventListener('click',()=>command(id));
document.body.dataset.door='closed';document.body.dataset.track='off';document.body.dataset.view='bar';
stage.addEventListener('keydown',e=>{
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){yaw+=e.key==='ArrowLeft'?-.16:.16;e.preventDefault();}
 if(e.key.toLowerCase()==='e')command('door');
});
let drag=null;const cast=new T.Raycaster();
stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;stage.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,bx:e.clientX,by:e.clientY};});
stage.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.0049;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.0048,-.54,.58);drag.x=e.clientX;drag.y=e.clientY;});
stage.addEventListener('pointercancel',()=>drag=null);
stage.addEventListener('pointerup',e=>{
 if(!drag)return;
 if(Math.hypot(e.clientX-drag.bx,e.clientY-drag.by)<7){
  const rect=stage.getBoundingClientRect(),pt=new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);
  cast.setFromCamera(pt,camera);const hit=cast.intersectObjects(picks,false)[0];
  if(hit)command(hit.object.userData.action);
 }
 drag=null;
});
function animate(t){
 if(!document.hidden) {
  if(doorState&&t>doorUntil&&legs.length===0)setDoor(false);
  doorValue=T.MathUtils.lerp(doorValue,+doorState,reduced?1:.09);
  leaf.position.x=T.MathUtils.lerp(closedX,openX,doorValue);
  if(legs.length && (!doorState||doorValue>.82||currentEye.z<1.7)){
   const a=legs[0],k=reduced?1:.092; currentEye.lerp(a.eye,k);currentAt.lerp(a.at,k);
   if(currentEye.distanceToSquared(a.eye)<.0025){currentEye.copy(a.eye);currentAt.copy(a.at);legs.shift();}
  }
  const dir=currentAt.clone().sub(currentEye);
  dir.applyAxisAngle(v(0,1,0),yaw);
  dir.y+=pitch*Math.hypot(dir.x,dir.z);
  camera.position.copy(currentEye);camera.lookAt(currentEye.clone().add(dir));
  const phase=(t*.001+8)%15;meteor.visible=!reduced&&phase<.79;
  meteor.position.set(4.7-phase*4,3.65-phase*1.0,15);
  meteor.material.opacity=Math.sin(Math.min(1,phase/.79)*Math.PI)*.82;
  for(const [i,b] of buttons.entries())b.position.y=i===trackMode?.075:.080;
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
 scene.add(gltf.scene);ready=true;q('view-status').textContent='窓辺';q('loading').hidden=true;document.body.dataset.ready='true';
}catch(e){
 console.error(e);q('loading').innerHTML='<b>バーを読み込めませんでした</b><span>ページを更新して、もう一度お試しください。</span>';
 q('view-status').textContent='読み込みエラー';document.querySelectorAll('button').forEach(b=>b.disabled=true);
}
