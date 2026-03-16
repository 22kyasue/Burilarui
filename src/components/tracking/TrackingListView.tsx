import { useState } from 'react';
import { Grid3x3, List, Search, Plus, Calendar, X, ChevronDown, Circle, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrackingListItem } from '../../types/tracking';
import { Skeleton } from '../ui/skeleton';

interface TrackingListViewProps {
  trackings: TrackingListItem[];
  loading?: boolean;
  onSelectTracking: (id: string) => void;
  onNewSearch: () => void;
  onRefresh: () => void;
}

export default function TrackingListView({
  trackings,
  loading,
  onSelectTracking,
  onNewSearch,
  onRefresh: _onRefresh,
}: TrackingListViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'tracking' | 'all'>('tracking');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeTrackings = trackings.filter(t => t.isActive);
  const displayTrackings = activeTab === 'tracking' ? activeTrackings : trackings;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const sortedTrackings = [...displayTrackings]
    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Sub Header - Tabs */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('tracking')}
              className={`pb-2 px-1 transition-colors relative text-sm font-medium ${
                activeTab === 'tracking' ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              追跡中のプロンプト
              {activeTab === 'tracking' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2 px-1 transition-colors relative text-sm font-medium ${
                activeTab === 'all' ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              全てのプロンプト
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Grid3x3 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <List className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Sort */}
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              新しい順
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Animated Search */}
            <div className="relative flex items-center">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '280px', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="検索..."
                        autoFocus
                        className="w-full pl-4 pr-10 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white dark:focus:bg-gray-600 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!isSearchOpen && (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>

            {/* New Button */}
            <button
              onClick={onNewSearch}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg text-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              新規作成
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 pr-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900 dark:text-gray-100 text-2xl font-semibold">
              {activeTab === 'tracking' ? '追跡中のプロンプト' : '全てのプロンプト'}
            </h2>
          </div>

          {loading && trackings.length === 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <Skeleton className="h-40 w-full rounded-none" />
                    <div className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-4 w-2/3 mb-2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTrackings.length > 0 ? (
                sortedTrackings.map((tracking, index) => (
                  <div
                    key={tracking.id}
                    onClick={() => onSelectTracking(tracking.id)}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl cursor-pointer hover:shadow-xl transition-all border border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-700 group animate-stagger-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Status dot */}
                    <div className="absolute -top-2 -left-2 z-10">
                      <div
                        className="w-4 h-4 rounded-full shadow-lg border-2 border-white"
                        style={{ backgroundColor: tracking.isActive ? '#10b981' : '#ef4444' }}
                      />
                    </div>

                    {/* Image placeholder */}
                    <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden rounded-t-2xl">
                      {tracking.imageUrl ? (
                        <img
                          src={tracking.imageUrl}
                          alt={tracking.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl opacity-30">📊</span>
                        </div>
                      )}

                      {/* Category badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-amber-600 shadow-sm">
                          <Circle className="w-2 h-2" fill="#f59e0b" stroke="none" />
                          追跡中
                        </span>
                      </div>

                      {/* Update count badge */}
                      {tracking.updateCount > 0 && (
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1 bg-gray-900/70 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                            {tracking.updateCount}件更新
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {tracking.title}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(tracking.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                  <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="mb-4 text-sm">追跡中のプロンプトはありません</p>
                  <button
                    onClick={onNewSearch}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    新規作成
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTrackings.length > 0 ? (
                sortedTrackings.map((tracking, index) => (
                  <div
                    key={tracking.id}
                    onClick={() => onSelectTracking(tracking.id)}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 cursor-pointer hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all border border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-md animate-stagger-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                          {tracking.isPinned ? (
                            <Pin
                              className="w-4 h-4"
                              style={{ color: tracking.isActive ? '#10b981' : '#ef4444' }}
                              fill={tracking.isActive ? '#10b981' : '#ef4444'}
                            />
                          ) : (
                            <Circle
                              className="w-2.5 h-2.5 mt-1"
                              fill={tracking.isActive ? '#10b981' : '#ef4444'}
                              stroke="none"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 dark:text-gray-100 text-sm font-medium mb-1 truncate">{tracking.title}</h3>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(tracking.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      {tracking.unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs rounded-full font-semibold shadow-sm">
                            {tracking.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                  <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="mb-4 text-sm">追跡中のプロンプトはありません</p>
                  <button
                    onClick={onNewSearch}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    新規作成
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
