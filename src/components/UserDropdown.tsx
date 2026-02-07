import { User, CreditCard, LogOut, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,

  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan?: 'free' | 'pro' | 'enterprise';
}

interface UserDropdownProps {
  user: UserInfo;
  onLogout: () => void;
  onProfileSettings?: () => void;
  onPlanManagement?: () => void;
  theme?: 'light' | 'dark';
}

export function UserDropdown({
  user,
  onLogout,
  onProfileSettings,
  onPlanManagement,
  theme = 'light',
}: UserDropdownProps) {
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getPlanLabel = (plan?: string) => {
    switch (plan) {
      case 'pro':
        return 'PRO';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Free';
    }
  };

  const getPlanColor = (plan?: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white';
      case 'enterprise':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="ユーザーメニュー"
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
              {getInitial(user.name)}
            </div>
          )}
          <ChevronDown className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={`w-64 ${theme === 'dark'
            ? 'bg-[#2d2d2d] border-[#3d3d3d] text-gray-200'
            : 'bg-white border-gray-200 text-gray-900'
          }`}
      >
        {/* User Info Section */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                {getInitial(user.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                }`}>
                {user.name}
              </p>
              <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                {user.email}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getPlanColor(user.plan)}`}>
              {getPlanLabel(user.plan)}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator className={theme === 'dark' ? 'bg-[#3d3d3d]' : 'bg-gray-200'} />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={onProfileSettings}
            className={`cursor-pointer ${theme === 'dark'
                ? 'hover:bg-[#3d3d3d] focus:bg-[#3d3d3d]'
                : 'hover:bg-gray-100 focus:bg-gray-100'
              }`}
          >
            <User className="w-4 h-4 mr-2" />
            <span>プロフィール設定</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onPlanManagement}
            className={`cursor-pointer ${theme === 'dark'
                ? 'hover:bg-[#3d3d3d] focus:bg-[#3d3d3d]'
                : 'hover:bg-gray-100 focus:bg-gray-100'
              }`}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            <span>プラン管理</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className={theme === 'dark' ? 'bg-[#3d3d3d]' : 'bg-gray-200'} />

        <DropdownMenuItem
          onClick={onLogout}
          className={`cursor-pointer text-red-500 focus:text-red-500 ${theme === 'dark'
              ? 'hover:bg-red-500/10 focus:bg-red-500/10'
              : 'hover:bg-red-50 focus:bg-red-50'
            }`}
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>ログアウト</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
