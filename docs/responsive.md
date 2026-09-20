# レスポンシブデザイン化（スマホ対応）の方針

本ドキュメントは、各機能を担当するエージェントが、レスポンシブな画面を実装する際の共通ルールと実装方針をまとめたものです。

## 1. 基本方針

本アプリは **MUI (Material UI)** を活用し、ワンソースでPC（デスクトップ）とスマートフォン（モバイル）の両方に最適化された画面を提供します。

- **PC (smブレークポイント以上: 600px〜):** 画面幅を活かした「テーブル表示」「右側サイドパネル」「標準ダイアログ」を使用します。
- **スマホ (xsブレークポイント: 〜599px):** 縦スクロールを前提とし、「カードリスト表示」「フルスクリーンダイアログ」「縦積みレイアウト」を使用します。

## 2. 共通レイアウト基盤

既に `frontend/src/components/Layout.tsx` にて以下のレスポンシブ対応が実装されています。

- **PC:** 左側に固定幅のサイドバー (Permanent Drawer) が表示されます。
- **スマホ:** 左側のサイドバーは隠れ、上部ヘッダーの左端にハンバーガーメニューが表示されます。タップするとスワイプ可能な Temporary Drawer が展開されます。
- **メイン領域:** `Layout` コンポーネント内の `<Outlet />` にレンダリングされるため、各機能ページはヘッダーやサイドバーを意識せず、自身の中身のレスポンシブ化にのみ専念してください。

## 3. 実装パターンとMUIの活用

各機能のエージェントは、以下のパターンを用いて画面を構築してください。

### A. グリッドとレイアウトの切り替え
要素の並び順を変える場合は、`Grid` または `Stack` を用いて、`xs` と `sm` で `direction` を切り替えます。
```tsx
<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
  <Box>要素1</Box>
  <Box>要素2</Box>
</Stack>
```

### B. テーブル表示とカードリスト表示の切り替え
TanStack Table などを用いてデータを表示する際、横スクロールが発生する表形式はスマホでは避けます。
```tsx
import { useTheme, useMediaQuery, Box } from '@mui/material';

const MyDataView = ({ data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    // スマホ向け: Cardコンポーネントを使ったリスト表示
    return (
      <Box>
        {data.map(item => <MyMobileCard key={item.id} item={item} />)}
      </Box>
    );
  }

  // PC向け: テーブル表示
  return <MyDesktopTable data={data} />;
};
```

### C. モーダル・ダイアログの挙動
フォーム入力や詳細確認で使うダイアログは、スマホでは全画面表示 (`fullScreen`) にします。
```tsx
import { Dialog, useTheme, useMediaQuery } from '@mui/material';

const MyFormDialog = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen}>
      {/* フォームの内容 */}
    </Dialog>
  );
};
```

### D. タップ領域と余白
- スマホ対応において、ボタンやアイコンのサイズは MUI のデフォルトサイズ（適切に確保されています）を使用してください。小さくしすぎないよう注意します。
- 画面の左右の余白は、親の Layout 側で `p={{ xs: 2, sm: 3 }}` のように自動調整されるため、各ページコンポーネント内では過剰な padding を追加する必要はありません。

## 4. テストと確認

- 実装時はブラウザエージェント (`/browser`) を用いて、デスクトップサイズとモバイルサイズ（幅375pxなど）の両方でレイアウトが崩れていないか確認してください。
- 既存の `docs/rules.md` に記載されているテスト方針やUIライブラリ選定ルールも併せて遵守してください。
