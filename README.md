# OpenOS

自作OS「OpenOS」のデスクトップ モックアップです。単一HTML(`public/index.html`)で動き、Cloudflare Workers にそのままホストできます。

## 構成

```
public/index.html   OpenOS本体(単一HTML、GSAPとLucideを内蔵)
public/_headers     配信ヘッダ
src/worker.js       /proxy だけを処理するWorker(ブラウザアプリの通信用)
wrangler.jsonc      Cloudflare設定(Workers + Static Assets)
```

## デプロイ

**Cloudflareダッシュボードから(GitHub連携)**

1. Workers & Pages → Create → Import a repository で、このリポジトリを選ぶ
2. Build command は空、Deploy command は `npx wrangler deploy`
3. デプロイ後の `https://openos.<アカウント>.workers.dev` を開く

**コマンドラインから**

```sh
npm install
npm run dev      # ローカル確認
npm run deploy   # 本番へ
```

## ブラウザアプリの通信

ホスト先では、ブラウザアプリが同じドメインの `/proxy?url=…` を自動で使います。設定は不要です。

- 他サイトの埋め込み禁止ヘッダを外して表示します。
- 表示中のページは iframe の sandbox(`allow-same-origin` なし)に入れ、OpenOSの保存データやDOMに触れません。
- `/proxy` はOpenOS自身のiframeからのGETだけを受け付けます(`Sec-Fetch-Site: same-origin`)。外部から使う場合は `wrangler secret put TOKEN` を設定し、`?token=…` を付けます。
- ログインが必要なサイトや、POSTを使うサイトには非対応です(Cookieは中継しません)。
- `file://` で開いた場合は直接表示になります。設定はアドレスバー横の盾アイコンからできます。

## 操作

`Alt+Space` で検索、`>` を打つと全操作コマンドを呼べます。`Alt+1〜4` でワークスペース、`Ctrl+\`` でドロップダウンターミナルです。詳しくは設定アプリのショートカット一覧を見てください。

## ロードマップ

HTML完成 → コア移植 → メイン移植 → 実機確認・修正
