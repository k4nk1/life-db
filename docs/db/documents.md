# 文書管理

## Document（自己参照ツリー）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| name | String | | ファイル/フォルダ名 |
| type | String | | `folder` / `document` |
| parentId | Int | FK → Document.id, nullable, onDelete: Cascade | 親フォルダ（null = ルート） |
| content | String | nullable | マークダウン本文（folder 時は null） |
| createdAt | DateTime | default: now() | 作成日時 |
| updatedAt | DateTime | updatedAt | 更新日時 |
