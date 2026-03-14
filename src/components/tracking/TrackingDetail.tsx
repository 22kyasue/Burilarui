import { useState, useRef, useEffect } from 'react';
import { X, Pencil, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrackingWithUpdates, UpdateTrackingRequest } from '../../types/tracking';
import UpdateItem from './UpdateItem';
import { Skeleton } from '../ui/skeleton';

interface TrackingDetailProps {
  tracking: TrackingWithUpdates | null;
  loading: boolean;
  error: string | null;
  onUpdate: (data: UpdateTrackingRequest) => Promise<unknown>;
  onDelete: () => Promise<void>;
  onExecute: () => Promise<unknown>;
  onMarkAllRead: () => Promise<void>;
  onClose: () => void;
}

export default function TrackingDetail({
  tracking,
  loading,
  error,
  onUpdate,
  onDelete,
  onExecute,
  onMarkAllRead,
  onClose,
}: TrackingDetailProps) {
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sourceUrls, setSourceUrls] = useState<string[]>(tracking?.sources ?? []);
  const [urlInput, setUrlInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedQuery, setEditedQuery] = useState('');
  const [originalQuery, setOriginalQuery] = useState('');
  const [detailLevel, setDetailLevel] = useState<'summary' | 'normal' | 'detailed'>('normal');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const settingsTitleRef = useRef<HTMLHeadingElement>(null);

  // Auto-scroll to notification settings when opened
  useEffect(() => {
    if (isNotificationSettingsOpen && settingsTitleRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const title = settingsTitleRef.current;
        if (container && title) {
          const containerRect = container.getBoundingClientRect();
          const titleRect = title.getBoundingClientRect();
          const scrollOffset = titleRect.top - containerRect.top + container.scrollTop - 24;
          container.scrollTo({ top: scrollOffset, behavior: 'smooth' });
        }
      }, 150);
    }
  }, [isNotificationSettingsOpen]);

  // Sync sourceUrls when tracking changes
  useEffect(() => {
    if (tracking) {
      setSourceUrls(tracking.sources ?? []);
    }
  }, [tracking?.id]);

  // Initialize prompt editing state when tracking changes
  useEffect(() => {
    if (tracking) {
      setEditedQuery(tracking.query);
      if (!originalQuery) {
        setOriginalQuery(tracking.query);
      }
      setIsEditingPrompt(false);
    }
  }, [tracking?.id]);

  const handleStartEditPrompt = () => {
    if (tracking) {
      setEditedQuery(tracking.query);
      setIsEditingPrompt(true);
    }
  };

  const handleSavePrompt = async () => {
    if (editedQuery.trim() && editedQuery !== tracking?.query) {
      await onUpdate({ query: editedQuery.trim() });
    }
    setIsEditingPrompt(false);
  };

  const handleCancelEditPrompt = () => {
    setIsEditingPrompt(false);
    if (tracking) {
      setEditedQuery(tracking.query);
    }
  };

  const handleResetPrompt = () => {
    setEditedQuery(originalQuery);
  };

  const handleAddUrl = () => {
    const newUrl = urlInput.trim();
    if (newUrl && !sourceUrls.includes(newUrl)) {
      const updated = [...sourceUrls, newUrl];
      setSourceUrls(updated);
      setUrlInput('');
      onUpdate({ sources: updated });
    }
  };

  const handleRemoveUrl = (url: string) => {
    const updated = sourceUrls.filter(u => u !== url);
    setSourceUrls(updated);
    onUpdate({ sources: updated });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      handleAddUrl();
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await onExecute();
      setTimeout(() => {
        setIsExecuting(false);
      }, 1500);
    } catch {
      setIsExecuting(false);
    }
  };

  // Loading state
  if (loading && !tracking) {
    return (
      <div className="w-[65%] h-full p-4 flex flex-col">
        <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-300 dark:border-gray-700 shadow-lg flex flex-col">
          {/* Skeleton header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-6 w-6 rounded-lg" />
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
          </div>
          {/* Skeleton content blocks */}
          <div className="flex-1 p-6 space-y-6">
            <div className="bg-gray-50/80 dark:bg-gray-800/80 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <Skeleton className="h-5 w-1/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <Skeleton className="h-5 w-1/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <Skeleton className="h-5 w-2/5 mb-4" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-[65%] h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={onClose} className="text-indigo-600 hover:text-indigo-700 font-medium">
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="w-[65%] h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">トラッキングが見つかりません</p>
          <button onClick={onClose} className="text-indigo-600 hover:text-indigo-700 font-medium">
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-[65%] h-full p-4 flex flex-col"
    >
      {/* Container with border */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-300 dark:border-gray-700 shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-gray-900 dark:text-gray-100 text-xl font-semibold">{tracking.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Status toggle */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => onUpdate({ isActive: !tracking.isActive })}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all shadow-sm ${
                tracking.isActive
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400'
                  : 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${tracking.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${tracking.isActive ? 'text-green-700' : 'text-red-700'}`}>
                {tracking.isActive ? 'アクティブ' : '中断中'}
              </span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200">
              <span className="text-xs font-medium text-purple-700">{tracking.frequency}</span>
            </div>

            {tracking.unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                すべて既読にする
              </button>
            )}
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-32 bg-gradient-to-br from-indigo-50/20 via-purple-50/20 to-pink-50/20 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" ref={scrollContainerRef}>
          <div className="space-y-6">
            {/* AI Recommended Config */}
            <div className="bg-gray-50/80 dark:bg-gray-800/80 rounded-2xl p-6 border-2 border-indigo-400 shadow-lg ring-2 ring-indigo-200/50 dark:ring-indigo-800/50">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">✨</span>
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold">プロンプト内容</h3>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-indigo-100 dark:border-indigo-800">
                {isEditingPrompt ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedQuery}
                      onChange={(e) => setEditedQuery(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 leading-relaxed focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all resize-none"
                      rows={4}
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleResetPrompt}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                      >
                        デフォルトに戻す
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCancelEditPrompt}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
                          title="キャンセル"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleSavePrompt}
                          className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-400 to-purple-400 text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-sm"
                          title="保存"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 group">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic flex-1">
                      {tracking.query}
                    </p>
                    <button
                      onClick={handleStartEditPrompt}
                      className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all opacity-0 group-hover:opacity-100"
                      title="プロンプトを編集"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {tracking.description && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-1 bg-indigo-400 rounded-full" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">説明</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{tracking.description}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Updates Timeline */}
            {tracking.updates.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold mb-4 flex items-center gap-2">
                  <span className="text-indigo-600">📍</span>
                  アップデート ({tracking.updates.length}件)
                </h3>
                <div className="space-y-4">
                  {tracking.updates.map(update => (
                    <UpdateItem key={update.id} update={update} />
                  ))}
                </div>
              </div>
            )}

            {tracking.updates.length === 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">まだアップデートはありません。「トラッキングを実行」でチェックしましょう。</p>
              </div>
            )}

            {/* Source URLs */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold mb-2 flex items-center gap-2">
                <span className="text-purple-600">🔗</span>
                参照する情報ソース（任意）
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                指定しない場合は、信頼性の高い複数ソースから自動で調査します
              </p>

              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="例: https://www.example.com"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                  />
                  <button
                    onClick={handleAddUrl}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white text-sm font-medium hover:from-indigo-500 hover:to-purple-500 transition-all shadow-sm hover:shadow-md"
                  >
                    追加
                  </button>
                </div>
              </div>

              {sourceUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    登録済みソース ({sourceUrls.length})
                  </div>
                  {sourceUrls.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl border border-indigo-100 dark:border-indigo-800 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/30 dark:to-purple-900/30 group hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-indigo-600">🌐</span>
                        <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{url}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveUrl(url)}
                        className="ml-2 w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-70 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {sourceUrls.length === 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-dashed border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ソースを指定しない場合、AIが自動的に最適なソースを選択します
                  </p>
                </div>
              )}
            </div>

            {/* Expandable Notification Settings */}
            <AnimatePresence>
              {isNotificationSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                >
                  <h3 className="text-gray-900 dark:text-gray-100 font-semibold mb-5" ref={settingsTitleRef}>通知の詳細設定</h3>

                  {/* Frequency */}
                  <div className="mb-6">
                    <label className="text-sm text-gray-700 dark:text-gray-300 block mb-3 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">🔄</span>
                      追跡検索の頻度
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {['1h', '6h', '12h'].map(freq => (
                        <button key={freq} className="px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all">
                          {freq}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['1d', '3d', '1w'].map(freq => (
                        <button key={freq} className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                          freq === '1d'
                            ? 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                        }`}>
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detail Level */}
                  <div className="mb-6">
                    <label className="text-sm text-gray-700 dark:text-gray-300 block mb-3 font-medium flex items-center gap-2">
                      <span className="text-indigo-600">📊</span>
                      通知の詳細度
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'summary' as const, label: '概要のみ' },
                        { value: 'normal' as const, label: '通常' },
                        { value: 'detailed' as const, label: '詳細' },
                      ]).map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => {
                            setDetailLevel(value);
                            onUpdate({ detailLevel: value });
                          }}
                          className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            detailLevel === value
                              ? 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notification Methods */}
                  <div className="mb-6">
                    <label className="text-sm text-gray-700 dark:text-gray-300 block mb-3 font-medium flex items-center gap-2">
                      <span className="text-purple-600">🔔</span>
                      通知形式
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/30 dark:to-purple-900/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 flex items-center justify-center">
                            <span className="text-lg">✉️</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">メール通知</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">登録メールアドレスに通知を送信</div>
                          </div>
                        </div>
                        <button className="w-12 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative transition-all">
                          <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-purple-100 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/30 dark:to-pink-900/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 flex items-center justify-center">
                            <span className="text-lg">📱</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">プッシュ通知</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">モバイルデバイスに通知を送信</div>
                          </div>
                        </div>
                        <button className="w-12 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative transition-all">
                          <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-pink-100 dark:border-pink-800 bg-gradient-to-r from-pink-50/50 to-indigo-50/50 dark:from-pink-900/30 dark:to-indigo-900/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-700 flex items-center justify-center">
                            <span className="text-lg">💬</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">アプリ内通知</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Burilarアプリ内で通知を表示</div>
                          </div>
                        </div>
                        <button className="w-12 h-6 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full relative transition-all">
                          <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom buttons - fixed */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            {/* Notification settings button */}
            <button
              onClick={() => setIsNotificationSettingsOpen(!isNotificationSettingsOpen)}
              className="flex-1 px-6 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 transition-all cursor-pointer"
            >
              通知設定
            </button>

            {/* Execute tracking button */}
            <motion.button
              onClick={handleExecute}
              disabled={isExecuting}
              className={`flex-1 px-6 py-3.5 rounded-xl text-white font-medium transition-all shadow-md hover:shadow-lg cursor-pointer relative overflow-hidden ${
                isExecuting
                  ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                  : 'bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-500 hover:to-purple-500'
              }`}
              whileTap={!isExecuting ? { scale: 0.95 } : {}}
            >
              {isExecuting && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
              )}
              <span className="relative flex items-center justify-center gap-2">
                {isExecuting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block"
                    >
                      ⚙️
                    </motion.span>
                    <span>実行中...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>トラッキングを実行</span>
                  </>
                )}
              </span>
            </motion.button>
          </div>

          {/* Delete button */}
          <button
            onClick={onDelete}
            className="w-full mt-3 px-6 py-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 font-medium transition-all text-sm"
          >
            このトラッキングを削除
          </button>
        </div>
      </div>
    </motion.div>
  );
}
