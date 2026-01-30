import { Bell } from 'lucide-react';

interface HeaderProps {
  onLogoClick: () => void;
  unreadCount?: number;
  onNotificationClick?: () => void;
  onProClick?: () => void;
  theme?: 'light' | 'dark';
}

export function Header({ onLogoClick, unreadCount = 8, onNotificationClick, onProClick, theme = 'light' }: HeaderProps) {
  return (
    <header className={`backdrop-blur-md border-b flex-shrink-0 z-10 shadow-sm transition-colors ${
      theme === 'dark' 
        ? 'bg-[#1a1f2e]/80 border-gray-800' 
        : 'bg-white/80 border-gray-200/50'
    }`}>
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Burilar
          </h1>
        </button>

        {/* Right: Notification, PRO badge, User icon */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            onClick={onNotificationClick}
            className={`relative p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            aria-label="通知"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* PRO Badge */}
          <div
            className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full cursor-default select-none"
            onClick={onProClick}
          >
            PRO
          </div>

          {/* User Icon */}
          <button
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm hover:opacity-80 transition-opacity"
            aria-label="ユーザーメニュー"
          >
            K
          </button>
        </div>
      </div>
    </header>
  );
}