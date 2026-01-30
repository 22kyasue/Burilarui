import { Menu, Search, Code2, Settings, Pin, Bell, Home, SquarePen, Activity, History, Podcast } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  pinned?: boolean;
  isTracking?: boolean;
  trackingActive?: boolean;
  updateCount?: number;
}

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  trackingPromptId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onNewChat: () => void;
  onTogglePin: (chatId: string) => void;
  onViewTracking: () => void;
  onViewNotificationSettings?: () => void;
  onViewHome?: () => void;
  onViewSettings?: () => void;
  shouldScrollToHistory?: boolean;
  onScrollToHistoryComplete?: () => void;
  theme?: 'light' | 'dark';
}

export function Sidebar({
  chats,
  currentChatId,
  trackingPromptId,
  isOpen,
  onClose,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  onTogglePin,
  onViewTracking,
  onViewNotificationSettings,
  onViewHome,
  onViewSettings,
  shouldScrollToHistory,
  onScrollToHistoryComplete,
  theme = 'light',
}: SidebarProps) {
  // 履歴セクションへの参照
  const historyRef = useRef<HTMLDivElement>(null);
  
  // 追跡中のチャットのみを対象
  const trackingChats = chats.filter((chat) => chat.isTracking);
  
  // 通常のチャット（追跡していないもの）
  const historyChats = chats.filter((chat) => !chat.isTracking);

  // 履歴セクションにスクロールする関数
  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 72) return `${hours}時間前`;
    return `${days}日前`;
  };

  // プロンプト単位表示用（新着順にソート）
  const sortedTrackingChats = [...trackingChats].sort((a, b) => {
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
  
  // 履歴チャット（新着順にソート）
  const sortedHistoryChats = [...historyChats].sort((a, b) => {
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  useEffect(() => {
    if (shouldScrollToHistory) {
      scrollToHistory();
      if (onScrollToHistoryComplete) {
        onScrollToHistoryComplete();
      }
    }
  }, [shouldScrollToHistory, onScrollToHistoryComplete]);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:fixed inset-y-0 left-0 z-50 w-80 border-r flex flex-col transition-all duration-300 shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          theme === 'dark' 
            ? 'bg-[#1a1f2e] border-gray-800' 
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`p-4 space-y-2 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
          <button
            onClick={onClose}
            className={`lg:block p-2 rounded-xl w-full flex items-center justify-start transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-indigo-900/30 text-gray-300' 
                : 'hover:bg-indigo-50 text-gray-700'
            }`}
            aria-label="閉じる"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <button
            onClick={onViewNotificationSettings}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors w-full text-left text-sm font-medium ${
              theme === 'dark' 
                ? 'hover:bg-indigo-900/30 text-gray-300' 
                : 'hover:bg-indigo-50 text-gray-700'
            }`}
          >
            <Code2 className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
            通知設定
          </button>
          
          <button
            onClick={onNewChat}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors w-full text-left text-sm font-medium ${
              theme === 'dark' 
                ? 'hover:bg-indigo-900/30 text-gray-300' 
                : 'hover:bg-indigo-50 text-gray-700'
            }`}
          >
            <SquarePen className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
            新規作成
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className={`px-4 pt-3 pb-3 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
          {/* 検索欄 */}
          <div>
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="検索"
                className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-indigo-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-indigo-300 focus:bg-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* プロンプト単位表示 */}
          <div className="px-3 py-3">
            <div className="px-2 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Podcast className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h4 className={`text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>追跡中</h4>
              </div>
              <button
                onClick={onViewTracking}
                className={`text-xs hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                  theme === 'dark' 
                    ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30' 
                    : 'text-indigo-600 hover:text-indigo-700'
                }`}
              >
                すべて表示
              </button>
            </div>
            
            {sortedTrackingChats.length > 0 ? (
              sortedTrackingChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative px-3 py-3 mb-2 rounded-xl cursor-pointer transition-all select-none ${
                    trackingPromptId === chat.id
                      ? theme === 'dark'
                        ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700'
                        : 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200'
                      : theme === 'dark'
                        ? 'hover:bg-gray-800 border border-transparent'
                        : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                  <div className="flex items-start gap-3">
                    {/* アイコン部分 */}
                    <div className="flex-shrink-0 relative mt-1">
                      {chat.pinned ? (
                        <Pin 
                          className="w-4 h-4" 
                          style={{ color: chat.trackingActive ? '#10b981' : '#ef4444' }}
                        />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${chat.trackingActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      )}
                    </div>
                    
                    {/* テキスト部分 */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm mb-0.5 truncate font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{chat.title}</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(chat.updatedAt)}</div>
                    </div>
                    
                    {/* 未読数バッジ */}
                    {chat.updateCount !== undefined && chat.updateCount > 0 && (
                      <div className="flex-shrink-0 mt-1">
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs rounded-full font-semibold shadow-sm">
                          {chat.updateCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={`px-3 py-8 text-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                追跡中のプロンプトはありません
              </div>
            )}
          </div>
          
          {/* 履歴セクション */}
          <div className={`px-3 py-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`} ref={historyRef}>
            <div className="px-2 py-2">
              <div className="flex items-center gap-2">
                <History className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <h4 className={`text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>履歴</h4>
              </div>
            </div>
            
            {sortedHistoryChats.length > 0 ? (
              sortedHistoryChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative px-3 py-3 mb-2 rounded-xl cursor-pointer transition-all select-none ${
                    currentChatId === chat.id
                      ? theme === 'dark'
                        ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700'
                        : 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200'
                      : theme === 'dark'
                        ? 'hover:bg-gray-800 border border-transparent'
                        : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                  <div className="flex items-start gap-3">
                    {/* アイコン部分 */}
                    <div className="flex-shrink-0 relative mt-1">
                      {chat.pinned ? (
                        <Pin className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
                      )}
                    </div>
                    
                    {/* テキスト部分 */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm mb-0.5 truncate font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{chat.title}</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(chat.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`px-3 py-8 text-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                履歴はありません
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-3 border-t space-y-1 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
          <button 
            onClick={onViewSettings}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full text-left group ${
              theme === 'dark' 
                ? 'hover:bg-indigo-900/30' 
                : 'hover:bg-indigo-50'
            }`}
          >
            <Settings className={`w-4 h-4 transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 group-hover:text-indigo-400' 
                : 'text-gray-600 group-hover:text-indigo-600'
            }`} />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>設定とヘルプ</span>
          </button>
        </div>
      </aside>
    </>
  );
}