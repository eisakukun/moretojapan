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
window.MTJ_LANGS = [
  { id:"en", name:"English" },
  { id:"ja", name:"日本語" },
  { id:"zh", name:"中文" },
  { id:"vi", name:"Tiếng Việt" },
  { id:"ko", name:"한국어" },
  { id:"tl", name:"Tagalog" },
  { id:"ne", name:"नेपाली" }
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
    s.src = "/i18n/" + lang + ".js?v=5";
    s.onload = res;
    s.onerror = function () { window.MTJ_READY[lang] = true; res(); };  // 無い言語でも止まらない
    document.head.appendChild(s);
  });
};
