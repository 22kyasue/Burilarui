import { X, Clock, TrendingUp, Bell, Activity, Pause, Search } from 'lucide-react';
import { useState } from 'react';

interface Chat {
  id: string;
  title: string;
  updatedAt: Date;
  isTracking?: boolean;
  trackingActive?: boolean;
  updateCount?: number;
}

interface Update {
  id: string;
  chatId: string;
  chatTitle: string;
  content: string;
  timestamp: Date;
  isActive: boolean;
}

interface UpdatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  theme?: 'light' | 'dark';
}

export function UpdatePanel({ isOpen, onClose, chats, onSelectChat, theme = 'light' }: UpdatePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 追跡中のチャットからアップデートを生成
  const trackingChats = chats.filter(chat => chat.isTracking);
  
  // モックアップデート
  const updates: Update[] = trackingChats.flatMap(chat => {
    const count = chat.updateCount || 0;
    return Array.from({ length: Math.min(count, 3) }, (_, i) => ({
      id: `${chat.id}-update-${i}`,
      chatId: chat.id,
      chatTitle: chat.title,
      content: `新しい情報が追加されました: ${chat.title}に関する最新のアップデートです。`,
      timestamp: new Date(chat.updatedAt.getTime() - i * 3600000),
      isActive: chat.trackingActive || false,
    }));
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const filteredPrompts = trackingChats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}時間前`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}日前`;
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">アップデート情報</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className={`px-6 py-4 border-b flex-shrink-0 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-700' 
            : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>追跡中のプロンプト</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {trackingChats.length}
              </p>
            </div>
            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>総アップデート数</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {updates.length}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`px-6 py-4 border-b flex-shrink-0 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索"
              className={`w-full py-2.5 pl-10 pr-4 text-sm border rounded-xl focus:outline-none transition-all ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
              }`}
            />
          </div>
        </div>

        {/* Section Header */}
        <div className={`px-6 py-3 border-b flex-shrink-0 flex items-center justify-between ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>追跡中</h3>
          <button 
            type="button"
            style={{ cursor: 'pointer' }}
            className={`text-xs font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
              theme === 'dark' 
                ? 'text-indigo-400 hover:bg-gray-700' 
                : 'text-indigo-600 hover:bg-gray-100'
            }`}
          >
            すべて表示
          </button>
        </div>

        {/* Updates List - スクロール可能 */}
        <div className="flex-1 overflow-y-auto">
          {filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-gray-700 to-gray-800' 
                  : 'bg-gradient-to-br from-indigo-100 to-purple-100'
              }`}>
                <Bell className={`w-8 h-8 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-400'}`} />
              </div>
              <p className={`mb-2 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>追跡中のプロンプトはありません</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                プロンプトを追跡すると、ここに最新情報が表示されます
              </p>
            </div>
          ) : (
            <>
              <div className={theme === 'dark' ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
                {filteredPrompts.map((chat) => {
                  // このプロンプトのアップデートを取得
                  const promptUpdates = updates.filter(u => u.chatId === chat.id);
                  
                  return (
                    <div key={chat.id} className={`last:border-b-0 ${
                      theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-100'
                    }`}>
                      {/* プロンプトヘッダー */}
                      <div
                        onClick={() => {
                          onSelectChat(chat.id);
                          onClose();
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        className={`px-6 py-3 transition-colors cursor-pointer select-none ${
                          theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-indigo-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            chat.trackingActive 
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-400/50' 
                              : 'bg-gradient-to-r from-red-400 to-rose-500'
                          }`} />
                          <span className={`text-sm font-semibold line-clamp-1 ${
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                          }`} style={{ caretColor: 'transparent' }}>
                            {chat.title}
                          </span>
                        </div>
                      </div>

                      {/* このプロンプトのアップデートリスト */}
                      {promptUpdates.length > 0 && (
                        <div className={theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50/50'}>
                          {promptUpdates.map((update, index) => (
                            <div
                              key={update.id}
                              onClick={() => {
                                onSelectChat(chat.id);
                                onClose();
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                              className={`px-6 py-3 transition-colors cursor-pointer border-t first:border-t-0 select-none ${
                                theme === 'dark'
                                  ? 'hover:bg-gray-700/50 border-gray-700'
                                  : 'hover:bg-indigo-50/50 border-gray-100'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <span className={`text-xs font-medium ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`} style={{ caretColor: 'transparent' }}>
                                  アップデート {index + 1}: 新しい情報が追加されました
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span style={{ caretColor: 'transparent' }}>{formatTimeAgo(update.timestamp)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* 最後の項目が上部まで表示されるようにスペーサーを追加 */}
              <div className="h-[1200px]"></div>
            </>
          )}
        </div>
      </div>
    </>
  );
}