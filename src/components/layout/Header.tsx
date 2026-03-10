import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationPanel from '../notifications/NotificationPanel';
import { Bell, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick?: () => void;
  menuButton?: ReactNode;
}

export default function Header({ menuButton }: HeaderProps) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead, submitFeedback } = useNotifications();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          {menuButton}
          <button
            onClick={() => navigate('/')}
            className="text-lg font-semibold tracking-tight"
          >
            Burilar
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <NotificationPanel
                notifications={notifications}
                onMarkRead={markAsRead}
                onMarkAllRead={markAllRead}
                onFeedback={submitFeedback}
              />
            </PopoverContent>
          </Popover>

          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">{user.name || user.email}</span>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
