export const SAVE_KEY = 'fuda-kanji-local-review-v1';
export const BASE = [
  { id: '木', reading: 'き', english: 'tree', power: 20, art: 'tree' },
  { id: '日', reading: 'ひ', english: 'sun', power: 20, art: 'sun' },
  { id: '月', reading: 'つき', english: 'moon', power: 30, art: 'moon' },
  { id: '人', reading: 'ひと', english: 'person', power: 10, art: 'person' },
  { id: '女', reading: 'おんな', english: 'woman', power: 20, art: 'woman' },
  { id: '子', reading: 'こ', english: 'child', power: 10, art: 'child' },
  { id: '家', reading: 'いえ', english: 'house', power: 30, art: 'house' },
  { id: '口', reading: 'くち', english: 'mouth', power: 10, art: 'mouth' },
  { id: '鳥', reading: 'とり', english: 'bird', power: 20, art: 'bird' },
  { id: '水', reading: 'みず', english: 'water', power: 20, art: 'water' },
  { id: '中', reading: 'なか・ちゅう', english: 'middle / inside', power: 20, art: 'middle', starterCopies: 0 },
];
export const RECIPES = [
  { id: '林', inputs: ['木', '木'], reading: 'はやし', english: 'grove', art: 'grove' },
  { id: '森', inputs: ['林', '木'], reading: 'もり', english: 'forest', art: 'forest' },
  { id: '森', inputs: ['木', '木', '木'], reading: 'もり', english: 'forest', art: 'forest' },
  { id: '明', inputs: ['日', '月'], reading: 'めい・あか(るい)', english: 'bright', art: 'sun' },
  { id: '休', inputs: ['人', '木'], reading: 'きゅう・やす(む)', english: 'rest', art: 'rest', forms: [{ from: '人', to: '亻', name: 'にんべん' }] },
  { id: '好', inputs: ['女', '子'], reading: 'こう・この(む)', english: 'like / fond of', art: 'heart' },
  { id: '鳴', inputs: ['口', '鳥'], reading: 'めい・な(く)', english: 'chirp / cry', art: 'bird' },
  { id: '仲', inputs: ['人', '中'], reading: 'なか', english: 'relationship', art: 'friends', forms: [{ from: '人', to: '亻', name: 'にんべん' }] },
];
export const DEFINITIONS = Object.fromEntries([...BASE, ...RECIPES].map(c => [c.id, c]));
const base = Object.fromEntries(BASE.map(c => [c.id, c]));
export const WIDTH = 24, HEIGHT = 20;
export const START = { x: 3, y: 7 };
export const NPC = { x: 12, y: 4, name: 'もりのおじいさん' };
export const EVOLUTION = { x: 13, y: 10, name: 'ひと文字の泉' };
export const MODE_KEYS = { A: SAVE_KEY, B: SAVE_KEY + '-battle-only-v2' };
// フィールドは3枚（各24×20）。道の端まで歩くと次のフィールドへ入る。
export const FIELDS = {
  town: { name: 'こもれびの町', english: 'Komorebi town' },
  forest: { name: 'ふかい森', english: 'Deep forest' },
  shore: { name: 'うみべの道', english: 'Seaside road' },
};
export const EXITS = [
  { field: 'town', x: 23, y: 13, to: 'forest', tx: 1, ty: 13 },
  { field: 'forest', x: 0, y: 13, to: 'town', tx: 22, ty: 13 },
  { field: 'town', x: 6, y: 19, to: 'shore', tx: 6, ty: 1 },
  { field: 'shore', x: 6, y: 0, to: 'town', tx: 6, ty: 18 },
];
export const exitAt = (field, x, y) => EXITS.find(e => e.field === field && e.x === x && e.y === y) ?? null;
export const fieldOf = place => place?.field ?? 'town';
export const SPOTS = [
  { id: 'grass-west', x: 3, y: 6, kind: 'grass', name: 'ふわふわの草むら', cards: ['木', '木', '人'] },
  { id: 'pot', x: 5, y: 3, kind: 'pot', name: '家の横のつぼ', cards: ['日', '月', '口'] },
  { id: 'grass-north', x: 9, y: 2, kind: 'grass', name: '木かげの草むら', cards: ['女', '子', '木'] },
  { id: 'post', x: 7, y: 7, kind: 'post', name: '赤いポスト', cards: ['家', '人', '口'] },
  { id: 'grass-east', x: 13, y: 7, kind: 'grass', name: 'お花のそばの草むら', cards: ['鳥', '鳥', '水'] },
  { id: 'well', x: 10, y: 6, kind: 'well', name: '古い井戸', cards: ['水', '月', '日'] },
  { id: 'stump', x: 2, y: 2, kind: 'stump', name: '小さな切り株', cards: ['木', '女', '子'] },
  { id: 'grass-south', x: 5, y: 8, kind: 'grass', name: '南の草むら', cards: ['口', '鳥', '家'] },
  { id: 'grass-middle', x: 8, y: 5, kind: 'grass', name: '町の中央の草むら', cards: ['中', '中', '人'] },
  { id: 'east-grass', x: 19, y: 3, kind: 'grass', name: '東の森の草むら', cards: ['木','日','月'] },
  { id: 'east-well', x: 21, y: 9, kind: 'well', name: '東の小さな井戸', cards: ['中','水','口'] },
  { id: 'south-grass', x: 4, y: 14, kind: 'grass', name: '南の原っぱ', cards: ['人','中','女'] },
  { id: 'south-stump', x: 11, y: 16, kind: 'stump', name: '南の森の切り株', cards: ['木','木','子'] },
  { id: 'pond-post', x: 19, y: 15, kind: 'post', name: '水辺のポスト', cards: ['鳥','家','日'] },
  { id: 'far-grass', x: 21, y: 17, kind: 'grass', name: '奥の花畑', cards: ['月','水','鳥'] },
  { id: 'forest-entry-grass', field: 'forest', x: 5, y: 12, kind: 'grass', name: '森の入口の草むら', cards: ['木','木','木'] },
  { id: 'forest-stump', field: 'forest', x: 11, y: 8, kind: 'stump', name: '苔の切り株', cards: ['木','人','中'] },
  { id: 'forest-sun-grass', field: 'forest', x: 13, y: 6, kind: 'grass', name: '木もれ日の草むら', cards: ['日','月','鳥'] },
  { id: 'forest-well', field: 'forest', x: 16, y: 2, kind: 'well', name: '森の古井戸', cards: ['水','水','口'] },
  { id: 'forest-deep-grass', field: 'forest', x: 22, y: 9, kind: 'grass', name: '奥の草むら', cards: ['女','子','子'] },
  { id: 'forest-old-stump', field: 'forest', x: 20, y: 12, kind: 'stump', name: '大きな切り株', cards: ['木','木','人'] },
  { id: 'forest-post', field: 'forest', x: 10, y: 18, kind: 'post', name: '森の小屋のポスト', cards: ['家','口','鳥'] },
  { id: 'forest-low-grass', field: 'forest', x: 5, y: 16, kind: 'grass', name: '谷の草むら', cards: ['月','日','中'] },
  { id: 'shore-grass', field: 'shore', x: 5, y: 6, kind: 'grass', name: '坂道の草むら', cards: ['水','口','人'] },
  { id: 'shore-post', field: 'shore', x: 7, y: 9, kind: 'post', name: '海の見えるポスト', cards: ['家','家','鳥'] },
  { id: 'shore-pot', field: 'shore', x: 12, y: 11, kind: 'pot', name: '貝がらのつぼ', cards: ['日','日','月'] },
  { id: 'shore-east-grass', field: 'shore', x: 20, y: 9, kind: 'grass', name: '岬の草むら', cards: ['女','子','中'] },
  { id: 'shore-stump', field: 'shore', x: 16, y: 5, kind: 'stump', name: '松の切り株', cards: ['木','木','子'] },
  { id: 'shore-well', field: 'shore', x: 13, y: 2, kind: 'well', name: '丘の井戸', cards: ['水','月','鳥'] },
  { id: 'shore-sand-pot', field: 'shore', x: 9, y: 14, kind: 'pot', name: '砂浜のつぼ', cards: ['口','鳥','人'] },
  { id: 'shore-driftwood', field: 'shore', x: 19, y: 14, kind: 'stump', name: '流木', cards: ['木','中','月'] },
];
const BLOCKED = new Set([
  '3,2','4,2','3,3','4,3', '11,1','12,1','11,2','12,2',
  '1,5','2,5','1,6','2,6', '14,2','14,3', '8,8','9,8','10,8',
]);
const BLOCKING = ['tree','pond','house','sea'];
const spotHere = (field, x, y) => SPOTS.some(s => fieldOf(s) === field && s.x === x && s.y === y);
export function terrain(x, y, field = 'town') {
  if (exitAt(field, x, y)) return 'path';
  const base = field === 'forest' ? forestTerrain(x, y) : field === 'shore' ? shoreTerrain(x, y) : townTerrain(x, y);
  // 札の場所は必ず歩いて近づけるように
  return field !== 'town' && spotHere(field, x, y) && BLOCKING.includes(base) ? 'lawn' : base;
}
function forestTerrain(x, y) {
  if (x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1) return 'tree';
  if ((y === 13 && x <= 12) || (x === 12 && y >= 3 && y <= 13) || (y === 3 && x >= 12 && x <= 21) || (x === 21 && y >= 3 && y <= 17) || (y === 17 && x >= 4 && x <= 21)) return 'path';
  if (x >= 3 && x <= 6 && y >= 4 && y <= 7) return 'pond';
  if ((x * 5 + y * 3) % 7 === 0 || (x + y * 2) % 9 === 0) return 'tree';
  return (x + y) % 5 === 0 ? 'flowers' : 'lawn';
}
function shoreTerrain(x, y) {
  if (y >= 16) return 'sea';
  if (x === 0 || y === 0 || x === WIDTH - 1) return 'tree';
  if ((x === 6 && y <= 10) || (y === 10 && x >= 2 && x <= 21) || (x === 17 && y >= 3 && y <= 10) || (y === 3 && x >= 10 && x <= 17)) return 'path';
  if (y >= 12) return 'sand';
  if (y <= 8 && (x * 3 + y * 7) % 10 === 0) return 'tree';
  return (x + y) % 4 === 0 ? 'flowers' : 'lawn';
}
function townTerrain(x, y) {
  if (x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1) return 'tree';
  if ((x === 1 || x === 2) && (y === 5 || y === 6)) return 'pond';
  if ((x === 3 || x === 4) && (y === 2 || y === 3)) return 'house';
  if (x>=15 && x<=17 && y>=11 && y<=13) return 'pond';
  if (BLOCKED.has(`${x},${y}`) || (x===17 && y>=5 && y<=7)) return 'tree';
  if (y === 4 || x === 6 || (y === 7 && x >= 6 && x<=14) || y===13 || (x===19 && y>=4)) return 'path';
  return (x + y) % 4 === 0 ? 'flowers' : 'lawn';
}
export function walkable(x, y, field = 'town') {
  if (!Number.isInteger(x) || !Number.isInteger(y) || !FIELDS[field]) return false;
  if (exitAt(field, x, y)) return true;
  if (!(x > 0 && y > 0 && x < WIDTH - 1 && y < HEIGHT - 1) || BLOCKING.includes(terrain(x, y, field))) return false;
  return field !== 'town' || !((x === NPC.x && y === NPC.y) || (x === EVOLUTION.x && y === EVOLUTION.y));
}
export const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export function pathTo(from, target, adjacent = false, field = 'town') {
  const queue = [[{ ...from }]], seen = new Set([`${from.x},${from.y}`]);
  while (queue.length) {
    const path = queue.shift(), p = path.at(-1);
    if (adjacent ? distance(p, target) <= 1 : distance(p, target) === 0) return path.slice(1);
    for (const [dx, dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const n = { x: p.x + dx, y: p.y + dy }, key = `${n.x},${n.y}`;
      // 出入口は目的地のときだけ通る（途中で別のフィールドへ入らないように）
      const isExit = exitAt(field, n.x, n.y) && !(n.x === target.x && n.y === target.y);
      if (walkable(n.x, n.y, field) && !isExit && !seen.has(key)) { seen.add(key); queue.push([...path, n]); }
    }
  }
  return null;
}
export function makeBase(id) {
  const c = base[id];
  if (!c) throw Error('Unknown base card');
  return { id, power: c.power, materials: [id], kind: 'kanji' };
}
export function createState() {
  return { version: 1, field: 'town', player: { ...START }, face: { x: 0, y: -1 },
    inventory: BASE.flatMap(c => Array.from({ length: c.starterCopies ?? 3 }, () => makeBase(c.id))),
    found: [], crafted: 0, matches: 0, wins: 0 };
}
export function move(state, dx, dy) {
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false;
  state.face = { x: dx, y: dy };
  const { x, y } = state.player, field = fieldOf(state);
  if (!walkable(x + dx, y + dy, field)) return false;
  state.player = { x: x + dx, y: y + dy };
  const exit = exitAt(field, x + dx, y + dy);
  if (exit) { state.field = exit.to; state.player = { x: exit.tx, y: exit.ty }; }
  return true;
}
export function discover(state, spotID) {
  const spot = SPOTS.find(s => s.id === spotID);
  if (!spot || fieldOf(spot) !== fieldOf(state) || distance(state.player, spot) > 1) return { ok: false, reason: '近づいてから調べよう。' };
  if (state.found.includes(spot.id)) return { ok: false, reason: 'ここはもう調べたよ。ほかの場所も探そう。' };
  const cards = spot.cards.map(makeBase);
  state.inventory.push(...cards); state.found.push(spot.id);
  return { ok: true, cards, spot };
}
export function availableRecipes(state) {
  return RECIPES.map((r, index) => {
    const remaining = [...state.inventory], cards = [];
    for (const id of r.inputs) {
      const i = remaining.findIndex(c => c.id === id);
      if (i < 0) return { ...r, index, available: false, power: recipePower(r) };
      cards.push(remaining.splice(i, 1)[0]);
    }
    return { ...r, index, available: true, power: cards.reduce((n, c) => n + c.power, 0) };
  });
}
export function recipePower(recipe) {
  return recipe.inputs.reduce((sum, id) => sum + (base[id]?.power ?? recipePower(RECIPES.find(r => r.id === id))), 0);
}
export function fuse(state, index) {
  const recipe = availableRecipes(state).find(r => r.index === index);
  if (!recipe?.available) return { ok: false, reason: '素材が足りないよ。町で札を探そう。' };
  const inventory = [...state.inventory], consumed = [];
  for (const id of recipe.inputs) consumed.push(inventory.splice(inventory.findIndex(c => c.id === id), 1)[0]);
  const result = { id: recipe.id, power: consumed.reduce((sum, c) => sum + c.power, 0), materials: consumed.flatMap(c => c.materials), kind: 'kanji' };
  state.inventory = [...inventory, result]; state.crafted++;
  return { ok: true, card: result, consumed };
}
export function shuffle(cards, random = Math.random) {
  const out = cards.map(c => ({ ...c, materials: [...c.materials] }));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function buildDeck(state, mode = 'A') {
  // Review rule: take crafted cards first, then interleave base types, up to 30.
  const crafted = mode === 'B' ? [] : state.inventory.filter(c => c.materials.length > 1);
  const piles = BASE.map(b => state.inventory.filter(c => c.id === b.id));
  const out = [...crafted];
  for (let i = 0; piles.some(p => p[i]); i++) for (const pile of piles) if (pile[i]) out.push(pile[i]);
  return out.slice(0, 30);
}
export function cpuDeck(mode = 'A') {
  const s = createState();
  // A few combinations, with exactly the same summed-power rules as the player.
  if (mode === 'A') for (const index of [0, 3, 4, 5, 6]) fuse(s, index);
  const deck = buildDeck(s);
  while (deck.length < 30) deck.push(makeBase(BASE[deck.length % BASE.length].id));
  return deck;
}
export function startMatch(state, random = Math.random, mode = 'A') {
  if (fieldOf(state) !== 'town' || distance(state.player, NPC) > 1) throw Error('おじいさんの近くで話しかけよう。');
  const deck = buildDeck(state, mode);
  if (deck.length < 3) throw Error('札が3枚以上必要だよ。');
  const playerDeck = shuffle(deck, random), opponentDeck = shuffle(cpuDeck(mode), random);
  return { mode, playerDeck, cpuDeck: opponentDeck, playerHand: playerDeck.slice(0, 3), cpuHand: opponentDeck.slice(0, 3),
    playerCursor: 3, cpuCursor: 3, playerPenalty: 0, cpuPenalty: 0, rounds: [], recorded: false, prepared: null, random };
}
export function legalMoves(hand, allowFusion = true) {
  const moves = hand.flatMap((c, i) => c.kind !== 'part' && c.playable !== false && DEFINITIONS[c.id] ? [{ indices: [i], card: c }] : []);
  for (const recipe of allowFusion ? RECIPES : []) {
    const indices = [];
    for (const id of recipe.inputs) {
      const i = hand.findIndex((c, j) => c.id === id && !indices.includes(j));
      if (i < 0) break;
      indices.push(i);
    }
    if (indices.length === recipe.inputs.length) {
      const cards = indices.map(i => hand[i]);
      moves.push({ indices, card: { id: recipe.id, power: cards.reduce((n,c) => n+c.power,0), materials: cards.flatMap(c => c.materials), kind: 'kanji' } });
    }
  }
  return moves;
}
export function prepareTurn(deck, hand, cursor, allowFusion = true) {
  let draws = 0, rescue = false;
  if (cursor < deck.length) { hand.push(deck[cursor++]); draws++; }
  if (!legalMoves(hand, allowFusion).length && cursor < deck.length) { hand.push(deck[cursor++]); draws++; rescue = true; }
  const moves = legalMoves(hand, allowFusion);
  return { hand, cursor, draws, rescue, moves, pass: !moves.length };
}
export function beginRound(match) {
  if (match.rounds.length >= 3) throw Error('3回戦は終了しているよ。');
  if (match.prepared) return match.prepared;
  const player = prepareTurn(match.playerDeck, match.playerHand, match.playerCursor, match.mode === 'B');
  const cpu = prepareTurn(match.cpuDeck, match.cpuHand, match.cpuCursor, match.mode === 'B');
  match.playerCursor = player.cursor; match.cpuCursor = cpu.cursor;
  return match.prepared = { player, cpu };
}
export function nextRound(match, moveIndex = 0) {
  const turn = beginRound(match);
  const playerMove = turn.player.moves[moveIndex];
  if (!turn.player.pass && !playerMove) throw Error('出せる札を選ぼう。');
  const cpuMove = turn.cpu.moves[Math.floor(match.random() * turn.cpu.moves.length)];
  const player = playerMove?.card ?? null, cpu = cpuMove?.card ?? null;
  if (!player) match.playerPenalty -= 10;
  if (!cpu) match.cpuPenalty -= 10;
  const outcome = Math.sign((player?.power ?? 0) - (cpu?.power ?? 0));
  const round = { player, cpu, outcome, playerDraws: turn.player.draws, cpuDraws: turn.cpu.draws, playerPass: !player, cpuPass: !cpu };
  for (const [move, hand] of [[playerMove, match.playerHand], [cpuMove, match.cpuHand]]) {
    if (move) for (const i of [...move.indices].sort((a,b) => b-a)) hand.splice(i, 1);
  }
  match.rounds.push(round); match.prepared = null; return round;
}
export function matchResult(match) {
  if (match.rounds.length !== 3) return null;
  const wins = match.rounds.filter(r => r.outcome > 0).length, losses = match.rounds.filter(r => r.outcome < 0).length;
  return { wins, losses, draws: 3 - wins - losses, playerPenalty: match.playerPenalty, cpuPenalty: match.cpuPenalty,
    outcome: Math.sign(wins - losses) || Math.sign(match.playerPenalty - match.cpuPenalty) };
}
export function finishMatch(state, match) {
  const result = matchResult(match);
  if (!result) throw Error('3回戦を最後まで遊ぼう。');
  if (!match.recorded) { state.matches++; if (result.outcome > 0) state.wins++; match.recorded = true; }
  return result;
}
export function readSave(text) {
  try {
    const s = JSON.parse(text);
    if (s?.version !== 1 || !Array.isArray(s.inventory) || s.inventory.length < 3 || s.inventory.length > 100 || !Array.isArray(s.found) || !s.found.every(id => SPOTS.some(p => p.id === id))) return null;
    // フィールドが無い古いセーブは町にいたことにする（進捗は消さない）
    if (s.field === undefined) s.field = 'town';
    if (!FIELDS[s.field] || exitAt(s.field, s.player?.x, s.player?.y) || !walkable(s.player?.x, s.player?.y, s.field)) return null;
    if (!s.inventory.every(c => DEFINITIONS[c.id] && Array.isArray(c.materials) && c.materials.length >= 1 && c.materials.length <= 3 && c.materials.every(id => base[id]) && c.power === c.materials.reduce((n, id) => n + base[id].power, 0))) return null;
    if (!['crafted', 'matches', 'wins'].every(k => Number.isInteger(s[k]) && s[k] >= 0) || s.wins > s.matches || !s.face || Math.abs(s.face.x) + Math.abs(s.face.y) !== 1) return null;
    return s;
  } catch { return null; }
}
