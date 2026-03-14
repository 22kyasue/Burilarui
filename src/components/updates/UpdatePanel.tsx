import { X, Bell, Search } from 'lucide-react';
import { useState } from 'react';
import type { TrackingListItem } from '../../types/tracking';
import type { Notification } from '../../types/notifications';
import { Skeleton } from '../ui/skeleton';

interface UpdatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  trackings: TrackingListItem[];
  notifications: Notification[];
  loading?: boolean;
  onSelectTracking: (id: string) => void;
}

export default function UpdatePanel({ isOpen, onClose, trackings, notifications, loading, onSelectTracking }: UpdatePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const activeTrackings = trackings.filter(t => t.isActive);

  const filteredTrackings = activeTrackings.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`;
    return `${Math.floor(diffInMinutes / 1440)}日前`;
  };

  // Group notifications by tracking
  const getTrackingNotifications = (trackingId: string) => {
    return notifications
      .filter(n => n.trackingId === trackingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  };

  const totalUpdates = notifications.filter(n => n.type === 'update').length;

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
        className={`fixed top-0 right-0 h-full w-96 shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col bg-white dark:bg-gray-900 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
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
        <div className="px-6 py-4 border-b bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs mb-1 text-gray-600 dark:text-gray-400">追跡中のプロンプト</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {activeTrackings.length}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1 text-gray-600 dark:text-gray-400">総アップデート数</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {totalUpdates}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索"
              className="w-full py-2.5 pl-10 pr-4 text-sm border rounded-xl focus:outline-none transition-all bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* Section Header */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">追跡中</h3>
          <button className="text-xs font-medium px-4 py-2 rounded-lg transition-all text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
            すべて表示
          </button>
        </div>

        {/* Updates List */}
        <div className="flex-1 overflow-y-auto update-panel-scroll">
          {loading && trackings.length === 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                  <div className="bg-gray-50/50 dark:bg-gray-800/50 px-6 py-3">
                    <Skeleton className="h-3 w-4/5 mb-2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTrackings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-indigo-100 to-purple-100">
                <Bell className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="mb-2 font-medium text-gray-600 dark:text-gray-400">追跡中のプロンプトはありません</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                プロンプトを追跡すると、ここに最新情報が表示されます
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredTrackings.map((tracking) => {
                const trackingNotifs = getTrackingNotifications(tracking.id);
                return (
                  <div key={tracking.id}>
                    {/* Tracking header */}
                    <div
                      onClick={() => onSelectTracking(tracking.id)}
                      className="px-6 py-3 transition-colors cursor-pointer select-none hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          tracking.isActive
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-400/50'
                            : 'bg-gradient-to-r from-red-400 to-rose-500'
                        }`} />
                        <span className="text-sm font-semibold line-clamp-1 text-gray-900 dark:text-gray-100">
                          {tracking.title}
                        </span>
                      </div>
                    </div>

                    {/* Notifications for this tracking */}
                    {trackingNotifs.length > 0 && (
                      <div className="bg-gray-50/50 dark:bg-gray-800/50">
                        {trackingNotifs.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => onSelectTracking(tracking.id)}
                            className="px-6 py-3 transition-colors cursor-pointer border-t first:border-t-0 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 border-gray-100 dark:border-gray-800 select-none"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {notif.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatTimeAgo(notif.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
