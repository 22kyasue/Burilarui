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
    <div className="max-w-3xl mx-auto mt-6 mb-6">
      {/* トラッキングカード */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold">このテーマは継続的に追跡できます</h3>
              <p className="text-xs text-gray-600 mt-0.5">自動で最新情報をチェックし、重要な変化があればお知らせします</p>
            </div>
          </div>
        </div>

        {/* Suggested Settings */}
        <div className="space-y-4 mb-5">
          {/* Theme / Prompt */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            {isDefaultMode ? (
              <>
                {/* 追跡プロンプト */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-600 font-medium">
                      追跡プロンプト
                    </label>
                    <button
                      onClick={handleEditPrompt}
                      className="text-indigo-600 hover:text-indigo-700 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>編集</span>
                    </button>
                  </div>
                  <input
                    ref={promptInputRef}
                    type="text"
                    value={suggestion.theme}
                    onChange={(e) => setSuggestion({ ...suggestion, theme: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-lg px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="追跡したい内容を入力してください"
                  />
                </div>

                {/* 推奨プロンプト */}
                <div>
                  <label className="text-xs text-indigo-600 mb-2 block font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    推奨プロンプト
                  </label>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 rounded-lg px-3 py-2.5 text-sm border border-indigo-200 italic">
                    {recommendedPrompt}
                  </div>
                </div>
              </>
            ) : (
              <>
                <label className="text-xs text-gray-600 mb-2 block font-medium">
                  追跡テー
                </label>
                {isFieldEditable ? (
                  <input
                    type="text"
                    value={suggestion.theme}
                    onChange={(e) => setSuggestion({ ...suggestion, theme: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-lg px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    ref={promptInputRef}
                    onClick={handleEditPrompt}
                  />
                ) : (
                  <p className="text-gray-900 text-sm font-medium">{suggestion.theme}</p>
                )}
              </>
            )}
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Frequency */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className="text-xs text-gray-600 mb-2 block font-medium">頻度</label>
              {isFieldEditable ? (
                <select
                  value={suggestion.frequency}
                  onChange={(e) => setSuggestion({ ...suggestion, frequency: e.target.value })}
                  className="w-full bg-white text-gray-900 rounded-lg px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option>毎日 9:00</option>
                  <option>毎日 18:00</option>
                  <option>週1回（月曜）</option>
                  <option>週2回（月・木）</option>
                  <option>リアルタイム</option>
                </select>
              ) : (
                <p className="text-gray-900 text-sm font-medium">{suggestion.frequency}</p>
              )}
            </div>

            {/* Notification Condition */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className="text-xs text-gray-600 mb-2 block font-medium">通知条件</label>
              {isFieldEditable ? (
                <select
                  value={suggestion.notificationCondition}
                  onChange={(e) => setSuggestion({ ...suggestion, notificationCondition: e.target.value })}
                  className="w-full bg-white text-gray-900 rounded-lg px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option>新しい情報が見つかったとき</option>
                  <option>重要な変化があったとき</option>
                  <option>毎回通知</option>
                  <option>通知しない</option>
                </select>
              ) : (
                <p className="text-gray-900 text-sm font-medium">{suggestion.notificationCondition}</p>
              )}
            </div>

            {/* Output Format */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className="text-xs text-gray-600 mb-2 block font-medium">アウトプット</label>
              {isFieldEditable ? (
                <select
                  value={suggestion.outputFormat}
                  onChange={(e) => setSuggestion({ ...suggestion, outputFormat: e.target.value })}
                  className="w-full bg-white text-gray-900 rounded-lg px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option>要約レポート（3-5項目）</option>
                  <option>詳細レポート（10項目以上）</option>
                  <option>変化点のみ</option>
                  <option>生データ</option>
                </select>
              ) : (
                <p className="text-gray-900 text-sm font-medium">{suggestion.outputFormat}</p>
              )}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleAccept}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl px-4 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Check className="w-5 h-5" />
            {isDefaultMode ? "トラッキング実行" : "トラッキングする"}
          </button>
        </div>

        {!isDefaultMode && isEditing && (
          <button
            onClick={() => setIsEditing(false)}
            className="mt-3 w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            編集を完了
          </button>
        )}
      </div>
    </div>
  );
}