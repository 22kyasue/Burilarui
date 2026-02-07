import { Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface TrackingSuccessMessageProps {
  theme: string;
  frequency: string;
  onViewDetails: () => void;
}

export function TrackingSuccessMessage({
  theme,
  frequency,
  onViewDetails,
}: TrackingSuccessMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto mt-6 mb-6"
    >
      <button
        onClick={onViewDetails}
        className="w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-indigo-300 p-6 shadow-lg hover:shadow-xl transition-all group cursor-pointer text-left"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-lg">
                トラッキング実行中
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                アップデートがあったら通知します
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-indigo-600 group-hover:gap-2 transition-all">
            <span className="text-sm font-medium">詳細を表示</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Tracking Info */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-indigo-200">
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1.5 font-medium">
              追跡テーマ
            </div>
            <div className="text-sm text-gray-900 font-medium leading-relaxed">
              {theme}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">頻度:</span>
              <span className="text-gray-900 font-medium bg-white px-2 py-1 rounded border border-gray-200">
                {frequency}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">通知:</span>
              <span className="text-gray-900 font-medium bg-white px-2 py-1 rounded border border-gray-200">
                新しい情報が見つかったとき
              </span>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="mt-4 flex items-center gap-2 text-xs text-indigo-700">
          <span className="flex-shrink-0">💡</span>
          <span>
            クリックして詳細設定を確認・編集できます
          </span>
        </div>
      </button>
    </motion.div>
  );
}
