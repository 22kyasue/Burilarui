import { Menu, Code2, Settings, SquarePen, Podcast, History } from 'lucide-react';

interface CollapsedSidebarProps {
  onToggleSidebar: () => void;
  onNewSearch: () => void;
  onViewTracking: () => void;
  onViewNotificationSettings: () => void;
  onViewSettings: () => void;
  onScrollToHistory: () => void;
}

export default function CollapsedSidebar({
  onToggleSidebar,
  onNewSearch,
  onViewTracking,
  onViewNotificationSettings,
  onViewSettings,
  onScrollToHistory,
}: CollapsedSidebarProps) {
  return (
    <div className="fixed left-0 top-0 h-screen w-16 border-r flex flex-col items-center py-4 gap-2 z-30 shadow-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-gray-200/50 dark:border-gray-700/50">
      {/* Hamburger menu - opens sidebar */}
      <button
        onClick={onToggleSidebar}
        className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative hover:bg-amber-50 dark:hover:bg-amber-900/30"
        aria-label="サイドバーを開く"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-amber-600 transition-colors" />
        <span className="absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg bg-gray-800 text-white">
          サイドバーを開く
        </span>
      </button>

      {/* Notification settings */}
      <button
        onClick={onViewNotificationSettings}
        className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative hover:bg-amber-50 dark:hover:bg-amber-900/30"
        aria-label="通知設定"
      >
        <Code2 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-amber-600 transition-colors" />
        <span className="absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg bg-gray-800 text-white">
          通知設定
        </span>
      </button>

      {/* New search */}
      <button
        onClick={onNewSearch}
        className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative hover:bg-amber-50 dark:hover:bg-amber-900/30"
        aria-label="新しい検索"
      >
        <SquarePen className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-amber-600 transition-colors" />
        <span className="absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg bg-gray-800 text-white">
          新しい検索
        </span>
      </button>

      {/* Divider */}
      <div className="w-8 h-px my-2 bg-gray-200 dark:bg-gray-700" />

      {/* Tracking list */}
      <button
        onClick={onViewTracking}
        className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative hover:bg-amber-50 dark:hover:bg-amber-900/30"
        aria-label="追跡中のプロンプト"
      >
        <Podcast className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-amber-600 transition-colors" />
        <span className="absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg bg-gray-800 text-white">
          追跡中のプロンプト
        </span>
      </button>

      {/* History */}
      <button
        onClick={() => {
          onToggleSidebar();
          setTimeout(() => onScrollToHistory(), 300);
        }}
        className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative hover:bg-amber-50 dark:hover:bg-amber-900/30"
        aria-label="履歴"
      >
        <History className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-amber-600 transition-colors" />
        <span className="absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg bg-gray-800 text-white">
          履歴
        </span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings (bottom) */}
      <button
        onClick={onViewSettings}
        className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors group relative mb-2 hover:bg-amber-50 dark:hover:bg-amber-900/30"
        aria-label="設定"
      >
        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-amber-600 transition-colors" />
        <span className="absolute left-16 px-3 py-2 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg bg-gray-800 text-white">
          設定
        </span>
      </button>
    </div>
  );
}
