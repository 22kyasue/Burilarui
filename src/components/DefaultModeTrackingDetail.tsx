import { Sparkles, ChevronDown } from "lucide-react";
import { useState } from "react";

interface DefaultModeTrackingDetailProps {
  query: string;
  frequency: string;
  onExecute: () => void;
}

export function DefaultModeTrackingDetail({
  query,
  frequency,
  onExecute,
}: DefaultModeTrackingDetailProps) {
  const [trackingQuery, setTrackingQuery] = useState(query);
  const [selectedFrequency, setSelectedFrequency] = useState(frequency);
  const [selectedCondition, setSelectedCondition] = useState("新しい情報が見つかった");
  const [selectedOutput, setSelectedOutput] = useState("要約レポート（3-5項目）");

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-gray-900 font-semibold text-lg mb-1">
              このテーマは継続的に追跡できます
            </h2>
            <p className="text-gray-600 text-sm">
              自動で最新情報をチェックし、重要な変化があればお知らせします
            </p>
          </div>
        </div>
      </div>

      {/* メイン設定カード */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 space-y-6">
        {/* AIが推奨する構成（参考） */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-amber-500">✨</span>
            <h3 className="text-gray-900 font-medium">AIが推奨する構成（参考）</h3>
          </div>
          
          {/* 推奨プロンプト */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
            <p className="text-gray-700 text-sm leading-relaxed">
              「Apple Intelligenceの2024〜2025年における、主要な機能アップデート、日本語対応の進捗状況、対応デバイスの拡大、プライバシー技術の革新、および市場での評価について、信頼性の高いソースから継続的に追跡し、重要な変化があれば通知してください。」
            </p>
          </div>

          {/* 期間の明確化 */}
          <div className="border-l-4 border-indigo-400 pl-4 mb-3">
            <h4 className="text-gray-900 text-sm font-medium mb-1">期間の明確化</h4>
            <p className="text-gray-600 text-sm">
              追跡期間を具体的に指定することで、関連性の高い情報に絞り込めます
            </p>
          </div>

          {/* 具体的な観点の列挙 */}
          <div className="border-l-4 border-purple-400 pl-4 mb-3">
            <h4 className="text-gray-900 text-sm font-medium mb-1">具体的な観点の列挙</h4>
            <p className="text-gray-600 text-sm">
              追跡したい項目を明示することで、より的確な情報収集が可能になります
            </p>
          </div>

          {/* 信頼性の担保 */}
          <div className="border-l-4 border-pink-400 pl-4">
            <h4 className="text-gray-900 text-sm font-medium mb-1">信頼性の担保</h4>
            <p className="text-gray-600 text-sm">
              「信頼性の高いソース」と指定することで、情報の質を確保できます
            </p>
          </div>

          {/* ヒント */}
          <div className="mt-4 bg-amber-50/50 rounded-lg p-3 border border-amber-100">
            <p className="text-amber-800 text-xs">
              💡 ヒント: より具体的に書くほど、精度の高い追跡が可能になります
            </p>
          </div>
        </div>

        {/* 設定オプション - 3列グリッド */}
        <div className="grid grid-cols-3 gap-4">
          {/* 頻度 */}
          <div>
            <label className="text-gray-700 text-sm font-medium block mb-2">
              頻度
            </label>
            <div className="relative">
              <select
                value={selectedFrequency}
                onChange={(e) => setSelectedFrequency(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm appearance-none cursor-pointer hover:border-indigo-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="毎日 9:00">毎日 9:00</option>
                <option value="毎時">毎時</option>
                <option value="6時間ごと">6時間ごと</option>
                <option value="12時間ごと">12時間ごと</option>
                <option value="3日ごと">3日ごと</option>
                <option value="1週間ごと">1週間ごと</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* 通知条件 */}
          <div>
            <label className="text-gray-700 text-sm font-medium block mb-2">
              通知条件
            </label>
            <div className="relative">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm appearance-none cursor-pointer hover:border-indigo-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="新しい情報が見つかった">新しい情報が見つかった</option>
                <option value="常に通知">常に通知</option>
                <option value="重要な変化のみ">重要な変化のみ</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* アウトプット */}
          <div>
            <label className="text-gray-700 text-sm font-medium block mb-2">
              アウトプット
            </label>
            <div className="relative">
              <select
                value={selectedOutput}
                onChange={(e) => setSelectedOutput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm appearance-none cursor-pointer hover:border-indigo-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="要約レポート（3-5項目）">要約レポート（3-5項目）</option>
                <option value="詳細レポート">詳細レポート</option>
                <option value="簡易サマリー">簡易サマリー</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* トラッキング実行ボタン */}
        <button
          onClick={onExecute}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <span className="text-lg">✓</span>
          トラッキング実行
        </button>
      </div>
    </div>
  );
}