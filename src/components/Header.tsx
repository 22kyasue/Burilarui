import { Bell, LogIn } from 'lucide-react';
import { UserDropdown } from './UserDropdown';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan?: 'free' | 'pro' | 'enterprise';
}

interface HeaderProps {
  onLogoClick: () => void;
  unreadCount?: number;
  onNotificationClick?: () => void;
  onProClick?: () => void;
  theme?: 'light' | 'dark';
  user?: User | null;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onLogout?: () => void;
  onProfileSettings?: () => void;
  onPlanManagement?: () => void;
}

export function Header({
  onLogoClick,
  unreadCount = 8,
  onNotificationClick,
  onProClick,
  theme = 'light',
  user,
  isAuthenticated = false,
  onLoginClick,
  onLogout,
  onProfileSettings,
  onPlanManagement,
}: HeaderProps) {
  return (
    <header className={`backdrop-blur-xl border-b flex-shrink-0 z-10 transition-all duration-300 ${
      theme === 'dark'
        ? 'bg-[#1a1f2e]/90 border-gray-800/50 shadow-lg shadow-black/10'
        : 'bg-white/90 border-gray-200/30 shadow-sm'
    }`}>
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2.5 hover:opacity-80 transition-all duration-200 active:scale-[0.97]"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
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
            className={`relative p-2 rounded-xl transition-all duration-200 active:scale-95 ${
              theme === 'dark'
                ? 'hover:bg-gray-800/80 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            aria-label="通知"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg shadow-red-500/30 animate-badge-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* PRO Badge - only show if user has pro plan */}
          {isAuthenticated && user?.plan === 'pro' && (
            <div
              className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full cursor-default select-none"
              onClick={onProClick}
            >
              PRO
            </div>
          )}

          {/* User Section */}
          {isAuthenticated && user ? (
            <UserDropdown
              user={user}
              onLogout={onLogout || (() => {})}
              onProfileSettings={onProfileSettings}
              onPlanManagement={onPlanManagement}
              theme={theme}
            />
          ) : (
            <button
              onClick={onLoginClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span className="text-sm font-medium">ログイン</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}