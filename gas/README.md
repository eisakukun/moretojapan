# 掲示板の裏側（Apps Script）

2つのページの保存先。スプレッドシート1枚だけ。

- `/help.html` 暮らしのこまりごと掲示板（posts / replies）
- `/market.html` ゆずります・さがしています（items / replies を共用）

写真は Drive の「More to Japan 掲示板の写真」に入り、1枚ずつ「リンクを知っている全員」にして
`drive.google.com/thumbnail?id=…` で直接表に出す（GASを通さないので速い）。

## 中身

| ファイル | 役目 |
|---|---|
| `Code.js` | 読み書き全部。`doGet`＝一覧と1件、`doPost`＝投稿・返事・ボタン類 |
| `appsscript.json` | 「全員（匿名ユーザーを含む）」で公開するための設定 |

## はじめの1回だけ

1. `gasctl open ~/nihongo-site/gas` でエディタを開く
2. 関数を `setup`（または `bootstrap`）にして **▶** を押す（Googleの許可が出るので通す）
   → スプレッドシート「More to Japan 掲示板データ」と、写真のフォルダが作られる

⚠️ **写真・メール通知を足したときは、もう一度 ▶ を押さないと権限が増えない。**
表には `DriveApp を呼び出す権限がありません` とは出さず「写真の置き場がまだ開いていません」と出る。

## 直したとき

```bash
gasctl push ~/nihongo-site/gas
cd ~/nihongo-site/gas && clasp deploy --deploymentId AKfycbz09z8z5zorue3p6xFwtt01Q3KQgh-7bm-SGTSZj6ILNRxXS-KbASTooYulq3fo7TBL --description "board"
```

**`--deploymentId` を付けること。** 付けないと新しいURLが生まれて、`help.html` に書いてある
アドレスが古いコードを指したままになる。

## 新着と通報をDiscordに流す（任意）

```bash
gasctl set ~/nihongo-site/gas DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
```

雨アラートで使っているのと同じ形。入れると、新しいこまりごと・返事・通報が全部飛んでくる。
**立ち上げのあいだはこれを入れておく**。最初の数件に本人が答えられるかどうかで、
掲示板が生き残るかが決まる。

NGワードを足したいとき:

```bash
gasctl set ~/nihongo-site/gas NG_WORDS=ことば1,ことば2
```

## 荒らしを消すとき

スプレッドシートを開いて、その行の `status` を `hidden` にするだけ。消さなくていい。
通報が3件つくと自動で `hidden` になる（`AUTO_HIDE_FLAGS`）。

## 持っていないもの

メールアドレス・IPアドレス・名前は一切保存しない。`dev` 列は端末が作ったランダムな文字列で、
「自分の投稿か」「もう押したか」を見分けるためだけに使う。身元には一切つながらない。
