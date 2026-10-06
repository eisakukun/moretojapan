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
const PROP_LESSON_MAIL = 'LESSON_MAIL';  // 申し込みの届け先。空ならスプレッドシートの持ち主（=本人）に届く

const AUTO_HIDE_FLAGS = 3;             // 通報がこれだけ付いたら自動で隠す
const LIST_LIMIT      = 400;           // 一覧で返す最大件数
const PREVIEW_LEN     = 300;           // 一覧に載せる本文の長さ

const COLS = {
  posts:   ['id','ts','updated','cat','lang','title','body','nick','area','dev','status','same','replies','solved','flags'],
  replies: ['id','ts','postId','body','nick','dev','helpful','status','flags'],
  votes:   ['ts','key'],
  // ゆずります・さがしています（ジモティーにあたるほう）
  items:   ['id','ts','updated','kind','title','body','price','nego','cat','area','deliver',
            'photos','langs','nick','dev','mail','status','comments','flags'],
  // いっしょに何かやる（趣味で集まるほう）
  plans:   ['id','ts','updated','kind','title','body','cat','when','area','level','size',
            'langs','nick','dev','mail','status','going','comments','flags',
            'learn', 'live'],   // ← 足すときは必ず末尾に（途中だと既存行の読む位置がずれる）
  // つぶやき。Twitterの形。返信は parent に親のidを入れて同じ表に積む
  tweets:  ['id','ts','body','nick','dev','langs','learn','likes','replies','parent','status','flags'],
  // 通話の回数券。払った人に渡す文字列だけを持つ。誰が払ったかは持たない
  passes:  ['code','ts','until','note','devs'],
  // 体験レッスンの申し込み。表には一切出さない（本人のメールとDiscordに届くだけ）
  bookings: ['id','ts','name','contact','level','where','goal','lang','dev','status']
};

const OK_LANGS = ['en','ja','zh','vi','ko','tl','ne'];   // 話せることばに書ける言語
const PROP_PHOTOS = 'PHOTO_FOLDER_ID';   // 写真の置き場（setup が作る）
const MAX_PHOTOS  = 3;
const ITEM_DAYS   = 60;                  // これより古いものは一覧から落とす
const TWEET_DAYS  = 120;                 // つぶやきは古くても残す。数が少ないうちは消すと死んで見える
const PLAN_DAYS   = 45;                  // 誘いは古くなるのが早い。45日で一覧から落とす
const LIVE_SEC    = 100;                 // これより新しい合図があれば「いま居る」とみなす
const TR_MAX      = 1200;                // 一度に意味を引ける長さ

/* ============================================================ 置き場所 */

function setup() {
  const p = PropertiesService.getScriptProperties();
  let id = p.getProperty(PROP_SHEET);
  if (id) {
    try {
      SpreadsheetApp.openById(id);
      photoFolder_();
      const fixed = fixCols_();
      return 'already: ' + ssUrl_(id) + (fixed.length ? ' / 列を直した: ' + fixed.join(',') : '');
    } catch (err) { id = null; }
  }
  const ss = SpreadsheetApp.create('More to Japan 掲示板データ');
  Object.keys(COLS).forEach(function (name, i) {
    const sh = i === 0 ? ss.getSheets()[0].setName(name) : ss.insertSheet(name);
    sh.getRange(1, 1, 1, COLS[name].length).setValues([COLS[name]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  p.setProperty(PROP_SHEET, ss.getId());
  photoFolder_();
  return 'created: ' + ss.getUrl();
}

/** 写真の置き場。1枚ずつ「リンクを知っている全員」にして、表からは直接読ませる */
function photoFolder_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty(PROP_PHOTOS);
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) {} }
  const f = DriveApp.createFolder('More to Japan 掲示板の写真');
  p.setProperty(PROP_PHOTOS, f.getId());
  return f;
}

/** 列を足したあと、シートの見出しを今の形に直す。setup を ▶ したときに走る。
 *  列の中に新しいものが割り込むと、人がシートを見たときに見出しがずれて読めなくなるので。 */
function fixCols_() {
  const out = [];
  Object.keys(COLS).forEach(function (name) {
    const sh = sheet_(name);
    const want = COLS[name];
    const have = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0]
                   .map(function (v) { return String(v); });
    if (have.join('|') === want.join('|')) return;
    // 足りない列を、あるべき位置に空で差し込む
    want.forEach(function (c, i) {
      if (have[i] !== c && have.indexOf(c) < 0) {
        sh.insertColumnBefore(i + 1);
        have.splice(i, 0, c);
      }
    });
    sh.getRange(1, 1, 1, want.length).setValues([want]).setFontWeight('bold');
    out.push(name);
  });
  return out;
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
  }).filter(function (o) { return o.id || o.key || o.code; });   // passes は code が主キー
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
    if (a === 'list')  return json_(list_(q));
    if (a === 'post')  return json_(one_(q.id));
    if (a === 'items') return json_(items_(q));
    if (a === 'item')  return json_(oneItem_(q.id));
    if (a === 'plans') return json_(plans_(q));
    if (a === 'plan')  return json_(onePlan_(q.id));
    if (a === 'tr')     return json_(tr_(q));
    if (a === 'tweets') return json_(tweets_(q));
    if (a === 'tweet')  return json_(oneTweet_(q.id));
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
      if (a === 'new')     return json_(newPost_(b));
      if (a === 'newitem') return json_(newItem_(b));
      if (a === 'sold')    return json_(sold_(b));
      if (a === 'newplan') return json_(newPlan_(b));
      if (a === 'close')   return json_(close_(b));
      if (a === 'live')    return json_(live_(b));
      if (a === 'pass')    return json_(pass_(b));
      if (a === 'book')     return json_(newBooking_(b));
      if (a === 'newtweet') return json_(newTweet_(b));
      if (a === 'like')     return json_(like_(b));
      if (a === 'reply')   return json_(newReply_(b));
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
  notify_('🆕 新しいこまりごと', title + '\n' + body.slice(0, 300) + '\nhttps://moretojapan.com/help/#p/' + id);
  return { ok: true, id: id };
}

/* ============================================================ 体験レッスンの申し込み
 * 本人はメールの山に埋もれて気づけないので、メールとDiscordの両方に飛ばす。
 * メールは返信先を生徒にしておくので、届いたメールで「返信」を押せばそのまま生徒に届く。 */

function newBooking_(b) {
  const dev = clean_(b.dev, 64);
  const gate = limit_(dev, 'book', 60);
  if (!gate.ok) return gate;

  const name    = clean_(b.name, 60);
  const contact = clean_(b.contact, 120);
  const level   = clean_(b.level, 80);
  const where   = clean_(b.where, 40);
  const goal    = clean_(b.goal, 2000);
  if (!name)    return { ok: false, err: 'noname' };
  if (contact.length < 3) return { ok: false, err: 'nocontact' };
  if (spam_(name + '\n' + contact + '\n' + goal)) return { ok: true, id: 'x' };   // 黙って捨てる

  const id  = 'b' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const now = new Date().toISOString();
  append_('bookings', { id: id, ts: now, name: name, contact: contact, level: level,
                        where: where, goal: goal, lang: clean_(b.lang, 4), dev: dev, status: 'new' });

  const text = 'お名前：' + name + '\n連絡先：' + contact + '\nレベル：' + level +
               '\nオンライン／対面：' + where + '\n\nできるようになりたいこと：\n' + (goal || '（空欄）');
  notify_('📩 体験レッスンの申し込み', text);

  const to = lessonMail_();
  if (to) {
    const isMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    try {
      const mail = {
        to: to,
        subject: '📩【More to Japan】体験レッスンの申し込み：' + name,
        body: text + '\n\n' + (isMail
          ? 'このメールに「返信」すると、そのまま ' + name + ' さんに届きます。'
          : '連絡先がメールではありません。上の連絡先から返事してください。') +
          '\n\n一覧：' + ssUrl_(PropertiesService.getScriptProperties().getProperty(PROP_SHEET)),
        name: 'More to Japan'
      };
      if (isMail) mail.replyTo = contact;
      MailApp.sendEmail(mail);
    } catch (err) {}
  }
  return { ok: true, id: id };
}

/** 届け先。LESSON_MAIL が無ければスプレッドシートの持ち主。
 *  アドレスをコードに書かないのは、このフォルダがGitHubに公開されているから */
function lessonMail_() {
  const p = PropertiesService.getScriptProperties();
  const set = p.getProperty(PROP_LESSON_MAIL);
  if (set) return set;
  try { return DriveApp.getFileById(p.getProperty(PROP_SHEET)).getOwner().getEmail(); }
  catch (err) { return ''; }
}

function newReply_(b) {
  const dev = clean_(b.dev, 64);
  const gate = limit_(dev, 'reply', 15);
  if (!gate.ok) return gate;

  const body = clean_(b.body, 4000);
  if (body.length < 2) return { ok: false, err: 'short-body' };
  const bad = spam_(body);
  if (bad) return { ok: false, err: 'spam', why: bad };

  // こまりごと（posts）・ゆずります（items）・いっしょにやる（plans）の3つに返事がつく
  const head   = String(b.id).charAt(0);
  const isItem = head === 'i';
  const isPlan = head === 'g';
  const sheet  = isItem ? 'items' : isPlan ? 'plans' : 'posts';
  const parent = rows_(sheet).filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!parent) return { ok: false, err: 'notfound' };

  const id  = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const now = new Date().toISOString();
  append_('replies', { id: id, ts: now, postId: parent.id, body: body,
                       nick: clean_(b.nick, 24), dev: dev, helpful: 0, status: 'open', flags: 0 });
  patch_(sheet, parent.id,
    (isItem || isPlan) ? { comments: (Number(parent.comments) || 0) + 1, updated: now }
                       : { replies:  (Number(parent.replies)  || 0) + 1, updated: now });
  CacheService.getScriptCache().removeAll(['list', 'items', 'plans']);

  const url = isItem ? 'https://moretojapan.com/market/#i/' + parent.id
            : isPlan ? 'https://moretojapan.com/play/#g/' + parent.id
                     : 'https://moretojapan.com/help/#p/' + parent.id;
  notify_(isItem ? '🛒 ゆずりますにコメント' : isPlan ? '🎮 いっしょにやるに書き込み' : '💬 返事がつきました',
          parent.title + '\n' + body.slice(0, 300) + '\n' + url);

  // 出した本人がメールを入れていたら、そこにだけ知らせる。メールは表には出さない
  if ((isItem || isPlan) && parent.mail && String(parent.dev) !== String(dev)) {
    try {
      MailApp.sendEmail(String(parent.mail),
        '[More to Japan] 「' + parent.title + '」にコメントがつきました',
        body.slice(0, 500) + '\n\n' + url +
        '\n\n--\nこの知らせは、出すときに自分で入れたアドレスにだけ届きます。' +
        '相手にはあなたのアドレスは見えていません。');
    } catch (err) {}
  }
  return { ok: true, id: id };
}

/** 「わたしも」「役に立った」。同じ端末からの二度押しは数えない */
function vote_(b) {
  const dev  = clean_(b.dev, 64);
  const kind = b.kind === 'helpful' ? 'helpful' : b.kind === 'going' ? 'going' : 'same';
  const key  = dev + '|' + kind + '|' + b.id;
  if (!dev) return { ok: false, err: 'nodev' };
  const seen = rows_('votes').some(function (v) { return v.key === key; });
  if (seen) return { ok: true, dup: true };
  append_('votes', { ts: new Date().toISOString(), key: key });

  if (kind === 'going') {
    // 「行きます」。人数が見えることがこの掲示板の全部なので、二度押しは数えない
    const g = rows_('plans').filter(function (x) { return String(x.id) === String(b.id); })[0];
    if (!g) return { ok: false, err: 'notfound' };
    const n = (Number(g.going) || 0) + 1;
    patch_('plans', g.id, { going: n, updated: new Date().toISOString() });
    CacheService.getScriptCache().remove('plans');
    if (String(g.dev) !== String(dev)) {
      notify_('🙋 行きます（' + n + '人）',
              g.title + '\nhttps://moretojapan.com/play/#g/' + g.id);
      if (g.mail) {
        try {
          MailApp.sendEmail(String(g.mail),
            '[More to Japan] 「' + g.title + '」に行きたい人がいます（' + n + '人）',
            'https://moretojapan.com/play/#g/' + g.id +
            '\n\n--\nこの知らせは、出すときに自分で入れたアドレスにだけ届きます。' +
            '相手にはあなたのアドレスは見えていません。');
        } catch (err) {}
      }
    }
    return { ok: true, going: n };
  }
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
function sheetOf_(kind) {
  return kind === 'reply' ? 'replies'
       : kind === 'item'  ? 'items'
       : kind === 'plan'  ? 'plans'
       : kind === 'tweet' ? 'tweets'
                          : 'posts';
}

function remove_(b) {
  const name = sheetOf_(b.kind);
  const row = rows_(name).filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!row) return { ok: false, err: 'notfound' };
  if (String(row.dev) !== String(b.dev)) return { ok: false, err: 'notyours' };
  patch_(name, row.id, { status: 'hidden' });
  if (name === 'replies') {
    const head = String(row.postId).charAt(0);
    const sh = head === 'i' ? 'items' : head === 'g' ? 'plans' : 'posts';
    const par = rows_(sh).filter(function (x) { return String(x.id) === String(row.postId); })[0];
    if (par) patch_(sh, par.id, sh === 'posts'
      ? { replies:  Math.max(0, (Number(par.replies)  || 0) - 1) }
      : { comments: Math.max(0, (Number(par.comments) || 0) - 1) });
  }
  CacheService.getScriptCache().removeAll(['list', 'items', 'plans']);
  return { ok: true };
}

/** 通報。3件でひとまず隠して、本人（管理者）に知らせる */
function flag_(b) {
  const name = sheetOf_(b.kind);
  const row = rows_(name).filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!row) return { ok: false, err: 'notfound' };
  const key = clean_(b.dev, 64) + '|flag|' + b.id;
  if (rows_('votes').some(function (v) { return v.key === key; })) return { ok: true, dup: true };
  append_('votes', { ts: new Date().toISOString(), key: key });

  const n = (Number(row.flags) || 0) + 1;
  const patch = { flags: n };
  if (n >= AUTO_HIDE_FLAGS) patch.status = 'hidden';
  patch_(name, row.id, patch);
  CacheService.getScriptCache().removeAll(['list', 'items', 'plans']);
  notify_('🚩 通報 ' + n + '件目' + (n >= AUTO_HIDE_FLAGS ? '（自動で隠しました）' : ''),
          (row.title || row.body || '').toString().slice(0, 300) + '\nid: ' + row.id +
          '\n理由: ' + clean_(b.why, 200) + '\n' + ssUrl_(PropertiesService.getScriptProperties().getProperty(PROP_SHEET)));
  return { ok: true, hidden: n >= AUTO_HIDE_FLAGS };
}


/* ============================================================ ゆずります・さがしています
 *
 *  ジモティーにあたるほう。ちがうのは客で、ここは「日本を出ていく人」と
 *  「来たばかりの人」をつなぐ。出ていく人は冷蔵庫も自転車も置いていくしかなく、
 *  来た人は同じものを全部買わされる。その2人が今はすれ違っている。
 *  だから 0円（あげます）を一等地に置く。ジモティーでも0円が主役になっている。
 */

function items_(q) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('items');
  if (hit) return JSON.parse(hit);

  const limit = Date.now() - ITEM_DAYS * 86400000;
  const list = rows_('items')
    .filter(function (it) { return it.status !== 'hidden'; })
    .filter(function (it) { return new Date(it.ts).getTime() > limit; })
    .map(function (it) {
      return {
        id: it.id, ts: String(it.ts), kind: it.kind,
        title: it.title, preview: String(it.body).slice(0, 200),
        price: Number(it.price) || 0, nego: !!it.nego,
        cat: it.cat, area: it.area, deliver: it.deliver,
        photos: String(it.photos || '').split(',').filter(Boolean),
        langs: String(it.langs || '').split(',').filter(Boolean),
        nick: it.nick, comments: Number(it.comments) || 0,
        sold: it.status === 'sold'
      };
    })
    .sort(function (a, b) { return a.ts < b.ts ? 1 : -1; })
    .slice(0, LIST_LIMIT);

  const out = { ok: true, items: list, now: new Date().toISOString() };
  cache.put('items', JSON.stringify(out), 20);
  return out;
}

function oneItem_(id) {
  const it = rows_('items').filter(function (x) { return String(x.id) === String(id); })[0];
  if (!it || it.status === 'hidden') return { ok: false, err: 'notfound' };
  const cs = rows_('replies')
    .filter(function (r) { return String(r.postId) === String(id) && r.status !== 'hidden'; })
    .map(function (r) { return { id: r.id, ts: String(r.ts), body: r.body, nick: r.nick }; })
    .sort(function (a, b) { return a.ts > b.ts ? 1 : -1; });
  return {
    ok: true,
    item: {
      id: it.id, ts: String(it.ts), kind: it.kind, title: it.title, body: it.body,
      price: Number(it.price) || 0, nego: !!it.nego, cat: it.cat, area: it.area,
      deliver: it.deliver, photos: String(it.photos || '').split(',').filter(Boolean),
      langs: String(it.langs || '').split(',').filter(Boolean),
      nick: it.nick, sold: it.status === 'sold'
      // mail はここには絶対に入れない
    },
    comments: cs
  };
}

function newItem_(b) {
  const dev = clean_(b.dev, 64);
  const gate = limit_(dev, 'item', 40);
  if (!gate.ok) return gate;

  const title = clean_(b.title, 120);
  const body  = clean_(b.body, 4000);
  const area  = clean_(b.area, 60);
  const kind  = ['sell', 'free', 'want'].indexOf(b.kind) >= 0 ? b.kind : 'sell';
  if (title.length < 3) return { ok: false, err: 'short-title' };
  if (body.length  < 5) return { ok: false, err: 'short-body' };
  if (!area)            return { ok: false, err: 'no-area' };
  // 話せることばは必ず1つ。会って渡すのだから、通じるかどうかが先に分かっていないと意味がない
  const langs = (b.langs || []).filter(function (x) { return OK_LANGS.indexOf(x) >= 0; });
  if (!langs.length) return { ok: false, err: 'no-langs' };
  const bad = spam_(title + '\n' + body);
  if (bad) return { ok: false, err: 'spam', why: bad };

  let price = Math.max(0, Math.min(9999999, Math.floor(Number(b.price) || 0)));
  if (kind === 'free') price = 0;

  const photos = savePhotos_(b.photos);
  const id  = 'i' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const now = new Date().toISOString();
  append_('items', {
    id: id, ts: now, updated: now, kind: kind, title: title, body: body,
    price: price, nego: b.nego ? 1 : '', cat: clean_(b.cat, 24) || 'misc',
    area: area, deliver: clean_(b.deliver, 16) || 'pickup',
    photos: photos.join(','), langs: langs.join(','),
    nick: clean_(b.nick, 24), dev: dev,
    mail: validMail_(b.mail), status: 'open', comments: 0, flags: 0
  });
  CacheService.getScriptCache().remove('items');
  notify_(kind === 'want' ? '🔎 さがしています' : kind === 'free' ? '🎁 あげます（0円）' : '🛒 売ります',
          title + '（' + (price ? '¥' + price : '0円') + '・' + area + '）\n' +
          body.slice(0, 200) + '\nhttps://moretojapan.com/market/#i/' + id);
  return { ok: true, id: id };
}

/** 出した本人だけが「もう無くなりました」にできる */
function sold_(b) {
  const it = rows_('items').filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!it) return { ok: false, err: 'notfound' };
  if (String(it.dev) !== String(b.dev)) return { ok: false, err: 'notyours' };
  patch_('items', it.id, { status: it.status === 'sold' ? 'open' : 'sold',
                           updated: new Date().toISOString() });
  CacheService.getScriptCache().remove('items');
  return { ok: true, sold: it.status !== 'sold' };
}

/** 写真。表で小さくしてから送ってもらう。ここでは形と大きさだけ見る */
function savePhotos_(arr) {
  if (!arr || !arr.length) return [];
  const folder = photoFolder_();
  const out = [];
  arr.slice(0, MAX_PHOTOS).forEach(function (d) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(d || ''));
    if (!m) return;
    if (m[2].length > 900000) return;            // 約650KB。これより大きいのは表の縮小が効いていない
    try {
      const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1],
        'mtj' + Date.now() + Math.floor(Math.random() * 1e6) + '.jpg');
      const f = folder.createFile(blob);
      f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      out.push(f.getId());
    } catch (err) {}
  });
  return out;
}

/** 知らせる先。形だけ見る。表には絶対に返さない列に入る */
function validMail_(s) {
  const v = clean_(s, 120);
  return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v) ? v : '';
}

/* ============================================================ いっしょに何かやる
 *
 *  言語交換の掲示板にはしない。会話そのものが目的だと、気まずさが全部表に出て
 *  20分で終わる。ゲームでもバスケでもボルダリングでも、手元に共通の対象があると
 *  黙っていい時間ができて、言葉が下手でも成り立つ。言葉はその副産物として伸びる。
 *
 *  だから単位は「人（プロフィール）」ではなく「やること（誘い）」。
 *  登録が要らないのも、古いものが勝手に落ちるのも、それが誘いだから。
 */

const PLAN_KINDS  = ['meet', 'online', 'open'];   // 会ってやる／オンライン／日はまだ無い
const PLAN_LEVELS = ['any', 'new', 'serious'];    // だれでも／はじめて／本気

function plans_(q) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('plans');
  if (hit) return JSON.parse(hit);

  const limit = Date.now() - PLAN_DAYS * 86400000;
  const list = rows_('plans')
    .filter(function (g) { return g.status !== 'hidden'; })
    .filter(function (g) { return new Date(g.ts).getTime() > limit; })
    .map(function (g) {
      return {
        id: g.id, ts: String(g.ts), kind: g.kind,
        title: g.title, preview: String(g.body).slice(0, 200),
        cat: g.cat, when: String(g.when || ''), area: String(g.area || ''),
        level: g.level || 'any', size: Number(g.size) || 0,
        langs: String(g.langs || '').split(',').filter(Boolean),
        learn: String(g.learn || '').split(',').filter(Boolean),
        live: liveNow_(g.live),
        nick: g.nick, going: Number(g.going) || 0,
        comments: Number(g.comments) || 0,
        closed: g.status === 'closed'
      };
    })
    .sort(function (a, b) { return a.ts < b.ts ? 1 : -1; })
    .slice(0, LIST_LIMIT);

  const out = { ok: true, plans: list, now: new Date().toISOString() };
  cache.put('plans', JSON.stringify(out), 20);
  return out;
}

function onePlan_(id) {
  const g = rows_('plans').filter(function (x) { return String(x.id) === String(id); })[0];
  if (!g || g.status === 'hidden') return { ok: false, err: 'notfound' };
  const cs = rows_('replies')
    .filter(function (r) { return String(r.postId) === String(id) && r.status !== 'hidden'; })
    .map(function (r) { return { id: r.id, ts: String(r.ts), body: r.body, nick: r.nick }; })
    .sort(function (a, b) { return a.ts > b.ts ? 1 : -1; });
  return {
    ok: true,
    plan: {
      id: g.id, ts: String(g.ts), kind: g.kind, title: g.title, body: g.body,
      cat: g.cat, when: String(g.when || ''), area: String(g.area || ''),
      level: g.level || 'any', size: Number(g.size) || 0,
      langs: String(g.langs || '').split(',').filter(Boolean),
      learn: String(g.learn || '').split(',').filter(Boolean),
      live: liveNow_(g.live),
      nick: g.nick, going: Number(g.going) || 0, closed: g.status === 'closed'
      // mail はここには絶対に入れない
    },
    comments: cs
  };
}

function newPlan_(b) {
  const dev = clean_(b.dev, 64);
  const gate = limit_(dev, 'plan', 40);
  if (!gate.ok) return gate;

  const kind  = PLAN_KINDS.indexOf(b.kind) >= 0 ? b.kind : 'meet';
  const title = clean_(b.title, 120);
  const body  = clean_(b.body, 4000);
  const area  = clean_(b.area, 60);
  if (title.length < 3) return { ok: false, err: 'short-title' };
  if (body.length  < 5) return { ok: false, err: 'short-body' };
  // 会ってやるなら場所だけは要る。オンラインと「日はまだ無い」は要らない
  if (kind === 'meet' && !area) return { ok: false, err: 'no-area' };
  const langs = (b.langs || []).filter(function (x) { return OK_LANGS.indexOf(x) >= 0; });
  if (!langs.length) return { ok: false, err: 'no-langs' };
  // ここは言語交換が土台なので、習いたいことばも必ず要る。
  // 片方しか無い投稿は「遊ぶ相手募集」になってしまい、別の掲示板になる
  const learn = (b.learn || []).filter(function (x) { return OK_LANGS.indexOf(x) >= 0; });
  if (!learn.length) return { ok: false, err: 'no-learn' };
  const bad = spam_(title + '\n' + body);
  if (bad) return { ok: false, err: 'spam', why: bad };

  const id  = 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const now = new Date().toISOString();
  append_('plans', {
    id: id, ts: now, updated: now, kind: kind, title: title, body: body,
    cat: clean_(b.cat, 24) || 'other',
    when: clean_(b.when, 60), area: area,
    level: PLAN_LEVELS.indexOf(b.level) >= 0 ? b.level : 'any',
    size: Math.max(0, Math.min(99, Math.floor(Number(b.size) || 0))),
    langs: langs.join(','), learn: learn.join(','),
    nick: clean_(b.nick, 24), dev: dev, mail: validMail_(b.mail),
    status: 'open', going: 0, comments: 0, flags: 0
  });
  CacheService.getScriptCache().remove('plans');
  notify_(kind === 'online' ? '🎮 オンラインで' : kind === 'open' ? '🔁 仲間さがし' : '📅 いっしょにやる',
          title + '（' + (clean_(b.when, 60) || '日はまだ') + (area ? '・' + area : '') + '）\n' +
          body.slice(0, 200) + '\nhttps://moretojapan.com/play/#g/' + id);
  return { ok: true, id: id };
}

/** 出した本人だけが「もう埋まりました／終わりました」にできる */
function close_(b) {
  const g = rows_('plans').filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!g) return { ok: false, err: 'notfound' };
  if (String(g.dev) !== String(b.dev)) return { ok: false, err: 'notyours' };
  patch_('plans', g.id, { status: g.status === 'closed' ? 'open' : 'closed',
                          updated: new Date().toISOString() });
  CacheService.getScriptCache().remove('plans');
  return { ok: true, closed: g.status !== 'closed' };
}

/* ============================================================ つぶやき
 *
 *  Twitter の形。ただし一つだけ違うものを必ず付ける：ことばの旗（話せる → 習いたい）。
 *  旗が無ければ、ここは「日本語と英語が混ざっただけの寂れたタイムライン」になる。
 *  旗があると、読めない相手の投稿にも「この人は自分のことばを欲しがっている」と分かる。
 *
 *  返信も同じ表に積み、parent に親の id を入れる。Twitter と同じで、返信もつぶやき。
 *  古いものを消さないのは、数が少ないうちに消すと死んで見えるから（掲示板とは逆の判断）。 */

function tweets_(q) {
  const cache = CacheService.getScriptCache();
  const key = 'tweets|' + (q.parent || '');
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  const limit = Date.now() - TWEET_DAYS * 86400000;
  const all = rows_('tweets').filter(function (t) { return t.status !== 'hidden'; });
  const list = all
    .filter(function (t) {
      if (new Date(t.ts).getTime() <= limit) return false;
      return q.parent ? String(t.parent) === String(q.parent) : !t.parent;
    })
    .map(shapeTweet_)
    .sort(function (a, b) { return q.parent ? (a.ts > b.ts ? 1 : -1) : (a.ts < b.ts ? 1 : -1); })
    .slice(0, LIST_LIMIT);

  const out = { ok: true, tweets: list, now: new Date().toISOString() };
  cache.put(key, JSON.stringify(out), 15);
  return out;
}

function shapeTweet_(t) {
  return {
    id: t.id, ts: String(t.ts), body: t.body, nick: t.nick,
    langs: String(t.langs || '').split(',').filter(Boolean),
    learn: String(t.learn || '').split(',').filter(Boolean),
    likes: Number(t.likes) || 0, replies: Number(t.replies) || 0,
    parent: t.parent || '', who: hash_(t.dev)
  };
}

/** 1件とその返信。Twitter でいうスレッド表示 */
function oneTweet_(id) {
  const t = rows_('tweets').filter(function (x) { return String(x.id) === String(id); })[0];
  if (!t || t.status === 'hidden') return { ok: false, err: 'notfound' };
  const kids = rows_('tweets')
    .filter(function (x) { return String(x.parent) === String(id) && x.status !== 'hidden'; })
    .map(shapeTweet_)
    .sort(function (a, b) { return a.ts > b.ts ? 1 : -1; });
  return { ok: true, tweet: shapeTweet_(t), replies: kids };
}

function newTweet_(b) {
  const dev = clean_(b.dev, 64);
  const gate = limit_(dev, 'tweet', 20);
  if (!gate.ok) return gate;

  const body = clean_(b.body, 400);          // Twitter と同じく短く切る
  if (body.length < 1) return { ok: false, err: 'empty' };
  const bad = spam_(body);
  if (bad) return { ok: false, err: 'spam', why: bad };

  // 旗はここの背骨。話せることばだけは必ず要る（習いたいほうは無くても出せる）
  const langs = (b.langs || []).filter(function (x) { return OK_LANGS.indexOf(x) >= 0; });
  if (!langs.length) return { ok: false, err: 'no-langs' };
  const learn = (b.learn || []).filter(function (x) { return OK_LANGS.indexOf(x) >= 0; });

  let parent = '';
  if (b.parent) {
    const p = rows_('tweets').filter(function (x) { return String(x.id) === String(b.parent); })[0];
    if (!p) return { ok: false, err: 'notfound' };
    parent = p.id;
    patch_('tweets', p.id, { replies: (Number(p.replies) || 0) + 1 });
  }

  const id  = 't' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const now = new Date().toISOString();
  append_('tweets', {
    id: id, ts: now, body: body, nick: clean_(b.nick, 24), dev: dev,
    langs: langs.join(','), learn: learn.join(','),
    likes: 0, replies: 0, parent: parent, status: 'open', flags: 0
  });
  CacheService.getScriptCache().removeAll(['tweets|', 'tweets|' + parent]);
  notify_(parent ? '💬 つぶやきに返信' : '🐦 つぶやき',
          body.slice(0, 300) + '\nhttps://moretojapan.com/tweet/#t/' + (parent || id));
  return { ok: true, id: id };
}

/** いいね。同じ端末からの二度押しは数えない（votes を使い回す） */
function like_(b) {
  const dev = clean_(b.dev, 64);
  if (!dev) return { ok: false, err: 'nodev' };
  const key = dev + '|like|' + b.id;
  if (rows_('votes').some(function (v) { return v.key === key; })) return { ok: true, dup: true };
  const t = rows_('tweets').filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!t) return { ok: false, err: 'notfound' };
  append_('votes', { ts: new Date().toISOString(), key: key });
  const n = (Number(t.likes) || 0) + 1;
  patch_('tweets', t.id, { likes: n });
  CacheService.getScriptCache().removeAll(['tweets|', 'tweets|' + (t.parent || '')]);
  return { ok: true, likes: n };
}

/* ============================================================ いま居る・意味・回数券 */

/** その合図が新しいか。「いま話せる人」を一覧に出すためだけに使う */
function liveNow_(v) {
  const t = v ? new Date(v).getTime() : 0;
  return !!t && (Date.now() - t) < LIVE_SEC * 1000;
}

/** 通話をひらいている人が、生きている合図を置きにくる。
 *  出した本人しか置けない。閉じるときは on:false で消す */
function live_(b) {
  const g = rows_('plans').filter(function (x) { return String(x.id) === String(b.id); })[0];
  if (!g) return { ok: false, err: 'notfound' };
  if (String(g.dev) !== String(b.dev)) return { ok: false, err: 'notyours' };
  patch_('plans', g.id, { live: b.on === false ? '' : new Date().toISOString() });
  CacheService.getScriptCache().remove('plans');
  return { ok: true };
}

/* 意味を引く。投稿そのものは翻訳しない方針は変えていない。
   原文は必ず画面に残したまま、読む人が自分で押したときだけ、その場で意味を出す。
   機械訳を本文として置くのと、読む人が辞書を引くのは別のこと。 */
function tr_(q) {
  const text = clean_(q.q, TR_MAX);
  const to   = OK_LANGS.indexOf(q.to) >= 0 ? q.to : 'en';
  if (!text) return { ok: false, err: 'empty' };

  const c   = CacheService.getScriptCache();
  const key = 'tr|' + to + '|' + hash_(text);
  const hit = c.get(key);
  if (hit) return { ok: true, text: hit, from: langOf_(text), cached: true };

  try {
    // LanguageApp は Apps Script に最初から入っていて鍵が要らない。
    // 元の言語は '' を渡して自動で見させる（人は何語かを知らずに貼るので）
    const out = LanguageApp.translate(text, '', to);
    if (!out) return { ok: false, err: 'notr' };
    c.put(key, out, 21600);   // 6時間。同じ単語を何人も引くので効く
    return { ok: true, text: out, from: langOf_(text) };
  } catch (err) {
    return { ok: false, err: 'notr', why: String(err && err.message || err) };
  }
}

/* 通話の回数券。払った人の名前もメールも持たない。文字列だけ。
   makePasses() を ▶ で走らせると新しい券ができる（→ 手渡し or 決済後に配る）。 */
function makePasses(n, days, note) {
  n = Number(n) || 5;
  days = Number(days) || 30;
  const out = [];
  const until = new Date(Date.now() + days * 86400000).toISOString();
  for (let i = 0; i < n; i++) {
    const code = 'MTJ-' + Math.random().toString(36).slice(2, 6).toUpperCase()
               + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    append_('passes', { code: code, ts: new Date().toISOString(), until: until,
                        note: clean_(note, 60), devs: '' });
    out.push(code);
  }
  return out.join('\n');
}

/** 券を入れる。合っていれば「いつまで有効か」だけ返す */
function pass_(b) {
  const code = clean_(b.code, 32).toUpperCase();
  const dev  = clean_(b.dev, 64);
  if (!code) return { ok: false, err: 'nocode' };
  const p = rows_('passes').filter(function (x) {
    return String(x.code).toUpperCase() === code;
  })[0];
  if (!p) return { ok: false, err: 'badcode' };
  const until = new Date(p.until).getTime();
  if (!until || until < Date.now()) return { ok: false, err: 'expired' };
  // 使った端末を控える。止めるためではなく、配った数と実際に使われた数を見るため
  const devs = String(p.devs || '').split(',').filter(Boolean);
  if (dev && devs.indexOf(dev) < 0) {
    devs.push(dev);
    patch_('passes', p.code, { devs: devs.slice(-20).join(',') });
  }
  return { ok: true, until: new Date(until).toISOString() };
}

/* ============================================================ こまごま */

/* 投稿が何語で書かれているかを見る。読める人に届けるための印で、翻訳はしない。
   かな があれば日本語。かな が無くて漢字だけなら中国語。
   ベトナム語はラテン文字に独特の記号（ă â đ ê ô ơ ư と声調）が必ず混じる。
   英語の文に「保険証」が1語まざっただけで日本語あつかいにはしない（割合で見る）。 */
function langOf_(text) {
  const t = String(text);
  const kana = (t.match(/[\u3040-\u30ff]/g) || []).length;
  const han  = (t.match(/[\u4e00-\u9faf]/g) || []).length;
  const viet = (t.match(/[ăâđêôơưĂÂĐÊÔƠƯáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/g) || []).length;
  const n = Math.max(1, t.length);
  if ((kana + han) / n > 0.2) return kana > 0 ? 'ja' : 'zh';
  if (viet / n > 0.02) return 'vi';
  return 'en';
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
