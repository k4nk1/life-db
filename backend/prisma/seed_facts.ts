import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const defaultDbPath = path.resolve(__dirname, 'dev.db');
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl === 'file:./dev.db') {
  databaseUrl = `file:${defaultDbPath}`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

const DUMMY_TAGS = [
  { name: '事実', color: '#1976d2' },
  { name: '思考', color: '#2e7d32' },
  { name: '仮説', color: '#ed6c02' },
  { name: '疑問', color: '#9c27b0' },
  { name: 'アイデア', color: '#0288d1' },
  { name: '学び', color: '#388e3c' },
  { name: '健康', color: '#d32f2f' },
  { name: '技術', color: '#5d4037' },
];

interface DummyFactItem {
  title: string;
  content?: string;
  tagNames: string[];
  supplements?: string[];
  daysAgo: number;
}

const DUMMY_FACTS: DummyFactItem[] = [
  {
    title: '朝20分の散歩で午前の集中力が持続する',
    content: '起床後30分以内に日光を浴びながら歩くと、セロトニン分泌が促されて午前中の作業効率が体感で3割向上する。',
    tagNames: ['事実', '健康'],
    supplements: ['雨の日は室内ステッパーで代用しても同等の効果があった。', '朝食前の散歩が最も頭が冴える。'],
    daysAgo: 29,
  },
  {
    title: 'カフェインの半減期と午後の摂取制限ルール',
    content: 'カフェインの血中濃度半減期はおよそ5〜7時間。14時以降の摂取を控えると、入眠潜時が15分短縮される。',
    tagNames: ['事実', '健康'],
    supplements: ['14時以降はルイボスティーまたはデカフェコーヒーに切り替えた。'],
    daysAgo: 28,
  },
  {
    title: 'なぜ深い思考作業中にBGMを聴くと疲労するのか？',
    content: '歌詞付きの音楽は言語処理領域（ワーキングメモリ）を消費するため、コーディングや執筆時は無音かホワイトノイズが最適かもしれない。',
    tagNames: ['疑問', '思考'],
    supplements: ['雨の環境音（ピンクノイズ）を試したところ、集中持続時間が伸びた。'],
    daysAgo: 28,
  },
  {
    title: 'TypeScriptの厳格な型定義はリファクタリング速度を倍にする',
    content: '共有型定義（shared/types）を一元化しておくと、API変更時のフロント修正箇所がコンパイラによって瞬時に特定できる。',
    tagNames: ['技術', '学び'],
    supplements: ['型定義の事前設計に時間を割く価値は十分にある。'],
    daysAgo: 27,
  },
  {
    title: 'スマホの通知を全オフにすると1日のマルチタスク負荷が激減する',
    content: '緊急連絡以外の通知をすべて切ることで、作業中の文脈スイッチ回数が1日あたり数十回削減された。',
    tagNames: ['事実', '思考'],
    daysAgo: 27,
  },
  {
    title: 'ポモドーロ・テクニック（25分＋5分）の向き不向き',
    content: '単純作業やタスク消化には非常に有効だが、深いアルゴリズム設計やゾーン状態に入っている時は休憩のアラームが逆効果になる。',
    tagNames: ['思考', '学び'],
    supplements: ['深い作業時は50分作業＋10分休憩のサイクルの方が相性が良い。'],
    daysAgo: 26,
  },
  {
    title: 'UIの縦余白の極小化は情報の一覧性と認知的負荷にどう影響するか？',
    content: '1画面に収まる行数が増えるほどスクロール回数が減り、コンテキストの把握が容易になる。ただし行間のクリック感度には注意が必要。',
    tagNames: ['仮説', 'アイデア'],
    daysAgo: 25,
  },
  {
    title: '週1回のKPT振り返りは翌週の行動改善に直結する',
    content: '毎週日曜の夜に15分だけ「Keep・Problem・Try」を記録する習慣をつけてから、同じミスの再発率が顕著に低下した。',
    tagNames: ['学び', '思考'],
    supplements: ['Tryの項目は1週間で最大2個に絞るのが定着のコツ。'],
    daysAgo: 25,
  },
  {
    title: '午後の集中力低下は水分不足が主因ではないか？',
    content: '午後2時〜3時の眠気や軽い頭痛は、単なる昼食後の血糖値スパイクだけでなく、軽度の脱水症状が関与している可能性が高い。',
    tagNames: ['仮説', '健康'],
    supplements: ['昼食後に常温の水500mlを飲む実験を開始した。', '3日間の検証で午後のだるさがかなり軽減された。'],
    daysAgo: 24,
  },
  {
    title: '読書メモは要約するより自分の意見を1行書く方が記憶に残る',
    content: '本の要約を綺麗にまとめる作業は受動的になりがち。「この本を読んで自分が明日から何を変えるか」を1行書くだけで定着率が跳ね上がる。',
    tagNames: ['学び', '思考'],
    daysAgo: 23,
  },
  {
    title: 'スタンディングデスクの導入による腰痛の軽減効果',
    content: '1日のうち午前中の1時間と午後の1時間をスタンディングで作業するようになってから、腰痛の自覚症状がほぼ消失した。',
    tagNames: ['事実', '健康'],
    daysAgo: 23,
  },
  {
    title: 'ローカルファーストな個人用DBは外部SaaSより精神的負担が少ない',
    content: 'SQLiteやローカルサーバーでデータを完結させると、サービス終了リスクやプライバシーの懸念がなく、自由自在に改修できる強みがある。',
    tagNames: ['思考', '技術'],
    supplements: ['LifeDBの設計思想とも合致している。'],
    daysAgo: 22,
  },
  {
    title: '夕食後3時間の断食と睡眠の深さ（スマートウォッチ計測）',
    content: '就寝直前の食事を避けると、スマートウォッチの深い睡眠スコアが平均18%向上し、起床時の心拍数も落ち着いている。',
    tagNames: ['事実', '健康'],
    daysAgo: 21,
  },
  {
    title: 'なぜタスク管理ツールは使い続けると形骸化するのか？',
    content: 'タスクの細分化や完了判定の基準が曖昧なままタスク数だけが増えると、開くこと自体に認知コストを感じて放棄されるのではないか。',
    tagNames: ['疑問', '思考'],
    supplements: ['定期的に未着手タスクを「やらないこと」に移管する仕組みが必要。'],
    daysAgo: 21,
  },
  {
    title: 'インライン編集UIがユーザー体験を劇的に軽快にする理由',
    content: '編集モーダルを開くアクションを排除し、テキストをクリックして直接編集・Enterで確定できるUIは、思考の文脈を中断させない。',
    tagNames: ['思考', 'アイデア'],
    daysAgo: 20,
  },
  {
    title: '習慣化には「既存の行動の直後に行う」ルール（If-Thenプランニング）が最強',
    content: '「毎朝コーヒーを淹れたら、LifeDBのデイリー画面を開く」のように、すでに定着している行動をトリガーにすると継続率が格段に上がる。',
    tagNames: ['事実', '学び'],
    supplements: ['3週間継続できており、完全に無意識の習慣になった。'],
    daysAgo: 19,
  },
  {
    title: 'CSSのline-clampを使ったテキストの1行省略表示とツールチップ',
    content: 'WebkitLineClamp: 1 を適用することでテーブルの高さを均一化しつつ、はみ出したテキストはhoverやクリックで全貌を確認可能にする。',
    tagNames: ['技術'],
    daysAgo: 19,
  },
  {
    title: '冷水シャワーは本当に交感神経を刺激して目覚めを促すか？',
    content: '朝のシャワーの最後に30秒間だけ冷水を浴びると、ノルアドレナリンが放出され強制的に眠気が吹き飛ぶ。',
    tagNames: ['事実', '健康'],
    supplements: ['冬場は心臓への負担を考慮してぬるま湯から徐々に下げること。'],
    daysAgo: 18,
  },
  {
    title: 'コミットメッセージを1行日本語にする運用の振り返り',
    content: 'git.mdのルールに沿って「種別: 要約」を1行で書く方針は、git logの一覧性が非常に高く、レビュアーの認知的負担が少ない。',
    tagNames: ['学び', '技術'],
    daysAgo: 18,
  },
  {
    title: '週末のデジタルデトックスで月曜の脳疲労が抜ける感覚',
    content: '土曜の夕方から日曜の朝までスマートフォンを別室に置く実験をしたところ、月曜朝の倦怠感が明らかに軽くなった。',
    tagNames: ['事実', '思考'],
    daysAgo: 17,
  },
  {
    title: '部屋の二酸化炭素濃度（CO2）が1000ppmを超えると集中力が低下する',
    content: '締め切った部屋で作業しているとCO2濃度が容易に1500ppmに達し、頭が重くなる。1時間に1回の換気が不可欠。',
    tagNames: ['事実', '健康'],
    supplements: ['CO2モニターを導入して数値を可視化した。窓を少し開けておくだけで800ppm台を維持可能。'],
    daysAgo: 16,
  },
  {
    title: 'アイデアは机に向かっている時より移動中に閃くことが多い現象',
    content: 'デフォルト・モード・ネットワーク（DMN）が活性化する散歩中や入浴中に、異なる概念の結合が起きやすい。',
    tagNames: ['思考', '学び'],
    supplements: ['スマホのボイスメモで歩きながら即座に記録する運用を試す。'],
    daysAgo: 16,
  },
  {
    title: 'PrismaのSQLiteとWAL（Write-Ahead Logging）モードの有効性',
    content: 'SQLiteで同時書き込み時のロック競合を防ぐため、WALモード（PRAGMA journal_mode = WAL;）を有効化すると読み書き性能が安定する。',
    tagNames: ['技術', '学び'],
    daysAgo: 15,
  },
  {
    title: '「やらないことリスト」がタスクリストよりも人生の質を決める仮説',
    content: '新しいことを始める前に、時間を浪費している悪習慣（深夜のSNS巡回、衝動買い等）を削る方が自己効力感の向上スピードが速い。',
    tagNames: ['仮説', '思考'],
    daysAgo: 15,
  },
  {
    title: '眼精疲労の予防：20-20-20ルールの実践結果',
    content: '20分ごとに20フィート（約6メートル）先を20秒間眺めるルール。夕方の目の乾きやピント調節の遅れが明らかに軽減された。',
    tagNames: ['事実', '健康'],
    daysAgo: 14,
  },
  {
    title: 'Material-UIのsxプロパティとStyled-componentsのパフォーマンス比較',
    content: 'sxプロパティは開発体験が極めて高いが、動的に大量の行をレンダリングするテーブルではテーマ解決のオーバーヘッドに留意が必要。',
    tagNames: ['技術'],
    supplements: ['50行程度であれば全くボトルネックにならず快適に動作している。'],
    daysAgo: 13,
  },
  {
    title: '意思決定の回数を朝のうちに減らす工夫',
    content: '朝食のメニューや着ていく服を前夜に決めておくことで、午前中の重要な判断にウィルパワー（意志力）を温存できる。',
    tagNames: ['学び', '思考'],
    daysAgo: 13,
  },
  {
    title: 'なぜ思考の言語化にはキーボードより手書きの方が良いと言われるのか？',
    content: '手書きは文字入力速度が制限されるため、脳内で情報を要約・抽象化するプロセスが自然と働くからではないか。',
    tagNames: ['疑問', '仮説'],
    supplements: ['大枠のアイデア出しを手書きノート、構造化と詳細化をLifeDBで行う棲み分けが良さそう。'],
    daysAgo: 12,
  },
  {
    title: '筋力トレーニング後のプロテイン摂取と翌日の筋肉痛の程度',
    content: 'トレーニング終了後45分以内に20gのタンパク質を補給すると、翌日の筋疲労の抜けが早い。',
    tagNames: ['事実', '健康'],
    daysAgo: 12,
  },
  {
    title: 'キーボードショートカットのみで操作可能なWebアプリの快感',
    content: 'J/Kでエントリー移動、Eで編集、Dで削除、Nで新規作成など、Vimライクな操作感を付与できればさらに操作効率が上がる。',
    tagNames: ['アイデア', '技術'],
    daysAgo: 11,
  },
  {
    title: '音読による文章校正の検出精度の高さ',
    content: '黙読では見逃してしまう文末の重複表現や助詞の不自然さは、声に出して読むことで違和感として一発で検知できる。',
    tagNames: ['事実', '学び'],
    daysAgo: 10,
  },
  {
    title: '日光浴（ビタミンD生成）と冬季のメンタル安定の関係',
    content: '冬場に日照時間が減るとセロトニン活性が下がり気味になる。意識的に正午前後に外へ出て日光を15分浴びることが重要。',
    tagNames: ['事実', '健康'],
    supplements: ['冬季はビタミンDサプリメントの併用も検討中。'],
    daysAgo: 10,
  },
  {
    title: 'レスポンシブデザインにおけるスマホ表示のカード化の利点',
    content: '横スクロールを強いるテーブルに比べ、重要情報を上段・詳細を下段に配置したカードUIは片手操作時の視認性が圧倒的に高い。',
    tagNames: ['技術', '思考'],
    daysAgo: 9,
  },
  {
    title: '失敗した理由を「意志の弱さ」ではなく「仕組みの不備」に帰属させる',
    content: '行動が続かなかった時は、ハードルを下げる（小さく始める）か、環境から誘惑を物理的に排除する仕組みに改善する。',
    tagNames: ['思考', '学び'],
    daysAgo: 9,
  },
  {
    title: 'FastAPI vs Express：小規模パーソナルツールでの選定基準',
    content: 'フロントエンドがTypeScriptなら、型定義をshared/typesで共通化できるExpress（Node.js）の方が総合的な実装コストが低い。',
    tagNames: ['技術', '思考'],
    daysAgo: 8,
  },
  {
    title: '昼寝（パワーナップ）の時間は15〜20分が黄金律',
    content: '30分を超えると深いノンレム睡眠に入ってしまい、起床時に睡眠慣性（だるさ）が残る。直前にカフェインを飲む「コーヒーナップ」が強力。',
    tagNames: ['事実', '健康'],
    supplements: ['アラームを20分後にセットして実践したところ、午後の頭のスッキリ感が段違いだった。'],
    daysAgo: 7,
  },
  {
    title: '「完璧主義」を手放して「とりあえず60点で動かす」メリット',
    content: '設計に悩み続けるより、プロトタイプを最速で作ってブラウザで触りながら違和感を修正していく方が結果的に良いものが作れる。',
    tagNames: ['思考', '学び'],
    daysAgo: 7,
  },
  {
    title: 'ダークモードとライトモードの疲労度の違い（環境照度による）',
    content: '昼間の明るい部屋ではライトモードの方がコントラストが高く読みやすいが、夜間や間接照明下ではダークモードの方が圧倒的に目が楽。',
    tagNames: ['事実', '健康'],
    daysAgo: 6,
  },
  {
    title: '毎日の食事内容を写真でなくテキスト1行で残す手軽さ',
    content: '写真だと振り返るのが面倒だが、「朝: 卵かけご飯, 昼: 蕎麦, 夜: 鮭定食」のようにテキストで記録するとカロリーや栄養の傾向が一目でわかる。',
    tagNames: ['アイデア', '健康'],
    daysAgo: 6,
  },
  {
    title: '散歩コースを日によってランダムに変える脳刺激効果',
    content: '毎日同じ道を歩くより、普段通らない路地を通る方が視覚情報が新奇となり、脳の活性化と気分転換の効果が高い。',
    tagNames: ['事実', '思考'],
    daysAgo: 5,
  },
  {
    title: 'JestとSupertestを用いたAPI統合テストの安心感',
    content: 'エンドポイントごとのレスポンスステータスとDBの副作用をテストで担保しておくと、リファクタリングを恐れずに行える。',
    tagNames: ['技術', '学び'],
    daysAgo: 5,
  },
  {
    title: '読んだ本の内容を「誰かに教えるつもりで説明する」アウトプット法',
    content: 'ファインマン・テクニック。専門用語を使わずに平易な言葉で説明しようとすると、自分が曖昧に理解していた箇所が浮き彫りになる。',
    tagNames: ['学び', '思考'],
    daysAgo: 4,
  },
  {
    title: '室内の湿度管理（40〜60%）が風邪予防と集中に及ぼす影響',
    content: '湿度が40%を下回るとウイルスの浮遊時間が長くなり粘膜が乾燥する。加湿器を設置して50%前後をキープすると喉の痛みが激減した。',
    tagNames: ['事実', '健康'],
    daysAgo: 4,
  },
  {
    title: 'ドラッグ＆ドロップによる並び替えUIの実装コストと操作感',
    content: 'HTML5標準のDrag and Drop APIは外部ライブラリ不要で軽量に実装できる。タグの表示順序変更において非常に直感的に機能する。',
    tagNames: ['技術', '学び'],
    daysAgo: 3,
  },
  {
    title: '感情が高ぶった時は「6秒間深呼吸」で扁桃体の興奮を鎮める',
    content: '怒りや焦りのアドレナリン分泌のピークは最初の6秒間と言われている。その間にゆっくり息を吐き出すことで理性（前頭葉）を取り戻せる。',
    tagNames: ['事実', '思考'],
    supplements: ['イラッとした瞬間にカウントする習慣を意識する。'],
    daysAgo: 3,
  },
  {
    title: '1つの画面に多くの情報を詰め込みすぎないための「折りたたみ」設計',
    content: '補足メモを常時展開せず、AccordionやCollapseで行のクリック時に展開する構造にすることで、一覧性と詳細確認を高いレベルで両立できる。',
    tagNames: ['思考', '技術'],
    daysAgo: 2,
  },
  {
    title: '毎日の「小さな完了体験」がドーパミンを生み出しモチベーションを保つ',
    content: '巨大な目標を細分化し、5分で終わる小さなタスクを完了させるチェックをつけるだけで、作業興奮が誘発されて次のタスクへ進める。',
    tagNames: ['事実', '学び'],
    daysAgo: 2,
  },
  {
    title: 'カフェで作業すると集中できるのは「ピア効果（他者の視線）」によるものか？',
    content: '適度な雑音と「周りも何かに集中している」という環境圧が、自制心を保つ手助けになっている可能性が高い。',
    tagNames: ['仮説', '思考'],
    daysAgo: 1,
  },
  {
    title: 'Gitブランチ命名規則と小さな単位でのコミット運用の快適さ',
    content: 'feature/ブランチを細かく切り、機能ごとに1行でコミットを残していくと、後から変更履歴を追うのが非常に楽になり迷わない。',
    tagNames: ['技術', '学び'],
    supplements: ['作業ブランチで試行錯誤した後にmainにマージするフローが確立できた。'],
    daysAgo: 1,
  },
  {
    title: 'LifeDBのレスポンシブ化によりスマホからの閲覧・追記が極めて快適になった',
    content: 'PCだけでなく外出先やベッドサイドからスマホで素早く思考をメモできるようになったことで、情報の記録漏れが劇的に減った。',
    tagNames: ['事実', '思考', 'アイデア'],
    supplements: ['引き続き他の画面（デイリー、タスク等）も同様の思想で磨き上げたい。'],
    daysAgo: 0,
  },
];

async function main() {
  console.log('Ensuring tags exist...');
  const tagMap = new Map<string, number>();

  for (let i = 0; i < DUMMY_TAGS.length; i++) {
    const item = DUMMY_TAGS[i]!;
    let tag = await prisma.tag.findUnique({ where: { name: item.name } });
    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name: item.name,
          color: item.color,
          sortOrder: i,
        },
      });
      console.log(`Created tag: ${item.name}`);
    }
    tagMap.set(item.name, tag.id);
  }

  // 既存のタグも取得してマップに登録
  const existingTags = await prisma.tag.findMany();
  for (const t of existingTags) {
    tagMap.set(t.name, t.id);
  }

  console.log(`Inserting ${DUMMY_FACTS.length} dummy fact entries...`);
  const now = new Date();

  let createdCount = 0;
  for (const item of DUMMY_FACTS) {
    const createdAt = new Date(now.getTime() - item.daysAgo * 24 * 3600 * 1000 - Math.floor(Math.random() * 3600 * 1000 * 8));

    const tagIds = item.tagNames
      .map(name => tagMap.get(name))
      .filter((id): id is number => id !== undefined);

    const createData: any = {
      title: item.title,
      content: item.content ?? null,
      createdAt,
      tags: {
        create: tagIds.map(tagId => ({ tagId })),
      },
    };

    if (item.supplements && item.supplements.length > 0) {
      createData.supplements = {
        create: item.supplements.map((s, idx) => ({
          content: s,
          createdAt: new Date(createdAt.getTime() + (idx + 1) * 3600 * 1000 * 2),
        })),
      };
    }

    const entry = await prisma.factEntry.create({
      data: createData,
    });

    createdCount++;
  }

  console.log(`Successfully created ${createdCount} dummy fact entries!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
