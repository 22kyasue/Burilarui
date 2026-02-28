import { useState, useRef, useCallback } from "react";
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
import { AuthGuard } from "./components/AuthGuard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import * as chatsApi from "./api/chats";
import { useChat } from "./hooks/useChat";
import { useTracking } from "./hooks/useTracking";
import { Chat, Message } from "./types/chat";
import { ToastNotification } from "./components/ToastNotification";
import { useNotifications } from "./hooks/useNotifications";
import { demoScenarios, RefinementScenario } from "./data/demoScenarios";

function AppContent() {
  // Auth
  const { user, isAuthenticated, isLoading: authLoading, login, register, loginWithGoogle, loginWithApple, logout, error: authError, clearError } = useAuth();

  // Read Updates State (Persisted)
  const { notifications, markAsRead, submitFeedback } = useNotifications();
  const [readUpdateIds, setReadUpdateIds] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('burilar_read_updates');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to parse read updates", e);
      return {};
    }
  });

  const handleMarkUpdateAsRead = (chatId: string, updateId: string) => {
    setReadUpdateIds((prev) => {
      const currentReads = prev[chatId] || [];
      if (currentReads.includes(updateId)) return prev;

      const newReads = [...currentReads, updateId];
      const newState = { ...prev, [chatId]: newReads };
      localStorage.setItem('burilar_read_updates', JSON.stringify(newState));
      return newState;
    });
  };

  // View State
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
  const [trackingPromptId, setTrackingPromptId] = useState<string | null>(null);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [shouldScrollToHistory, setShouldScrollToHistory] = useState(false);
  const [currentMode, setCurrentMode] = useState<"default" | "pro">("default");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUpdatePanelOpen, setIsUpdatePanelOpen] = useState(false);
  const [dismissedToastIds, setDismissedToastIds] = useState<string[]>([]);
  const [adaptationToast, setAdaptationToast] = useState<string | null>(null);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);

  // Demo State
  const [currentScenario, setCurrentScenario] = useState<RefinementScenario | undefined>(undefined);

  // Clarification state for ambiguous queries
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);

  // Hooks
  const tracking = useTracking();
  const chat = useChat(
    isAuthenticated,
    readUpdateIds,
    setCurrentView,
    setTrackingPromptId,
    tracking.setActiveTracking,
    tracking.addTrackingSuggestion
  );

  // Feedback handler — shows adaptation toast when strategy is auto-updated
  const handleFeedback = useCallback(async (id: string, feedback: 'useful' | 'not_useful') => {
    const result = await submitFeedback(id, feedback);
    if (result?.adapted) {
      setAdaptationToast(result.message ?? '追跡戦略が更新されました');
      setTimeout(() => setAdaptationToast(null), 5000);
    }
  }, [submitFeedback]);

  // Custom Logic that needs both hooks or local state
  const handleCreateNotebook = (
    title: string,
    prompt: string,
    _template?: string,
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

    // Use hook setter
    chat.setChats([newChat, ...chat.chats]);
    setIsNotebookModalOpen(false);

    // 新しく作成したノートブックのトラッキングページに移動
    setTrackingPromptId(newChat.id);
    setCurrentView("tracking");
  };

  // Scroll ref (needed for chat scrolling)
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Render
  return (
    <AuthGuard>
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
          chats={chat.chats}
          currentChatId={chat.currentChatId}
          trackingPromptId={trackingPromptId}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectChat={chat.handleSelectChat}
          onDeleteChat={chat.handleDeleteChat}
          onNewChat={chat.handleNewChat}
          onTogglePin={chat.handleTogglePin}
          onViewTracking={() => {
            setTrackingPromptId(null);
            setCurrentView("trackingList");
          }}
          onViewNotificationSettings={() => {
            setCurrentView("notifications");
          }}

          onViewSettings={() => setIsSettingsModalOpen(true)}

          shouldScrollToHistory={shouldScrollToHistory}
          theme={theme}
        />

        {/* Collapsed Sidebar - shown when sidebar is closed */}
        {!isSidebarOpen && (
          <CollapsedSidebar
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onNewChat={chat.handleNewChat}
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
          className={`flex-1 flex flex-col transition-all duration-300 min-w-0 overflow-hidden ${isSidebarOpen ? "ml-80" : "ml-16"
            }`}
        >


          {/* Fixed Header - shown in all views */}
          <Header
            onLogoClick={() => {
              setCurrentView("home");
              chat.setCurrentChatId(null);
              setTrackingPromptId(null);
              tracking.setActiveTracking(null);
            }}
            unreadCount={chat.chats.reduce((sum, c) => sum + (c.updateCount || 0), 0)}
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




          {/* Toast Notification */}
          {(() => {
            const activeNotification = notifications.find(n => !n.read && !n.feedback && !dismissedToastIds.includes(n.id)) || null;
            return (
              <ToastNotification
                notification={activeNotification}
                onDismiss={() => {
                  if (activeNotification) {
                    setDismissedToastIds(prev => [...prev, activeNotification.id]);
                  }
                }}
                onFeedback={handleFeedback}
                theme={theme}
              />
            );
          })()}

          {/* Adaptation Toast */}
          <AnimatePresence>
            {adaptationToast && (
              <motion.div
                key="adaptation-toast"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <span className="text-blue-500">✦</span>
                {adaptationToast}
              </motion.div>
            )}
          </AnimatePresence>


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
                  onViewPlan={() =>
                    setCurrentView("planSelection")
                  }
                  theme={theme}
                  onSendMessage={async (message, attachments = []) => {
                    // Clear any pending clarification questions when user sends a new message
                    setClarificationQuestions([]);
                    // Logic for home page new chat creation (complex, mostly duplicated from original App.tsx)
                    // We can reuse chat.setChats but logic is specific to home page new chat flow
                    // Re-implementing logic here for now
                    const userMessage: Message = {
                      id: Date.now().toString(),
                      content: message,
                      role: "user",
                      timestamp: new Date(),
                      attachments: attachments.map(f => ({
                        id: f.id,
                        name: f.name,
                        type: f.type,
                        url: f.preview,
                        size: f.size
                      }))
                    };

                    let newChatId = Date.now().toString();
                    let newChat: Chat = {
                      id: newChatId,
                      title: message.slice(0, 30),
                      messages: [userMessage],
                      updatedAt: new Date(),
                    };

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

                    chat.setChats([newChat, ...chat.chats]);
                    chat.setCurrentChatId(newChatId);
                    setCurrentView("chat");

                    try {
                      const response = await fetch('/api/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: message }),
                      });

                      if (!response.ok) {
                        const text = await response.text();
                        throw new Error(`Server error: ${response.status} ${text}`);
                      }

                      const data = await response.json();

                      let responseContent = '';
                      if (data.needs_clarification) {
                        const status = data.status;
                        if (status === 'not_feasible') {
                          responseContent = `このトピックは既に完結した出来事または静的な情報のようです。継続的な追跡には向いていません。\n\n別のトピックで試してみてください。例えば「今後発売予定の製品」や「進行中のイベント」などはトラッキングに適しています。`;
                        } else if (status === 'no_sources') {
                          responseContent = `このトピックについて信頼性の高い情報源が見つかりませんでした。\n\nトピックをより具体的に指定するか、別の表現で試してみてください。`;
                        } else {
                          // ambiguous - show questions as text and also as clickable chips
                          responseContent = `クエリについて確認が必要です。\n\n以下のいずれかを選択するか、詳しく教えてください：`;
                          setClarificationQuestions(data.clarification_questions || []);
                        }
                      } else if (data.status === 'completed') {
                        responseContent = data.search_result || '';
                        if (data.status_explanation) {
                          responseContent = `${data.search_result}\n\n---\n📌 ${data.status_explanation}`;
                        }
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
                        sources: 0,
                      };

                      const updatedMessages = [...newChat.messages, assistantMessage];

                      if (isAuthenticated) {
                        try {
                          await chatsApi.updateChat(newChatId, { messages: updatedMessages });
                        } catch (error) {
                          console.error('Failed to update chat:', error);
                        }
                      }

                      chat.setChats((prevChats) =>
                        prevChats.map((c) =>
                          c.id === newChatId
                            ? { ...c, messages: updatedMessages, updatedAt: new Date() }
                            : c
                        )
                      );

                      if (data.proposed_plan) {
                        tracking.setTrackingSuggestions((prev) => [
                          ...prev,
                          {
                            messageId: userMessage.id,
                            query: message,
                            accepted: false,
                            planId: data.proposed_plan.plan_id,
                            suggestedPrompt: data.proposed_plan.suggested_prompt,
                            imageUrl: data.proposed_plan.image_url,
                            structureItems: data.proposed_plan.structure_items,
                            missingPoints: data.proposed_plan.missing_points,
                            notificationTriggers: data.proposed_plan.notification_triggers
                          },
                        ]);
                      } else {
                        tracking.setTrackingSuggestions((prev) => [
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
                      // Error handling
                      const errorMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        content: `Error: ${error instanceof Error ? error.message : 'Failed to fetch response'}`,
                        role: "assistant", // Using 'assistant' as 'system' not in type
                        timestamp: new Date(),
                      };
                      chat.setChats((prevChats) =>
                        prevChats.map((c) =>
                          c.id === newChatId
                            ? { ...c, messages: [...c.messages, errorMessage], updatedAt: new Date() }
                            : c
                        )
                      );
                    }
                  }}
                  onOpenTrackingDetail={(theme, _query) => {
                    tracking.setActiveTracking({
                      theme: theme,
                      frequency: "毎日 9:00",
                    });

                    // Determine and set the current scenario
                    // First, try to find the suggestion that matches this theme/query
                    const suggestion = tracking.trackingSuggestions.find(s => s.query === theme || s.suggestedPrompt?.includes(theme));

                    if (suggestion && suggestion.structureItems && suggestion.structureItems.length > 0) {
                      // Use dynamic data from API
                      setCurrentScenario({
                        id: `dynamic-${Date.now()}`,
                        title: `${theme}の動向追跡`,
                        theme: theme,
                        topic: "最新動向",
                        status: "active",
                        priority: "高",
                        recommendedPrompt: suggestion.suggestedPrompt || "",
                        structureItems: suggestion.structureItems,
                        missingPoints: suggestion.missingPoints || [],
                        notificationTriggers: suggestion.notificationTriggers || []
                      } as RefinementScenario);
                    } else if (theme === "Apple Intelligence" || theme === "Apple Intelligenceの2024〜2025年の最新動向") {
                      setCurrentScenario(demoScenarios["Apple Intelligence"]);
                    } else if (theme === "Tesla Competitor Analysis" || theme === "テスラの競合分析") {
                      setCurrentScenario(demoScenarios["Tesla Competitor Analysis"]);
                    } else {
                      // Fallback for unknown themes without dynamic data
                      setCurrentScenario(undefined);
                    }

                    // Demo Data Definition
                    const demoChatData: Record<string, Message[]> = {
                      "Apple Intelligence": [
                        {
                          id: "refine-ai-1",
                          content: "この情報を追跡する目的を教えてください。\n例：\n・投資判断\n・プロダクト企画\n・業界リサーチ\n・個人の情報収集 など",
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
                          content: "業界リサーチとのことですが、特に重視したい観点はありますか？\n複数選択でも構いません。\n\n・機能・技術（生成AI、オンデバイスAIなど）\n・ビジネス戦略・競争環境\n・プライバシー・規制対応\n・日本市場への影響\n・他社（OpenAI / Google / Microsoft等）との比較",
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
                          content: "追跡する情報ソースについて、希望はありますか？\n例：\n・Apple公式（発表、WWDC、プレスリリース）\n・海外メディア（Bloomberg, The Vergeなど）\n・日本語メディア\n・アナリストレポート",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 2000),
                        },
                        {
                          id: "refine-user-3",
                          content: "Apple公式と、信頼性の高い海外メディアを中心にしたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 1000),
                        },
                      ],
                      "Tesla Competitor Analysis": [
                        {
                          id: "refine-ai-tesla-1",
                          content: "この情報を追跡する目的を教えてください。\n例：\n・投資判断（TSLA保有中）\n・EV市場調査\n・技術トレンド分析\n・自動車業界の動向把握 など",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 6000),
                        },
                        {
                          id: "refine-user-tesla-1",
                          content: "テスラの競合分析をお願いします。\n特にEV市場でのシェア推移と、自律走行技術における他社との比較について、最新の情報を基に教えてください。",
                          role: "user",
                          timestamp: new Date(Date.now() - 5000),
                        },
                        {
                          id: "refine-ai-tesla-2",
                          content: "競合分析承知しました。比較対象として特に重視したい企業や地域はありますか？\n\n・中国メーカー (BYD, XPeng, Nio)\n・欧州既存メーカー (VW, BMW, Mercedes)\n・米国スタートアップ (Rivian, Lucid)\n・自動運転技術企業 (Waymo, Cruise)",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 4000),
                        },
                        {
                          id: "refine-user-tesla-2",
                          content: "中国のBYDと、自動運転のWaymoとの比較を重点的にお願いします。",
                          role: "user",
                          timestamp: new Date(Date.now() - 3000),
                        },
                      ],
                      "最新のAIモデルについて": [
                        {
                          id: "refine-ai-1",
                          content: "この情報を追跡する目的を教えてください。\n例：\n・モデルの性能比較\n・アプリ開発への応用\n・研究目的\n・個人の学習 など",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 6000),
                        },
                        {
                          id: "refine-user-1",
                          content: "アプリ開発への応用です。\n特にGPT-4oやClaude 3.5 Sonnetなどの最新モデルのAPI仕様変更や価格改定を把握したいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 5000),
                        },
                        {
                          id: "refine-ai-2",
                          content: "アプリ開発への応用とのことですが、特に重視したい観点はありますか？\n複数選択でも構いません。\n\n・マルチモーダル機能\n・Function Calling / Tool Use\n・コンテキストウィンドウの拡大\n・推論速度とコスト\n・ファインチューニングの可能性",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 4000),
                        },
                        {
                          id: "refine-user-2",
                          content: "マルチモーダル機能と、推論速度とコストのバランスについて特に知りたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 3000),
                        },
                        {
                          id: "refine-ai-3",
                          content: "追跡する情報ソースについて、希望はありますか？\n例：\n・公式開発者ブログ（OpenAI, Anthropic, Google）\n・技術系ニュースサイト（Hacker News, TechCrunch）\n・開発者コミュニティ（X, Discord, Reddit）\n・論文解説記事",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 2000),
                        },
                        {
                          id: "refine-user-3",
                          content: "公式開発者ブログと、Xでの開発者の反応を中心にしたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 1000),
                        },
                      ],
                      "ビジネストレンド分析": [
                        {
                          id: "refine-ai-1",
                          content: "この情報を追跡する目的を教えてください。\n例：\n・新規事業立案\n・競合調査\n・投資判断\n・営業トークのネタ作り など",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 6000),
                        },
                        {
                          id: "refine-user-1",
                          content: "新規事業立案です。\n2025年に注目されるSaaSやDXのトレンドを把握し、自社サービスの企画に活かしたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 5000),
                        },
                        {
                          id: "refine-ai-2",
                          content: "新規事業立案とのことですが、特にどの領域に関心がありますか？\n複数選択でも構いません。\n\n・Vertical SaaS（特定業界向け）\n・HR Tech / 働き方改革\n・Green Transformation (GX)\n・生成AI活用ビジネス\n・Web3 / ブロックチェーン",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 4000),
                        },
                        {
                          id: "refine-user-2",
                          content: "生成AI活用ビジネスと、Vertical SaaSの掛け合わせについて特に知りたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 3000),
                        },
                        {
                          id: "refine-ai-3",
                          content: "追跡する情報ソースについて、希望はありますか？\n例：\n・日経新聞・業界紙\n・ベンチャーキャピタルのレポート\n・スタートアップ企業のプレスリリース\n・ビジネス系ポッドキャスト",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 2000),
                        },
                        {
                          id: "refine-user-3",
                          content: "VCのレポートと、海外のテック系メディアのトレンド分析を中心にしたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 1000),
                        },
                      ],
                      "マーケティング戦略": [
                        {
                          id: "refine-ai-1",
                          content: "この情報を追跡する目的を教えてください。\n例：\n・自社ブランドの認知拡大\n・SNS運用改善\n・広告運用の効率化\n・Z世代のトレンド把握 など",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 6000),
                        },
                        {
                          id: "refine-user-1",
                          content: "Z世代のトレンド把握とSNS運用改善です。\n特にTikTokやInstagram Reelsでのショート動画マーケティングの最新事例を知りたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 5000),
                        },
                        {
                          id: "refine-ai-2",
                          content: "SNS運用改善とのことですが、特に重視したい指標や手法はありますか？\n複数選択でも構いません。\n\n・UGC（ユーザー生成コンテンツ）の活用\n・インフルエンサーマーケティング\n・アルゴリズムの最新動向\n・動画編集・制作トレンド\n・コンバージョン獲得手法",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 4000),
                        },
                        {
                          id: "refine-user-2",
                          content: "アルゴリズムの最新動向と、UGCの自然な発生を促すキャンペーン設計について特に知りたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 3000),
                        },
                        {
                          id: "refine-ai-3",
                          content: "追跡する情報ソースについて、希望はありますか？\n例：\n・各プラットフォーム公式発表\n・マーケティング専門メディア（Adweekなど）\n・著名マーケターのニュースレター\n・SNS上のトレンドタグ分析",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 2000),
                        },
                        {
                          id: "refine-user-3",
                          content: "マーケティング専門メディアと、実際にバズっている事例の解説記事を中心にしたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 1000),
                        },
                      ],
                      "テクノロジー最前線": [
                        {
                          id: "refine-ai-1",
                          content: "この情報を追跡する目的を教えてください。\n例：\n・R&Dテーマの探索\n・長期的な技術投資判断\n・知的好奇心\n・サイエンスニュースの収集 など",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 6000),
                        },
                        {
                          id: "refine-user-1",
                          content: "長期的な技術投資判断です。\n量子コンピューティングや核融合技術など、10年後の社会を変える技術の実用化マイルストーンを追いたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 5000),
                        },
                        {
                          id: "refine-ai-2",
                          content: "技術投資判断とのことですが、特に注目している分野はありますか？\n複数選択でも構いません。\n\n・量子コンピューティング（ゲート型/アニーリング型）\n・次世代エネルギー（核融合/水素）\n・バイオテクノロジー・ゲノム編集\n・宇宙開発\n・新素材・ナノテク",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 4000),
                        },
                        {
                          id: "refine-user-2",
                          content: "量子コンピューティングのエラー訂正技術の進展と、核融合の商用炉設計の進捗について特に知りたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 3000),
                        },
                        {
                          id: "refine-ai-3",
                          content: "追跡する情報ソースについて、希望はありますか？\n例：\n・学術論文誌（Nature/Science）\n・研究機関のプレスリリース（理研/MIT等）\n・技術系ニュースサイト\n・テック企業のR&Dブログ",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 2000),
                        },
                        {
                          id: "refine-user-3",
                          content: "Nature/Scienceなどの主要論文誌のサマリーと、主要プレイヤー（Google/IBM等）の発表を中心にしたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 1000),
                        },
                      ],
                      "UIデザインのトレンド": [
                        {
                          id: "refine-ai-1",
                          content: "この情報を追跡する目的を教えてください。\n例：\n・デザイン業務の参考\n・UI/UX改善提案\n・ポートフォリオ作成\n・デザイントレンドの把握 など",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 6000),
                        },
                        {
                          id: "refine-user-1",
                          content: "デザイン業務の参考です。\n2025年に流行しそうなWebデザインやアプリUIのスタイル、インタラクションのトレンドを先取りしたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 5000),
                        },
                        {
                          id: "refine-ai-2",
                          content: "デザイン業務の参考とのことですが、特に重視したい要素はありますか？\n複数選択でも構いません。\n\n・ビジュアルスタイル（Bento UI, Glassmorphism等）\n・マイクロインタラクション\n・3D・AR要素の活用\n・タイポグラフィ\n・アクセシビリティ・包括的デザイン",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 4000),
                        },
                        {
                          id: "refine-user-2",
                          content: "マイクロインタラクションと、空間コンピューティング時代を見据えた3D要素の活用について特に知りたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 3000),
                        },
                        {
                          id: "refine-ai-3",
                          content: "追跡する情報ソースについて、希望はありますか？\n例：\n・Dribbble/Behanceの人気作品\n・デザインアワード受賞作（Awwwards等）\n・デザインツール公式（Figma等）のアップデート\n・有名デザインブログ",
                          role: "assistant",
                          timestamp: new Date(Date.now() - 2000),
                        },
                        {
                          id: "refine-user-3",
                          content: "AwwwardsのTrendsセクションと、Figmaコミュニティで話題のプラグインやキットを中心にしたいです。",
                          role: "user",
                          timestamp: new Date(Date.now() - 1000),
                        },
                      ],
                    };

                    const defaultMessages: Message[] = [
                      {
                        id: "refine-ai-1",
                        content: "この情報を追跡する目的を教えてください。\n例：\n・投資判断\n・プロダクト企画\n・業界リサーチ\n・個人の情報収集 など",
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
                        content: "業界リサーチとのことですが、特に重視したい観点はありますか？\n複数選択でも構いません。\n\n・機能・技術（生成AI、オンデバイスAIなど）\n・ビジネス戦略・競争環境\n・プライバシー・規制対応\n・日本市場への影響\n・他社（OpenAI / Google / Microsoft等）との比較",
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
                        content: "追跡する情報ソースについて、希望はありますか？\n例：\n・Apple公式（発表、WWDC、プレスリリース）\n・海外メディア（Bloomberg, The Vergeなど）\n・日本語メディア\n・アナリストレポート",
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

                    const initialRefinementMessages = demoChatData[theme] || defaultMessages;

                    chat.setCurrentChatId(null);
                    chat.setRefinementMessages(initialRefinementMessages);
                    tracking.setIsTrackingDetailOpen(true);
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
                  chats={chat.chats}
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
                  promptId={trackingPromptId}
                  chats={chat.chats}
                  theme={theme}
                  readUpdateIds={readUpdateIds}
                  onMarkUpdateAsRead={handleMarkUpdateAsRead}
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
                  chats={chat.chats}
                  onSelectChat={chat.handleSelectChat}
                  onNewChat={() => {
                    setCurrentView("home");
                    chat.setCurrentChatId(null);
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
                  onClose={() => {
                    setCurrentView("home");
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex flex-col flex-1 overflow-hidden"
              >
                {/* Main Chat/Tracking View */}
                <div className="flex-1 flex overflow-hidden relative">
                  <div className={`flex flex-col h-full transition-all duration-300 ${tracking.isTrackingDetailOpen ? 'w-[35%]' : 'w-full'
                    }`}>
                    {tracking.isTrackingDetailOpen ? (
                      <TrackingRefinementChat
                        refinementMessages={chat.refinementMessages}
                        onSendMessage={(content) => {
                          const planId = tracking.trackingSuggestions.find((s) => s.accepted)?.planId;
                          chat.handleRefinementMessage(content, planId);
                        }}
                        currentMode={currentMode}
                        onModeChange={setCurrentMode}
                      />
                    ) : tracking.isDefaultModeDetailOpen ? (
                      <div className={`flex-1 overflow-y-auto flex flex-col items-center ${theme === 'dark'
                        ? 'bg-gradient-to-br from-[#1a1f2e] via-[#252a3a] to-[#2a1f2e]'
                        : 'bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]'
                        }`}>
                        <DefaultModeTrackingDetail
                          query={
                            tracking.trackingSuggestions.find((s) => s.accepted)?.query || ""
                          }
                          planId={tracking.trackingSuggestions.find((s) => s.accepted)?.planId}
                          frequency={tracking.activeTracking?.frequency || "毎日 9:00"}
                          scenario={currentScenario}
                          onExecute={() => {
                            if (chat.currentChatId) {
                              chat.setChats((prevChats) =>
                                prevChats.map((c) =>
                                  c.id === chat.currentChatId
                                    ? {
                                      ...c,
                                      isTracking: true,
                                      trackingActive: true,
                                      trackingFrequency: tracking.activeTracking?.frequency || "毎日 9:00",
                                    }
                                    : c,
                                ),
                              );
                            }
                            console.log("デフォルトモードでトラッキング実行");
                            tracking.setIsDefaultModeDetailOpen(false);
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className={`flex-1 overflow-y-auto flex flex-col items-center pb-4 ${theme === 'dark'
                          ? 'bg-gradient-to-br from-[#1a1f2e] via-[#252a3a] to-[#2a1f2e]'
                          : 'bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]'
                          }`}>
                          {chat.currentChat &&
                            chat.currentChat.messages.length > 0 ? (
                            <div className={`w-full mx-auto px-6 py-6 pb-32 transition-all duration-300 ${tracking.isTrackingDetailOpen ? 'max-w-full' : 'max-w-3xl'
                              }`}>
                              {(() => {
                                const messagesBeforeTracking = tracking.activeTracking?.startTime
                                  ? chat.currentChat.messages.filter(msg => msg.timestamp < tracking.activeTracking!.startTime!)
                                  : chat.currentChat.messages;

                                const messagesAfterTracking = tracking.activeTracking?.startTime
                                  ? chat.currentChat.messages.filter(msg => msg.timestamp >= tracking.activeTracking!.startTime!)
                                  : [];

                                return (
                                  <>
                                    {messagesBeforeTracking.map((message, index) => (
                                      <div key={message.id}>
                                        <ChatMessage message={message} />

                                        {message.role === "assistant" &&
                                          index > 0 &&
                                          messagesBeforeTracking[index - 1].role === "user" && (
                                            <>
                                              {tracking.trackingSuggestions.find(
                                                (s) =>
                                                  s.messageId ===
                                                  messagesBeforeTracking[index - 1].id && !s.accepted,
                                              ) && (
                                                  <>
                                                    <div className="max-w-4xl mx-auto mt-6 mb-4" ref={tracking.trackingSuggestionCardRef}>
                                                      <SimpleTrackingSetup

                                                        recommendedPrompt={
                                                          tracking.trackingSuggestions.find(
                                                            (s) =>
                                                              s.messageId ===
                                                              messagesBeforeTracking[index - 1].id,
                                                          )?.suggestedPrompt ||
                                                          "このトピックに関する最新情報を継続的に追跡し、重要な変化があれば通知してください。"
                                                        }
                                                        onExecuteTracking={() => {
                                                          const suggestion = tracking.trackingSuggestions.find(
                                                            (s) =>
                                                              s.messageId ===
                                                              messagesBeforeTracking[index - 1].id,
                                                          );
                                                          const trackingStartTime = new Date();
                                                          const theme = suggestion?.query || "Tracked Topic";

                                                          tracking.setActiveTracking({
                                                            theme: theme,
                                                            frequency: "毎日 9:00",
                                                            startTime: trackingStartTime,
                                                          });
                                                          tracking.setTrackingSuggestions(
                                                            (prev) =>
                                                              prev.map((s) =>
                                                                s.messageId === messagesBeforeTracking[index - 1].id
                                                                  ? { ...s, accepted: true }
                                                                  : s,
                                                              ),
                                                          );

                                                          if (chat.currentChatId) {
                                                            if (isAuthenticated) {
                                                              chatsApi.updateChat(chat.currentChatId, {
                                                                isTracking: true,
                                                                trackingActive: true,
                                                                trackingFrequency: "毎日 9:00",
                                                                thumbnail: suggestion?.imageUrl
                                                              }).catch(err => console.error("Failed to update chat tracking status", err));
                                                            }

                                                            chat.setChats((prevChats) =>
                                                              prevChats.map((c) =>
                                                                c.id === chat.currentChatId
                                                                  ? {
                                                                    ...c,
                                                                    isTracking: true,
                                                                    trackingActive: true,
                                                                    trackingFrequency: "毎日 9:00",
                                                                  }
                                                                  : c,
                                                              ),
                                                            );
                                                          }

                                                          console.log("追跡実行");
                                                        }}
                                                        onOpenDetailSettings={() => {
                                                          setIsSidebarOpen(false);
                                                          tracking.setIsTrackingDetailOpen(true);
                                                        }}
                                                      />
                                                    </div>
                                                  </>
                                                )}
                                            </>
                                          )}
                                      </div>
                                    ))}

                                    {tracking.activeTracking && !tracking.isTrackingDetailOpen && !tracking.isDefaultModeDetailOpen && (
                                      currentMode === "default" ? (
                                        <TrackingSuccessMessage
                                          theme={tracking.activeTracking.theme}
                                          frequency={tracking.activeTracking.frequency}
                                          onViewDetails={() => {
                                            tracking.setActiveTracking(null);
                                            tracking.setTrackingSuggestions((prev) =>
                                              prev.map((s) => ({
                                                ...s,
                                                accepted: false,
                                              }))
                                            );
                                            setTimeout(() => {
                                              tracking.trackingSuggestionCardRef.current?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start',
                                              });
                                            }, 100);
                                          }}
                                        />
                                      ) : (
                                        <TrackingStatusBadge
                                          ref={tracking.trackingStatusBadgeRef}
                                          theme={tracking.activeTracking.theme}
                                          frequency={tracking.activeTracking.frequency}
                                          onManage={() => {
                                            tracking.setIsTrackingDetailOpen(true);
                                            setIsSidebarOpen(false);
                                          }}
                                        />
                                      )
                                    )}

                                    {messagesAfterTracking.map((message) => (
                                      <div key={message.id}>
                                        <ChatMessage message={message} />
                                      </div>
                                    ))}
                                    {/* Typing Indicator */}
                                    {chat.isTyping && (
                                      <div className="flex justify-start mb-6 px-6">
                                        <div className={`rounded-2xl px-5 py-3 flex items-center space-x-1.5 ${theme === 'dark' ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-gray-100/80 backdrop-blur-sm'}`}>
                                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                                        </div>
                                      </div>
                                    )}

                                    <div className="h-4" />
                                  </>
                                );
                              })()}

                              <div ref={chatMessagesEndRef} />
                            </div>
                          ) : null}
                        </div>

                        {clarificationQuestions.length > 0 && (
                          <div className="px-4 pb-2 flex flex-wrap gap-2">
                            {clarificationQuestions.map((q, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setClarificationQuestions([]);
                                  chat.handleSendMessage(q);
                                }}
                                className="px-3 py-1.5 rounded-full border border-indigo-300 bg-indigo-50 text-indigo-700 text-sm hover:bg-indigo-100 transition-colors"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        )}
                        {chat.currentChat && (
                          <ChatInput
                            onSendMessage={(msg, att) => {
                              setClarificationQuestions([]);
                              chat.handleSendMessage(msg, att);
                            }}
                            isHome={false}
                            currentMode={currentMode}
                            onModeChange={setCurrentMode}
                          />
                        )}
                      </>
                    )}
                  </div>

                  <AnimatePresence>
                    {tracking.isTrackingDetailOpen && (
                      <TrackingDetail
                        isOpen={true}
                        onClose={() => {
                          tracking.setIsTrackingDetailOpen(false);
                          chat.setRefinementMessages([]);
                          // 画面を閉じる際に、表示すべきチャットがない場合はホームに戻る
                          const hasValidChat = chat.currentChatId && chat.chats.find(c => c.id === chat.currentChatId);
                          if (!hasValidChat) {
                            setTimeout(() => {
                              setCurrentView("home");
                            }, 300);
                          }
                        }}
                        theme={tracking.activeTracking?.theme || ""}
                        frequency={tracking.activeTracking?.frequency || "毎日 9:00"}
                        query={
                          tracking.trackingSuggestions.find((s) => s.accepted)?.query ||
                          "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向を教えてください。"
                        }
                        mode={currentMode}
                        scenario={currentScenario}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <UpdatePanel
          isOpen={isUpdatePanelOpen}
          onClose={() => setIsUpdatePanelOpen(false)}

          onSelectChat={chat.handleSelectChat}
          theme={theme}
          notifications={notifications}
          markAsRead={markAsRead}
          onFeedback={handleFeedback}
        />

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
          onLoadDemoData={chat.loadDemoData}
          onPlayDemoScenario={async () => {
            setIsSettingsModalOpen(false);
            setCurrentView("chat");

            // Helper for delay
            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            // Step 1: Starting
            setDemoStatus("デモシナリオを開始：ユーザー体験をシミュレーションします");
            await delay(1500);

            // Step 2: Create Chat
            setDemoStatus("1. 新規チャットの作成：分析テーマ用のスペースを準備中...");
            const newChatId = await chat.handleNewChat();
            await delay(1500);

            // Step 3: User Typing
            setDemoStatus("2. ユーザー入力：具体的な分析リクエストを送信中...");
            const userMessageId = (Date.now()).toString();
            const userMessage: Message = {
              id: userMessageId,
              content: "テスラの競合分析をお願いします。\n特にEV市場でのシェア推移と、自律走行技術における他社との比較について、最新の情報を基に教えてください。",
              role: "user",
              timestamp: new Date(),
            };
            const teslaThumbnail = "https://images.unsplash.com/photo-1560221328-12fe60f83ab8?crop=entropy&cs=tinysrgb&fit=maximum&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHx0ZXNsYSUyMGNhcnxlbnwwfHx8fDE3MjE2NzE1MzR8MA&ixlib=rb-4.0.3&q=80&w=1080";

            chat.setChats((prevChats) =>
              prevChats.map((c) =>
                c.id === newChatId
                  ? {
                    ...c,
                    title: "テスラの競合分析",
                    messages: [...c.messages, userMessage],
                    updatedAt: new Date(),
                    thumbnail: teslaThumbnail
                  }
                  : c
              )
            );
            await delay(2500);

            // Step 4: AI Analyzing
            setDemoStatus("3. AI分析：Perplexity APIを使用してWeb上の最新情報を検索・統合中...");
            await delay(3000);

            // Step 5: AI Response
            setDemoStatus("4. 回答生成：ソースに基づいた包括的なレポートを表示しました");
            const aiMessageId = (Date.now() + 1).toString();
            const aiMessage: Message = {
              id: aiMessageId,
              content: `テスラの市場シェアと自律走行技術における競合他社との比較について、最新の情報を基に詳細に分析いたします。

### 1. EV市場シェアの現況と推移
テスラは依然としてEVの世界販売で最大手ですが、直近数年はシェアの伸びが鈍化し、地域によっては競合に押されつつあります [1]。特に中国市場では価格競争が激化しており、BYDなどの地元メーカーが台頭しています [4]。

| 企業 | 強みの軸 | テスラに対する位置づけ |
| :--- | :--- | :--- |
| **テスラ** | ブランド、ソフトウェア、充電網 | 依然トップクラスのBEV販売と高い利益率だが、成長鈍化が課題 |
| **BYD** | 低価格、多車種、垂直統合 | 中国・一部海外で販売台数ベースではテスラを上回りつつある [1] |
| **既存OEM** | 販売網、ブランド力 | EVラインナップ拡充中だが、ソフト面・利益率で出遅れとされる |
| **新興EV** | ニッチセグメント | 台数は限定的だがブランド性や技術で存在感（Rivianなど） |

### 2. 自律走行技術 (FSD) の比較
テスラのFSD v12は「エンドツーエンドニューラルネットワーク」を採用し、人間のような滑らかな運転を実現しています [2]。一方、競合他社のアプローチは異なります。

*   **Waymo (Google系):** 高精度マップとLiDARを組み合わせたアプローチで、無人タクシーの商用化で先行しています [3]。限定エリアでの安全性は高い評価を得ています。
*   **中国勢 (Huawei/Xpeng):** 市街地NOA (Navigation on Autopilot) の展開速度が速く、中国国内ではテスラFSDに匹敵する性能を見せています。

### 結論
2024年はテスラにとって、EV販売の成長維持とFSDの完成度向上が問われる重要な年となります [5]。ロボタクシー事業への転換スピードが今後の勝敗を分ける鍵となるでしょう。`,
              role: "assistant",
              timestamp: new Date(),
              sources: 5,
              followUps: [
                "テスラのCybercab量産スケジュールと価格戦略",
                "BYDのEVシェアがテスラを上回った理由",
                "テスラFSDの安全性データ詳細",
                "NVIDIAのAlpamayoがテスラに与える影響"
              ]
            };

            chat.setChats((prevChats) =>
              prevChats.map((c) =>
                c.id === newChatId
                  ? { ...c, messages: [...c.messages, aiMessage], updatedAt: new Date() }
                  : c
              )
            );
            await delay(1500);

            // Step 6: Tracking Suggestion
            setDemoStatus("5. 追跡提案：継続的な情報収集のためのプランをAIが自動設計中...");
            tracking.setTrackingSuggestions((prev) => [
              ...prev,
              {
                messageId: userMessageId,
                query: "テスラの競合分析",
                accepted: false,
                suggestedPrompt: "テスラの市場シェアと自律走行技術の競合他社比較を継続的に追跡し、主要なアップデートを報告してください。",
              },
            ]);
            await delay(1500);

            setDemoStatus(null);
          }}
        />

        {/* Demo Status Banner */}
        <AnimatePresence>
          {demoStatus && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">{demoStatus}</span>
            </motion.div>
          )}
        </AnimatePresence>

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
    </AuthGuard>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}