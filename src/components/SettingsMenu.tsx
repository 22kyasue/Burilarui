import { 
  X, 
  RotateCcw, 
  UserCog, 
  Puzzle, 
  Repeat, 
  Link2, 
  Sun, 
  Info, 
  Sparkles, 
  BookOpen, 
  MessageSquare, 
  HelpCircle, 
  ChevronRight,
  MapPin 
} from 'lucide-react';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPlan: () => void;
}

export function SettingsMenu({ isOpen, onClose, onViewPlan }: SettingsMenuProps) {
  if (!isOpen) return null;

  const menuItems = [
    { icon: RotateCcw, label: 'アクティビティ', onClick: () => {} },
    { icon: UserCog, label: 'パーソナライズ設定', onClick: () => {} },
    { icon: Puzzle, label: 'アプリ連携', hasIndicator: true, onClick: () => {} },
    { icon: Repeat, label: '予約アクション', onClick: () => {} },
    { icon: Link2, label: '公開リンク', onClick: () => {} },
    { icon: Sun, label: 'テーマ', hasArrow: true, onClick: () => {} },
    { icon: Info, label: '定期購入を管理', onClick: onViewPlan },
    { icon: Sparkles, label: 'Google AI Ultra にアップグレード', onClick: () => {} },
    { icon: BookOpen, label: 'NotebookLM', onClick: () => {} },
    { icon: MessageSquare, label: 'フィードバックを送信', onClick: () => {} },
    { icon: HelpCircle, label: 'ヘルプ', hasArrow: true, onClick: () => {} },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed top-16 right-6 w-[420px] bg-[#1f1f1f] rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white">設定</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-700/30 transition-colors text-left border-b border-gray-700/30 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="text-white text-sm">{item.label}</span>
                  {item.hasIndicator && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                {item.hasArrow && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
            );
          })}

          {/* Location Info */}
          <div className="px-6 py-4 border-t border-gray-700/50">
            <div className="flex items-start gap-3 text-gray-400">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p>日本、東京都新宿区</p>
                <p className="text-gray-500">IPアドレスを使用・位置情報を更新</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
