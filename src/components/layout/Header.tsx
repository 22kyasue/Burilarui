import { useState, useRef, useEffect } from 'react';
import { Bell, User, Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

interface HeaderProps {
  onLogoClick: () => void;
  onNotificationClick: () => void;
  onViewSettings?: () => void;
  onViewPlan?: () => void;
}

export default function Header({ onLogoClick, onNotificationClick, onViewSettings, onViewPlan }: HeaderProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || 'U';

  // Close dropdown on outside click
  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [avatarMenuOpen]);

  return (
    <header className="backdrop-blur-md border-b flex-shrink-0 z-10 shadow-sm bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-700/50">
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
            className="relative p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            aria-label="通知"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold animate-badge-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Plan Badge */}
          {user?.plan === 'pro' ? (
            <button
              onClick={onViewPlan}
              className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full cursor-pointer select-none"
            >
              PRO
            </button>
          ) : (
            <button
              onClick={onViewPlan}
              className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full cursor-pointer select-none opacity-80 hover:opacity-100 transition-opacity"
            >
              Upgrade
            </button>
          )}

          {/* User Icon + Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm hover:opacity-80 transition-opacity"
              aria-label="ユーザーメニュー"
            >
              {userInitial.toUpperCase()}
            </button>

            {avatarMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                <button
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    toast('近日公開');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  プロフィール
                </button>
                <button
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    onViewSettings?.();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  設定
                </button>
                <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                <button
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
