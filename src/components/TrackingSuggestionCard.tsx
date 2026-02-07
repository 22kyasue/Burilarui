import { useState, useRef } from 'react';
import { Sparkles, Check, Edit2 } from 'lucide-react';

interface TrackingSuggestion {
  theme: string;
  frequency: string;
  notificationCondition: string;
  outputFormat: string;
}

interface TrackingSuggestionCardProps {
  originalQuery: string;
  onAccept: (suggestion: TrackingSuggestion) => void;

  mode?: "default" | "pro";
}

export function TrackingSuggestionCard({ originalQuery, onAccept, mode = "pro" }: TrackingSuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isDefaultMode = mode === "default";

  // デフォルトモード用の推奨プロンプト（固定）
  const recommendedPrompt = "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向を教えてください。";

  const [suggestion, setSuggestion] = useState<TrackingSuggestion>({
    theme: isDefaultMode ? originalQuery : generateTheme(originalQuery),
    frequency: '毎日 9:00',
    notificationCondition: '新しい情報が見つかったとき',
    outputFormat: '要約レポート（3-5項目）',
  });
  const promptInputRef = useRef<HTMLInputElement>(null);

  // AI generates a tracking theme from the query
  function generateTheme(query: string): string {
    // Simple heuristic - in production this would be AI-generated
    if (query.length > 50) {
      return query.substring(0, 47) + '...';
    }
    return query;
  }

  const handleAccept = () => {
    onAccept(suggestion);
  };

  const handleEditPrompt = () => {
    if (promptInputRef.current) {
      promptInputRef.current.focus();
      const length = promptInputRef.current.value.length;
      promptInputRef.current.setSelectionRange(length, length);
    }
  };

  const isFieldEditable = isDefaultMode || isEditing;

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* トラッキングカード */}
      <div className="relative group">
        {/* Glow Effects */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-30 blur group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl text-gray-900 font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                  Discovery & Tracking
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <p className="text-sm text-gray-500 font-medium">Automatic Monitoring Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Settings */}
          <div className="space-y-6 mb-8">
            {/* Theme / Prompt */}
            <div className="group/input relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl transform transition-transform group-hover/input:scale-[1.02]"></div>
              <div className="relative bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-100 transition-colors hover:border-indigo-200 shadow-sm">
                {isDefaultMode ? (
                  <>
                    {/* 追跡プロンプト */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs tracking-wider uppercase text-gray-500 font-bold">
                          Tracking Subject
                        </label>
                        <button
                          onClick={handleEditPrompt}
                          className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors px-2 py-1 rounded-full hover:bg-indigo-50"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <input
                        ref={promptInputRef}
                        type="text"
                        value={suggestion.theme}
                        onChange={(e) => setSuggestion({ ...suggestion, theme: e.target.value })}
                        className="w-full bg-transparent text-lg font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors py-1 px-0 placeholder-gray-400"
                        placeholder="What would you like to track?"
                      />
                    </div>

                    {/* 推奨プロンプト */}
                    <div>
                      <label className="text-xs tracking-wider uppercase text-indigo-500 mb-3 block font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        AI Optmized Query
                      </label>
                      <div className="relative overflow-hidden group/prompt">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover/prompt:opacity-100 transition-opacity"></div>
                        <div className="relative bg-white/40 border border-indigo-100 rounded-xl p-4 text-sm leading-relaxed text-gray-600 shadow-inner">
                          {recommendedPrompt}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="text-xs tracking-wider uppercase text-gray-500 mb-3 block font-bold">
                      Tracking Theme
                    </label>
                    {isFieldEditable ? (
                      <input
                        type="text"
                        value={suggestion.theme}
                        onChange={(e) => setSuggestion({ ...suggestion, theme: e.target.value })}
                        className="w-full bg-white/50 text-gray-900 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                        ref={promptInputRef}
                        onClick={handleEditPrompt}
                      />
                    ) : (
                      <p className="text-gray-900 text-lg font-medium">{suggestion.theme}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Frequency */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-indigo-50 shadow-sm hover:shadow-md transition-shadow group/card">
                <label className="text-xs tracking-wider uppercase text-gray-400 mb-3 block font-bold group-hover/card:text-indigo-500 transition-colors">Frequency</label>
                {isFieldEditable ? (
                  <select
                    value={suggestion.frequency}
                    onChange={(e) => setSuggestion({ ...suggestion, frequency: e.target.value })}
                    className="w-full bg-transparent text-gray-900 font-semibold text-sm border-none p-0 focus:ring-0 cursor-pointer"
                  >
                    <option>毎日 9:00</option>
                    <option>毎日 18:00</option>
                    <option>週1回（月曜）</option>
                    <option>週2回（月・木）</option>
                    <option>リアルタイム</option>
                  </select>
                ) : (
                  <p className="text-gray-900 font-semibold text-sm">{suggestion.frequency}</p>
                )}
              </div>

              {/* Notification Condition */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-indigo-50 shadow-sm hover:shadow-md transition-shadow group/card">
                <label className="text-xs tracking-wider uppercase text-gray-400 mb-3 block font-bold group-hover/card:text-indigo-500 transition-colors">Triggers</label>
                {isFieldEditable ? (
                  <select
                    value={suggestion.notificationCondition}
                    onChange={(e) => setSuggestion({ ...suggestion, notificationCondition: e.target.value })}
                    className="w-full bg-transparent text-gray-900 font-semibold text-sm border-none p-0 focus:ring-0 cursor-pointer"
                  >
                    <option>新しい情報が見つかったとき</option>
                    <option>重要な変化があったとき</option>
                    <option>毎回通知</option>
                    <option>通知しない</option>
                  </select>
                ) : (
                  <p className="text-gray-900 font-semibold text-sm">{suggestion.notificationCondition}</p>
                )}
              </div>

              {/* Output Format */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-indigo-50 shadow-sm hover:shadow-md transition-shadow group/card">
                <label className="text-xs tracking-wider uppercase text-gray-400 mb-3 block font-bold group-hover/card:text-indigo-500 transition-colors">Format</label>
                {isFieldEditable ? (
                  <select
                    value={suggestion.outputFormat}
                    onChange={(e) => setSuggestion({ ...suggestion, outputFormat: e.target.value })}
                    className="w-full bg-transparent text-gray-900 font-semibold text-sm border-none p-0 focus:ring-0 cursor-pointer"
                  >
                    <option>要約レポート（3-5項目）</option>
                    <option>詳細レポート（10項目以上）</option>
                    <option>変化点のみ</option>
                    <option>生データ</option>
                  </select>
                ) : (
                  <p className="text-gray-900 font-semibold text-sm">{suggestion.outputFormat}</p>
                )}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="group relative w-full overflow-hidden rounded-xl bg-gray-900 px-8 py-4 text-white shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative flex items-center justify-center gap-2 font-bold">
                <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
                <span>{isDefaultMode ? "Start Intelligent Tracking" : "Confirm Settings"}</span>
              </div>
            </button>
          </div>

          {!isDefaultMode && isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
              Finish Editing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}