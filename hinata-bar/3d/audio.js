let ctx, wave, ticket=0;
const chords=[[48,55,59,62],[45,52,55,60],[41,48,52,57],[43,50,53,59]];
export const labels=['Twilight','Orbit'];
function makeBuffer(id){
 const sr=ctx.sampleRate, beat=id? .61:.77, len=Math.floor(sr*beat*32);
 const b=ctx.createBuffer(2,len,sr);
 function note(n,start,duration,gain,pan,bright){
  const a=b.getChannelData(0), B=b.getChannelData(1);
  const f=440*2**((n-69)/12);
  for(let i=0;i<duration*sr;i++){
   const t=i/sr, j=(i+Math.round(start*sr))%len;
   const env=Math.min(t/.022,1)*Math.min((duration-t)/.16,1)*Math.exp(-t*(bright?3.2:1.3));
   const phase=2*Math.PI*f*t;
   const s=(Math.sin(phase)+.17*Math.sin(phase*2.003)+.058*Math.sin(phase*(bright?4.02:3.01)))*gain*env;
   a[j]+=s*Math.sqrt(1-pan); B[j]+=s*Math.sqrt(pan);
  }
 }
 chords.forEach((c,i)=>{
  c.forEach((n,k)=>note(n,(i*8+k*.16)*beat,2.4,k===0?.080:.036,.26+k*.15,false));
  [0,2.5,4,6.2].forEach((t,j)=>note(c[(j+1)%4]+(id?12:0),(i*8+t+.53)*beat,.52,.032,.22+.17*j,true));
  if(id) for(let j=0;j<8;j++)note(c[0]-12,(i*8+j)*beat,.34,j%2===0?.063:.036,.5,true);
 });
 return b;
}
export function stop(){ticket++; if(wave){try{wave.stop();}catch{} wave.disconnect();wave=null;}}
export async function play(id){
 stop();const run=ticket;
 ctx??=new AudioContext();
 await ctx.resume();if(run!==ticket)return false;
 const src=ctx.createBufferSource(),gain=ctx.createGain();
 src.buffer=makeBuffer(id);src.loop=true;
 gain.gain.value=.34;src.connect(gain);gain.connect(ctx.destination);src.start();wave=src;return true;
}
