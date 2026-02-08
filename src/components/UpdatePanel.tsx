import { X, Bell, Search, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';
import { Notification } from '../types/notification';



interface UpdatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  theme?: 'light' | 'dark';
  notifications: Notification[];
  markAsRead: (id: string) => void;
  onFeedback?: (id: string, feedback: 'useful' | 'not_useful') => void;
}

export function UpdatePanel({ isOpen, onClose, onSelectChat, theme = 'light', notifications, markAsRead, onFeedback }: UpdatePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notifications based on search query
  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
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
        className={`fixed top-0 right-0 h-full w-96 shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
          } ${theme === 'dark' ? 'bg-gray-800/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'}`}
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
        <div className={`px-6 py-4 border-b flex-shrink-0 ${theme === 'dark'
          ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-700'
          : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-gray-200'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>未読通知</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`px-6 py-4 border-b flex-shrink-0 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索"
              className={`w-full py-2.5 pl-10 pr-4 text-sm border rounded-xl focus:outline-none transition-all ${theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30'
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
                }`}
            />
          </div>
        </div>

        {/* Section Header */}
        <div className={`px-6 py-3 border-b flex-shrink-0 flex items-center justify-between ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>最新のアップデート</h3>
          {notifications.length > 0 && (
            <button
              onClick={() => notifications.forEach(n => markAsRead(n.id))}
              className={`text-xs font-medium px-4 py-2 rounded-lg transition-all duration-200 ${theme === 'dark'
                ? 'text-indigo-400 hover:bg-gray-700'
                : 'text-indigo-600 hover:bg-gray-100'
                }`}
            >
              すべて既読にする
            </button>
          )}
        </div>

        {/* Updates List - スクロール可能 */}
        <div className="flex-1 overflow-y-auto update-panel-scroll">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-float ${theme === 'dark'
                ? 'bg-gradient-to-br from-gray-700 to-gray-800'
                : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                }`}>
                <Bell className={`w-7 h-7 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
              </div>
              <p className={`mb-2 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>通知はありません</p>
              <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                新しい情報が見つかるとここに表示されます
              </p>
            </div>
          ) : (
            <div className={theme === 'dark' ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-6 py-4 transition-colors relative group ${theme === 'dark'
                    ? 'hover:bg-gray-700/50'
                    : 'hover:bg-indigo-50/30'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notification.type === 'error' ? 'bg-red-500' :
                      notification.type === 'warning' ? 'bg-yellow-500' :
                        notification.type === 'success' ? 'bg-green-500' :
                          'bg-blue-500'
                      }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-semibold line-clamp-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>

                      {notification.details ? (
                        <div className="mt-2 space-y-3">
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {notification.details.summary}
                          </p>

                          {/* Specific Changes */}
                          {notification.details.changes.length > 0 && (
                            <ul className="list-disc list-inside space-y-1">
                              {notification.details.changes.map((change, idx) => (
                                <li key={idx} className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {change}
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Sources */}
                          {notification.details.sources.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                              <span className="text-xs font-semibold text-gray-500">Sources:</span>
                              {notification.details.sources.map((source) => (
                                <a
                                  key={source.id}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${theme === 'dark'
                                    ? 'bg-gray-800 border-gray-600 text-blue-400 hover:bg-gray-700'
                                    : 'bg-white border-gray-300 text-blue-600 hover:bg-gray-50'
                                    }`}
                                  title={source.title}
                                >
                                  [{source.id}]
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className={`text-xs mt-1 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className={`text-xs flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                          <CheckCircle size={12} />
                          既読にする
                        </button>
                        {/* Feedback Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onFeedback?.(notification.id, 'useful');
                            }}
                            className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${notification.feedback === 'useful' ? 'text-green-500' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
                              }`}
                            title="役に立った"
                          >
                            <ThumbsUp size={14} className={notification.feedback === 'useful' ? 'fill-current' : ''} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onFeedback?.(notification.id, 'not_useful');
                            }}
                            className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${notification.feedback === 'not_useful' ? 'text-red-500' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
                              }`}
                            title="役に立たない"
                          >
                            <ThumbsDown size={14} className={notification.feedback === 'not_useful' ? 'fill-current' : ''} />
                          </button>
                        </div>
                        {notification.plan_id && (
                          <button
                            onClick={() => {
                              // Assuming plan_id maps to chat_id for now, or we need a way to navigate
                              if (notification.plan_id) onSelectChat(notification.plan_id);
                              onClose();
                            }}
                            className={`text-xs flex items-center gap-1 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
                          >
                            <Search size={12} />
                            詳細を見る
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Spacer */}
          <div className="h-20"></div>
        </div>
      </div>
    </>
  );
}