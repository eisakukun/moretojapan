import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const OPEN=0,PARTIAL=.59,CLOSED=1;
export function animationAt(t){
 const blinkTime=((t%10)+10)%10, hopTime=((t%30)+30)%30;
 const blink=blinkTime>=7.08&&blinkTime<7.32?(blinkTime>=7.15&&blinkTime<7.25?CLOSED:PARTIAL):OPEN;
 const smooth=x=>x*x*(3-2*x);
 const hop=hopTime>=7.20&&hopTime<=7.66?.31*smooth(hopTime<=7.40?(hopTime-7.20)/.20:(7.66-hopTime)/.26):0;
 return {blink,hop};
}
const mat=new T.ShaderMaterial({
 vertexColors:true,side:T.DoubleSide,
 uniforms:{blink:{value:0}},
 vertexShader:`
 varying vec3 localPos; varying vec3 objectNormal; varying vec3 rgb;
 void main(){localPos=position;objectNormal=normal;rgb=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
 `,
 fragmentShader:`
 uniform float blink;
 varying vec3 localPos; varying vec3 objectNormal; varying vec3 rgb;
 void main(){
   vec3 col=rgb;
   if(blink>0.0){
    vec2 left=(localPos.xy-vec2(-.2351,.47635))/vec2(.12737,.09761);
    vec2 right=(localPos.xy-vec2(.19446,.4828))/vec2(.13259,.10474);
    vec2 q=dot(left,left)<dot(right,right)?left:right;
    float ellipse=1.-smoothstep(.85,1.1,dot(q,q));
    float depth=smoothstep(.407,.464,localPos.z);
    float crease=1.-smoothstep(.065,.155,abs(q.y+.11*q.x*q.x));
    float lid=smoothstep(1.-blink-.08,1.-blink+.04,abs(q.y-.04));
    vec3 cover=mix(vec3(.205,.448,.319),vec3(.033,.106,.068),crease*.87);
    col=mix(col,cover,ellipse*depth*max(lid,blink*blink*blink*.92));
   }
   vec3 n=normalize(objectNormal);
   float l=.60+.31*max(0.,dot(n,normalize(vec3(.36,.72,.59))))+.14*max(0.,dot(n,normalize(vec3(-.46,.60,-.64))));
   gl_FragColor=vec4(col*l*vec3(.94,.97,1.),1.);
   #include <colorspace_fragment>
 }
 `
});
async function exactGrogu(){
 const response=await fetch('./grogu.glb.gz');if(!response.ok||!response.body)throw Error('Grogu model unavailable');
 const glb=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 return (await new GLTFLoader().parseAsync(glb,'')).scene;
}
export async function addDisplay(scene){
 const [grogu,art]=await Promise.all([exactGrogu(),new T.TextureLoader().loadAsync('./right-wall-art.png')]);
 const expected=[6.20,-.04,.64,7.959];
 grogu.traverse(o=>{if(o.isMesh){if(!o.geometry.getAttribute('color'))throw Error('Vertex colours missing');o.material=mat;}});
 const group=new T.Group();group.name='Grogu | giant beyond the front';group.add(grogu);
 group.rotation.y=Math.PI;
 const b=new T.Box3().setFromObject(group),scale=expected[0]/b.getSize(new T.Vector3()).y;
 group.scale.setScalar(scale);
 const center=new T.Box3().setFromObject(group).getCenter(new T.Vector3());
 group.position.set(expected[1]-center.x,expected[2]-center.y,expected[3]-center.z);
 scene.add(group);
 const baseY=group.position.y;
 art.colorSpace=T.SRGBColorSpace;art.anisotropy=4;
 const framed=new T.Mesh(new T.PlaneGeometry(2.32,1.74),new T.MeshBasicMaterial({map:art,alphaTest:.34,side:T.DoubleSide,toneMapped:false}));
 framed.name='Exact framed drawings | original scene texture';framed.position.set(2.80,1.00,-.105);framed.rotation.y=-Math.PI/2;scene.add(framed);
 document.body.dataset.display='ready';
 return {update(t){
   const {blink,hop}=animationAt(t);
   mat.uniforms.blink.value=blink;group.position.y=baseY+hop;
   document.body.dataset.blink=String(blink);
   document.body.dataset.hop=hop.toFixed(3);
 },group,framed};
}
