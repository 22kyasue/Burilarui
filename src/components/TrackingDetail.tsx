import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { RefinementScenario } from "../data/demoScenarios";

interface TrackingDetailProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  frequency: string;
  query: string;
  mode?: "default" | "pro";
  planId?: string; // Optional: if provided, we're editing an existing plan
  onTrackingStarted?: (planId: string) => void; // Callback when tracking starts
  scenario?: RefinementScenario;
}

export function TrackingDetail({
  isOpen: _isOpen,
  onClose,
  scenario,
}: TrackingDetailProps) {
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const notificationSettingsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackingSettingsTitleRef = useRef<HTMLHeadingElement>(null);
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<"active" | "paused">("paused");

  // Default to Apple Intelegence if no scenario provided (for backward compatibility/safety)
  const activeScenario = scenario || {
    title: "Apple Intelligenceの2024〜2025年の最新動向",
    recommendedPrompt: "「Apple Intelligenceについて、2024年から2025年にかけての最新動向を業界リサーチ目的で継続的に追跡してください。特に、生成AIやオンデバイスAI、OSとの統合などに関する新機能・技術アップデートと、日本市場における対応状況（日本語対応の進捗、提供開始時期、対応デバイスの拡大）を重点的に把握したいです。情報源はAppleの公式発表および信頼性の高い海外テックメディアを中心とし、重要な変化が確認された場合のみ通知してください。その際は、変化の内容とそれがAppleのAI戦略や市場において持つ意味を簡潔に説明してください。」",
    structureItems: [
      { color: "indigo", title: "期間の明確化", description: "追跡期間を具体的に指定することで、関連性の高い情報に絞り込めます" },
      { color: "purple", title: "具体的な観点の列挙", description: "複数の観点を明示することで、包括的な追跡が可能になります" },
      { color: "pink", title: "アクション条件の設定", description: "どんな時に通知が欲しいかを明記することで、ノイズを削減できます" }
    ],
    missingPoints: [
      { text: "2025年第2四半期以降の具体的なリリーススケジュール" },
      { text: "日本語版の完全対応時期と機能の制限事項" },
      { text: "新型iPhone/iPad/Macの発表および対応状況" },
      { text: "第三者評価機関による最新のプライバシー監査結果" }
    ],
    notificationTriggers: [
      { text: "Apple公式サイトで新しいアップデートや機能が発表されたとき" },
      { text: "主要テックメディアが日本語対応の進捗を報じたとき" },
      { text: "新型デバイスの発表や対応機種リストの更新があったとき" },
      { text: "プライバシー技術に関する重要な分析レポートが公開されたとき" },
      { text: "毎日9:00の定期チェックで新しい情報が検出されたとき" }
    ]
  };

  // プロンプト編集の状態管理
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(activeScenario.recommendedPrompt);
  const originalPrompt = activeScenario.recommendedPrompt;

  // Reset prompt when scenario changes
  useEffect(() => {
    setCurrentPrompt(activeScenario.recommendedPrompt);
  }, [activeScenario.recommendedPrompt]);

  // 通知設定が開いたときに自動スクロール
  useEffect(() => {
    if (isNotificationSettingsOpen && trackingSettingsTitleRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        // 追跡設定のタイトルがコンテナの上部に来るようにスクロール
        const container = scrollContainerRef.current;
        const titleElement = trackingSettingsTitleRef.current;

        if (container && titleElement) {
          const containerRect = container.getBoundingClientRect();
          const titleRect = titleElement.getBoundingClientRect();
          const scrollOffset = titleRect.top - containerRect.top + container.scrollTop - 24; // 24pxのパディングを考慮

          container.scrollTo({
            top: scrollOffset,
            behavior: 'smooth'
          });
        }
      }, 150); // アニメーション開始後に少し遅延させてスクロール
    }
  }, [isNotificationSettingsOpen]);

  // URLを追加する関数
  const handleAddUrl = () => {
    if (urlInput.trim() && !sourceUrls.includes(urlInput.trim())) {
      setSourceUrls([...sourceUrls, urlInput.trim()]);
      setUrlInput("");
    }
  };

  // URLを削除する関数
  const handleRemoveUrl = (urlToRemove: string) => {
    setSourceUrls(sourceUrls.filter(url => url !== urlToRemove));
  };

  // Enterキーでの追加
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // IME変換中はエンターキーを処理しない
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      handleAddUrl();
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute right-0 top-0 w-full md:w-[65%] h-full p-4 flex flex-col z-20"
    >
      {/* 枠で囲まれたコンテナ */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border-2 border-gray-300 shadow-lg flex flex-col">
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-gray-900 text-xl font-semibold">
              {activeScenario.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-white/50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* ステータス切り替えボタン */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => setTrackingStatus(trackingStatus === "active" ? "paused" : "active")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all shadow-sm ${trackingStatus === "active"
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400"
                : "bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400"
                }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${trackingStatus === "active" ? "bg-green-500" : "bg-red-500"
                }`}></div>
              <span className={`text-sm font-medium ${trackingStatus === "active" ? "text-green-700" : "text-red-700"
                }`}>
                {trackingStatus === "active" ? "アクティブ" : "中断中"}
              </span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200">
              <span className="text-xs font-medium text-purple-700">必ビジ追中</span>
            </div>
          </div>
        </div>

        {/* コンテンツ - スクロール可能 */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-32 bg-gradient-to-br from-indigo-50/20 via-purple-50/20 to-pink-50/20" ref={scrollContainerRef}>
          <div className="space-y-6">
            {/* AIが推奨する構成（参考） */}
            <div className="bg-gray-50/80 rounded-2xl p-6 border-2 border-indigo-400 shadow-lg ring-2 ring-indigo-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <h3 className="text-gray-900 font-semibold">AIが推奨する構成（参考）</h3>
                </div>

                {/* プロンプト操作ボタンをタイトル行の右端に配置 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPrompt(originalPrompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    <span>↩️</span>
                    <span>元に戻す</span>
                  </button>
                  <button
                    onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-medium hover:from-indigo-100 hover:to-purple-100 transition-all"
                  >
                    <span>{isEditingPrompt ? '✓' : '✏️'}</span>
                    <span>{isEditingPrompt ? '編集完了' : '編集する'}</span>
                  </button>
                </div>
              </div>

              {/* 理想的な追跡プロンプトの完成イメージ */}
              {isEditingPrompt ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-indigo-100">
                  <textarea
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    className="w-full text-sm text-gray-800 leading-relaxed italic bg-transparent border-none focus:outline-none resize-none"
                    rows={4}
                  />
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-indigo-100">
                  <p className="text-sm text-gray-800 leading-relaxed italic">
                    {currentPrompt}
                  </p>
                </div>
              )}

              {/* 推奨要素の説明 */}
              <div className="space-y-3">
                {activeScenario.structureItems.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={`flex-shrink-0 w-1 bg-${item.color}-400 rounded-full`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 今後の追跡と通知の流れ */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                <span className="text-indigo-600">📍</span>
                今後の追跡と通知の流れ
              </h3>

              {/* A. 現時点で未確定・不十分な点 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                    現時点で未確
                  </div>
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-amber-200">
                  {activeScenario.missingPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-amber-600 text-sm mt-0.5">•</span>
                      <p className="text-sm text-gray-700">{point.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* B. 今後の通知トリガー */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                    通知されるタイミング
                  </div>
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-indigo-200">
                  {activeScenario.notificationTriggers.map((trigger, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-indigo-600 text-sm mt-0.5">→</span>
                      <p className="text-sm text-gray-700">{trigger.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-xs text-indigo-700 flex items-start gap-2">
                  <span className="flex-shrink-0">💡</span>
                  <span>通知は要約形式で届き、詳細はアプリ内で確認できます。不要な通知を減らすため、重要度の高い情報のみをお届けします。</span>
                </p>
              </div>
            </div>

            {/* 参照する情報ソース（任意） */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                <span className="text-purple-600">🔗</span>
                参照する情報ソース（任意）
              </h3>

              <p className="text-xs text-gray-500 mb-4">
                指定しない場合は、信頼性の高い複数ソースから自動で調査します
              </p>

              {/* URL入力欄 */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="例: https://www.apple.com"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                  />
                  <button
                    onClick={handleAddUrl}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white text-sm font-medium hover:from-indigo-500 hover:to-purple-500 transition-all shadow-sm hover:shadow-md"
                  >
                    追加
                  </button>
                </div>
              </div>

              {/* 追加されたURLリスト */}
              {sourceUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    登録済みソース ({sourceUrls.length})
                  </div>
                  {sourceUrls.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 group hover:border-indigo-200 transition-all"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-indigo-600">🌐</span>
                        <span className="text-sm text-gray-800 truncate">{url}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveUrl(url)}
                        className="ml-2 w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-70 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* URLが登録されていない場合表示 */}
              {sourceUrls.length === 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200 text-center">
                  <p className="text-xs text-gray-500">
                    ソースを指定しない場合、AIが自動的に最適なソースを選択します
                  </p>
                </div>
              )}
            </div>

            {/* 通知設定セクション - 展開可能 */}
            <AnimatePresence>
              {isNotificationSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                    opacity: { duration: 0.3 }
                  }}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm overflow-hidden"
                  ref={notificationSettingsRef}
                >
                  <h3 className="text-gray-900 font-semibold mb-5" ref={trackingSettingsTitleRef}>通知の詳細設定</h3>

                  {/* 追跡検索の頻度 */}
                  <div className="mb-6">
                    <label className="text-sm text-gray-700 block mb-3 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">🔄</span>
                      追跡検索の頻度
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      このプロンプトに対して、どのくらいの頻度で新しい情報を検索するかを設定します
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <button className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-600 text-sm font-medium hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        1h
                      </button>
                      <button className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-600 text-sm font-medium hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        6h
                      </button>
                      <button className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-600 text-sm font-medium hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        12h
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <button className="px-4 py-2.5 rounded-lg border-2 border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-sm font-medium shadow-sm">
                        1d
                      </button>
                      <button className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-600 text-sm font-medium hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        3d
                      </button>
                      <button className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-600 text-sm font-medium hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                        1w
                      </button>
                    </div>
                    <button className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-600 text-sm font-medium hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                      カスタム
                    </button>
                  </div>

                  {/* 通知形式 */}
                  <div className="mb-6">
                    <label className="text-sm text-gray-700 block mb-3 font-medium flex items-center gap-2">
                      <span className="text-purple-600">🔔</span>
                      通知形式
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      アップデートがあった時の通知方法を選択します
                    </p>
                    <div className="space-y-3">
                      {/* メール通知 */}
                      <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-indigo-200 flex items-center justify-center">
                            <span className="text-lg">✉️</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              メール通知
                            </div>
                            <div className="text-xs text-gray-500">
                              登録メールアドレスに通知を送信
                            </div>
                          </div>
                        </div>
                        <button className="w-12 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative transition-all">
                          <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></span>
                        </button>
                      </div>

                      {/* プッシュ通知 */}
                      <div className="flex items-center justify-between p-4 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-purple-200 flex items-center justify-center">
                            <span className="text-lg">📱</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              プッシュ通知
                            </div>
                            <div className="text-xs text-gray-500">
                              モバイルデバイスに通知を送信
                            </div>
                          </div>
                        </div>
                        <button className="w-12 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative transition-all">
                          <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></span>
                        </button>
                      </div>

                      {/* アプリ内通知 */}
                      <div className="flex items-center justify-between p-4 rounded-xl border border-pink-100 bg-gradient-to-r from-pink-50/50 to-indigo-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-pink-200 flex items-center justify-center">
                            <span className="text-lg">💬</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              アプリ内通知
                            </div>
                            <div className="text-xs text-gray-500">
                              Burilarアプリ内で通知を表示
                            </div>
                          </div>
                        </div>
                        <button className="w-12 h-6 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full relative transition-all">
                          <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 通知のタイミング */}
                  <div className="mb-6">
                    <label className="text-sm text-gray-700 block mb-3 font-medium flex items-center gap-2">
                      <span className="text-pink-600">⏰</span>
                      通知のタイミング
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      どのタイミングで通知を受け取るかを設定します
                    </p>
                    <div className="space-y-2">
                      {/* 新しいアップデートがあった時 */}
                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="mt-0.5 w-5 h-5 rounded border-2 border-indigo-400 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">
                            新しいアップデートがあった時
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            追跡中のプロンプトに新しい情報が見つかった時に即座に通知
                          </div>
                        </div>
                      </label>

                      {/* 再検索したタイミング */}
                      <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                        <input
                          type="checkbox"
                          className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">
                            再検索したタイミング
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            検索を実行するたびに通知（新しい情報の有無に関わらず）
                          </div>
                        </div>
                      </label>

                      {/* 日次ダイジェスト */}
                      <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                        <input
                          type="checkbox"
                          className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">
                            日次ダイジェスト
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            1日のアップデートをまとめて通知（毎日午前9時）
                          </div>
                        </div>
                      </label>

                      {/* 週次ダイジェスト */}
                      <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                        <input
                          type="checkbox"
                          className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">
                            週次ダイジェスト
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            1週間のアップデートをまとめて通知（毎週月曜午前9時）
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 通知の詳細度 */}
                  <div className="mb-6">
                    <label className="text-sm text-gray-700 block mb-3 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">📊</span>
                      通知の詳細度
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      通知に含める情報量を選択します
                    </p>
                    <div className="space-y-2">
                      {/* 要約のみ */}
                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 cursor-pointer">
                        <input
                          type="radio"
                          name="detail-level"
                          defaultChecked
                          className="mt-0.5 w-5 h-5 border-2 border-indigo-400 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">
                            要約のみ
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            アップデートのタイトルと簡単な要約のみ
                          </div>
                        </div>
                      </label>

                      {/* 詳細 */}
                      <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                        <input
                          type="radio"
                          name="detail-level"
                          className="mt-0.5 w-5 h-5 border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">
                            詳細
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            要約に加えて、主要なポイントと参考文献を含む
                          </div>
                        </div>
                      </label>

                      {/* 完全版 */}
                      <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                        <input
                          type="radio"
                          name="detail-level"
                          className="mt-0.5 w-5 h-5 border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">
                            完全版
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            すべての詳細情報と完全なレポートを含む
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 下部ボタンエリア - 固定 */}
        <div className="p-6 border-t border-gray-200 bg-white flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            {/* 通知設定ボタン */}
            <button
              onClick={() => {
                setIsNotificationSettingsOpen(!isNotificationSettingsOpen);
              }}
              className="flex-1 px-6 py-3.5 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
            >
              通知設定
            </button>

            {/* トラッキングを実行ボタン */}
            <motion.button
              onClick={() => {
                setIsExecuting(true);
                console.log("トラッキングを実行");

                // アニメーション効果
                setTimeout(() => {
                  // 1.5秒後にパネルを閉じる
                  onClose();
                  setIsExecuting(false);
                }, 1500);
              }}
              disabled={isExecuting}
              className={`flex-1 px-6 py-3.5 rounded-xl text-white font-medium transition-all shadow-md hover:shadow-lg cursor-pointer relative overflow-hidden ${isExecuting
                ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                : 'bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-500 hover:to-purple-500'
                }`}
              whileTap={!isExecuting ? { scale: 0.95 } : {}}
              animate={
                isExecuting
                  ? {
                    scale: [1, 1.02, 1],
                  }
                  : {}
              }
              transition={{ duration: 0.3 }}
            >
              {/* 実行中のローディングアニメーション */}
              {isExecuting && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
              )}

              {/* ボタンテキストとアイコン */}
              <span className="relative flex items-center justify-center gap-2">
                {isExecuting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      ⚙️
                    </motion.span>
                    <span>実行中...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>トラッキングを実行</span>
                  </>
                )}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}