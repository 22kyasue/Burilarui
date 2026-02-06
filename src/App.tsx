import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./components/Sidebar";
import { CollapsedSidebar } from "./components/CollapsedSidebar";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { TrackingPage } from "./components/TrackingPage";
import { TrackingListView } from "./components/TrackingListView";
import { NotificationSettings } from "./components/NotificationSettings";
import { HomePage } from "./components/HomePage";
import { NotebookCreationModal } from "./components/NotebookCreationModal";
import { UpdatePanel } from "./components/UpdatePanel";
import { PlanSelection } from "./components/PlanSelection";
import { PlanManagement } from "./components/PlanManagement";
import { TrackingSuggestionCard } from "./components/TrackingSuggestionCard";
import { TrackingStatusBadge } from "./components/TrackingStatusBadge";
import { TrackingDetail } from "./components/TrackingDetail";
import { TrackingRefinementChat } from "./components/TrackingRefinementChat";
import { TrackingSuccessMessage } from "./components/TrackingSuccessMessage";
import { DefaultModeTrackingDetail } from "./components/DefaultModeTrackingDetail";
import { SimpleTrackingSetup } from "./components/SimpleTrackingSetup";
import { Header } from "./components/Header";
import { SettingsModal } from "./components/SettingsModal";
import { IntegrationScreen } from "./components/IntegrationScreen";
import { TrackingSettingsScreen } from "./components/TrackingSettingsScreen";
import { LoginModal } from "./components/LoginModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Menu, Sparkles, Bell, Lock, ArrowRight } from "lucide-react";
import * as chatsApi from "./api/chats";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: number;
  images?: string[];
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
  trackingFrequency?: string;
  notificationEnabled?: boolean;
  notificationGranularity?: "update" | "prompt";
  updates?: Array<{
    timestamp: string;
    update: string;
  }>;
}

function AppContent() {
  // Site Access State
  const [accessPassword, setAccessPassword] = useState('');
  const [isAccessGranted, setIsAccessGranted] = useState(() => {
    // Check if access is already granted in this browser
    return localStorage.getItem('burilar_access_granted') === 'true';
  });
  const [accessError, setAccessError] = useState(false);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessPassword === 'kenseiyasue123') {
      localStorage.setItem('burilar_access_granted', 'true');
      setIsAccessGranted(true);
      setAccessError(false);
    } else {
      setAccessError(true);
    }
  };
  const { user, isAuthenticated, isLoading: authLoading, login, register, loginWithGoogle, loginWithApple, logout, error: authError, clearError } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [shouldScrollToHistory, setShouldScrollToHistory] = useState(false);
  const [currentMode, setCurrentMode] = useState<"default" | "pro">("default");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [currentView, setCurrentView] = useState<
    | "home"
    | "chat"
    | "tracking"
    | "trackingList"
    | "notifications"
    | "planSelection"
    | "planManagement"
    | "integrations"
    | "trackingSettings"
  >("home");
  const [trackingPromptId, setTrackingPromptId] = useState<
    string | null
  >(null);
  const [isNotebookModalOpen, setIsNotebookModalOpen] =
    useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isUpdatePanelOpen, setIsUpdatePanelOpen] =
    useState(false);

  interface TrackingSuggestion {
    messageId: string;
    query: string;
    accepted: boolean;
    suggestedPrompt?: string;
    imageUrl?: string;
  }
  const [trackingSuggestions, setTrackingSuggestions] =
    useState<
      Array<TrackingSuggestion>
    >([
      {
        messageId: "ai-m1",
        query: "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向を教えてください。",
        accepted: false,
      },
    ]);
  const [activeTracking, setActiveTracking] = useState<{
    theme: string;
    frequency: string;
    startTime?: Date;
  } | null>(null);
  const [isTrackingDetailOpen, setIsTrackingDetailOpen] =
    useState(false);
  const [isDefaultModeDetailOpen, setIsDefaultModeDetailOpen] =
    useState(false);

  // SimpleTrackingSetupとDetailの切り替え状態
  const [showSimpleTrackingSetup, setShowSimpleTrackingSetup] = useState(false);
  const [showDetailSettings, setShowDetailSettings] = useState(false);

  // ブラッシュアップモード専用のチャット履歴
  const [refinementMessages, setRefinementMessages] = useState<Message[]>([]);

  // トラッキング提案カードへの参照を保持
  const trackingSuggestionCardRef = useRef<HTMLDivElement>(null);

  // メインチャット画面のスクロール用ref
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // TrackingStatusBadgeへの参照
  const trackingStatusBadgeRef = useRef<HTMLDivElement>(null);

  // Initialize empty - will be populated from API
  const [chats, setChats] = useState<Chat[]>([]);

  // Fetch chats from backend when authenticated
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated) {
          // Fetch user's chats from API
          const userChats = await chatsApi.getChats();
          setChats(userChats);
          if (userChats.length > 0) {
            setCurrentChatId(userChats[0].id);
          }
        } else {
          // For non-authenticated users, fetch tracking data (legacy behavior)
          const response = await fetch('/api/tracking/list');
          const data = await response.json();

          if (data.plans && Array.isArray(data.plans)) {
            // Transform backend tracking plans to Chat format
            const transformedChats: Chat[] = data.plans.map((plan: any) => ({
              id: plan.id,
              title: plan.topic || plan.original_query || 'Untitled',
              messages: plan.last_search_result ? [
                {
                  id: `${plan.id}-query`,
                  content: plan.original_query || plan.topic,
                  role: 'user' as const,
                  timestamp: new Date(plan.created_at),
                },
                {
                  id: `${plan.id}-result`,
                  content: plan.last_search_result,
                  role: 'assistant' as const,
                  timestamp: plan.last_search_time ? new Date(plan.last_search_time) : new Date(plan.created_at),
                  sources: 6,
                }
              ] : [],
              updatedAt: plan.last_search_time ? new Date(plan.last_search_time) : new Date(plan.created_at),
              pinned: false,
              isTracking: plan.status === 'tracking',
              trackingActive: plan.active,
              updateCount: plan.updates?.length || 0,
              trackingFrequency: `${plan.frequency_hours}時間ごと`,
              updates: plan.updates || [],
            }));

            setChats(transformedChats);
            if (transformedChats.length > 0) {
              setCurrentChatId(transformedChats[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);


  const currentChat = currentChatId
    ? chats.find((chat) => chat.id === currentChatId)
    : null;

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !currentChatId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    const chat = chats.find((c) => c.id === currentChatId);
    const updatedMessages = chat ? [...chat.messages, userMessage] : [userMessage];
    const newTitle = chat && chat.messages.length === 0 ? content.slice(0, 30) : chat?.title;

    // Update via API if authenticated
    if (isAuthenticated) {
      try {
        await chatsApi.updateChat(currentChatId, {
          messages: updatedMessages,
          title: newTitle,
        });
      } catch (error) {
        console.error('Failed to update chat:', error);
      }
    }

    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === currentChatId
          ? {
            ...c,
            messages: updatedMessages,
            updatedAt: new Date(),
            title: newTitle || c.title,
          }
          : c,
      ),
    );
  };

  // ブラッシュアップモード専用のメッセージ送信ハンドラー
  const handleRefinementMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setRefinementMessages((prev) => [...prev, userMessage]);

    // AIの応答をシミュレート（実際のAPIコールに置き換え可能）
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `プロンプトのブラッシュアップについてのご質問ありがとうございます。${content}について、より具体的な改善をご提案いたします。`,
        role: "assistant",
        timestamp: new Date(),
      };
      setRefinementMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };

  const handleNewChat = () => {
    // ホームの検索画面に移動
    setCurrentView("home");
    setCurrentChatId(null);
    setTrackingPromptId(null);
    setActiveTracking(null);
  };

  const handleViewHome = () => {
    // ホーム画面に移動
    setCurrentView("home");
    setCurrentChatId(null);
    setTrackingPromptId(null);
    setActiveTracking(null);
  };

  const handleCreateNotebook = (
    title: string,
    prompt: string,
    template?: string,
    trackingFrequency?: string,
    notificationEnabled?: boolean,
    notificationGranularity?: "update" | "prompt",
  ) => {
    const userMessageId = Date.now().toString();
    const assistantMessageId = (Date.now() + 1).toString();

    // 初期回答を生成
    const initialResponse = `ユーーバのマーケティング戦略調査に関する最新のアップデート情報を含む包括的な回答です。各アップデートの内容を統合し、実用的なベストプラクティスと具体的な実装例を提供します。

**情報:**

詳細な技術解説、実装パターン、パフォーマンス最適化の手法、そして実際のユースケースを含めた完全な回答がここに表示されま。 📝

**文献:**

[1] Example Article on Recent Developments
https://example.com/article1

[2] Research Paper: Latest Findings and Analysis
https://research.example.org/paper

[3] Example Article on Recent Developments
https://example.com/article1

[4] Research Paper: Latest Findings and Analysis
https://research.example.org/paper

[5] Example Article on Recent Developments
https://example.com/article1

[6] Research Paper: Latest Findings and Analysis
https://research.example.org/paper`;

    const newChat: Chat = {
      id: Date.now().toString(),
      title: title,
      messages: [
        {
          id: userMessageId,
          content: prompt,
          role: "user",
          timestamp: new Date(),
        },
        {
          id: assistantMessageId,
          content: initialResponse,
          role: "assistant",
          timestamp: new Date(Date.now() + 100),
        },
      ],
      updatedAt: new Date(),
      isTracking: true,
      trackingActive: false, // 初期は中断中
      updateCount: 0,
      trackingFrequency: trackingFrequency || "daily",
      notificationEnabled: notificationEnabled || false,
      notificationGranularity:
        notificationGranularity || "update",
    };
    setChats([newChat, ...chats]);
    setIsNotebookModalOpen(false);

    // 新しく作成したノートブックのトラッキングページに移動
    setTrackingPromptId(newChat.id);
    setCurrentView("tracking");
  };

  const handleSelectChat = (chatId: string) => {
    const selectedChat = chats.find(
      (chat) => chat.id === chatId,
    );

    // 追跡中のチャットの場合は、TrackingPageを表示
    if (selectedChat?.isTracking) {
      setTrackingPromptId(chatId);
      setCurrentChatId(null); // 通常のチャットIDをクリア
      setCurrentView("tracking");
    } else {
      setCurrentChatId(chatId);
      setTrackingPromptId(null); // 追跡中のチャットIDをクリア
      setCurrentView("chat");
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    // Delete from API if authenticated
    if (isAuthenticated) {
      try {
        await chatsApi.deleteChat(chatId);
      } catch (error) {
        console.error('Failed to delete chat:', error);
      }
    }

    setChats((prevChats) =>
      prevChats.filter((chat) => chat.id !== chatId),
    );
    if (currentChatId === chatId && chats.length > 1) {
      const remainingChats = chats.filter(
        (chat) => chat.id !== chatId,
      );
      setCurrentChatId(remainingChats[0].id);
    } else if (chats.length === 1) {
      handleNewChat();
    }
  };

  const handleTogglePin = async (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const newPinned = !chat.pinned;

    // Update via API if authenticated
    if (isAuthenticated) {
      try {
        await chatsApi.updateChat(chatId, { pinned: newPinned });
      } catch (error) {
        console.error('Failed to toggle pin:', error);
      }
    }

    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === chatId
          ? { ...c, pinned: newPinned }
          : c,
      ),
    );
  };

  // 初回マウント時にローディングを3秒間表示
  useEffect(() => {
    // 2.5秒後にフェードアウト開始
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // 3秒後に完全非表示
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // メインチャット画面のメッセージが更新されたら自動スクロール
  useEffect(() => {
    if (currentChat && currentChat.messages.length > 0 && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
    }
  }, [currentChat?.messages]);

  // パネルが閉じた時にTrackingStatusBadgeが画面中央に来るようにスクロール
  useEffect(() => {
    if (!isTrackingDetailOpen && !isDefaultModeDetailOpen && trackingStatusBadgeRef.current) {
      setTimeout(() => {
        trackingStatusBadgeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 100); // パネルのクローズアニメーション後にスクロール
    }
  }, [isTrackingDetailOpen, isDefaultModeDetailOpen]);

  // ローディング画面
  if (isLoading) {
    return (
      <div
        className={`flex h-screen w-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 items-center justify-center overflow-hidden transition-opacity duration-500 ${isFadingOut ? "opacity-0" : "opacity-100"
          }`}
      >
        <div className="text-center">
          {/* ロゴテキスト */}
          <div className="mb-8 animate-[logo-fade-in_2s_ease-out]">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Burilar
            </h1>
          </div>

          {/* アニメーション円 */}
          <div className="flex justify-center items-center gap-3 animate-[fade-in-up_1.5s_ease-out_0.5s_both]">
            <div
              className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>

          {/* サブテキスト */}
          <p className="mt-8 text-gray-600 text-sm animate-[fade-in-up_1.5s_ease-out_0.8s_both]">
            AIで追跡、情報を常に最新に
          </p>
        </div>

        {/* 背景の装飾的な円 */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-40 blur-2xl animate-pulse"></div>
        <div
          className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-40 blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full opacity-30 blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    );
  }

  // Site Access Gate
  if (!isAccessGranted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <Lock className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              パスワードを入力
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              このサイトにアクセスするにはパスワードが必要です
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAccessSubmit}>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full appearance-none rounded-xl border border-gray-300 px-3 py-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm transition-colors"
                placeholder="パスワード"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
              />
            </div>

            {accessError && (
              <div className="text-center text-sm text-red-600 font-medium">
                パスワードが正しくありません
              </div>
            )}

            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-lg shadow-indigo-200"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <ArrowRight className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
                </span>
                アクセスする
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${theme === 'dark'
      ? 'bg-gradient-to-br from-[#1a1f2e] via-[#252a3a] to-[#2a1f2e]'
      : 'bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]'
      }`}>
      {/* Notebook Creation Modal */}
      <NotebookCreationModal
        isOpen={isNotebookModalOpen}
        onClose={() => setIsNotebookModalOpen(false)}
        onCreateNotebook={handleCreateNotebook}
      />

      {/* Sidebar - shown in all views */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        trackingPromptId={trackingPromptId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
        onTogglePin={handleTogglePin}
        onViewTracking={() => {
          setTrackingPromptId(null);
          setCurrentView("trackingList");
        }}
        onViewNotificationSettings={() => {
          setCurrentView("notificationSettings");
        }}
        onViewHome={handleViewHome}
        onViewSettings={() => setIsSettingsModalOpen(true)}
        shouldScrollToHistory={shouldScrollToHistory}
        onScrollToHistoryComplete={() => setShouldScrollToHistory(false)}
        theme={theme}
      />

      {/* Collapsed Sidebar - shown when sidebar is closed */}
      {!isSidebarOpen && (
        <CollapsedSidebar
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onNewChat={handleNewChat}
          onViewTracking={() => {
            setTrackingPromptId(null);
            setCurrentView("trackingList");
          }}
          onViewNotificationSettings={() => {
            setCurrentView("notifications");
          }}
          onViewSettings={() => {
            setIsSettingsModalOpen(true);
          }}
          onScrollToHistory={() => {
            setShouldScrollToHistory(true);
          }}
          theme={theme}
        />
      )}

      {/* Main Content Area - with margin when sidebar is open */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-16"
          }`}
      >
        {/* Fixed Header - shown in all views */}
        <Header
          onLogoClick={handleNewChat}
          unreadCount={8}
          onNotificationClick={() => setIsUpdatePanelOpen(true)}
          onProClick={() => { }} // 無効化
          theme={theme}
          user={user}
          isAuthenticated={isAuthenticated}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onLogout={logout}
          onProfileSettings={() => setIsSettingsModalOpen(true)}
          onPlanManagement={() => setCurrentView("planManagement")}
        />

        <AnimatePresence mode="wait">
          {currentView === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <HomePage
                chats={chats}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
                onViewPlan={() =>
                  setCurrentView("planSelection")
                }
                onViewUpdatePanel={() =>
                  setIsUpdatePanelOpen(true)
                }
                currentMode={currentMode}
                onModeChange={setCurrentMode}
                theme={theme}
                onSendMessage={async (message) => {
                  // 新しいチャットを作成
                  const userMessage: Message = {
                    id: Date.now().toString(),
                    content: message,
                    role: "user",
                    timestamp: new Date(),
                  };

                  let newChatId = Date.now().toString();
                  let newChat: Chat = {
                    id: newChatId,
                    title: message.slice(0, 30),
                    messages: [userMessage],
                    updatedAt: new Date(),
                  };

                  // Save to API if authenticated
                  if (isAuthenticated) {
                    try {
                      const savedChat = await chatsApi.createChat({
                        title: message.slice(0, 30),
                        messages: [userMessage],
                      });
                      newChat = savedChat;
                      newChatId = savedChat.id;
                    } catch (error) {
                      console.error('Failed to save chat:', error);
                    }
                  }

                  setChats((prev) => [newChat, ...prev]);
                  setCurrentChatId(newChatId);
                  setCurrentView("chat");

                  // 実際のAPIを呼び出し
                  try {
                    const response = await fetch('/api/search', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ query: message }),
                    });

                    const data = await response.json();

                    // Handle different response types
                    let responseContent = '';
                    if (data.needs_clarification) {
                      responseContent = `${data.reason}\n\n**Clarification needed:**\n${data.clarification_questions?.map((q: string) => `- ${q}`).join('\n') || ''}`;
                    } else if (data.search_result) {
                      responseContent = data.search_result;
                    } else if (data.error) {
                      responseContent = `Error: ${data.error}`;
                    } else {
                      responseContent = 'No response received';
                    }

                    const assistantMessage: Message = {
                      id: (Date.now() + 1).toString(),
                      content: responseContent,
                      role: "assistant",
                      timestamp: new Date(),
                      sources: data.search_result ? 6 : 0,
                    };

                    // Update chat with assistant message
                    const updatedMessages = [...newChat.messages, assistantMessage];

                    // Save to API if authenticated
                    if (isAuthenticated) {
                      try {
                        await chatsApi.updateChat(newChatId, {
                          messages: updatedMessages,
                        });
                      } catch (error) {
                        console.error('Failed to update chat:', error);
                      }
                    }

                    setChats((prevChats) =>
                      prevChats.map((chat) =>
                        chat.id === newChatId
                          ? {
                            ...chat,
                            messages: updatedMessages,
                            updatedAt: new Date(),
                          }
                          : chat,
                      ),
                    );

                    // トラッキング提案を追加
                    if (data.proposed_plan) {
                      setTrackingSuggestions((prev) => [
                        ...prev,
                        {
                          messageId: userMessage.id,
                          query: message,
                          accepted: false,
                          suggestedPrompt: data.proposed_plan.suggested_prompt,
                          imageUrl: data.proposed_plan.image_url,
                        },
                      ]);
                    } else {
                      // Fallback logic if needed, or just don't add suggestion
                      setTrackingSuggestions((prev) => [
                        ...prev,
                        {
                          messageId: userMessage.id,
                          query: message,
                          accepted: false,
                          suggestedPrompt: undefined
                        },
                      ]);
                    }
                  } catch (error) {
                    const errorMessage: Message = {
                      id: (Date.now() + 1).toString(),
                      content: `Error: ${error instanceof Error ? error.message : 'Failed to fetch response'}`,
                      role: "assistant",
                      timestamp: new Date(),
                    };

                    setChats((prevChats) =>
                      prevChats.map((chat) =>
                        chat.id === newChatId
                          ? {
                            ...chat,
                            messages: [...chat.messages, errorMessage],
                            updatedAt: new Date(),
                          }
                          : chat,
                      ),
                    );
                  }
                }}
                onOpenTrackingDetail={(theme, query) => {
                  // 直接TrackingDetailを開く
                  setActiveTracking({
                    theme: theme,
                    frequency: "毎日 9:00",
                  });

                  // ブラッシュアップチャットの初期対話を設定
                  const initialRefinementMessages: Message[] = [
                    {
                      id: "refine-ai-1",
                      content: `この情報を追跡する目的を教えてください。\n例：\n・投資判断\n・プロダクト企画\n・業界リサーチ\n・個人の情報収集 など`,
                      role: "assistant",
                      timestamp: new Date(Date.now() - 6000),
                    },
                    {
                      id: "refine-user-1",
                      content: "業界リサーチです。\n特にAppleがAI分野でどこまで本気なのかを継続的に把握したいです。",
                      role: "user",
                      timestamp: new Date(Date.now() - 5000),
                    },
                    {
                      id: "refine-ai-2",
                      content: `業界リサーチとのことですが、特に重視したい観点はありますか？\n複数選択でも構いません。\n\n・機能・技術（生成AI、オンデバイスAIなど）\n・ビジネス戦略・競争環境\n・プライバシー・規制対応\n・日本市場への影響\n・他社（OpenAI / Google / Microsoft等）との比較`,
                      role: "assistant",
                      timestamp: new Date(Date.now() - 4000),
                    },
                    {
                      id: "refine-user-2",
                      content: "機能・技術と、日本市場への影響は特に知りたいです。",
                      role: "user",
                      timestamp: new Date(Date.now() - 3000),
                    },
                    {
                      id: "refine-ai-3",
                      content: `追跡する情報ソースについて、希望はありますか？\n例：\n・Apple公式（発表、WWDC、プレスリリース）\n・海外メディア（Bloomberg, The Vergeなど）\n・日本語メディア\n・アナリストレポート`,
                      role: "assistant",
                      timestamp: new Date(Date.now() - 2000),
                    },
                    {
                      id: "refine-user-3",
                      content: "Apple公式と、信頼性の高い海外メディアを中心にしたいです。",
                      role: "user",
                      timestamp: new Date(Date.now() - 1000),
                    },
                  ];

                  setRefinementMessages(initialRefinementMessages);
                  setIsTrackingDetailOpen(true);
                  setCurrentView("chat");
                }}
              />
            </motion.div>
          ) : currentView === "notifications" ? (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <NotificationSettings
                onBack={() => {
                  setCurrentView("home");
                }}
                chats={chats}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              />
            </motion.div>
          ) : currentView === "tracking" ? (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <TrackingPage
                onBack={() => {
                  setCurrentView("home");
                  setTrackingPromptId(null);
                }}
                promptId={trackingPromptId}
                chats={chats}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
                theme={theme}
              />
            </motion.div>
          ) : currentView === "trackingList" ? (
            <motion.div
              key="trackingList"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <TrackingListView
                onBack={() => {
                  setCurrentView("home");
                  setTrackingPromptId(null);
                }}
                chats={chats}
                onSelectChat={handleSelectChat}
                onViewNotificationSettings={() => {
                  setCurrentView("notifications");
                }}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
                onNewChat={() => {
                  // ホーム画面に戻る
                  setCurrentView("home");
                  setCurrentChatId(null);
                  setTrackingPromptId(null);
                }}
              />
            </motion.div>
          ) : currentView === "planSelection" ? (
            <motion.div
              key="planSelection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <PlanSelection
                onBack={() => {
                  setCurrentView("home");
                }}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              />
            </motion.div>
          ) : currentView === "planManagement" ? (
            <motion.div
              key="planManagement"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <PlanManagement
                onBack={() => {
                  setCurrentView("home");
                }}
                onChangePlan={() => {
                  setCurrentView("planSelection");
                }}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              />
            </motion.div>
          ) : currentView === "integrations" ? (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <IntegrationScreen
                onBack={() => {
                  setCurrentView("home");
                }}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              />
            </motion.div>
          ) : currentView === "trackingSettings" ? (
            <motion.div
              key="trackingSettings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TrackingSettingsScreen
                onBack={() => {
                  setCurrentView("home");
                }}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              />
            </motion.div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Main container - フレックスレイアウトで左右に分割 */}
              <div className="flex-1 flex overflow-hidden">
                {/* Chat Area - トラッキング詳細が開いているときは左側に配置 */}
                <div className={`flex flex-col transition-all duration-300 ${isTrackingDetailOpen ? 'w-[35%]' : 'w-full'
                  }`}>
                  {/* トラッキング詳細が開いている場合は専用チャット画面を表示 */}
                  {isTrackingDetailOpen ? (
                    <TrackingRefinementChat
                      refinementMessages={refinementMessages}
                      onSendMessage={handleRefinementMessage}
                      currentMode={currentMode}
                      onModeChange={setCurrentMode}
                    />
                  ) : isDefaultModeDetailOpen ? (
                    <div className={`flex-1 overflow-y-auto flex flex-col items-center ${theme === 'dark'
                      ? 'bg-gradient-to-br from-[#1a1f2e] via-[#252a3a] to-[#2a1f2e]'
                      : 'bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]'
                      }`}>
                      <DefaultModeTrackingDetail
                        query={
                          trackingSuggestions.find((s) => s.accepted)?.query ||
                          "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向教えてください。"
                        }
                        frequency={activeTracking?.frequency || "毎日 9:00"}
                        onExecute={() => {
                          // トラッキング実行：現在のチャットをサイドバーの「追跡中」に追加
                          if (currentChatId) {
                            setChats((prevChats) =>
                              prevChats.map((chat) =>
                                chat.id === currentChatId
                                  ? {
                                    ...chat,
                                    isTracking: true,
                                    trackingActive: true,
                                    trackingFrequency: activeTracking?.frequency || "毎日 9:00",
                                  }
                                  : chat,
                              ),
                            );
                          }
                          console.log("デフォルトモードでトラッキング実行");
                          // 詳細画面を閉じて成功メッセージに戻る
                          setIsDefaultModeDetailOpen(false);
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className={`flex-1 overflow-y-auto flex flex-col items-center pb-4 ${theme === 'dark'
                        ? 'bg-gradient-to-br from-[#1a1f2e] via-[#252a3a] to-[#2a1f2e]'
                        : 'bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]'
                        }`}>
                        {currentChat &&
                          currentChat.messages.length > 0 ? (
                          <div className={`w-full mx-auto px-6 py-6 pb-32 transition-all duration-300 ${isTrackingDetailOpen ? 'max-w-full' : 'max-w-3xl'
                            }`}>
                            {(() => {
                              // メッセージを追跡開始前と後に分割
                              const messagesBeforeTracking = activeTracking?.startTime
                                ? currentChat.messages.filter(msg => msg.timestamp < activeTracking.startTime!)
                                : currentChat.messages;

                              const messagesAfterTracking = activeTracking?.startTime
                                ? currentChat.messages.filter(msg => msg.timestamp >= activeTracking.startTime!)
                                : [];

                              return (
                                <>
                                  {/* 追跡開始前のメッセージ */}
                                  {messagesBeforeTracking.map((message, index) => (
                                    <div key={message.id}>
                                      <ChatMessage message={message} />

                                      {/* アシスタントの回答の後に追跡提案を表示 */}
                                      {message.role === "assistant" &&
                                        index > 0 &&
                                        messagesBeforeTracking[index - 1].role === "user" && (
                                          <>
                                            {/* 該当するユーザーメッセージに対する追跡提案カード */}
                                            {trackingSuggestions.find(
                                              (s) =>
                                                s.messageId ===
                                                messagesBeforeTracking[index - 1].id && !s.accepted,
                                            ) && (
                                                <>
                                                  {/* SimpleTrackingSetup */}
                                                  <div className="max-w-4xl mx-auto mt-6 mb-4" ref={trackingSuggestionCardRef}>
                                                    <SimpleTrackingSetup
                                                      userPrompt={
                                                        trackingSuggestions.find(
                                                          (s) =>
                                                            s.messageId ===
                                                            messagesBeforeTracking[index - 1].id,
                                                        )?.query || ""
                                                      }
                                                      recommendedPrompt={
                                                        trackingSuggestions.find(
                                                          (s) =>
                                                            s.messageId ===
                                                            messagesBeforeTracking[index - 1].id,
                                                        )?.suggestedPrompt ||
                                                        "「Apple Intelligenceの2024〜2025年における、主要な機能アップデート、日本語対応の進捗状況、対応デバイスの拡大、プライバシー技術の革新、および市場での評価について、信頼性の高いソースから継続的に追跡し、重要な変化があれば通知してください。」"
                                                      }
                                                      onExecuteTracking={() => {
                                                        const suggestion = trackingSuggestions.find(
                                                          (s) =>
                                                            s.messageId ===
                                                            messagesBeforeTracking[index - 1].id,
                                                        );
                                                        const trackingStartTime = new Date();
                                                        const theme = suggestion?.query || "Apple Intelligence"; // Fallback

                                                        setActiveTracking({
                                                          theme: theme,
                                                          frequency: "毎日 9:00",
                                                          startTime: trackingStartTime,
                                                        });
                                                        setTrackingSuggestions(
                                                          (prev) =>
                                                            prev.map((s) =>
                                                              s.messageId === messagesBeforeTracking[index - 1].id
                                                                ? { ...s, accepted: true }
                                                                : s,
                                                            ),
                                                        );

                                                        // 現在のチャットをサイドバーの「追跡中」に追加
                                                        if (currentChatId) {
                                                          // Backend update
                                                          if (isAuthenticated) {
                                                            chatsApi.updateChat(currentChatId, {
                                                              isTracking: true,
                                                              trackingActive: true,
                                                              trackingFrequency: "毎日 9:00",
                                                              thumbnail: suggestion?.imageUrl
                                                            }).catch(err => console.error("Failed to update chat tracking status", err));
                                                          }

                                                          setChats((prevChats) =>
                                                            prevChats.map((chat) =>
                                                              chat.id === currentChatId
                                                                ? {
                                                                  ...chat,
                                                                  isTracking: true,
                                                                  trackingActive: true,
                                                                  trackingFrequency: "毎日 9:00",
                                                                  // Also update local state if Chat interface has thumbnail? 
                                                                  // Need to verify Chat interface. But backend persistence is key.
                                                                }
                                                                : chat,
                                                            ),
                                                          );
                                                        }

                                                        console.log("追跡実行");
                                                      }}
                                                      onOpenDetailSettings={() => {
                                                        // 詳細設定を開く
                                                        setIsSidebarOpen(false);
                                                        setIsTrackingDetailOpen(true);
                                                      }}
                                                    />
                                                  </div>
                                                </>
                                              )}
                                          </>
                                        )}
                                    </div>
                                  ))}

                                  {/* Tracking Status Badge - 追跡開始後に表示 */}
                                  {activeTracking && !isTrackingDetailOpen && !isDefaultModeDetailOpen && (
                                    currentMode === "default" ? (
                                      <TrackingSuccessMessage
                                        theme={activeTracking.theme}
                                        frequency={activeTracking.frequency}
                                        onViewDetails={() => {
                                          // 成功メッセージを非表示にして元のチャット画面に戻る
                                          setActiveTracking(null);
                                          // トラッキング提案カードを再表示
                                          setTrackingSuggestions((prev) =>
                                            prev.map((s) => ({
                                              ...s,
                                              accepted: false,
                                            }))
                                          );
                                          // カードまでスクロール
                                          setTimeout(() => {
                                            trackingSuggestionCardRef.current?.scrollIntoView({
                                              behavior: 'smooth',
                                              block: 'start',
                                            });
                                          }, 100);
                                        }}
                                      />
                                    ) : (
                                      <TrackingStatusBadge
                                        ref={trackingStatusBadgeRef}
                                        theme={activeTracking.theme}
                                        frequency={activeTracking.frequency}
                                        onManage={() => {
                                          // トラッキング詳細パネルを開く
                                          setIsTrackingDetailOpen(true);
                                          // メニューバーを閉じる
                                          setIsSidebarOpen(false);
                                        }}
                                      />
                                    )
                                  )}

                                  {/* 追跡開始後の新しいメッセージ */}
                                  {messagesAfterTracking.map((message) => (
                                    <div key={message.id}>
                                      <ChatMessage message={message} />
                                    </div>
                                  ))}
                                </>
                              );
                            })()}

                            {/* スクロール用の参照ポイント */}
                            <div ref={chatMessagesEndRef} />
                          </div>
                        ) : null}
                      </div>

                      {/* Input Area - fixed at bottom when in chat */}
                      {currentChat &&
                        currentChat.messages.length > 0 && (
                          <ChatInput
                            onSendMessage={handleSendMessage}
                            isHome={false}
                            currentMode={currentMode}
                            onModeChange={setCurrentMode}
                          />
                        )}
                    </>
                  )}
                </div>

                {/* Tracking Detail Panel - 右側のボックス */}
                <TrackingDetail
                  isOpen={isTrackingDetailOpen}
                  onClose={() => {
                    setIsTrackingDetailOpen(false);
                    // ブラッシュアップチャット履歴をクリア
                    setRefinementMessages([]);
                  }}
                  theme={activeTracking?.theme || ""}
                  frequency={activeTracking?.frequency || "毎日 9:00"}
                  query={
                    trackingSuggestions.find((s) => s.accepted)?.query ||
                    "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向を教えてください。"
                  }
                  mode={currentMode}
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Update Panel - 右側からスライド */}
      <UpdatePanel
        isOpen={isUpdatePanelOpen}
        onClose={() => setIsUpdatePanelOpen(false)}
        chats={chats}
        onSelectChat={handleSelectChat}
        theme={theme}
      />

      {/* Settings Modal - 右側からスライド */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onViewIntegrations={() => {
          setCurrentView("integrations");
          setIsSettingsModalOpen(false);
        }}
        onViewTrackingSettings={() => {
          setCurrentView("trackingSettings");
          setIsSettingsModalOpen(false);
        }}
        theme={theme}
        onThemeChange={(newTheme) => setTheme(newTheme)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          clearError();
        }}
        onLogin={login}
        onRegister={register}
        onGoogleLogin={loginWithGoogle}
        onAppleLogin={loginWithApple}
        error={authError}
        isLoading={authLoading}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}