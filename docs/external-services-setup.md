# 外部サービス接続設定手順

「日報管理システム」 が利用する外部サービスの接続設定手順です。 設定値は稼働環境の環境変数として与えます。 ソースコードに直接書き込まないでください。

## Amazon SES

用途: 日報入力期限到来時と未提出時に報告者へ通知を送信する
実装ファイル: `src/adapters/amazon-ses-adapter.ts`

> このサービスの API 仕様は未調査のまま実装しています。 接続先 URL と項目名は稼働前に提供元の公式情報で確認してください。

### 必要な設定値

| 環境変数 | 用途 | 取得方法 |
| --- | --- | --- |
| `AWS_SES_REGION` | Amazon SESのサービスリージョン（例：ap-northeast-1） | AWS管理コンソールで日報管理システムを運用するリージョンを確認する |
| `AWS_SES_ACCESS_KEY_ID` | AWS APIへのアクセス認証に使うアクセスキーID | AWS IAM管理画面でSES送信権限を持つユーザーのアクセスキーを発行する |
| `AWS_SES_SECRET_ACCESS_KEY` | AWS APIへのアクセス認証に使うシークレットアクセスキー | AWS IAM管理画面でSES送信権限を持つユーザーのシークレットキーを発行する |
| `AWS_SES_FROM_EMAIL` | メール送信元のメールアドレス（日報通知用） | AWS SES管理画面で検証済みメールアドレスまたはドメインから選択する |
| `AWS_SES_ENDPOINT_URL` | Amazon SES APIのエンドポイントURL | AWS公式ドキュメントで対象リージョンのSES APIエンドポイントを確認する |
| `AWS_SES_MAX_SEND_RATE` | 1秒あたりの最大送信数（SESの送信レート制限に合わせる） | AWS SESの送信制限設定を確認し、稼働環境に合わせて設定する（デフォルト：14） |

### 接続手順

1. AWSアカウントを取得し、Amazon SESサービスを有効化する
2. AWS IAM管理画面でSES送信権限を持つIAMユーザーを作成する
3. 該当ユーザーのアクセスキーIDとシークレットアクセスキーを発行する
4. AWS SES管理画面で日報通知用のメールアドレスまたはドメインを検証する
5. AWS SES管理画面で送信レート制限を確認し、必要に応じて引き上げをリクエストする
6. 稼働環境の環境変数にAWS_SES_REGION、AWS_SES_ACCESS_KEY_ID、AWS_SES_SECRET_ACCESS_KEY、AWS_SES_FROM_EMAIL、AWS_SES_ENDPOINT_URL、AWS_SES_MAX_SEND_RATEを設定する
7. EmailNotificationServiceから送信テストメールを実際に送信し、配信確認を行う
8. AWS CloudWatchでメール送信ログを確認し、正常に動作していることを検証する
