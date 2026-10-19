// BGMと効果音。音源ファイルは使わず、矩形波と三角波で自前の旋律を鳴らす。
let AC = null, master = null, on = true, tune = 'town', stepI = 0, nextT = 0, quietUntil = 0;
const midi = m => 440 * Math.pow(2, (m - 69) / 12);
const bar = (a, b) => [a, 0, b, 0, a, 0, b, 0], drive = a => [a, a, a + 12, a, a, a, a + 12, a];
const TUNES = {
  town: { bpm: 120,
    lead: [72,0,76,0,79,0,76,0, 77,0,76,74,72,0,0,0, 74,0,77,0,81,0,79,0, 77,76,74,0,76,0,0,0,
           72,0,76,0,79,0,84,0, 81,0,79,77,76,0,74,0, 72,74,76,79,77,0,74,0, 72,0,0,0,0,0,0,0],
    bass: [].concat(bar(48,55), bar(41,48), bar(43,50), bar(48,55), bar(48,55), bar(45,52), bar(43,50), bar(48,55)) },
  spring: { bpm: 88, leadType: 'triangle',
    lead: [79,0,0,0,76,0,0,0, 77,0,0,0,74,0,0,0, 76,0,0,0,72,0,0,0, 74,0,76,0,79,0,0,0],
    bass: [].concat(bar(48,55), bar(41,48), bar(45,52), bar(43,50)) },
  battle: { bpm: 160,
    lead: [69,0,72,0,76,0,72,0, 74,0,72,71,69,0,0,0, 69,0,72,0,77,0,76,74, 76,0,0,0,0,0,0,0,
           72,0,76,0,79,0,76,0, 77,0,76,74,72,0,71,0, 69,71,72,74,76,0,74,72, 71,0,69,0,0,0,0,0],
    bass: [].concat(drive(45), drive(45), drive(41), drive(43), drive(48), drive(41), drive(40), drive(45)) },
};
// [音, 長さ(拍)]。0は休み。
const JINGLES = {
  find: { bpm: 150, lead: [[72,.5],[76,.5],[79,.5],[84,1],[0,.25],[79,.25],[84,.5],[88,1.5]],
          bass: [[48,1],[52,.5],[55,1],[0,.5],[60,2]] },
  fuse: { bpm: 180, lead: [[60,.25],[64,.25],[67,.25],[72,.25],[76,.25],[79,.25],[84,.5],[0,.25],[83,.25],[84,.25],[88,2]],
          bass: [[48,1],[55,1],[60,2.5]] },
  win:  { bpm: 140, lead: [[79,.5],[79,.5],[79,.5],[76,.5],[79,1],[84,2]], bass: [[48,1],[52,1],[55,1],[60,2]] },
  lose: { bpm: 100, lead: [[72,.75],[71,.75],[69,.75],[67,2]], bass: [[45,1.5],[41,1.5],[43,2]] },
  start:{ bpm: 170, lead: [[69,.25],[72,.25],[76,.25],[81,1]], bass: [[45,.75],[57,1]] },
};
function ctx() {
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .8; master.connect(AC.destination); }
    if (AC.state === 'suspended') AC.resume();
  } catch { AC = null; }
  return AC;
}
function note(m, t, d, type = 'square', v = .03) {
  if (!m) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = midi(m);
  g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + d * .7); g.gain.linearRampToValueAtTime(0, t + d);
  o.connect(g).connect(master); o.start(t); o.stop(t + d + .02);
}
function beep(f, d = .08, v = .04, when = 0, type = 'square') {
  if (!on || !ctx()) return;
  const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + d * .8); g.gain.linearRampToValueAtTime(0, t + d);
  o.connect(g).connect(master); o.start(t); o.stop(t + d + .02);
}
const SFX = {
  select: () => beep(660, .04, .03),
  ok: () => { beep(784, .07); beep(1047, .11, .04, .07); },
  ng: () => { beep(196, .09); beep(147, .16, .04, .09); },
  bump: () => beep(110, .07, .05),
  place: () => { beep(523, .05, .04); beep(392, .08, .03, .05, 'triangle'); },
  attach: () => { beep(659, .05, .04); beep(880, .09, .04, .05); },
  bounce: () => { beep(233, .06, .04); beep(175, .12, .04, .07); },
  back: () => beep(392, .06, .03),
  reveal: () => [262, 330, 392, 523].forEach((f, i) => beep(f, .05, .035, i * .04)),
  roundWin: () => [784, 988, 1175].forEach((f, i) => beep(f, .08, .035, i * .08)),
  roundLose: () => { beep(330, .12, .035); beep(262, .2, .035, .12); },
  roundDraw: () => { beep(523, .1, .03); beep(523, .1, .03, .14); },
};
export function sfx(name) { SFX[name]?.(); }
export function jingle(name) {
  const J = JINGLES[name];
  if (!on || !J || !ctx()) return;
  const beat = 60 / J.bpm, start = AC.currentTime + .05;
  let end = start;
  for (const [line, type, v] of [[J.lead, 'square', .035], [J.bass, 'triangle', .07]]) {
    let t = start;
    for (const [m, len] of line) { note(m, t, len * beat * .95, type, v); t += len * beat; }
    end = Math.max(end, t);
  }
  // ジングルの間はBGMを止め、終わったら頭から鳴らし直す
  quietUntil = end + .15; stepI = 0; nextT = 0;
}
export function setTune(name) { if (tune === name || !TUNES[name]) return; tune = name; stepI = 0; nextT = 0; }
export function setEnabled(value) {
  on = !!value; quietUntil = 0; stepI = 0; nextT = 0;
  if (on) ctx();
  if (master && AC) master.gain.setValueAtTime(on ? .8 : 0, AC.currentTime);
}
export const enabled = () => on;
setInterval(() => {
  if (!AC || !on || document.hidden || AC.state !== 'running') { nextT = 0; return; }
  if (AC.currentTime < quietUntil) { nextT = 0; return; }
  const T = TUNES[tune], dt = 30 / T.bpm;
  if (nextT < AC.currentTime) nextT = AC.currentTime + .05;
  while (nextT < AC.currentTime + .35) {
    const i = stepI++ % T.lead.length;
    note(T.lead[i], nextT, dt * .9, T.leadType ?? 'square', .022);
    note(T.bass[i % T.bass.length], nextT, dt * .9, 'triangle', .055);
    nextT += dt;
  }
}, 120);
// ブラウザの決まりで、音は最初に触ったときから
const wake = () => { if (on) ctx(); };
addEventListener('pointerdown', wake); addEventListener('keydown', wake);
