import { Pin, Circle, Clock, Send, Check, Edit2, Save, X, Lightbulb, Sparkles, Info } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Source {
  id: string;
  url: string;
  title: string;
}

interface Update {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  sources?: Source[];
}

interface TrackingPrompt {
  id: string;
  title: string;
  isActive: boolean;
  isPinned: boolean;
  latestUpdate: string;
  description: string;
  updatedAt: Date;
  updates: Update[];
  promptContent: string;
}

interface TrackingPageProps {
  promptId?: string | null;
  theme?: 'light' | 'dark';
  chats: Array<{
    id: string;
    title: string;
    updatedAt: Date;
    pinned?: boolean;
    isTracking?: boolean;
    trackingActive?: boolean;
    updateCount?: number;
    messages?: Array<{
      id: string;
      role: 'user' | 'ai' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
    updates?: Array<{
      timestamp: string;
      update: string;
      sources?: Array<{ id: string; url: string; title: string }>;
    }>;
  }>;
  readUpdateIds?: Record<string, string[]>;
  onMarkUpdateAsRead?: (chatId: string, updateId: string) => void;
}

export function TrackingPage({ promptId, theme = 'light', chats, readUpdateIds = {}, onMarkUpdateAsRead }: TrackingPageProps) {

  // Remove local viewedUpdates state in favor of props
  // const [viewedUpdates, setViewedUpdates] = useState<Set<string>>(new Set());

  const [selectedUpdate, setSelectedUpdate] = useState<string | null>(null);

  const toggleUpdateExpand = (updateId: string) => {
    setSelectedUpdate(prev => prev === updateId ? null : updateId);
  };
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPromptText, setEditingPromptText] = useState('');
  const [expandedPromptDetails, setExpandedPromptDetails] = useState<string | null>(promptId || null);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set()); // プロンプトの展開状態
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);
  const [trackingFrequency, setTrackingFrequency] = useState<Record<string, number>>({});
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});
  const [showFrequencyOptions, setShowFrequencyOptions] = useState<Record<string, boolean>>({});
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null); // ハイライトセグメントのホバー状態
  const hasInitialized = useRef(false);

  const toggleExpand = (promptId: string) => {
    setExpandedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  const togglePromptDetails = (promptId: string) => {
    if (expandedPromptDetails === promptId && !selectedUpdate) {
      setExpandedPromptDetails(null);
    } else {
      setExpandedPromptDetails(promptId);
      setSelectedUpdate(null);
      setChatMessages([]);
      setEditingPromptId(null);
    }
  };

  const handleEditPrompt = (promptId: string, promptContent: string) => {
    // 下の回答部分のハイライトを明示的に消す
    setExpandedPromptDetails(null);
    setSelectedUpdate(null);
    setChatMessages([]);
    // 上の追跡中のプロンプトをハイライト
    setEditingPromptId(promptId);
    setEditingPromptText(promptContent);
  };



  const handleSendQuestion = () => {
    if (!question.trim() || (!selectedUpdate && !expandedPromptDetails)) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: question,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);

    setTimeout(() => {
      const aiMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai' as const,
        content: expandedPromptDetails
          ? generateAIResponseForPrompt(question, expandedPromptDetails)
          : generateAIResponse(question, selectedUpdate!),
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setQuestion('');
  };

  const generateAIResponse = (userQuestion: string, updateId: string): string => {
    let selectedUpdateData: Update | null = null;
    for (const prompt of displayPrompts) {
      const found = prompt.updates.find(u => u.id === updateId);
      if (found) {
        selectedUpdateData = found;
        break;
      }
    }

    if (!selectedUpdateData) {
      return '申し訳ございません。情報が見つかりませんでした。';
    }

    const lowerQuestion = userQuestion.toLowerCase();

    if (lowerQuestion.includes('いつ') || lowerQuestion.includes('when') || lowerQuestion.includes('時期')) {
      return `${selectedUpdateData.title}は${formatFullDateTime(selectedUpdateData.timestamp)}に発表されました。${selectedUpdateData.content.substring(0, 150)}...`;
    }

    if (lowerQuestion.includes('なぜ') || lowerQuestion.includes('why') || lowerQuestion.includes('理由')) {
      return `${selectedUpdateData.title}の背景には、業界全体の動向や市場の変化があります。詳細については上記の情報セクションをご覧ください。`;
    }

    if (lowerQuestion.includes('どのように') || lowerQuestion.includes('how') || lowerQuestion.includes('方法')) {
      return `${selectedUpdateData.title}に関する具体的な実装方法や手順については、参考文献セクションのリンクをご確認ください。詳細なドキュメントが用意されています。`;
    }

    return `${selectedUpdateData.title}についてですね。${selectedUpdateData.content} 詳細については上記の情報と参考文献をご参照ください。`;
  };

  const generateAIResponseForPrompt = (userQuestion: string, promptId: string): string => {
    let selectedPromptData: TrackingPrompt | null = null;
    for (const prompt of displayPrompts) {
      if (prompt.id === promptId) {
        selectedPromptData = prompt;
        break;
      }
    }

    if (!selectedPromptData) {
      return '申し訳ございません。情報が見つかりませんでした。';
    }

    const lowerQuestion = userQuestion.toLowerCase();

    if (lowerQuestion.includes('いつ') || lowerQuestion.includes('when') || lowerQuestion.includes('時期')) {
      return `${selectedPromptData.title}は${formatFullDateTime(selectedPromptData.updatedAt)}に更新されました。${selectedPromptData.description.substring(0, 150)}...`;
    }

    if (lowerQuestion.includes('なぜ') || lowerQuestion.includes('why') || lowerQuestion.includes('理由')) {
      return `${selectedPromptData.title}の背景には、業界全体の動向や市場の変化があります。詳細については上記の情報セクションをご覧ください。`;
    }

    if (lowerQuestion.includes('どのように') || lowerQuestion.includes('how') || lowerQuestion.includes('方法')) {
      return `${selectedPromptData.title}に関する具体的な実装方法や手順については、参考文献セクションのリンクをご確認ください。詳細なドキュメントが用意されています。`;
    }

    return `${selectedPromptData.title}についてですね。${selectedPromptData.description} 詳細については上記の情報と参考文献をご参照ください。`;
  };

  // プロンプト改善提案を生成
  const generatePromptSuggestions = (currentPrompt: string): Array<{ type: string; suggestion: string; reason: string }> => {
    const suggestions = [];

    // 具体性のチェック
    if (currentPrompt.length < 50) {
      suggestions.push({
        type: '具体性の向上',
        suggestion: 'より具体的な文脈や条件を追加してください。例：「〇〇について、△△の観点から、□□の目的で」のように詳細化します。',
        reason: '具体的なプロンプトは、より関連性の高い情報を収集できます。'
      });
    }

    // 時間軸のチェック
    if (!currentPrompt.includes('最新') && !currentPrompt.includes('トレンド') && !currentPrompt.includes('動向')) {
      suggestions.push({
        type: '時間軸明確化',
        suggestion: '「最新の」「2024年以降の」「最近の動向」など、時間的な範囲を明示してください。',
        reason: '時間軸を明確にすることで、より新鮮で関連性の高い情報を追跡できます。'
      });
    }

    // ソースの質のチェック
    if (!currentPrompt.includes('公式') && !currentPrompt.includes('信頼') && !currentPrompt.includes('一次情報')) {
      suggestions.push({
        type: '情報源の指定',
        suggestion: '「公式発表」「信頼性の高い」「一次情報から」など、情報源の質を指定してください。',
        reason: '情報源を指定することで、より信頼性の高い情報を優先的に収集できます。'
      });
    }

    // 目的の明確化
    if (!currentPrompt.includes('比較') && !currentPrompt.includes('分析') && !currentPrompt.includes('評価') && !currentPrompt.includes('理解')) {
      suggestions.push({
        type: '目的の明確化',
        suggestion: '「比較分析」「評価」「理解」「予測」など、情報を追跡する目的を明示してください。',
        reason: '目的を明確にすることで、その目的に沿った情報を効率的に収集できます。'
      });
    }

    // キーワードのチェック
    const words = currentPrompt.split(/\s+/);
    if (words.length < 3) {
      suggestions.push({
        type: 'キーワードの追加',
        suggestion: '関連するキーワードを2-3個追加してください。業界用語、技術名、企業名などが有効です。',
        reason: '複数のキーワードを含めることで、検索の精度と網羅性が向上します。'
      });
    }

    return suggestions;
  };

  // chatsデータを使って追跡中のプロンプトを生成
  const trackingChatsFromData = chats
    .filter(chat => chat.isTracking)
    .map(chat => {
      const firstUserMessage = chat.messages?.find(msg => msg.role === 'user');
      const promptContent = firstUserMessage ? firstUserMessage.content : chat.title;

      return {
        id: chat.id,
        title: chat.title,
        isActive: chat.trackingActive || false,
        isPinned: chat.pinned || false,
        latestUpdate: generateLatestUpdate(chat),
        description: generateDescription(chat),
        updatedAt: chat.updatedAt,
        updates: generateUpdates(chat),
        promptContent: promptContent,
      };
    });

  const trackingPrompts: TrackingPrompt[] = trackingChatsFromData.length > 0
    ? trackingChatsFromData
    : [
      {
        id: '1',
        title: 'ユニリーバのマーケティング戦略調査',
        isActive: true,
        isPinned: true,
        latestUpdate: 'ユニリーバのスポーツスポンサーシップと消費者参加型プログラムに関する最新情報が更新されました。',
        description: 'ユニリーバブランドの社会的取り組みとマーケティング戦略の包括的調査',
        updatedAt: new Date(Date.now() - 1000 * 60 * 15),
        promptContent: 'FIFAワールドカップやUEFA EUROなどのスポーツスポンサーシップにおいて、Rexona（レクソーナ）やDove（ダヴ）などのブランドがどのような消費者参加型イベントやメッセージ発信（自信、ジェンダー平等など）を行っているか調査する。\n日本国内の消費者参加型エコプログラム「UMILE（ユーマイル）」について、現在のキャンペーン内容、対象店舗、回収ボックスの設置場所、消費者がどのように参加できるか詳しく調べる。\nダヴ（Dove）の「リアルビューティー」キャンペーンや「自己肯定感向上プロジェクト（Dove Self-Esteem Project）」について、日本国内の学校教育やワークショップでの実施事例、一般向けの教材提供などを調査する。\nラックス（LUX）が展開する「Social Damage Care」や採用バイアスに関するキャンペーンなど、ジェンダー平等や固定観念の打破を目指す具体的な活動内容を調べる。',
        updates: [
          {
            id: 'u1',
            title: 'Luxの「Social Damage Care」プロジェクトの最新展開',
            content: 'Lux（ラックス）の「Social Damage Care（社会的ダメージケア）」プロジェクトが、採用活動における性別欄・顔写真の撤廃を実現し、さらに競合他社や異業種（三井化学など）へ波及させるムーブメントを創出しました。単に「髪のダメージ」を修復するという製品機能を超えて、「履歴書の性別欄」という日本社会の根深い慣習にメスを入れ、他社を巻き込んだ社会変革のアクションとして機能しています。',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            sources: [
              { id: 's1', url: 'https://www.unilever.co.jp/news/press-releases/2023/lux-social-damage-care/', title: 'ユニリーバ・ジャパン: Lux Social Damage Care プロジェクト' },
              { id: 's2', url: 'https://www.advertimes.com/20230315/article405792/', title: 'AdverTimes: ラックスが挑む「社会的ダメージ」の解消' },
            ],
          },
          {
            id: 'u2',
            title: 'UMILE（ユーマイル）エコプログラムの拡大',
            content: '日本国内の消費者参加型エコプログラム「UMILE（ユーマイル）」が、花王との連携により対象店舗を大幅に拡大しました。競合を超えた「共創（Co-creation）」により、消費者は全国の提携店舗で使用済み容器を回収ボックスに投入でき、サーキュラーエコノミーの実現に参加できるようになっています。',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            sources: [
              { id: 's3', url: 'https://www.unilever.co.jp/planet-and-society/umile/', title: 'ユニリーバ・ジャパン: UMILE プログラム公式サイト' },
              { id: 's4', url: 'https://www.kao.com/jp/corporate/news/sustainability/2023/20230420-001/', title: '花王: UMILEプログラムへの参画について' },
            ],
          },
          {
            id: 'u3',
            title: 'Doveの「自己肯定感向上プロジェクト」日本展開',
            content: 'ダヴ（Dove）の「リアルビューティー」キャンペーンと「自己肯定感向上プロジェクト（Dove Self-Esteem Project）」が、日本国内の学校教育やワークショップでの実施事例を増やしています。一般向けの教材も無料で提供され、若年層の自己肯定感の向上とメディアリテラシーの育成に貢献しています。',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
            sources: [
              { id: 's5', url: 'https://www.dove.com/jp/dove-self-esteem-project.html', title: 'Dove: 自己肯定感プロジェクト' },
              { id: 's6', url: 'https://www.unilever.co.jp/brands/personal-care/dove/', title: 'ユニリーバ・ジャパン: Dove ブランドサイト' },
            ],
          },
        ],
      },
    ];

  function generateLatestUpdate(chat: any): string {
    const updates = [
      `${chat.title}に関する最新情報が追加されました。新しい機能や改善点についての詳細が更新されています。`,
      `${chat.title}のトピックに関連する重要なアップデートが公開されました。`,
      `${chat.title}について、最新の研究結果や実装例が追加されました。`,
    ];
    return updates[Math.floor(Math.random() * updates.length)];
  }

  function generateDescription(_chat: any): string {
    const descriptions = [
      'このトピックに関する包括的な情報と最新のトレンドを追跡しています。',
      '継続的に更新される情報源から最新データを収集中です。',
      '関連する技術やベストプラクティスの変化を監視しています。',
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  function generateUpdates(chat: any): Update[] {
    // もしchat.updatesが存在するなら、それを利用する
    if (chat.updates && chat.updates.length > 0) {
      return chat.updates.map((update: any, index: number) => {
        // Generate stable ID using timestamp
        const timestamp = update.timestamp ? new Date(update.timestamp) : new Date();
        // Ensure ID generation matches useChat.ts: use raw timestamp string if available
        const stableId = update.timestamp ? update.timestamp : timestamp.getTime().toString();

        return {
          id: stableId, // Use timestamp as stable ID
          title: update.update ? update.update.substring(0, 30) + (update.update.length > 30 ? '...' : '') : `${chat.title}に関する更新 #${index + 1}`,
          content: update.update || '内容がありません',
          timestamp: timestamp,
          sources: update.sources || [
            // ダミーのソースを一部使用（本番ではupdate.sourcesなどがあればそれを使う）
            { id: `s${chat.id}-${index}-1`, url: '#', title: 'Source 1' },
            { id: `s${chat.id}-${index}-2`, url: '#', title: 'Source 2' },
          ],
        };
      });
    }

    const updateCount = chat.updateCount || 1;
    const updates: Update[] = [];
    const dummySources = [
      { id: 'ds1', url: 'https://example.com/article1', title: 'Example Article on Recent Developments' },
      { id: 'ds2', url: 'https://research.example.org/paper', title: 'Research Paper: Latest Findings and Analysis' },
      { id: 'ds3', url: 'https://blog.example.com/post', title: 'Industry Blog Post: Expert Insights' },
      { id: 'ds4', url: 'https://news.example.net/article', title: 'News Report: Breaking Updates' },
      { id: 'ds5', url: 'https://docs.example.io/guide', title: 'Technical Documentation and Best Practices' },
    ];

    for (let i = 0; i < Math.min(updateCount, 5); i++) {
      const dummyTimestamp = new Date(chat.updatedAt.getTime() - (i * 1000 * 60 * 60));
      updates.push({
        id: `u${chat.id}-${i}`,
        title: `${chat.title}に関する更新 #${i + 1}`,
        content: `${chat.title}に関する更新 #${i + 1}: 新しい情報が追加されました。詳細な内容については、関連する情報源を参照してください。`,
        timestamp: dummyTimestamp,
        sources: dummySources.slice(0, 2 + (i % 2)), // 2-3個のソースをランダムに割り当て
      });
    }

    return updates;
  }

  const generateBestAnswer = (prompt: TrackingPrompt) => {
    const summaries: Record<string, { summary: string; full: string }> = {
      '1': {
        summary: '最新の分析結果によると、NetflixのWarner Bros買収交渉は最終段階に入っています。主要な合意事項として、コンテンツライセンスの独占権と、既存のWarner Bros Discovery株主への特別配当が含まれています。',
        full: `# NetflixによるWarner Bros買収：現状分析

## 📊 取引概要

| 項目 | 詳細 | ステータス |
| :--- | :--- | :--- |
| **買収額** | $85 Billion (推定) | 交渉中 |
| **形式** | 現金および株式交換 | 合意済 |
| **規制承認** | FTC, EU規制当局 | 審査開始 |
| **完了予定** | 2025年 Q4 | オンスケジュール |

## 💡 主要なポイント

1.  **コンテンツ統合**: HBO Maxの全ライブラリがNetflixに統合される予定です。
2.  **市場への影響**: ストリーミング市場におけるシェアが40%を超え、独占禁止法の懸念が高まっています。
3.  **組織再編**: 制作部門の統合により、約15%の人員削減が予想されています。

### 今後のマイルストーン
- **2025 Q1**: 株主総会での承認
- **2025 Q2**: 主要規制当局の予備審査結果
- **2025 Q3**: 最終契約締結

> **Note:** この情報は市場の噂と複数の内部告発に基づいています。正式な発表を待つ必要があります。`
      },
      '2': {
        summary: 'React 19ベータ版では、Server Componentsの大幅な改善とReact Compilerの導入により、パフォーマンスと開発者体験が向上します。新しいAPI仕様により、従来の手動最適化が不要になり、自動的にメモ化が行われます。',
        full: `# React 19 Beta: 主な変更点と機能

## 🚀 新機能ハイライト

| 機能 | 概要 | 影響度 |
| :--- | :--- | :--- |
| **React Compiler** | 自動メモ化 (useMemo/useCallback不要) | High |
| **Actions** | フォーム処理の簡素化 (useTransition統合) | Medium |
| **Server Components** | ストリーミングSSRの改善 | High |
| **Assets Loading** | スタイル・スクリプトの並列読み込み | Medium |

## 💻 コード比較: フォーム処理

従来の手法とReact 19のActionsを使用した比較：

### React 18
\`\`\`javascript
const [isPending, startTransition] = useTransition();
const onSubmit = () => {
  startTransition(async () => {
    await saveData();
  });
};
\`\`\`

### React 19
\`\`\`javascript
const [state, formAction] = useFormState(saveData, initialState);
// <form action={formAction}> で自動的にPending状態を管理
\`\`\`

> **Core Change:** 開発者はレンダリングの最適化よりも、ビジネスロジックに集中できるようになります。`,
      },
    };

    return summaries[prompt.id] || {
      summary: `${prompt.title}に関する最新のアップデート情報を含む包括的な回答です。各アップデートの内容を統合し、実用的なベストプラクティスと具体的な実装例を提供します。`,
      full: `# ${prompt.title}に関する分析

## 📈 現状の概要

| 指標 | 値 | トレンド |
| :--- | :--- | :--- |
| **注目度** | High | ↗️ 上昇中 |
| **関連ニュース** | 12件/週 | ➡️ 横ばい |
| **市場センチメント** | Positive | ↗️ 改善 |

${prompt.title}に関する最新のアップデート情報を含む包括的な回答です。各アップデートの内容を統合し、実用的なベストプラクティスと具体的な実装例を提供します。

## 🔍 詳細分析

1.  **技術的進歩**: 最新のパッチにより、処理速度が20%向上しました。
2.  **ユーザーフィードバック**: 新機能に対する満足度は高く、特にUIの改善が評価されています。
3.  **競合状況**: 主要な競合他社と比較しても、独自の機能セットにより優位性を保っています。

> 最新の情報に基づき、継続的にモニタリングを行っています。`,
    };
  };

  // 回答をセグメント化して、最新アップデート情報にハイライトを付ける（仮実装）
  interface AnswerSegment {
    text: string;
    isHighlight: boolean;
    updateInfo?: {
      updateId: string;
      updateTitle: string;
      timestamp: Date;
      sources?: Array<{ id: string; url: string; title: string }>;
    };
  }

  const generateAnswerWithHighlights = (prompt: TrackingPrompt): AnswerSegment[] => {
    const answer = generateBestAnswer(prompt).full;
    const segments: AnswerSegment[] = [];

    // 仮実装：特定のキーワードやフレーズをハイライト対象として検出
    // 実際のAPI実装時は、APIレスポンスにハイライト情報が含まれる想定

    if (prompt.id === '1') {
      // ユニリーバのケース：特定の文をハイライト
      const parts = answer.split('\n\n');
      segments.push({
        text: parts[0] + '\n\n',
        isHighlight: false,
      });

      if (parts[1]) {
        // 2段落目を最新アップデート情報としてハイライト
        const latestUpdate = prompt.updates[0];
        segments.push({
          text: parts[1],
          isHighlight: true,
          updateInfo: {
            updateId: latestUpdate.id,
            updateTitle: latestUpdate.title,
            timestamp: latestUpdate.timestamp,
            sources: latestUpdate.sources,
          },
        });
      }
    } else {
      // デフォルト：最初の段落は通常、2段落目以降をハイライト
      const parts = answer.split('\n\n');
      parts.forEach((part, idx) => {
        if (idx === 0) {
          segments.push({
            text: part + (parts.length > 1 ? '\n\n' : ''),
            isHighlight: false,
          });
        } else {
          const latestUpdate = prompt.updates[Math.min(idx - 1, prompt.updates.length - 1)];
          segments.push({
            text: part + (idx < parts.length - 1 ? '\n\n' : ''),
            isHighlight: true,
            updateInfo: latestUpdate ? {
              updateId: latestUpdate.id,
              updateTitle: latestUpdate.title,
              timestamp: latestUpdate.timestamp,
              sources: latestUpdate.sources,
            } : undefined,
          });
        }
      });
    }

    return segments;
  };

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}分前`;
    if (hours < 72) return `${hours}時間前`;
    return `${days}日前`;
  };

  const formatFullDateTime = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${month}/${day}/${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const displayPrompts = promptId
    ? trackingPrompts.filter(p => p.id === promptId)
    : trackingPrompts;

  // 初期状態で最初のプロンプトの詳細を表示
  useEffect(() => {
    if (displayPrompts.length > 0 && !hasInitialized.current) {
      if (promptId) {
        setExpandedPromptDetails(promptId);
      } else {
        setExpandedPromptDetails(displayPrompts[0].id);
      }
      hasInitialized.current = true;
    }
  }, [displayPrompts, promptId]);

  const pageTitle = promptId && displayPrompts.length > 0
    ? displayPrompts[0].title
    : 'プロンプト管理';

  const pageSubtitle = promptId && displayPrompts.length > 0
    ? '追跡中のプロンプト詳細とアップデート履歴'
    : '追跡中のプロンプトとそのアップデート履歴';

  // 全アップデートの未読数をカウント
  const totalUnreadCount = displayPrompts.reduce((count, prompt) => {
    // Check against readUpdateIds prop
    const readIds = readUpdateIds[prompt.id] || [];
    const unreadInPrompt = prompt.updates.filter(update => !readIds.includes(update.id)).length;
    return count + unreadInPrompt;
  }, 0);

  return (
    <div className={`h-screen overflow-y-auto transition-colors ${theme === 'dark'
      ? 'bg-gradient-to-br from-[#1a1f2e] via-[#252a3a] to-[#2a1f2e]'
      : 'bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]'
      }`}>
      {/* Header */}
      <div className={`border-b backdrop-blur-md sticky top-0 z-10 shadow-sm transition-colors ${theme === 'dark'
        ? 'border-gray-700/50 bg-gray-800/80'
        : 'border-gray-200/50 bg-white/80'
        }`}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">{pageTitle}</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{pageSubtitle}</p>
            </div>

            {/* 未読カウント */}
            <div className="flex items-center gap-4">
              {totalUnreadCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-2xl shadow-sm">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <p className="text-xs text-amber-700">未読</p>
                    <p className="text-lg text-amber-800 font-bold">{totalUnreadCount}件</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 未読アップデート専用セクション */}
        {(() => {
          // 全プロンプトから未読アップデートを収集
          const unreadUpdates: Array<{
            update: typeof trackingPrompts[0]['updates'][0];
            prompt: typeof trackingPrompts[0];
            updateNumber: number;
          }> = [];

          displayPrompts.forEach(prompt => {
            prompt.updates.forEach((update, index) => {
              const readIds = readUpdateIds[prompt.id] || [];
              if (!readIds.includes(update.id)) {
                unreadUpdates.push({
                  update,
                  prompt,
                  updateNumber: prompt.updates.length - index
                });
              }
            });
          });

          // 時系列で並べ替え（新しい順）
          unreadUpdates.sort((a, b) => b.update.timestamp.getTime() - a.update.timestamp.getTime());

          if (unreadUpdates.length === 0) return null;

          return (
            <div className="mb-8 animate-fadeIn transition-all duration-300 ease-in-out overflow-visible">
              {/* セクションヘッダー */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <span className="text-3xl animate-bounce">🔔</span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
                <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>未読アップデート</h2>
                <div className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-md">
                  <span className="text-white text-sm font-bold">{unreadUpdates.length}</span>
                </div>
              </div>

              {/* 未読アップデートグリッド */}
              <div className="grid grid-cols-1 gap-4 mb-6 transition-all duration-300 ease-in-out overflow-visible">
                {unreadUpdates.slice(0, 5).map(({ update, prompt, updateNumber }) => (
                  <div
                    key={update.id}
                    onClick={() => {
                      if (onMarkUpdateAsRead) {
                        onMarkUpdateAsRead(prompt.id, update.id);
                      }
                      // toggleUpdateExpand(update.id); // No need to expand if it disappears
                    }}
                    className={`group relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 animate-slideIn overflow-visible ${theme === 'dark'
                      ? 'bg-gray-800 border-indigo-500/50'
                      : 'bg-white border-indigo-200'
                      }`}
                    style={{
                      animationDelay: `${unreadUpdates.indexOf({ update, prompt, updateNumber }) * 0.1}s`
                    }}
                  >
                    {/* パルスエフェクト */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full animate-ping" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full" />

                    {/* コンテンツ */}
                    <div className="relative z-10">
                      {/* ヘッダー */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-lg uppercase tracking-wide animate-pulse shadow-sm">
                            NEW
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-lg font-medium ${theme === 'dark'
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-700'
                            }`}>
                            Update #{updateNumber}
                          </span>
                        </div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>{formatDateTime(update.timestamp)}</span>
                      </div>

                      {/* プロンプトタイトル */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${prompt.isActive ? 'bg-emerald-500' : 'bg-red-500' // Use isActive instead of status
                          }`} />
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          プロンプト: <span className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{prompt.title}</span>
                        </p>
                      </div>

                      {/* アップデート内容 */}
                      <p className={`text-base leading-relaxed mb-3 line-clamp-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                        {update.content}
                      </p>

                      {/* アクションボタン */}
                      <div className="flex items-center justify-between">
                        <button className="text-sm text-indigo-600 font-medium flex items-center gap-1 transition-all">
                          詳細を表示
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onMarkUpdateAsRead) {
                              onMarkUpdateAsRead(prompt.id, update.id);
                            }
                          }}
                          className={`text-xs transition-colors font-medium ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-700 hover:text-gray-900'
                            }`}
                        >
                          既読にする
                        </button>
                      </div>
                    </div>

                    {/* ホバーエフェクト用のグラデーションオーバーレイ */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 
                                  rounded-xl transition-all duration-300" />
                  </div>
                ))}
              </div>

              {
                unreadUpdates.length > 5 && (
                  <p className={`text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    他 {unreadUpdates.length - 5} 件の未読アップデート
                  </p>
                )
              }

              {/* 区切り線 */}
              <div className="flex items-center gap-4 mt-8 mb-6">
                <div className={`flex-1 h-px ${theme === 'dark'
                  ? 'bg-gradient-to-r from-transparent via-gray-600 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'
                  }`} />
                <span className={`text-xs uppercase tracking-wider font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>すべてのプロンプト</span>
                <div className={`flex-1 h-px ${theme === 'dark'
                  ? 'bg-gradient-to-r from-transparent via-gray-600 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'
                  }`} />
              </div>
            </div>
          );
        })()}

        <div className="flex gap-6">
          {/* Left Column - Prompt List (40% width) */}
          <div className="w-[40%] space-y-6 pr-2 pb-32">
            {displayPrompts.map((prompt) => (
              <div
                key={prompt.id}
                id={`prompt-${prompt.id}`}
                className={`rounded-2xl border overflow-hidden shadow-md transition-all ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
                  }`}
              >
                {/* Card Header */}
                <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                  {/* Tracking Frequency Selector */}
                  <div className="mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFrequencyOptions(prev => ({ ...prev, [prompt.id]: !prev[prompt.id] }));
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl transition-colors mb-3"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>追跡頻度:</span>
                        <span className="text-xs text-indigo-600 font-semibold">
                          {(() => {
                            const freq = trackingFrequency[prompt.id] || 24;
                            if (freq === 1) return '1h';
                            if (freq === 6) return '6h';
                            if (freq === 12) return '12h';
                            if (freq === 24) return '1d';
                            if (freq === 72) return '3d';
                            if (freq === 168) return '1w';
                            if (freq % 168 === 0) return `${freq / 168}w`;
                            if (freq % 24 === 0) return `${freq / 24}d`;
                            return `${freq}h`;
                          })()}
                        </span>
                      </div>
                      <div className={`transition-transform ${showFrequencyOptions[prompt.id] ? 'rotate-180' : ''}`}>
                        <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {showFrequencyOptions[prompt.id] && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackingFrequency(prev => ({ ...prev, [prompt.id]: 1 }));
                              setShowCustomInput(prev => ({ ...prev, [prompt.id]: false }));
                            }}
                            className={`p-3 rounded-xl border transition-all font-medium ${trackingFrequency[prompt.id] === 1 && !showCustomInput[prompt.id]
                              ? theme === 'dark'
                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                                : 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : theme === 'dark'
                                ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                          >
                            <div className="text-center">
                              <p className="text-sm">1h</p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackingFrequency(prev => ({ ...prev, [prompt.id]: 6 }));
                              setShowCustomInput(prev => ({ ...prev, [prompt.id]: false }));
                            }}
                            className={`p-3 rounded-xl border transition-all font-medium ${trackingFrequency[prompt.id] === 6 && !showCustomInput[prompt.id]
                              ? theme === 'dark'
                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                                : 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : theme === 'dark'
                                ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                          >
                            <div className="text-center">
                              <p className="text-sm">6h</p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackingFrequency(prev => ({ ...prev, [prompt.id]: 12 }));
                              setShowCustomInput(prev => ({ ...prev, [prompt.id]: false }));
                            }}
                            className={`p-3 rounded-xl border transition-all font-medium ${trackingFrequency[prompt.id] === 12 && !showCustomInput[prompt.id]
                              ? theme === 'dark'
                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                                : 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : theme === 'dark'
                                ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                          >
                            <div className="text-center">
                              <p className="text-sm">12h</p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackingFrequency(prev => ({ ...prev, [prompt.id]: 24 }));
                              setShowCustomInput(prev => ({ ...prev, [prompt.id]: false }));
                            }}
                            className={`p-3 rounded-xl border transition-all font-medium ${trackingFrequency[prompt.id] === 24 && !showCustomInput[prompt.id]
                              ? theme === 'dark'
                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                                : 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : theme === 'dark'
                                ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                          >
                            <div className="text-center">
                              <p className="text-sm">1d</p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackingFrequency(prev => ({ ...prev, [prompt.id]: 72 }));
                              setShowCustomInput(prev => ({ ...prev, [prompt.id]: false }));
                            }}
                            className={`p-3 rounded-xl border transition-all font-medium ${trackingFrequency[prompt.id] === 72 && !showCustomInput[prompt.id]
                              ? theme === 'dark'
                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                                : 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : theme === 'dark'
                                ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                          >
                            <div className="text-center">
                              <p className="text-sm">3d</p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackingFrequency(prev => ({ ...prev, [prompt.id]: 168 }));
                              setShowCustomInput(prev => ({ ...prev, [prompt.id]: false }));
                            }}
                            className={`p-3 rounded-xl border transition-all font-medium ${trackingFrequency[prompt.id] === 168 && !showCustomInput[prompt.id]
                              ? theme === 'dark'
                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                                : 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : theme === 'dark'
                                ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                          >
                            <div className="text-center">
                              <p className="text-sm">1w</p>
                            </div>
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCustomInput(prev => ({ ...prev, [prompt.id]: !prev[prompt.id] }));
                          }}
                          className={`w-full px-4 py-3 rounded-xl border text-left transition-all font-medium ${showCustomInput[prompt.id]
                            ? theme === 'dark'
                              ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                              : 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : theme === 'dark'
                              ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">カスタム</span>
                            {showCustomInput[prompt.id] && <Check className="w-4 h-4 text-blue-400" />}
                          </div>
                        </button>

                        {showCustomInput[prompt.id] && (
                          <div className="pt-2 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className={`text-xs mb-1 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>時間数を入力</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="168"
                                  value={trackingFrequency[prompt.id] || 24}
                                  onChange={(e) => {
                                    const value = Math.max(1, Math.min(168, Number(e.target.value) || 1));
                                    setTrackingFrequency(prev => ({ ...prev, [prompt.id]: value }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`w-full text-sm rounded-xl px-3 py-2 border focus:outline-none focus:border-indigo-400 focus:ring-2 ${theme === 'dark'
                                    ? 'bg-gray-700 text-gray-100 border-gray-600 focus:ring-indigo-500/30'
                                    : 'bg-white text-gray-900 border-gray-300 focus:ring-indigo-100'
                                    }`}
                                  placeholder="1-168"
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-5">
                                <span className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>時間毎</span>
                              </div>
                            </div>

                            <div>
                              <label className={`text-xs mb-2 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>スライダーで調整</label>
                              <input
                                type="range"
                                min="1"
                                max="168"
                                value={trackingFrequency[prompt.id] || 24}
                                onChange={(e) => setTrackingFrequency(prev => ({ ...prev, [prompt.id]: Number(e.target.value) }))}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full h-2 bg-[#3d3d3d] rounded-lg appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((trackingFrequency[prompt.id] || 24) / 168) * 100}%, #3d3d3d ${((trackingFrequency[prompt.id] || 24) / 168) * 100}%, #3d3d3d 100%)`
                                }}
                              />
                              <div className={`flex justify-between mt-2 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span>1h</span>
                                <span>24h</span>
                                <span>72h</span>
                                <span>168h</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3 mb-4">
                    {prompt.isPinned ? (
                      <Pin
                        className="w-4 h-4 flex-shrink-0 mt-1"
                        style={{ color: prompt.isActive ? '#00ff00' : '#ff0000' }}
                      />
                    ) : (
                      <span
                        className="flex-shrink-0"
                        style={{
                          color: prompt.isActive ? '#00ff00' : '#ff0000',
                          fontSize: '24px',
                          lineHeight: '16px',
                        }}
                      >
                        ・
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="overflow-hidden relative group max-w-md">
                        <h2
                          className={`text-lg mb-1 font-semibold whitespace-nowrap ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                            } ${prompt.title.length > 25 ? 'animate-scroll-text' : ''
                            }`}
                        >
                          {prompt.title}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-lg font-medium ${prompt.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {prompt.isActive ? 'アクティブ' : '中断中'}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDateTime(prompt.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 追跡中���プロンプト */}
                  <div
                    onClick={() => handleEditPrompt(prompt.id, prompt.promptContent || prompt.title)}
                    className={`rounded-xl cursor-pointer transition-all duration-300 mb-4 overflow-hidden ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                      } ${editingPromptId === prompt.id
                        ? 'border-2 border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-2 border-transparent'
                      }`}
                  >
                    <div className={`flex items-center justify-between pb-3 pt-3 px-3 border-b ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-100'
                      }`}>
                      <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>追跡中のプロンプト:</p>
                      <div className="text-xs text-indigo-600 flex items-center gap-1 font-medium">
                        <Edit2 className="w-3 h-3" />
                        <span>編集</span>
                      </div>
                    </div>

                    <div className="px-3 pt-3 pb-3">
                      <p className={`text-sm leading-relaxed whitespace-pre-line transition-all duration-200 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                        } ${expandedPrompts.has(prompt.id) ? '' : 'line-clamp-3'
                        }`}>
                        {prompt.promptContent || prompt.title}
                      </p>

                      {(prompt.promptContent || prompt.title).split('\n').length > 3 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(prompt.id);
                          }}
                          className="text-xs text-blue-400 mt-2 transition-colors"
                        >
                          {expandedPrompts.has(prompt.id) ? '▲ 少なく表示' : '▼ もっと見る'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Best Answer Section */}
                  <div
                    onClick={() => togglePromptDetails(prompt.id)}
                    className={`rounded-xl cursor-pointer transition-all duration-300 mb-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                      } ${expandedPromptDetails === prompt.id
                        ? theme === 'dark'
                          ? 'border-2 border-purple-400 ring-2 ring-purple-500/30 bg-purple-900/30'
                          : 'border-2 border-purple-400 ring-2 ring-purple-100 bg-purple-50/30'
                        : 'border-2 border-transparent'
                      }`}
                  >
                    <p className={`text-sm leading-relaxed whitespace-pre-line px-3 pt-3 pb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                      {generateBestAnswer(prompt).summary}
                    </p>
                  </div>
                </div>

                {/* Update History */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>アップデート履歴</h3>
                    {(() => {
                      // Use readUpdateIds prop
                      const readIds = readUpdateIds[prompt.id] || [];
                      const unreadCount = prompt.updates.filter(u => !readIds.includes(u.id)).length;
                      return unreadCount > 0 ? (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          未読 {unreadCount}件
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scroll-container pb-8">
                    {(() => {
                      // すべてのアップデートを表示
                      const filteredUpdates = prompt.updates;

                      if (filteredUpdates.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-3">
                              <Check className="w-8 h-8 text-green-400" />
                            </div>
                            <p className="text-sm text-gray-700 font-medium">すべて確認済み</p>
                            <p className="text-xs text-gray-600 mt-1">未読のアップ��ートはありません</p>
                          </div>
                        );
                      }

                      return filteredUpdates.map((update) => {
                        const updateNumber = prompt.updates.length - prompt.updates.indexOf(update);
                        // Use readUpdateIds prop
                        const readIds = readUpdateIds[prompt.id] || [];
                        const isUnread = !readIds.includes(update.id);
                        const isLatest = prompt.updates[0].id === update.id;

                        return (
                          <div
                            key={update.id}
                            className={`rounded-lg overflow-hidden transition-all duration-300 $${selectedUpdate === update.id
                              ? 'bg-[#252525] border-2 border-indigo-500 ring-2 ring-indigo-200'
                              : isUnread
                                ? 'bg-blue-500/5 border border-blue-500/30'
                                : 'bg-[#1f1f1f] border border-transparent'
                              } ${isLatest ? 'border-2 border-blue-500/30' : ''
                              }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUpdateExpand(update.id);
                              }}
                              className={`w-full flex items-start gap-3 transition-colors text-left ${isLatest ? 'p-4' : 'p-3'
                                }`}
                            >
                              <div className="flex-shrink-0 mt-2">
                                {isUnread ? (
                                  <Circle className={`fill-blue-400 text-blue-400 ${isLatest ? 'w-3 h-3' : 'w-2.5 h-2.5'
                                    }`} />
                                ) : (
                                  <div className={`${isLatest ? 'w-3 h-3' : 'w-2.5 h-2.5'}`} />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {isLatest && (
                                    <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                                      最新
                                    </span>
                                  )}
                                  {isUnread && !isLatest && (
                                    <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                                      未読
                                    </span>
                                  )}
                                </div>
                                <p className={`mb-1 font-medium ${isLatest ? 'text-sm' : 'text-xs'} ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                                  }`}>
                                  Update #{updateNumber}
                                </p>
                                <p className={`${isLatest ? 'text-base' : 'text-sm'} ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                                  }`}>
                                  {update.content}
                                </p>
                                <p className={`mt-1 ${isLatest ? 'text-sm' : 'text-xs'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                  {formatDateTime(update.timestamp)}
                                </p>
                              </div>
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Detail Panel (60% width) */}
          <div className="w-[60%] flex-shrink-0">
            <div className="space-y-4">
              {editingPromptId ? (
                // プロンプト編集パネル
                (() => {
                  const editingPrompt = displayPrompts.find(p => p.id === editingPromptId);
                  if (!editingPrompt) return null;

                  const suggestions = generatePromptSuggestions(editingPromptText);

                  return (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg text-gray-900 font-semibold">プロンプトを編集</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              // 保存処理
                              setEditingPromptId(null);
                              setEditingPromptText('');
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm flex items-center gap-2 transition-colors shadow-md font-medium"
                          >
                            <Save className="w-4 h-4" />
                            保存
                          </button>
                          <button
                            onClick={() => {
                              setEditingPromptId(null);
                              setEditingPromptText('');
                            }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm flex items-center gap-2 transition-colors font-medium"
                          >
                            <X className="w-4 h-4" />
                            キャンセル
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto scroll-container">
                        {/* プロンプト入力エリア */}
                        <div>
                          <label className="text-sm text-gray-700 mb-2 block font-medium">プロンプトの内容</label>
                          <textarea
                            value={editingPromptText}
                            onChange={(e) => setEditingPromptText(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-gray-50 text-gray-900 rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                            rows={16}
                            placeholder="追跡したい内容を具体的に入力してください..."
                          />
                          <p className="text-xs text-gray-700 mt-2">
                            {editingPromptText.length} 文字
                          </p>
                        </div>

                        {/* AI推奨変更ポイント */}
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200">
                          <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-amber-600" />
                            <h4 className="text-sm text-gray-900 font-semibold">AIによる推奨変更ポイント</h4>
                          </div>

                          {suggestions.length > 0 ? (
                            <div className="space-y-4">
                              {suggestions.map((suggestion, index) => (
                                <div key={index} className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                                  <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                      <span className="text-white text-xs font-bold">{index + 1}</span>
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="text-sm text-amber-700 mb-2 font-semibold">{suggestion.type}</h5>
                                      <p className="text-sm text-gray-700 mb-2">{suggestion.suggestion}</p>
                                      <p className="text-xs text-gray-600 italic">💡 {suggestion.reason}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-green-400">✓ このプロンプトは十分に最適化されています</p>
                              <p className="text-xs text-gray-600 mt-1">明確で具体的な内容になっています</p>
                            </div>
                          )}
                        </div>

                        {/* プロンプト改善の一般的なヒント */}
                        <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
                          <h5 className="text-sm text-blue-400 mb-2">効果的なプロンプトのポイント</h5>
                          <ul className="text-xs text-gray-900 space-y-1">
                            <li>• 具体的なキーワードを含める（業界名、技術名、企業名など）</li>
                            <li>• 時間軸を明確にする（最新、2024年以降など）</li>
                            <li>• 追跡の目的を示す（���較、分析、評価など）</li>
                            <li>• 情報源の質を指定する（公式発表、一次情報な���）</li>
                            <li>• 適度な長さを保つ（50〜200文字程度が理想的）</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : selectedUpdate ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md">
                  <h3 className="text-sm text-gray-700 mb-4 font-semibold">アップデート詳細</h3>
                  <div className="bg-gray-50 rounded-xl p-6 max-h-[calc(100vh-120px)] overflow-y-auto scroll-container">
                    {(() => {
                      let selectedUpdateData: Update | null = null;
                      let updateNumber = 0;
                      for (const prompt of displayPrompts) {
                        const foundIndex = prompt.updates.findIndex(u => u.id === selectedUpdate);
                        if (foundIndex !== -1) {
                          selectedUpdateData = prompt.updates[foundIndex];
                          updateNumber = prompt.updates.length - foundIndex;
                          break;
                        }
                      }

                      if (selectedUpdateData) {
                        return (
                          <div className="space-y-6">
                            <h4 className="text-lg text-gray-900 font-semibold">
                              Update #{updateNumber} ({selectedUpdateData.title})
                            </h4>

                            <div className="flex items-center gap-2 text-gray-700 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>{formatFullDateTime(selectedUpdateData.timestamp)}</span>
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-sm text-gray-900 font-semibold">情報:</h5>
                              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <p className="text-gray-900 leading-relaxed text-sm">
                                  {selectedUpdateData.content}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-sm text-gray-900 font-semibold">文献:</h5>
                              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                {selectedUpdateData.sources && selectedUpdateData.sources.length > 0 ? (
                                  <div className="space-y-3">
                                    {selectedUpdateData.sources.map((source, index) => (
                                      <div key={source.id} className="text-sm">
                                        <div className="flex gap-2">
                                          <span className="text-gray-800 flex-shrink-0 font-medium">[{index + 1}]</span>
                                          <div className="flex-1">
                                            <p className="text-gray-900 mb-1 font-medium">{source.title}</p>
                                            <a
                                              href={source.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-indigo-600 hover:text-indigo-700 hover:underline transition-colors break-all text-xs"
                                            >
                                              {source.url}
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-600 text-xs">参考文献がありません</p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-sm text-gray-900 font-semibold">Ask Question:</h5>
                              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                {chatMessages.length > 0 && (
                                  <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto scroll-container">
                                    {chatMessages.map((message) => (
                                      <div key={message.id} className="flex items-start gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${message.role === 'user' ? 'bg-indigo-100' : 'bg-emerald-100'
                                          }`}>
                                          <span className={`text-xs font-semibold ${message.role === 'user' ? 'text-indigo-700' : 'text-emerald-700'
                                            }`}>
                                            {message.role === 'user' ? 'U' : 'AI'}
                                          </span>
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm text-gray-900">{message.content}</p>
                                          <p className="text-xs text-gray-700 mt-1">{formatFullDateTime(message.timestamp)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendQuestion();
                                      }
                                    }}
                                    placeholder="この更新内容について質問..."
                                    className="flex-1 bg-gray-50 text-gray-900 text-sm rounded-xl px-4 py-2 border border-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-gray-500"
                                  />
                                  <button
                                    onClick={handleSendQuestion}
                                    disabled={!question.trim()}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 transition-colors flex items-center gap-2 shadow-md"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return <p className="text-gray-400 text-sm">詳細情報がありません</p>;
                    })()}
                    {/* スペーサーを追加して最後まで快適にスクロール可能に */}
                    <div className="h-[800px]"></div>
                  </div>
                </div>
              ) : expandedPromptDetails ? (
                // プロンプトの詳細表示
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md">
                  {/* 強調されたヘッダーセクション */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg text-gray-900 font-semibold">現段階のプロンプトに対する回答</h3>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 overflow-y-auto scroll-container">
                    {(() => {
                      const expandedPrompt = displayPrompts.find(p => p.id === expandedPromptDetails);
                      if (expandedPrompt) {
                        return (
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <h5 className="text-sm text-gray-700 font-semibold">情報:</h5>
                              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">



                                <div className="text-gray-900 leading-relaxed text-sm markdown-body">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      table: ({ node, ...props }) => (
                                        <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
                                          <table className="min-w-full divide-y divide-gray-200" {...props} />
                                        </div>
                                      ),
                                      thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
                                      th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />,
                                      tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                                      tr: ({ node, ...props }) => <tr {...props} />,
                                      td: ({ node, ...props }) => <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700" {...props} />,
                                      h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                                      h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-5 mb-3 text-gray-800 border-b pb-2" {...props} />,
                                      h3: ({ node, ...props }) => <h3 className="text-md font-bold mt-4 mb-2 text-gray-800" {...props} />,
                                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
                                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
                                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-4 bg-indigo-50/50 italic text-gray-700" {...props} />,
                                      code: ({ node, ...props }) => {
                                        const match = /language-(\w+)/.exec((props.className || ''))
                                        const isInline = !match && !props.children?.toString().includes('\n')
                                        return isInline
                                          ? <code className="bg-gray-100 rounded px-1.5 py-0.5 text-xs font-mono text-red-500" {...props} />
                                          : <code className="block bg-[#1e1e1e] text-gray-200 p-4 rounded-lg text-xs font-mono overflow-x-auto my-3" {...props} />
                                      }
                                    }}
                                  >
                                    {generateBestAnswer(expandedPrompt).full}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-sm text-gray-700 font-semibold">文献:</h5>
                              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="space-y-3">
                                  {expandedPrompt.updates.slice(0, 3).map((update, idx) => (
                                    update.sources && update.sources.length > 0 && update.sources.slice(0, 2).map((source, sourceIdx) => (
                                      <div key={`${update.id}-${source.id}`} className="text-sm">
                                        <div className="flex gap-2">
                                          <span className="text-gray-900 flex-shrink-0 font-medium">[{idx * 2 + sourceIdx + 1}]</span>
                                          <div className="flex-1">
                                            <p className="text-gray-900 mb-1 font-medium">{source.title}</p>
                                            <a
                                              href={source.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-indigo-600 hover:text-indigo-700 hover:underline transition-colors break-all text-xs"
                                            >
                                              {source.url}
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ))}
                                  {expandedPrompt.updates.every(u => !u.sources || u.sources.length === 0) && (
                                    <p className="text-gray-600 text-xs">参考文献がありません</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-sm text-gray-900 font-semibold">Ask Question:</h5>
                              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                {chatMessages.length > 0 && (
                                  <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto scroll-container">
                                    {chatMessages.map((message) => (
                                      <div key={message.id} className="flex items-start gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${message.role === 'user' ? 'bg-indigo-100' : 'bg-emerald-100'
                                          }`}>
                                          <span className={`text-xs font-semibold ${message.role === 'user' ? 'text-indigo-700' : 'text-emerald-700'
                                            }`}>
                                            {message.role === 'user' ? 'U' : 'AI'}
                                          </span>
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm text-gray-900">{message.content}</p>
                                          <p className="text-xs text-gray-700 mt-1">{formatFullDateTime(message.timestamp)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendQuestion();
                                      }
                                    }}
                                    placeholder="この回答について質問..."
                                    className="flex-1 bg-gray-50 text-gray-900 text-sm rounded-xl px-4 py-2 border border-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-gray-500"
                                  />
                                  <button
                                    onClick={handleSendQuestion}
                                    disabled={!question.trim()}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 transition-colors flex items-center gap-2 shadow-md"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return <p className="text-gray-400 text-sm">詳細情報がありません</p>;
                    })()}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 rounded-xl border border-indigo-200/50 p-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <Info className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-gray-500 text-sm text-center">
                      アップデート履歴を選択すると、詳細情報がここに表示されます
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}