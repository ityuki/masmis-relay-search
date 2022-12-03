masmis-search
====

* https://github.com/gittrname/activitypub-relay を参考に作っています。
* https://masmis-search.ja-jp.org/ で動いてます

## 注意

* masterで弄りまくっているので、fork/cloneする場合はお気をつけください。

## 絶対に必要な初期設定

* 公開鍵暗号用に公開鍵と秘密鍵を作成

```sh
openssl genrsa 1024 > private.pem
openssl rsa -in private.pem -pubout -out public.pem
```

* .env.productionファイルを作成
$ cp .env.production.sample .env.production
$ vi .env.production

```conf
# Relay
RELAY_URL="{あなたのリレーサーバーのURL}"
PRIVATE_KEY="{private.pemの中身}"
PUBLIC_KEY="{public.pemの中身}"

# PostgreSQL Database
DB_NAME=DB名
DB_USER=DBユーザ名
DB_PASS=DBパスワード
```

* 他にも気になるところがあれば書き換えてください。

## 必要なプログラム

* Node.JS
* PostgreSQL
* Redis

## webUIの書き換え

* src/views/ 以下をいじってください

## 最初の設定

* モジュールのインストール
```sh
npm install
```

* DB作ります
```sh
npm run build:migrate
```

* 実行します
```sh
npm start
```

* port 3000で何か立ち上がります



