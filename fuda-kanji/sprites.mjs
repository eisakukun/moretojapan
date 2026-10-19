// Original Fuda Town's readable head/body/leg approach, redrawn as lightweight SVG.
// A back-facing character has hair/backpack rather than mirrored front-facing eyes.
const COLORS={outline:'#213e31',hair:'#354a32',cap:'#8b9c58',shirt:'#4d7550',skin:'#f0dbac',pack:'#b98446',light:'#d1d9a2',shoe:'#283e32'};
export function facingFor(face){return face.x<0?'left':face.x>0?'right':face.y<0?'up':'down';}
const cache=new Map();
export function playerSprite(direction='down',frame=0){
 if(!['up','down','left','right'].includes(direction))direction='down';
 frame=[0,1,2].includes(frame)?frame:0;
 const key=direction+':'+frame;if(cache.has(key))return cache.get(key);
 const parts=[];
 const rect=(color,x,y,w,h,part='')=>parts.push(`<rect${part?` data-part="${part}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" fill="${COLORS[color]}"/>`);
 rect('outline',4,0,8,1);rect('outline',3,1,10,8);rect('cap',4,1,8,2);
 if(direction==='up'){
  rect('hair',4,4,8,4,'back-of-head');rect('light',6,3,4,1,'cap-strap');
 }else if(direction==='down'){
  rect('cap',3,3,10,1);rect('skin',4,4,8,4,'face');rect('outline',6,5,1,2,'eye');rect('outline',9,5,1,2,'eye');
 }else if(direction==='left'){
  rect('skin',4,4,6,4,'face');rect('skin',3,6,1,1,'nose');rect('hair',10,4,2,4);rect('outline',5,5,1,2,'eye');rect('cap',2,3,10,1);
 }else{
  rect('skin',6,4,6,4,'face');rect('skin',12,6,1,1,'nose');rect('hair',4,4,2,4);rect('outline',10,5,1,2,'eye');rect('cap',4,3,10,1);
 }
 rect('outline',4,9,8,5);rect('shirt',5,9,6,4);
 if(direction==='up'){rect('outline',5,9,6,4);rect('pack',6,9,4,4,'backpack');rect('light',6,10,4,1);}
 else if(direction==='down'){rect('light',6,9,1,3);rect('light',9,9,1,3);}
 else rect('pack',direction==='left'?10:4,9,2,4,'backpack');
 const handOffset=frame===1?1:0;
 rect('skin',3,10+handOffset,1,2,'hand');rect('skin',12,10+(frame===2?1:0),1,2,'hand');
 rect('shoe',5,14,2,frame===2?1:2,'left-foot');rect('shoe',9,14,2,frame===1?1:2,'right-foot');
 const result=`<svg viewBox="0 -1 16 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" shape-rendering="crispEdges" data-facing="${direction}" data-walk-frame="${frame}">${parts.join('')}</svg>`;
 cache.set(key,result);return result;
}
