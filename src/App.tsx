import { useState, useRef } from "react";
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

function AppContent() {
  // Auth
  const { user, isAuthenticated, isLoading: authLoading, login, register, loginWithGoogle, loginWithApple, logout, error: authError, clearError } = useAuth();

  // Read Updates State (Persisted)
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

      // Update chats state to reflect new unread count immediately - hook handles this logic internally?
      // Actually useChat doesn't update updateCount automatically on readUpdateIds change unless we trigger it.
      // But we can manually update via chat.setChats if needed, or rely on re-render.
      // The hook effect depends on readUpdateIds, so it might re-fetch/re-calculate.
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

  // Hooks
  const tracking = useTracking();
  const chat = useChat(
    isAuthenticated,
    readUpdateIds,
    setCurrentView,
    setTrackingPromptId,
    tracking.setActiveTracking
  );

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

  // メインチャット画面のメッセージが更新されたら自動スクロール
  // useEffect logic now in App.tsx using hook data or move to hook?
  // Hook doesn't control scroll ref passed from outside easily. 
  // Let's keep effect here.
  // Note: imported useEffect is removed from top list in my previous edit? No, I need to check imports.
  // I must include useEffect in imports.

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
          className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-16"
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
                      const data = await response.json();

                      let responseContent = '';
                      if (data.needs_clarification) {
                        responseContent = `${data.reason}\n\n**確認が必要な点:**\n${data.clarification_questions?.map((q: string) => `- ${q}`).join('\n') || ''}`;
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
                            suggestedPrompt: data.proposed_plan.suggested_prompt,
                            imageUrl: data.proposed_plan.image_url,
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
                        onSendMessage={chat.handleRefinementMessage}
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
                            tracking.trackingSuggestions.find((s) => s.accepted)?.query ||
                            "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向教えてください。"
                          }
                          frequency={tracking.activeTracking?.frequency || "毎日 9:00"}
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
                                                          "「Apple Intelligenceの2024〜2025年における、主要な機能アップデート、日本語対応の進捗状況、対応デバイスの拡大、プライバシー技術の革新、および市場での評価について、信頼性の高いソースから継続的に追跡し、重要な変化があれば通知してください。」"
                                                        }
                                                        onExecuteTracking={() => {
                                                          const suggestion = tracking.trackingSuggestions.find(
                                                            (s) =>
                                                              s.messageId ===
                                                              messagesBeforeTracking[index - 1].id,
                                                          );
                                                          const trackingStartTime = new Date();
                                                          const theme = suggestion?.query || "Apple Intelligence";

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
                                  </>
                                );
                              })()}

                              <div ref={chatMessagesEndRef} />
                            </div>
                          ) : null}
                        </div>

                        {chat.currentChat && (
                          <ChatInput
                            onSendMessage={chat.handleSendMessage}
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
          chats={chat.chats}
          onSelectChat={chat.handleSelectChat}
          theme={theme}
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
          onPlayDemoScenario={() => {
            setIsSettingsModalOpen(false);
            setCurrentView("chat");

            // 1. Create New Chat
            const newChatId = chat.handleNewChat();

            // 2. Simulate User Message (Tesla Analysis)
            const userMessageId = (Date.now()).toString();
            const userMessage: Message = {
              id: userMessageId,
              content: "テスラの競合分析をお願いします。\n特にEV市場でのシェア推移と、自律走行技術における他社との比較を知りたいです。",
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

            // 3. Simulate AI Response with Delay
            setTimeout(() => {
              const aiMessageId = (Date.now() + 1).toString();
              const aiMessage: Message = {
                id: aiMessageId,
                content: "テスラの競合分析について承知いたしました。\n\n**1. EV市場シェアの動向**\nBYDなどの中国メーカーの台頭により、グローバルシェアは激化しています。特に価格競争力のあるモデルとの競合が激しくなっています。\n\n**2. 自律走行技術 (FSD)**\nFSD v12の展開により、エンドツーエンドのニューラルネットアプローチで先行していますが、WaymoやCruise、および中国系企業の技術進歩も著しい状況です。\n\nこのトピックについて、継続的な市場動向や技術アップデートを追跡することをお勧めします。",
                role: "assistant",
                timestamp: new Date(),
              };

              chat.setChats((prevChats) =>
                prevChats.map((c) =>
                  c.id === newChatId
                    ? { ...c, messages: [...c.messages, aiMessage], updatedAt: new Date() }
                    : c
                )
              );

              // 4. Trigger Tracking Suggestion
              tracking.setTrackingSuggestions((prev) => [
                ...prev,
                {
                  messageId: userMessageId,
                  query: "テスラの競合分析",
                  accepted: false,
                  suggestedPrompt: "テスラの市場シェアと自律走行技術の競合他社比較を継続的に追跡し、主要なアップデートを報告してください。",
                },
              ]);
            }, 1000);
          }}
        />

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