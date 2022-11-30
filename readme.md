masmis-search
====

* https://github.com/gittrname/activitypub-relay を参考に作っています。

## 絶対に必要な初期設定

* 公開鍵暗号用に公開鍵と秘密鍵を作成

```sh
openssl genrsa 1024 > private.pem
openssl rsa -in private.pem -pubout -out public.pem
```

* .env.productionファイルを作成
$ cp .env.sample .env.production
$ vi .env.production

# Relay
RELAY_URL="{あなたのリレーサーバーのURL}"
PRIVATE_KEY="{private.pemの中身}"
PUBLIC_KEY="{public.pemの中身}"

