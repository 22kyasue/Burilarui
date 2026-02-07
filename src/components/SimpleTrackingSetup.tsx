import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface SimpleTrackingSetupProps {
  recommendedPrompt: string;
  onExecuteTracking: () => void;
  onOpenDetailSettings: () => void;
}

export function SimpleTrackingSetup({
  recommendedPrompt,
  onExecuteTracking,
  onOpenDetailSettings,
}: SimpleTrackingSetupProps) {
  const [trackingPrompt, setTrackingPrompt] = useState(recommendedPrompt);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [frequency, setFrequency] = useState("毎日 9:00");
  const [notificationCondition, setNotificationCondition] = useState("新しい情報が見つかった時");
  const [outputFormat, setOutputFormat] = useState("要約レポート（3-5項目）");

  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [showOutputDropdown, setShowOutputDropdown] = useState(false);

  const frequencyOptions = ["毎日 9:00", "毎日 18:00", "12時間ごと", "6時間ごと", "週1回"];
  const conditionOptions = ["新しい情報が見つかった時", "検索実行ごと", "重要な変化があった時"];
  const outputOptions = ["要約レポート（3-5項目）", "詳細レポート（10項目以上）", "箇条書きのみ"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden"
    >
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-2xl">✨</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">このテーマは継続的に追跡できます</h2>
            <p className="text-sm text-gray-600">自動で最新情報をチェックし、重要な変化があればお知らせします</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* AIが推奨する構成 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h3 className="text-lg font-bold text-gray-900">AIが推奨する構成（参考）</h3>
            </div>
            {!isEditingPrompt && (
              <button
                onClick={() => setIsEditingPrompt(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-all"
              >
                編集する
              </button>
            )}
          </div>

          {/* 推奨プロンプト表示 */}
          <div>
            {isEditingPrompt ? (
              <textarea
                value={trackingPrompt}
                onChange={(e) => setTrackingPrompt(e.target.value)}
                onBlur={() => setIsEditingPrompt(false)}
                autoFocus
                className="w-full px-5 py-4 rounded-2xl border-2 border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none text-sm shadow-md"
                rows={4}
              />
            ) : (
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl px-6 py-5 border-2 border-indigo-200 mb-4 shadow-md">
                <p className="text-sm text-gray-800 leading-relaxed italic">{trackingPrompt}</p>
              </div>
            )}
          </div>

          {/* 提案項目 */}
          <div className="space-y-3">
            {/* 期間の明確化 */}
            <div className="border-l-4 border-indigo-500 pl-4 py-2">
              <h4 className="text-sm font-bold text-gray-900 mb-1">期間の明確化</h4>
              <p className="text-sm text-gray-600">追跡期間を具体的に指定することで、関連性の高い情報に絞り込めます</p>
            </div>

            {/* 具体的な観点の列挙 */}
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="text-sm font-bold text-gray-900 mb-1">具体的な観点の列挙</h4>
              <p className="text-sm text-gray-600">複数の観点を明示することで、包括的な追跡が可能になります</p>
            </div>

            {/* アクション条件の設定 */}
            <div className="border-l-4 border-pink-500 pl-4 py-2">
              <h4 className="text-sm font-bold text-gray-900 mb-1">アクション条件の設定</h4>
              <p className="text-sm text-gray-600">どんな時に通知が欲しいかを明記することで、ノイズを削減できます</p>
            </div>
          </div>
        </div>

        {/* 設定オプション */}
        <div className="grid grid-cols-3 gap-4">
          {/* 頻度 */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">頻度</label>
            <div className="relative">
              <button
                onClick={() => {
                  setShowFrequencyDropdown(!showFrequencyDropdown);
                  setShowConditionDropdown(false);
                  setShowOutputDropdown(false);
                }}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 hover:border-indigo-300 transition-all flex items-center justify-between text-left"
              >
                <span className="text-sm text-gray-800">{frequency}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {showFrequencyDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFrequencyDropdown(false)} />
                  <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 max-h-60 overflow-y-auto">
                    {frequencyOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setFrequency(option);
                          setShowFrequencyDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-indigo-50 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 通知条件 */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">通知条件</label>
            <div className="relative">
              <button
                onClick={() => {
                  setShowConditionDropdown(!showConditionDropdown);
                  setShowFrequencyDropdown(false);
                  setShowOutputDropdown(false);
                }}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 hover:border-indigo-300 transition-all flex items-center justify-between text-left"
              >
                <span className="text-sm text-gray-800 truncate">{notificationCondition}</span>
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </button>
              {showConditionDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowConditionDropdown(false)} />
                  <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 max-h-60 overflow-y-auto">
                    {conditionOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setNotificationCondition(option);
                          setShowConditionDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-indigo-50 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* アウトプット */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">アウトプット</label>
            <div className="relative">
              <button
                onClick={() => {
                  setShowOutputDropdown(!showOutputDropdown);
                  setShowFrequencyDropdown(false);
                  setShowConditionDropdown(false);
                }}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 hover:border-indigo-300 transition-all flex items-center justify-between text-left"
              >
                <span className="text-sm text-gray-800 truncate">{outputFormat}</span>
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </button>
              {showOutputDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowOutputDropdown(false)} />
                  <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 max-h-60 overflow-y-auto">
                    {outputOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setOutputFormat(option);
                          setShowOutputDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-indigo-50 transition-colors whitespace-nowrap"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={onOpenDetailSettings}
            className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
          >
            <span>⚙️</span>
            <span>詳細編集</span>
          </button>
          <button
            onClick={onExecuteTracking}
            className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>✓</span>
            <span>追跡実行</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}