/*  More to Japan — 暮らしの掲示板（Everyday Help Board）の裏側
 *
 *  表（help.html）からは fetch で呼ばれるだけ。保存先はスプレッドシート1枚。
 *  最初に一度だけ setup() を ▶ で走らせると、シートを作って ID を覚える。
 *
 *  設計のメモ（あとで自分が読む用）
 *  - 承認制にはしない。承認制の掲示板は「待たされる」から誰も二度と書かない。
 *    代わりに通報が入ったら Discord に飛ばして、本人が消す。
 *  - 投稿に会員登録は要らない。端末ごとの dev（ランダムな文字列）だけで
 *    「自分の投稿か」「もう押したか」を見分ける。身元は一切持たない。
 *  - 書いた人がいなくなっても答えが残るように、解決した投稿は消さず印をつける。
 */

const PROP_SHEET = 'BOARD_SHEET_ID';   // スプレッドシートのID（setup が入れる）
const PROP_HOOK  = 'DISCORD_WEBHOOK';  // 新着と通報の行き先（任意）
const PROP_NG    = 'NG_WORDS';         // 追加のNGワード。カンマ区切り（任意）

const AUTO_HIDE_FLAGS = 3;             // 通報がこれだけ付いたら自動で隠す
const LIST_LIMIT      = 400;           // 一覧で返す最大件数
const PREVIEW_LEN     = 300;           // 一覧に載せる本文の長さ

const COLS = {
  posts:   ['id','ts','updated','cat','lang','title','body','nick','area','dev','status','same','replies','solved','flags'],
  replies: ['id','ts','postId','body','nick','dev','helpful','status','flags'],
  votes:   ['ts','key']
};

/* ============================================================ 置き場所 */

function setup() {
  const p = PropertiesService.getScriptProperties();
  let id = p.getProperty(PROP_SHEET);
  if (id) {
    try { SpreadsheetApp.openById(id); return 'already: ' + ssUrl_(id); } catch (err) { id = null; }
  }
  const ss = SpreadsheetApp.create('More to Japan 掲示板データ');
  Object.keys(COLS).forEach(function (name, i) {
    const sh = i === 0 ? ss.getSheets()[0].setName(name) : ss.insertSheet(name);
    sh.getRange(1, 1, 1, COLS[name].length).setValues([COLS[name]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  p.setProperty(PROP_SHEET, ss.getId());
  return 'created: ' + ss.getUrl();
}

function ssUrl_(id) { return 'https://docs.google.com/spreadsheets/d/' + id + '/edit'; }

function sheet_(name) {
  const id = PropertiesService.getScriptProperties().getProperty(PROP_SHEET);
  if (!id) throw new Error('setup() がまだ走っていません');
  const ss = SpreadsheetApp.openById(id);
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, COLS[name].length).setValues([COLS[name]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** シート全部を {列名: 値} の配列にする */
function rows_(name) {
  const sh = sheet_(name);
  const n = sh.getLastRow();
  if (n < 2) return [];
  const vals = sh.getRange(2, 1, n - 1, COLS[name].length).getValues();
  return vals.map(function (r) {
    const o = {};
    COLS[name].forEach(function (c, i) { o[c] = r[i]; });
    return o;
  }).filter(function (o) { return o.id || o.key; });
}

function append_(name, obj) {
  sheet_(name).appendRow(COLS[name].map(function (c) {
    return obj[c] === undefined || obj[c] === null ? '' : obj[c];
  }));
}

/** id でその行を探して、渡した列だけ書き換える */
function patch_(name, id, patch) {
  const sh = sheet_(name);
  const n = sh.getLastRow();
  if (n < 2) return null;
  const ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      const row = i + 2;
      const cur = sh.getRange(row, 1, 1, COLS[name].length).getValues()[0];
      const o = {};
      COLS[name].forEach(function (c, j) { o[c] = cur[j]; });
      Object.keys(patch).forEach(function (k) { o[k] = patch[k]; });
      sh.getRange(row, 1, 1, COLS[name].length)
        .setValues([COLS[name].map(function (c) { return o[c] === undefined ? '' : o[c]; })]);
      return o;
    }
  }
  return null;
}

/* ============================================================ 入口 */

function doGet(e) {
  try {
    const q = (e && e.parameter) || {};
    const a = q.a || 'list';
    if (a === 'ping') return json_({ ok: true, ready: !!PropertiesService.getScriptProperties().getProperty(PROP_SHEET) });
    if (a === 'list') return json_(list_(q));
    if (a === 'post') return json_(one_(q.id));
    return json_({ ok: false, err: 'unknown' });
  } catch (err) {
    return json_({ ok: false, err: String(err && err.message || err) });
  }
}

function doPost(e) {
  try {
    const b = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const a = b.a;
    // ロボットよけ。人間には見えない欄に何か入っていたら、黙って成功を返して捨てる
    if (b.hp) return json_({ ok: true, id: 'x' });
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (a === 'new')    return json_(newPost_(b));
      if (a === 'reply')  return json_(newReply_(b));
      if (a === 'vote')   return json_(vote_(b));
      if (a === 'solve')  return json_(solve_(b));
      if (a === 'flag')   return json_(flag_(b));
      if (a === 'remove') return json_(remove_(b));
      return json_({ ok: false, err: 'unknown' });
    } finally { lock.releaseLock(); }
  } catch (err) {
    return json_({ ok: false, err: String(err && err.message || err) });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================ 読む */

function list_(q) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('list');
  if (hit) return JSON.parse(hit);

  const posts = rows_('posts')
    .filter(function (p) { return p.status !== 'hidden'; })
    .map(function (p) {
      return {
        id: p.id, ts: String(p.ts), updated: String(p.updated || p.ts),
        cat: p.cat, lang: p.lang, title: p.title,
        preview: String(p.body).slice(0, PREVIEW_LEN),
        cut: String(p.body).length > PREVIEW_LEN,
        nick: p.nick, area: p.area,
        same: Number(p.same) || 0, replies: Number(p.replies) || 0,
        solved: !!p.solved
      };
    })
    .sort(function (a, b) { return a.ts < b.ts ? 1 : -1; })
    .slice(0, LIST_LIMIT);

  const out = { ok: true, posts: posts, now: new Date().toISOString() };
  cache.put('list', JSON.stringify(out), 20);   // 連打しても毎回シートを読まない
  return out;
}

function one_(id) {
  const p = rows_('posts').filter(function (x) { return String(x.id) === String(id); })[0];
  if (!p || p.status === 'hidden') return { ok: false, err: 'notfound' };
  const rs = rows_('replies')
    .filter(function (r) { return String(r.postId) === String(id) && r.status !== 'hidden'; })
    .map(function (r) {
      return { id: r.id, ts: String(r.ts), body: r.body, nick: r.nick,
               helpful: Number(r.helpful) || 0, mine: false };
    })
    .sort(function (a, b) { return a.ts > b.ts ? 1 : -1; });
  return {
    ok: true,
    post: { id: p.id, ts: String(p.ts), cat: p.cat, lang: p.lang, title: p.title,
            body: p.body, nick: p.nick, area: p.area,
            same: Number(p.same) || 0, solved: p.solved || '', dev: hash_(p.dev) },
    replies: rs
  };
}

/* ============================================================ 書く */

function newPost_(b) {
  const dev = clean_(b.dev, 64);
  const gate = limit_(dev, 'new', 40);
  if (!gate.ok) return gate;

  const title = clean_(b.title, 120);
  const body  = clean_(b.body, 4000);
  if (title.length < 4)  return { ok: false, err: 'short-title' };
  if (body.length  < 10) return { ok: false, err: 'short-body' };
  const bad = spam_(title + '\n' + body);
  if (bad) return { ok: false, err: 'spam', why: bad };

  const id  = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const now = new Date().toISOString();
  append_('posts', {
    id: id, ts: now, updated: now,
    cat: clean_(b.cat, 24) || 'other',
    lang: langOf_(title + ' ' + body),
    title: title, body: body,
    nick: clean_(b.nick, 24), area: clean_(b.area, 40),
    dev: dev, status: 'open', same: 0, replies: 0, solved: '', flags: 0
  });
  CacheService.getScriptCache().remove('list');
  notify_('🆕 新しいこまりごと', title + '\n' + body.slice(0, 300) + '\nhttps://moretojapan.com/help.html#p/' + id);
  return { ok: true, id: id };
}

function newReply_(b) {
  const dev = clean_(b.dev, 64);
  const gate = limit_(dev, 'reply', 15);
  if (!gate.ok) return gate;

  const body = clean_(b.body, 4000);
  if (body.length < 2) return { ok: false, err: 'short-body' };
  const bad = spam_(body);
  if (bad) return { ok: false, err: 'spam', why: bad };

  const post = rows_('posts').filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!post) return { ok: false, err: 'notfound' };

  const id  = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const now = new Date().toISOString();
  append_('replies', { id: id, ts: now, postId: post.id, body: body,
                       nick: clean_(b.nick, 24), dev: dev, helpful: 0, status: 'open', flags: 0 });
  patch_('posts', post.id, { replies: (Number(post.replies) || 0) + 1, updated: now });
  CacheService.getScriptCache().remove('list');
  notify_('💬 返事がつきました', post.title + '\n' + body.slice(0, 300) + '\nhttps://moretojapan.com/help.html#p/' + post.id);
  return { ok: true, id: id };
}

/** 「わたしも」「役に立った」。同じ端末からの二度押しは数えない */
function vote_(b) {
  const dev  = clean_(b.dev, 64);
  const kind = b.kind === 'helpful' ? 'helpful' : 'same';
  const key  = dev + '|' + kind + '|' + b.id;
  if (!dev) return { ok: false, err: 'nodev' };
  const seen = rows_('votes').some(function (v) { return v.key === key; });
  if (seen) return { ok: true, dup: true };
  append_('votes', { ts: new Date().toISOString(), key: key });

  if (kind === 'same') {
    const p = rows_('posts').filter(function (x) { return String(x.id) === String(b.id); })[0];
    if (!p) return { ok: false, err: 'notfound' };
    patch_('posts', p.id, { same: (Number(p.same) || 0) + 1 });
  } else {
    const r = rows_('replies').filter(function (x) { return String(x.id) === String(b.id); })[0];
    if (!r) return { ok: false, err: 'notfound' };
    patch_('replies', r.id, { helpful: (Number(r.helpful) || 0) + 1 });
  }
  CacheService.getScriptCache().remove('list');
  return { ok: true };
}

/** 書いた本人だけが「これで解決した」を押せる */
function solve_(b) {
  const p = rows_('posts').filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!p) return { ok: false, err: 'notfound' };
  if (String(p.dev) !== String(b.dev)) return { ok: false, err: 'notyours' };
  patch_('posts', p.id, { solved: b.replyId ? clean_(b.replyId, 32) : 'self', updated: new Date().toISOString() });
  CacheService.getScriptCache().remove('list');
  return { ok: true };
}

/** 自分が書いたものを自分で消す */
function remove_(b) {
  const name = b.kind === 'reply' ? 'replies' : 'posts';
  const row = rows_(name).filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!row) return { ok: false, err: 'notfound' };
  if (String(row.dev) !== String(b.dev)) return { ok: false, err: 'notyours' };
  patch_(name, row.id, { status: 'hidden' });
  if (name === 'replies') {
    const p = rows_('posts').filter(function (x) { return String(x.id) === String(row.postId); })[0];
    if (p) patch_('posts', p.id, { replies: Math.max(0, (Number(p.replies) || 0) - 1) });
  }
  CacheService.getScriptCache().remove('list');
  return { ok: true };
}

/** 通報。3件でひとまず隠して、本人（管理者）に知らせる */
function flag_(b) {
  const name = b.kind === 'reply' ? 'replies' : 'posts';
  const row = rows_(name).filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!row) return { ok: false, err: 'notfound' };
  const key = clean_(b.dev, 64) + '|flag|' + b.id;
  if (rows_('votes').some(function (v) { return v.key === key; })) return { ok: true, dup: true };
  append_('votes', { ts: new Date().toISOString(), key: key });

  const n = (Number(row.flags) || 0) + 1;
  const patch = { flags: n };
  if (n >= AUTO_HIDE_FLAGS) patch.status = 'hidden';
  patch_(name, row.id, patch);
  CacheService.getScriptCache().remove('list');
  notify_('🚩 通報 ' + n + '件目' + (n >= AUTO_HIDE_FLAGS ? '（自動で隠しました）' : ''),
          (row.title || row.body || '').toString().slice(0, 300) + '\nid: ' + row.id +
          '\n理由: ' + clean_(b.why, 200) + '\n' + ssUrl_(PropertiesService.getScriptProperties().getProperty(PROP_SHEET)));
  return { ok: true, hidden: n >= AUTO_HIDE_FLAGS };
}

/* ============================================================ こまごま */

/* 英語の文に「保険証」が1語まざっただけで日本語の投稿にはしない。
   かなと漢字が全体の2割を超えていたら日本語とみなす。 */
function langOf_(text) {
  const t = String(text);
  const ja = (t.match(/[\u3040-\u30ff\u4e00-\u9faf]/g) || []).length;
  return ja / Math.max(1, t.length) > 0.2 ? 'ja' : 'en';
}

function clean_(s, max) {
  return String(s == null ? '' : s).replace(/\u0000/g, '').trim().slice(0, max);
}

function hash_(s) {
  // 本人確認ではなく「自分の投稿かどうか」の見分けだけに使う短い指紋
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(s) + 'mtj');
  return raw.slice(0, 4).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

/** 同じ端末から立て続けに投げられたら断る（秒） */
function limit_(dev, kind, sec) {
  if (!dev) return { ok: false, err: 'nodev' };
  const c = CacheService.getScriptCache();
  const k = 'rl|' + kind + '|' + dev;
  if (c.get(k)) return { ok: false, err: 'toofast', wait: sec };
  c.put(k, '1', sec);
  return { ok: true };
}

/** スパムらしさ。本物の質問を落としたくないので判定はゆるく、リンクの数だけ厳しく */
function spam_(text) {
  const links = (text.match(/https?:\/\//g) || []).length;
  if (links > 3) return 'links';
  const base = ['viagra', 'casino', 'bitcoin profit', 'телеграм', 'подпис', '微信', '加微', '包养'];
  const extra = (PropertiesService.getScriptProperties().getProperty(PROP_NG) || '')
    .split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  const low = text.toLowerCase();
  const hit = base.concat(extra).filter(function (w) { return w && low.indexOf(w) >= 0; })[0];
  return hit ? 'word' : '';
}

function notify_(title, body) {
  const url = PropertiesService.getScriptProperties().getProperty(PROP_HOOK);
  if (!url) return;
  try {
    UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ content: ('**' + title + '**\n' + body).slice(0, 1900) }),
      muteHttpExceptions: true
    });
  } catch (err) {}
}
