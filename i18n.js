/*  More to Japan — 掲示板まわりの言葉（7か国語）
 *
 *  なぜこの言葉たちか：日本に住んでいる外国人の上位は
 *  中国93万／ベトナム68万／韓国41万／フィリピン36万／ネパール30万
 *  （出入国在留管理庁・2025年12月末、総数412万）。
 *  英語だけでは、日本に住む外国人の半分に届かない。
 *
 *  仕組み：英語の原文をそのまま鍵にする。だからHTMLにもJSにも手を入れずに訳を足せる。
 *  訳は言語ごとに i18n/<言語>.js に分けてあり、その言語を選んだ人だけが読み込む
 *  （7言語ぶんを全員に送りつけない）。鍵が無ければ英語のまま出る。
 *  半端な機械訳を出すより、英語のまま出したほうが親切。
 */
/* 旗はここ1か所。全部のページがこの表を読むので、足すのも直すのもここだけでいい。
   ⚠️ 英語に「正しい旗」は無い（イギリスもアメリカも他もある）。便宜で🇬🇧にしてある。
   ⚠️ Windowsは国旗の絵文字を描けず「GB」「JP」の2文字で出る。読めるので許容。
      だから旗だけに頼らず、必ず名前か短い札（JA/EN）と並べて出すこと。 */
window.MTJ_LANGS = [
  { id:"en", name:"English",     flag:"🇬🇧", sh:"EN" },
  { id:"ja", name:"日本語",       flag:"🇯🇵", sh:"JA" },
  { id:"zh", name:"中文",         flag:"🇨🇳", sh:"ZH" },
  { id:"vi", name:"Tiếng Việt",  flag:"🇻🇳", sh:"VI" },
  { id:"ko", name:"한국어",       flag:"🇰🇷", sh:"KO" },
  { id:"tl", name:"Tagalog",     flag:"🇵🇭", sh:"TL" },
  { id:"ne", name:"नेपाली",        flag:"🇳🇵", sh:"NP" }
];

window.MTJ_TR = {};
window.MTJ_ADD = function (lang, map) {
  Object.keys(map).forEach(function (k) {
    (window.MTJ_TR[k] = window.MTJ_TR[k] || {})[lang] = map[k];
  });
  window.MTJ_READY[lang] = true;
};
window.MTJ_READY = { en:true, ja:true };

/** その言語の訳を1回だけ取りに行く。失敗しても英語で動き続ける */
window.MTJ_LOAD = function (lang) {
  if (window.MTJ_READY[lang]) return Promise.resolve();
  return new Promise(function (res) {
    const s = document.createElement("script");
    s.src = "/i18n/" + lang + ".js?v=7";
    s.onload = res;
    s.onerror = function () { window.MTJ_READY[lang] = true; res(); };  // 無い言語でも止まらない
    document.head.appendChild(s);
  });
};


/*  プロフィール。アカウントは作らない。
 *  メールもパスワードも要らない。この端末の localStorage に1つだけ持つ。
 *  3つのページ（つぶやき・掲示板・ゆずります）は同じ moretojapan.com なので同じ箱を読める。
 *  つぶやきで一度作れば、掲示板で出すときは「話せる／習いたい／呼び名」が最初から入る。
 *
 *  ⚠️ 端末に紐づくので、ブラウザのデータを消す・別の端末で開く、と空に戻る。
 *     それは仕様。身元を持たないことの裏返しで、メールを持たせない限り取り戻せない。 */
window.MTJ_ME = {
  get: function () {
    try {
      const o = JSON.parse(localStorage.getItem("mj-me") || "null");
      if (!o || !o.langs || !o.langs.length) return null;
      return {
        nick: String(o.nick || ""),
        langs: o.langs.slice(),
        // 習いたいことばは、話せることばと重ならない
        learn: (o.learn || []).filter(function (x) { return o.langs.indexOf(x) < 0; })
      };
    } catch (e) { return null; }
  },
  set: function (o) {
    try {
      localStorage.setItem("mj-me", JSON.stringify({
        nick: String(o.nick || "").slice(0, 24),
        langs: o.langs.slice(),
        learn: (o.learn || []).filter(function (x) { return o.langs.indexOf(x) < 0; })
      }));
    } catch (e) {}
  }
};
