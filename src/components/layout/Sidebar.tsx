import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Menu, Search, Code2, SquarePen, Podcast, History, Pin, Settings, MessageSquare, Radar, Clock, Pencil, Archive, Trash2, Share2 } from 'lucide-react';
import { useTracking } from '../../hooks/useTracking';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';

import type { Chat } from '../../types/chat';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTracking: (id: string) => void;
  onNewSearch: () => void;
  onViewTracking: () => void;
  onViewNotificationSettings: () => void;
  onViewSettings: () => void;
  shouldScrollToHistory?: boolean;
  onScrollToHistoryComplete?: () => void;
  chats?: Chat[];
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => Promise<boolean>;
  onRenameChat?: (id: string, title: string) => Promise<boolean>;
}

export default function Sidebar({
  isOpen,
  onClose,
  onSelectTracking,
  onNewSearch,
  onViewTracking,
  onViewNotificationSettings,
  onViewSettings,
  shouldScrollToHistory,
  onScrollToHistoryComplete,
  chats = [],
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}: SidebarProps) {
  const historyRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const { trackings, fetchTrackings, updateTracking, deleteTracking, loading } = useTracking();
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string; type: 'tracking' | 'chat' } | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; type: 'tracking' | 'chat'; currentTitle: string } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, itemId: string, type: 'tracking' | 'chat') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, itemId, type });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleRename = useCallback((id: string, type: 'tracking' | 'chat', currentTitle: string) => {
    setRenaming({ id, type, currentTitle });
    setContextMenu(null);
  }, []);

  const handleRenameSubmit = useCallback(async (newTitle: string) => {
    if (!renaming) return;
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === renaming.currentTitle) {
      setRenaming(null);
      return;
    }
    if (renaming.type === 'tracking') {
      await updateTracking(renaming.id, { title: trimmed });
      toast.success('名前を変更しました');
    } else {
      const success = await onRenameChat?.(renaming.id, trimmed);
      if (success) toast.success('名前を変更しました');
    }
    setRenaming(null);
  }, [renaming, updateTracking, onRenameChat]);

  const handleDelete = useCallback(async (id: string, type: 'tracking' | 'chat') => {
    setContextMenu(null);
    const confirmed = window.confirm('本当に削除しますか？');
    if (!confirmed) return;
    if (type === 'tracking') {
      await deleteTracking(id);
    } else {
      await onDeleteChat?.(id);
    }
  }, [deleteTracking, onDeleteChat]);

  const handleArchive = useCallback(async (id: string) => {
    setContextMenu(null);
    await updateTracking(id, { isActive: false });
    toast.success('アーカイブしました');
  }, [updateTracking]);

  const handleShare = useCallback((id: string, type: 'tracking' | 'chat') => {
    setContextMenu(null);
    const url = `${window.location.origin}/${type === 'tracking' ? 'tracking' : 'chat'}/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('リンクをコピーしました');
  }, []);

  // Focus rename input when it appears
  useEffect(() => {
    if (renaming) {
      setTimeout(() => renameInputRef.current?.focus(), 0);
    }
  }, [renaming]);

  // Close context menu on click outside or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => closeContextMenu();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu();
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu, closeContextMenu]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrackings();
    }
  }, [isAuthenticated, fetchTrackings]);

  useEffect(() => {
    if (shouldScrollToHistory) {
      historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onScrollToHistoryComplete?.();
    }
  }, [shouldScrollToHistory, onScrollToHistoryComplete]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Split into active trackings and history (inactive/completed), filtered by search
  const activeTrackings = useMemo(() =>
    [...trackings]
      .filter(t => t.isActive)
      .filter(t => !normalizedQuery || t.title.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [trackings, normalizedQuery]
  );

  const historyTrackings = useMemo(() =>
    [...trackings]
      .filter(t => !t.isActive)
      .filter(t => !normalizedQuery || t.title.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [trackings, normalizedQuery]
  );

  // Filter and sort chats
  const filteredChats = useMemo(() =>
    [...chats]
      .filter(chat => {
        if (!normalizedQuery) return true;
        const titleMatch = chat.title.toLowerCase().includes(normalizedQuery);
        const messageMatch = chat.messages.some(m =>
          m.content.toLowerCase().includes(normalizedQuery)
        );
        return titleMatch || messageMatch;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [chats, normalizedQuery]
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 72) return `${hours}時間前`;
    return `${days}日前`;
  };

  const getLastMessage = (chat: Chat): string | null => {
    if (chat.messages.length === 0) return null;
    const last = chat.messages[chat.messages.length - 1];
    return last.content;
  };

  const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

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
        className={`fixed lg:fixed inset-y-0 left-0 z-50 w-80 border-r flex flex-col transition-all duration-300 shadow-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 space-y-2 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="lg:block p-2 rounded-xl w-full flex items-center justify-start transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/30 text-gray-700 dark:text-gray-300"
            aria-label="閉じる"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={onViewNotificationSettings}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors w-full text-left text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/30 text-gray-700 dark:text-gray-300"
          >
            <Code2 className="w-4 h-4 text-amber-600" />
            通知設定
          </button>

          <button
            onClick={onNewSearch}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors w-full text-left text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/30 text-gray-700 dark:text-gray-300"
          >
            <SquarePen className="w-4 h-4 text-amber-600" />
            新規作成
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 focus:border-amber-300 focus:bg-white dark:focus:bg-gray-800 transition-colors"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto sidebar-scroll">
          {/* Active trackings */}
          <div className="px-3 py-3">
            <div className="px-2 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Podcast className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">追跡中</h4>
              </div>
              <button
                onClick={onViewTracking}
                className="text-xs hover:bg-amber-50 dark:hover:bg-amber-900/30 px-2 py-1 rounded-lg transition-all font-medium cursor-pointer text-amber-600 hover:text-amber-700"
              >
                すべて表示
              </button>
            </div>

            {loading && trackings.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-3 py-3 mb-2">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-3/4 mb-1.5" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : activeTrackings.length > 0 ? (
              activeTrackings.map((tracking) => (
                <div
                  key={tracking.id}
                  className="group relative px-3 py-3 mb-2 rounded-xl cursor-pointer transition-all select-none hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                  onClick={() => onSelectTracking(tracking.id)}
                  onContextMenu={(e) => handleContextMenu(e, tracking.id, 'tracking')}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 relative mt-1">
                      {tracking.isPinned ? (
                        <Pin className="w-4 h-4" style={{ color: tracking.isActive ? '#10b981' : '#ef4444' }} />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${tracking.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {renaming?.id === tracking.id ? (
                        <input
                          ref={renameInputRef}
                          defaultValue={renaming.currentTitle}
                          className="text-sm w-full px-1 py-0.5 rounded border border-amber-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(e.currentTarget.value);
                            if (e.key === 'Escape') setRenaming(null);
                          }}
                          onBlur={(e) => handleRenameSubmit(e.currentTarget.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <div className="text-sm mb-0.5 truncate font-medium text-gray-900 dark:text-gray-100">{tracking.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tracking.updatedAt)}</div>
                        </>
                      )}
                    </div>
                    {tracking.unreadCount > 0 && (
                      <div className="flex-shrink-0 mt-1">
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs rounded-full font-semibold shadow-sm">
                          {tracking.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-8 flex flex-col items-center justify-center text-sm text-gray-400 dark:text-gray-500 gap-1.5">
                <Radar className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                追跡中のプロンプトはありません
              </div>
            )}
          </div>

          {/* Conversations (Chats) section */}
          <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="px-2 py-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">会話</h4>
              </div>
            </div>

            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => {
                const lastMessage = getLastMessage(chat);
                return (
                  <div
                    key={chat.id}
                    className="group relative px-3 py-3 mb-2 rounded-xl cursor-pointer transition-all select-none hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                    onClick={() => onSelectChat?.(chat.id)}
                    onContextMenu={(e) => handleContextMenu(e, chat.id, 'chat')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 relative mt-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {renaming?.id === chat.id ? (
                          <input
                            ref={renameInputRef}
                            defaultValue={renaming.currentTitle}
                            className="text-sm w-full px-1 py-0.5 rounded border border-amber-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit(e.currentTarget.value);
                              if (e.key === 'Escape') setRenaming(null);
                            }}
                            onBlur={(e) => handleRenameSubmit(e.currentTarget.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <div className="text-sm mb-0.5 truncate font-medium text-gray-900 dark:text-gray-100">{chat.title}</div>
                            {lastMessage && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 truncate mb-0.5">
                                {truncate(lastMessage, 40)}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(chat.updatedAt)}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                会話はありません
              </div>
            )}
          </div>

          {/* History section */}
          <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800" ref={historyRef}>
            <div className="px-2 py-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">履歴</h4>
              </div>
            </div>

            {loading && trackings.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-3 py-3 mb-2">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-2/3 mb-1.5" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </div>
              ))
            ) : historyTrackings.length > 0 ? (
              historyTrackings.map((tracking) => (
                <div
                  key={tracking.id}
                  className="group relative px-3 py-3 mb-2 rounded-xl cursor-pointer transition-all select-none hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                  onClick={() => onSelectTracking(tracking.id)}
                  onContextMenu={(e) => handleContextMenu(e, tracking.id, 'tracking')}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 relative mt-1">
                      <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {renaming?.id === tracking.id ? (
                        <input
                          ref={renameInputRef}
                          defaultValue={renaming.currentTitle}
                          className="text-sm w-full px-1 py-0.5 rounded border border-amber-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(e.currentTarget.value);
                            if (e.key === 'Escape') setRenaming(null);
                          }}
                          onBlur={(e) => handleRenameSubmit(e.currentTarget.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <div className="text-sm mb-0.5 truncate font-medium text-gray-900 dark:text-gray-100">{tracking.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tracking.updatedAt)}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-8 flex flex-col items-center justify-center text-sm text-gray-400 dark:text-gray-500 gap-1.5">
                <Clock className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                履歴はありません
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <button
            onClick={onViewSettings}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full text-left group hover:bg-amber-50 dark:hover:bg-amber-900/30"
          >
            <Settings className="w-4 h-4 transition-colors text-gray-600 dark:text-gray-400 group-hover:text-amber-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">設定とヘルプ</span>
          </button>
        </div>
      </aside>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[100] min-w-[160px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const item = contextMenu.type === 'tracking'
                ? trackings.find(t => t.id === contextMenu.itemId)
                : chats.find(c => c.id === contextMenu.itemId);
              if (item) handleRename(contextMenu.itemId, contextMenu.type, item.title);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            名前を変更
          </button>
          {contextMenu.type === 'tracking' && (
            <button
              onClick={() => handleArchive(contextMenu.itemId)}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Archive className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              アーカイブ
            </button>
          )}
          <button
            onClick={() => handleDelete(contextMenu.itemId, contextMenu.type)}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            削除
          </button>
          <button
            onClick={() => handleShare(contextMenu.itemId, contextMenu.type)}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            共有
          </button>
        </div>
      )}
    </>
  );
}
