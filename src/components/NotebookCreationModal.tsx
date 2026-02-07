import { X, Sparkles, FileText, Zap, Bell, Clock } from 'lucide-react';
import { useState } from 'react';

interface NotebookCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNotebook: (
    title: string,
    prompt: string,
    template?: string,
    trackingFrequency?: string,
    notificationEnabled?: boolean,
    notificationGranularity?: 'update' | 'prompt'
  ) => void;
}

export function NotebookCreationModal({ isOpen, onClose, onCreateNotebook }: NotebookCreationModalProps) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [trackingFrequency, setTrackingFrequency] = useState('daily');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationGranularity, setNotificationGranularity] = useState<'update' | 'prompt'>('update');


  if (!isOpen) return null;

  const templates = [
    {
      id: 'market-research',
      icon: '📊',
      title: '市場調査',
      description: '業界トレンドと競合分析',
      prompt: `以下の業界について包括的な市場調査を実施してください：

【調査項目】
1. 市場規模と成長性
   - 現在の市場規模（金額ベース、ユニット数）
   - 過去3-5年の成長率（CAGR）
   - 2025-2030年の成長予測と主要成長ドライバー
   - 地域別・セグメント別の市場シェア

2. 競合環境分析
   - 主要プレイヤー上位5-10社のプロフィール
   - 各社の市場シェア、売上高、強み・弱み
   - 新規参入企業と破壊的イノベーターの動向
   - M&A動向と戦略的提携

3. トレンドと機会
   - 技術トレンド（AI、デジタル化など）
   - 消費者行動の変化
   - 規制環境の変化
   - サステナビリティ・ESG要因

4. リスクと課題
   - 主要なリスク要因
   - 参入障壁
   - サプライチェーンの課題

【業界名】: `
    },
    {
      id: 'product-analysis',
      icon: '🔍',
      title: '製品分析',
      description: '製品の詳細な評価',
      prompt: `以下の製品について詳細な分析を実施してください：

【分析フレームワーク】
1. 製品概要
   - 基本仕様と主要機能
   - ターゲット顧客セグメント
   - 価格帯とポジショニング
   - 販売チャネルと流通戦略

2. 競合比較
   - 直接競合製品3-5点との機能・価格比較表
   - 差別化ポイントと独自価値提案（UVP）
   - 市場での相対的な位置づけ（ポジショニングマップ）

3. 顧客評価
   - レビュー・評価の定量分析（星評価、NPS等）
   - 主要な顧客フィードバック（ポジティブ/ネガティブ）
   - ユーザー層の特徴と満足度

4. ビジネスパフォーマンス
   - 販売実績とトレンド
   - 市場シェアの推移
   - ブランド認知度

5. SWOT分析
   - Strengths（強み）
   - Weaknesses（弱み）
   - Opportunities（機会）
   - Threats（脅威）

【製品名】: `
    },
    {
      id: 'strategy-research',
      icon: '🎯',
      title: '戦略リサーチ',
      description: 'ビジネス戦略の調査',
      prompt: `以下の企業/ブランドのビジネス戦略について包括的に調査してください：

【調査フレームワーク】
1. 企業概要と事業ポートフォリオ
   - 企業プロフィール（設立年、本社、売上規模、従業員数）
   - 主要事業セグメントと収益構成
   - グローバルフットプリント

2. 成長戦略
   - 中期経営計画の目標と重点施策
   - 新市場進出戦略（地理的/製品的拡大）
   - M&A戦略と主要な買収案件
   - イノベーション・R&D投資

3. マーケティング戦略
   - ブランドポジショニングとメッセージング
   - 主要キャンペーンとクリエイティブ戦略
   - デジタルマーケティング施策
   - カスタマーエンゲージメント手法

4. 競争戦略
   - コアコンピタンスと差別化要因
   - コストリーダーシップ vs. 差別化戦略
   - 戦略的パートナーシップ

5. サステナビリティ・ESG
   - 環境・社会課題への取り組み
   - ESG目標とKPI
   - サステナビリティレポートの主要指標

6. 財務パフォーマンス
   - 過去3-5年の売上・利益成長率
   - 収益性指標（営業利益率、ROE等）
   - 投資家向けガイダンスと見通し

【企業/ブランド名】: `
    },
    {
      id: 'tech-trends',
      icon: '⚡',
      title: '技術トレンド',
      description: '最新技術の追跡',
      prompt: `以下の技術分野について最新トレンドを調査してください：

【調査項目】
1. 技術概要と進化
   - 技術の基本原理と最新の発展状況
   - 主要な技術的ブレークスルー（過去1-2年）
   - 技術成熟度（Gartnerハイプサイクル等）

2. 市場動向
   - 市場規模と成長予測
   - 主要な投資トレンドとVC動向
   - 企業による技術導入率

3. 主要プレイヤー
   - テクノロジーリーダー企業（上位5-10社）
   - 有力スタートアップと資金調達状況
   - アカデミアの主要研究機関

4. ユースケースと実用例
   - 業界別の主要ユースケース
   - 先進的な導入事例（3-5件）
   - ROI・ビジネスインパクト

5. 技術的課題
   - 現在の技術的限界
   - 標準化・相互運用性の課題
   - セキュリティ・プライバシー懸念

6. 将来展望
   - 2025-2030年の技術ロードマップ
   - 破壊的影響を受ける産業
   - 規制環境の見通し

【技術分野】: `
    },
    {
      id: 'competitive-intelligence',
      icon: '🔬',
      title: '競合インテリジェンス',
      description: '競合企業の詳細分析',
      prompt: `以下の競合企業について詳細なインテリジェンスを収集してください：

【分析フレームワーク】
1. 企業プロフィール
   - 基本情報（設立、本社、経営陣）
   - 組織構造と主要部門
   - 従業員数と採用動向

2. 事業戦略
   - ビジネスモデルと収益構造
   - 製品/サービスラインナップ
   - 価格戦略とポジショニング

3. 市場パフォーマンス
   - 市場シェアと推移
   - 顧客基盤と主要クライアント
   - 地域別売上構成

4. イノベーション
   - R&D投資額と注力分野
   - 特許ポートフォリオ
   - 新製品パイプライン

5. マーケティング・営業
   - ブランディング戦略
   - 主要キャンペーンとメッセージング
   - チャネル戦略（直販/パートナー比率）

6. 財務健全性
   - 収益性と成長率
   - キャッシュフロー
   - 負債比率と財務レバレッジ

7. SWOT分析
   - 相対的な強み・弱み
   - 潜在的な脅威と機会

【競合企業名】: `
    },
    {
      id: 'blank',
      icon: '📝',
      title: '白紙から作成',
      description: 'カスタムプロンプト',
      prompt: ''
    }
  ];

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setPrompt(template.prompt);
    }
  };

  const handleCreate = () => {
    if (!title.trim() || !prompt.trim()) return;
    onCreateNotebook(title, prompt, selectedTemplate || undefined, trackingFrequency, notificationEnabled, notificationGranularity);
    // Reset form
    setTitle('');
    setPrompt('');
    setSelectedTemplate(null);
  };

  const handleCancel = () => {
    setTitle('');
    setPrompt('');
    setSelectedTemplate(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#2d2d2d] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-[#3d3d3d]">
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#3d3d3d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-2xl text-gray-200">ノートブックを新規作成</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-[#3d3d3d] rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Template Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">テンプレートを選択</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#3d3d3d] bg-[#1f1f1f] hover:border-[#4d4d4d]'
                    }`}
                >
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <h3 className="text-sm font-medium text-gray-200 mb-1">{template.title}</h3>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">ノートブックのタイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ユニリーバのマーケティング戦略調査"
              className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#3d3d3d] rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">調査プロンプト</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="調査したい内容を詳しく記述してください..."
              rows={8}
              className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#3d3d3d] rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 ヒント: 具体的な質問や調査項目を記載すると、より精度の高い結果が得られます
            </p>
          </div>

          {/* AI Suggestions */}
          {selectedTemplate && selectedTemplate !== 'blank' && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">AI提案</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    このテンプレートでは、業界の最新トレンド、主要企業の動向、市場データなど、
                    包括的な情報を自動的に収集し、定期的に更新します。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Frequency */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <Clock className="w-4 h-4" />
              追跡頻度
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTrackingFrequency('realtime')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${trackingFrequency === 'realtime'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-[#3d3d3d] bg-[#1f1f1f] hover:border-[#4d4d4d]'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-gray-200">リアルタイム</span>
                </div>
                <p className="text-xs text-gray-500">新しい情報が見つかり次第更新</p>
              </button>

              <button
                onClick={() => setTrackingFrequency('hourly')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${trackingFrequency === 'hourly'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[#3d3d3d] bg-[#1f1f1f] hover:border-[#4d4d4d]'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-200">毎時</span>
                </div>
                <p className="text-xs text-gray-500">1時間ごとに自動更新</p>
              </button>

              <button
                onClick={() => setTrackingFrequency('daily')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${trackingFrequency === 'daily'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[#3d3d3d] bg-[#1f1f1f] hover:border-[#4d4d4d]'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-200">毎日</span>
                </div>
                <p className="text-xs text-gray-500">1日1回定期更新（推奨）</p>
              </button>

              <button
                onClick={() => setTrackingFrequency('weekly')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${trackingFrequency === 'weekly'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[#3d3d3d] bg-[#1f1f1f] hover:border-[#4d4d4d]'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-200">毎週</span>
                </div>
                <p className="text-xs text-gray-500">週1回の定期更新</p>
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-[#252525] rounded-xl p-5 border border-[#3d3d3d]">
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Bell className="w-4 h-4" />
              通知設定
            </label>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-200 mb-1">通知を有効にする</p>
                  <p className="text-xs text-gray-500">新しい更新があった際に通知を受け取ります</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationEnabled}
                    onChange={(e) => setNotificationEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {notificationEnabled && (
                <div className="pt-3 border-t border-[#3d3d3d]">
                  <label className="block text-xs text-gray-400 mb-2">通知の粒度</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNotificationGranularity('update')}
                      className={`p-3 rounded-lg border transition-all text-left ${notificationGranularity === 'update'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-[#3d3d3d] bg-[#1f1f1f] hover:border-[#4d4d4d]'
                        }`}
                    >
                      <p className="text-xs font-medium text-gray-200 mb-1">アップデート単位</p>
                      <p className="text-xs text-gray-500">まとめて通知</p>
                    </button>

                    <button
                      onClick={() => setNotificationGranularity('prompt')}
                      className={`p-3 rounded-lg border transition-all text-left ${notificationGranularity === 'prompt'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-[#3d3d3d] bg-[#1f1f1f] hover:border-[#4d4d4d]'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-200">プロンプト単位</p>
                        {notificationGranularity === 'prompt' && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded">未読数表示</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">詳細に通知</p>
                    </button>
                  </div>

                  <div className="mt-3 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-xs text-blue-400 leading-relaxed">
                      {notificationGranularity === 'update'
                        ? '💡 複数の更新をまとめて1つの通知で受け取ります'
                        : '💡 各プロンプトの更新を個別に通知し、未読数をバッジで表示します'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#3d3d3d] flex items-center justify-between bg-[#252525]">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileText className="w-4 h-4" />
            <span>作成後、追跡設定を調整できます</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleCreate}
              disabled={!title.trim() || !prompt.trim()}
              className={`px-6 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${!title.trim() || !prompt.trim()
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              作成して追跡開始
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}