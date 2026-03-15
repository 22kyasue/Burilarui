import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Mic, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../hooks/useTracking';
import { useChat } from '../hooks/useChat';
import { useNotifications } from '../hooks/useNotifications';
import LoginModal from '../components/auth/LoginModal';
import AppLayout, { type AppView } from '../components/layout/AppLayout';
import TrackingListView from '../components/tracking/TrackingListView';
import NotificationSettings from '../components/notifications/NotificationSettings';
import UpdatePanel from '../components/updates/UpdatePanel';
import SettingsModal from '../components/settings/SettingsModal';
import PlanModal from '../components/billing/PlanModal';
import ChatView from '../components/chat/ChatView';
import PlusMenu from '../components/ui/PlusMenu';

const suggestions = [
  {
    id: 1,
    title: '最新のAIモデルについて',
    description: '最新のLLMやマルチモーダルAIの動向を教えて',
    icon: '🤖',
    gradient: 'from-indigo-400 to-purple-500',
  },
  {
    id: 2,
    title: 'ビジネストレンド分析',
    description: '今年注目のビジネストレンドを分析',
    icon: '📊',
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    id: 3,
    title: 'マーケティング戦略',
    description: 'SNSを活用した最新のマーケティング手法',
    icon: '📱',
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    id: 4,
    title: 'テクノロジー最前線',
    description: '量子コンピューティングの実用化状況',
    icon: '⚡',
    gradient: 'from-amber-400 to-orange-500',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { trackings, fetchTrackings, createTracking } = useTracking();
  const { chats, currentChat, sendMessage, createChat, selectChat, clearCurrentChat, fetchChats, loading: chatLoading } = useChat();
  const { notifications } = useNotifications();

  const [currentView, setCurrentView] = useState<AppView>('home');
  const [inputValue, setInputValue] = useState('');
  const [updatePanelOpen, setUpdatePanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrackings();
      fetchChats();
    }
  }, [isAuthenticated, fetchTrackings, fetchChats]);

  // Handle Stripe redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get('billing');
    if (billing === 'success') {
      toast.success('プロプランへのアップグレードが完了しました！');
      window.history.replaceState({}, '', '/');
    } else if (billing === 'cancel') {
      toast('チェックアウトがキャンセルされました');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // When switching back to home, clear chat
  useEffect(() => {
    if (currentView !== 'home') {
      clearCurrentChat();
    }
  }, [currentView, clearCurrentChat]);

  const startChat = useCallback(async (query: string) => {
    setIsSending(true);
    try {
      // Create a new chat if none exists
      let chat = currentChat;
      if (!chat) {
        chat = await createChat(query.substring(0, 50));
        if (!chat) return;
      }
      // Send the message (hook handles optimistic update + AI response)
      await sendMessage(query);
    } finally {
      setIsSending(false);
    }
  }, [currentChat, createChat, sendMessage]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = inputValue.trim();
    if (!query) return;
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await startChat(query);
  }, [inputValue, startChat]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleSuggestionClick = async (title: string, description: string) => {
    const query = `${title}: ${description}`;
    await startChat(query);
  };

  const handleTrackThis = useCallback(async (query: string) => {
    const tracking = await createTracking({ query });
    if (tracking) {
      navigate(`/tracking/${tracking.id}`);
    }
  }, [createTracking, navigate]);

  const handleChatSendMessage = useCallback(async (content: string) => {
    setIsSending(true);
    try {
      await sendMessage(content);
    } finally {
      setIsSending(false);
    }
  }, [sendMessage]);

  const handleNewSearch = useCallback(() => {
    clearCurrentChat();
    setCurrentView('home');
  }, [clearCurrentChat]);

  const handleSelectChat = useCallback(async (id: string) => {
    await selectChat(id);
    setCurrentView('home');
  }, [selectChat]);

  // Loading screen
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl mx-auto mb-4" style={{ animation: 'logo-fade-in 0.6s ease-out' }}>
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" style={{ animation: 'fade-in-up 0.6s ease-out 0.3s both' }}>
            Burilar
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'trackingList':
        return (
          <TrackingListView
            trackings={trackings}
            onSelectTracking={(id) => navigate(`/tracking/${id}`)}
            onNewSearch={handleNewSearch}
            onRefresh={fetchTrackings}
          />
        );
      case 'notificationSettings':
        return (
          <NotificationSettings
            trackings={trackings}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'home':
      default:
        // If there's an active chat, show the chat view
        if (currentChat && currentChat.messages.length > 0) {
          return (
            <ChatView
              messages={currentChat.messages}
              onSendMessage={handleChatSendMessage}
              isLoading={isSending || chatLoading}
              onTrackThis={handleTrackThis}
            />
          );
        }

        // Otherwise show the home/search view
        return (
          <div className="flex-1 flex flex-col bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="flex-1 flex items-center justify-center px-6 py-12">
              <div className="w-full max-w-3xl">
                {/* Welcome Message */}
                <div className="text-center mb-12">
                  <h2 className="text-5xl mb-4">
                    <span className="text-gray-700 dark:text-gray-300">お手伝いできることは</span>
                  </h2>
                  <h2 className="text-5xl">
                    <span className="text-gray-700 dark:text-gray-300">ありますか？</span>
                  </h2>
                </div>

                {/* Search Input */}
                <form onSubmit={handleSubmit} className="mb-8">
                  <div className="relative rounded-3xl shadow-lg border overflow-visible transition-all hover:shadow-xl focus-within:ring-2 focus-within:ring-indigo-300/50 focus-within:shadow-indigo-100/50 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-2 px-3 py-2">
                      <div className="relative flex-shrink-0">
                        <button
                          type="button"
                          className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                          onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <PlusMenu
                          isOpen={plusMenuOpen}
                          onClose={() => setPlusMenuOpen(false)}
                          className="bottom-full left-0 mb-2"
                        />
                      </div>

                      <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Burilar に相談"
                        style={{ transition: 'height 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        className="flex-1 px-1 py-2 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none bg-transparent resize-none text-gray-800 dark:text-gray-200"
                        rows={1}
                      />

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                        <button
                          type="submit"
                          disabled={!inputValue.trim() || isSending}
                          className={`p-2 rounded-full transition-all ${
                            inputValue.trim() && !isSending
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-md'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Loading indicator */}
                {isSending && (
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">考え中...</span>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {!isSending && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion.title, suggestion.description)}
                        className="rounded-2xl p-5 border text-left group bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-xl hover:scale-[1.02] transform transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${suggestion.gradient} flex items-center justify-center flex-shrink-0 text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                            {suggestion.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1 text-sm text-gray-900 dark:text-gray-100">
                              {suggestion.title}
                            </h3>
                            <p className="text-xs line-clamp-2 text-gray-600 dark:text-gray-400">
                              {suggestion.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ animation: 'app-fade-in 0.6s ease-out both' }}>
      <style>{`
        @keyframes app-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <AppLayout
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'home') clearCurrentChat();
          setCurrentView(view);
        }}
        updatePanelOpen={updatePanelOpen}
        onToggleUpdatePanel={() => setUpdatePanelOpen(!updatePanelOpen)}
        chats={chats}
        onSelectChat={handleSelectChat}
        onViewPlan={() => setPlanModalOpen(true)}
      >
        {renderContent()}
      </AppLayout>

      {/* Update Panel */}
      <UpdatePanel
        isOpen={updatePanelOpen}
        onClose={() => setUpdatePanelOpen(false)}
        trackings={trackings}
        notifications={notifications}
        onSelectTracking={(id) => {
          navigate(`/tracking/${id}`);
          setUpdatePanelOpen(false);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onViewNotificationSettings={() => {
          setSettingsOpen(false);
          setCurrentView('notificationSettings');
        }}
        onViewTrackingSettings={() => {
          setSettingsOpen(false);
          setCurrentView('trackingList');
        }}
        onViewPlan={() => {
          setSettingsOpen(false);
          setPlanModalOpen(true);
        }}
      />

      {/* Plan Modal */}
      <PlanModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
      />
    </div>
  );
}
