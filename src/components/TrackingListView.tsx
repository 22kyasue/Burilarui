import { ArrowLeft, Pin, Circle, Code2, Search, Grid3x3, List, ChevronDown, Plus, Calendar, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Chat {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
  }>;
  updatedAt: Date;
  pinned?: boolean;
  isTracking?: boolean;
  trackingActive?: boolean;
  updateCount?: number;
}

interface TrackingListViewProps {
  onBack: () => void;
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  onViewNotificationSettings?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onNewChat?: () => void;
}

// サムネイル画像マッピング
const thumbnailImages: Record<string, string> = {
  'React開発のベストプラクティス': 'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGUlMjBzY3JlZW58ZW58MXx8fHwxNzY2OTY4MzU3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'AIモデルの最新トレンド': 'https://images.unsplash.com/photo-1562976540-1502c2145186?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wdXRlciUyMGNpcmN1aXQlMjBib2FyZHxlbnwxfHx8fDE3NjcwMTcyNzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'ユニリーバのマーケティング戦略調査': 'https://images.unsplash.com/photo-1709715357520-5e1047a2b691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjB0ZWFtfGVufDF8fHx8MTc2Njk5MTc4Mnww&ixlib=rb-4.1.0&q=80&w=1080',
  'カリスマ宣言師': 'https://images.unsplash.com/photo-1639493115941-a70fcef4f715?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyYWRpZW50JTIwY29sb3JmdWx8ZW58MXx8fHwxNzY3MDMyNzI0fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'Badminton Doubles: Teamwork and Effective Strategies': 'https://images.unsplash.com/photo-1613918431551-b2ef2720387c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWRtaW50b24lMjBjb3VydCUyMHNwb3J0fGVufDF8fHx8MTc2NzAzNjg5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
  '広告代理店向け自己PR戦略概要案': 'https://images.unsplash.com/photo-1623679072629-3aaa0192a391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjB3b3Jrc3BhY2UlMjBkZXNrfGVufDF8fHx8MTc2Njk1NTE3OHww&ixlib=rb-4.1.0&q=80&w=1080',
};

export function TrackingListView({ 
  onBack, 
  chats, 
  onSelectChat,
  onViewNotificationSettings,
  isSidebarOpen,
  onToggleSidebar,
  onNewChat
}: TrackingListViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'tracking' | 'all'>('tracking');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const trackingChats = chats.filter((chat) => chat.isTracking);
  const displayChats = activeTab === 'tracking' ? trackingChats : chats;

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  // 新着順にソート + 検索フィルター
  const sortedChats = [...displayChats]
    .filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]">
      {/* Sub Header - Tabs */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('tracking')}
              className={`pb-2 px-1 transition-colors relative ${
                activeTab === 'tracking'
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              追跡中のプロンプト
              {activeTab === 'tracking' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2 px-1 transition-colors relative ${
                activeTab === 'all'
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              全てのプロンプト
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-200'
                }`}
              >
                <Grid3x3 className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              新しい順
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Search with Animation */}
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
                        className="w-full pl-4 pr-10 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Search Button */}
              {!isSearchOpen && (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* New Button */}
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
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
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900 text-2xl font-semibold">追跡中のプロンプト</h2>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedChats.length > 0 ? (
                sortedChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className="relative bg-white rounded-2xl cursor-pointer hover:shadow-xl transition-all border border-gray-100 hover:border-indigo-200 group"
                  >
                    {/* Status Indicator - Top Left (outside card) */}
                    {chat.trackingActive !== undefined && (
                      <div className="absolute -top-2 -left-2 z-10">
                        <div 
                          className="w-4 h-4 rounded-full shadow-lg border-2 border-white"
                          style={{ backgroundColor: chat.trackingActive ? '#10b981' : '#ef4444' }}
                        />
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden rounded-t-2xl">
                      <img
                        src={thumbnailImages[chat.title] || 'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=400'}
                        alt={chat.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Badge - Top Left */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-indigo-600 shadow-sm">
                          <Circle className="w-2 h-2" fill="#6366f1" stroke="none" />
                          ビジネス
                        </span>
                      </div>

                      {/* Sources Badge - Top Right */}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-gray-900/70 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                          {Math.floor(Math.random() * 7) + 1}ソース
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-gray-900 font-medium mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {chat.title}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(chat.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-gray-400">
                  追跡中のプロンプトはありません
                </div>
              )}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {sortedChats.length > 0 ? (
                sortedChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 cursor-pointer hover:bg-white/90 transition-all border border-gray-100 hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                          {chat.pinned ? (
                            <Pin 
                              className="w-4 h-4" 
                              style={{ color: chat.trackingActive ? '#10b981' : '#ef4444' }}
                              fill={chat.trackingActive ? '#10b981' : '#ef4444'}
                            />
                          ) : (
                            <Circle 
                              className="w-2.5 h-2.5 mt-1"
                              fill={chat.trackingActive ? '#10b981' : '#ef4444'}
                              stroke="none"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 text-sm font-medium mb-1 truncate">
                            {chat.title}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(chat.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      {chat.updateCount !== undefined && chat.updateCount > 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs rounded-full font-semibold shadow-sm">
                            {chat.updateCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">
                  追跡中のプロンプトはありません
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}