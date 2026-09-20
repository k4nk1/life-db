# 資産

## Transaction（取引）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| date | DateTime | | 取引日時 |
| amount | Int | | 金額（プラス=収入、マイナス=支出、ゼロ=金銭移動なし） |
| detail | String | nullable | 詳細 |
