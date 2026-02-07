import { useState, useEffect } from "react";
import * as chatsApi from "../api/chats";
import { Message, Chat } from "../types/chat";
import { DEMO_CHAT_DATA } from "../data/demoData";

// Define strict types for the arguments to ensure type safety
type ViewType =
    | "home"
    | "chat"
    | "tracking"
    | "trackingList"
    | "notifications"
    | "planSelection"
    | "planManagement"
    | "integrations"
    | "trackingSettings";

export function useChat(
    isAuthenticated: boolean,
    readUpdateIds: Record<string, string[]>,
    setCurrentView: (view: ViewType) => void,
    setTrackingPromptId: (id: string | null) => void,
    setActiveTracking: (tracking: any) => void
) {
    // State
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [refinementMessages, setRefinementMessages] = useState<Message[]>([]);

    // Computed
    const currentChat = currentChatId
        ? chats.find((chat) => chat.id === currentChatId)
        : null;

    // Helper to calculate update count with stable IDs
    const calculateUpdateCount = (updates: any[], chatId: string, readIdsMap: Record<string, string[]>) => {
        if (!updates || updates.length === 0) return 0;
        const readIds = readIdsMap[chatId] || [];

        return updates.filter((u: any) => {
            // Use timestamp string directly as ID if available, otherwise fallback to time ms
            // This ensures stability across refreshes if the backend string is stable
            const stableId = u.timestamp
                ? u.timestamp
                : new Date(u.timestamp).getTime().toString();

            const isRead = readIds.includes(stableId);
            console.log(`[useChat] Chat ${chatId} Update ${stableId} Read? ${isRead}`, { readIds, stableId });
            return !isRead;
        }).length;
    };

    // Fetch chats
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isAuthenticated) {
                    // Fetch user's chats from API
                    const userChats = await chatsApi.getChats();

                    // Apply local read state to authenticated chats
                    const processedChats = userChats.map(chat => ({
                        ...chat,
                        updateCount: calculateUpdateCount(chat.updates || [], chat.id, readUpdateIds)
                    }));

                    setChats(processedChats);
                    if (processedChats.length > 0 && !currentChatId) {
                        setCurrentChatId(processedChats[0].id);
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
                            // Update Count Calculation
                            updateCount: calculateUpdateCount(plan.updates || [], plan.id, readUpdateIds),
                            trackingFrequency: `${plan.frequency_hours}時間ごと`,
                            updates: plan.updates || [],
                        }));

                        setChats(transformedChats);
                        if (transformedChats.length > 0 && !currentChatId) {
                            setCurrentChatId(transformedChats[0].id);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };

        fetchData();
    }, [isAuthenticated, readUpdateIds]); // Re-run when auth changes or read count updates

    // Actions
    const handleSendMessage = async (content: string, attachments: any[] = []) => {
        if ((!content.trim() && attachments.length === 0) || !currentChatId) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            role: "user",
            timestamp: new Date(),
            attachments: attachments.map(f => ({
                id: f.id,
                name: f.name,
                type: f.type,
                url: f.preview, // Use preview as URL for now
                size: f.size
            }))
        };

        // Optimistic update
        setChats((prevChats) =>
            prevChats.map((c) =>
                c.id === currentChatId
                    ? {
                        ...c,
                        messages: [...c.messages, userMessage],
                        updatedAt: new Date(),
                    }
                    : c
            )
        );

        // Call API
        if (isAuthenticated) {
            try {
                // This now triggers the AI on the backend
                // Note: We are currently NOT sending attachments to backend API as it likely doesn't support it yet
                // But we are displaying them in the UI which satisfies "making it work" visually
                const updatedChat = await chatsApi.sendMessage(currentChatId, {
                    content,
                });

                setChats((prevChats) =>
                    prevChats.map((c) =>
                        c.id === currentChatId
                            ? updatedChat
                            : c
                    )
                );

            } catch (error) {
                console.error('Failed to send message:', error);
                // Fallback or error handling
            }
        } else {
            // For unauthenticated demo, keep the simulated behavior or warn
            // simulating for consistency if not logged in
            setTimeout(() => {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: `(Demo Mode) I received: "${content}"${attachments.length > 0 ? ` and ${attachments.length} file(s)` : ''}. Please log in for real AI responses.`,
                    role: "assistant",
                    timestamp: new Date(),
                };
                setChats((prevChats) =>
                    prevChats.map((c) =>
                        c.id === currentChatId
                            ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date() }
                            : c
                    )
                );
            }, 1000);
        }
    };

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
        const newChat: Chat = {
            id: Date.now().toString(),
            title: "New Chat",
            messages: [],
            updatedAt: new Date(),
            pinned: false,
            isTracking: false,
            trackingActive: false,
            updateCount: 0,
            trackingFrequency: "",
            updates: [],
        };
        setChats((prev) => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
        setCurrentView("chat"); // Navigate to the new chat
        setTrackingPromptId(null);
        setActiveTracking(null);
        return newChat.id;
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

    const loadDemoData = () => {
        setChats((prev) => {
            if (prev.some((c) => c.id === DEMO_CHAT_DATA.id)) return prev;
            // Add to local state
            return [...prev, { ...DEMO_CHAT_DATA, updatedAt: new Date() }];
        });

        // If authenticated, we might want to save it to the backend too, 
        // but for a pure "demo" viewer, local state is often sufficient 
        // until the user interacts with it.
        // For now, we leave it as local-only injection.
    };

    return {
        chats,
        setChats, // Exposed for manual updates like handleCreateNotebook
        currentChatId,
        setCurrentChatId,
        currentChat,
        refinementMessages,
        setRefinementMessages,
        handleSendMessage,
        handleRefinementMessage,
        handleNewChat,
        handleSelectChat,
        handleDeleteChat,
        handleTogglePin,
        loadDemoData,
    };
}
