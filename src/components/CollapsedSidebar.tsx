import { Menu, Home, Bell, Settings, Code2, SquarePen, Podcast, History } from 'lucide-react';

interface CollapsedSidebarProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onViewTracking: () => void;
  onViewNotificationSettings: () => void;
  onViewSettings?: () => void;
  onScrollToHistory?: () => void;
  theme?: 'light' | 'dark';
}

export function CollapsedSidebar({ 
  onToggleSidebar, 
  onNewChat, 
  onViewTracking,
  onViewNotificationSettings,
  onViewSettings,
  onScrollToHistory,
  theme = 'light'
}: CollapsedSidebarProps) {
  return (
    <div className={`fixed left-0 top-0 h-screen w-16 border-r flex flex-col items-center py-4 gap-2 z-30 shadow-sm transition-colors ${
      theme === 'dark'
        ? 'bg-gray-800/80 backdrop-blur-md border-gray-700/50'
        : 'bg-white/80 backdrop-blur-md border-gray-200/50'
    }`}>
      {/* ハンバーガーメニュー - サイドバーを開く */}
      <button
        onClick={onToggleSidebar}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative ${
          theme === 'dark' ? 'hover:bg-indigo-500/20' : 'hover:bg-indigo-50'
        }`}
        aria-label="サイドバーを開く"
      >
        <Menu className={`w-5 h-5 transition-colors ${
          theme === 'dark' 
            ? 'text-gray-300 group-hover:text-indigo-400' 
            : 'text-gray-600 group-hover:text-indigo-600'
        }`} />
        <span className={`absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ${
          theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'
        }`}>
          サイドバーを開く
        </span>
      </button>

      {/* 通知設定 */}
      <button
        onClick={onViewNotificationSettings}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative ${
          theme === 'dark' ? 'hover:bg-indigo-500/20' : 'hover:bg-indigo-50'
        }`}
        aria-label="通知設定"
      >
        <Code2 className={`w-5 h-5 transition-colors ${
          theme === 'dark' 
            ? 'text-gray-300 group-hover:text-indigo-400' 
            : 'text-gray-600 group-hover:text-indigo-600'
        }`} />
        <span className={`absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ${
          theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'
        }`}>
          通知設定
        </span>
      </button>

      {/* 新しいチャット */}
      <button
        onClick={onNewChat}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative ${
          theme === 'dark' ? 'hover:bg-indigo-500/20' : 'hover:bg-indigo-50'
        }`}
        aria-label="新しいチャット"
      >
        <SquarePen className={`w-5 h-5 transition-colors ${
          theme === 'dark' 
            ? 'text-gray-300 group-hover:text-indigo-400' 
            : 'text-gray-600 group-hover:text-indigo-600'
        }`} />
        <span className={`absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ${
          theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'
        }`}>
          新しいチャット
        </span>
      </button>

      {/* 区切り線 */}
      <div className={`w-8 h-px my-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />

      {/* 追跡中のプロンプト */}
      <button
        onClick={onViewTracking}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative ${
          theme === 'dark' ? 'hover:bg-indigo-500/20' : 'hover:bg-indigo-50'
        }`}
        aria-label="追跡中のプロンプト"
      >
        <Podcast className={`w-5 h-5 transition-colors ${
          theme === 'dark' 
            ? 'text-gray-300 group-hover:text-indigo-400' 
            : 'text-gray-600 group-hover:text-indigo-600'
        }`} />
        <span className={`absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ${
          theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'
        }`}>
          追跡中のプロンプト
        </span>
      </button>

      {/* 履歴 */}
      <button
        onClick={() => {
          onToggleSidebar();
          // サイドバーを開いたら履歴セクションにスクロール
          setTimeout(() => {
            onScrollToHistory?.();
          }, 300); // サイドバーのアニメーション完了を待つ
        }}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative ${
          theme === 'dark' ? 'hover:bg-indigo-500/20' : 'hover:bg-indigo-50'
        }`}
        aria-label="履歴"
      >
        <History className={`w-5 h-5 transition-colors ${
          theme === 'dark' 
            ? 'text-gray-300 group-hover:text-indigo-400' 
            : 'text-gray-600 group-hover:text-indigo-600'
        }`} />
        <span className={`absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ${
          theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'
        }`}>
          履歴
        </span>
      </button>

      {/* スペーサー - 下部のボタンを押し下げる */}
      <div className="flex-1" />

      {/* 設定（下部） */}
      <button
        onClick={onViewSettings}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative mb-2 ${
          theme === 'dark' ? 'hover:bg-indigo-500/20' : 'hover:bg-indigo-50'
        }`}
        aria-label="設定"
      >
        <Settings className={`w-5 h-5 transition-colors ${
          theme === 'dark' 
            ? 'text-gray-300 group-hover:text-indigo-400' 
            : 'text-gray-600 group-hover:text-indigo-600'
        }`} />
        <span className={`absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ${
          theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'
        }`}>
          設定
        </span>
      </button>
    </div>
  );
}