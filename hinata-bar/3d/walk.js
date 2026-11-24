// Navigation colliders derived from the displayed room, not from furniture-name guesses.
const BODY=.15, CELL=.32, levels=[.33,.56,.82,1.00,1.22];
const segmentGrid=new Map();
const cell=t=>Math.floor(t/CELL);
const key=(a,b)=>a+','+b;
const add=(a,b)=>{
 if(Math.hypot(a[0]-b[0],a[1]-b[1])<.00001)return;
 for(let x=cell(Math.min(a[0],b[0])-BODY);x<=cell(Math.max(a[0],b[0])+BODY);x++)
  for(let z=cell(Math.min(a[1],b[1])-BODY);z<=cell(Math.max(a[1],b[1])+BODY);z++){
   const k=key(x,z);if(!segmentGrid.has(k))segmentGrid.set(k,[]);
   segmentGrid.get(k).push([a[0],a[1],b[0],b[1]]);
  }
};
export function readRoomCollisions(room,Vector3){
 room.updateWorldMatrix(true,true);
 room.traverse(o=>{
  if(!o.isMesh||!o.geometry.attributes.position)return;
  const p=o.geometry.attributes.position, ix=o.geometry.index, t=new Vector3(), pts=[];
  for(let i=0;i<p.count;i++){t.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);pts.push([t.x,t.y,t.z]);}
  for(let i=0;i<(ix?.count??p.count);i+=3){
   const a=pts[ix?ix.getX(i):i], b=pts[ix?ix.getX(i+1):i+1], c=pts[ix?ix.getX(i+2):i+2];
   const low=Math.min(a[1],b[1],c[1]),high=Math.max(a[1],b[1],c[1]);
   for(const y of levels){
    if(y<low||y>=high)continue;
    const hits=[];
    for(const [u,v] of [[a,b],[b,c],[c,a]]){
     if((u[1]>y)===(v[1]>y))continue;
     const k=(y-u[1])/(v[1]-u[1]);hits.push([u[0]+(v[0]-u[0])*k,u[2]+(v[2]-u[2])*k]);
    }
    if(hits.length===2)add(...hits);
   }
  }
 });
}
function distance2(x,z,[ax,az,bx,bz]){
 const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
 return (x-ax-dx*t)**2+(z-az-dz*t)**2;
}
export function inThreshold(x,z){return x>=-2.98&&x<=-1.68&&z>2.48&&z<2.91;}
export function clear(x,z,doorX){
 if(x< -2.83||x>2.83||z< -2.31||z>3.98)return false;
 const doorLane=x>=-2.81&&x<=-1.86;
 if(z>2.49&&!doorLane)return false;
 if(z>2.51&&z<2.70&&x> -1.86)return false;
 if(Math.abs(z-2.755)<BODY+.034&&x>=doorX-.68-BODY&&x<=doorX+.68+BODY)return false;
 return !(segmentGrid.get(key(cell(x),cell(z)))??[]).some(e=>distance2(x,z,e)<BODY**2);
}
export function walk(eye,dx,dz,doorX){
 const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.05));dx/=n;dz/=n;
 for(let i=0;i<n;i++){
  if(clear(eye.x+dx,eye.z,doorX))eye.x+=dx;
  if(clear(eye.x,eye.z+dz,doorX))eye.z+=dz;
 }
}
