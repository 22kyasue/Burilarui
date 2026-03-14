import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Chat, ChatMessage } from '../types/chat';
import * as chatApi from '../api/chats';

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const list = await chatApi.getChats();
      setChats(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch chats';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createChat = useCallback(async (title?: string) => {
    try {
      const chat = await chatApi.createChat({ title });
      setChats(prev => [chat, ...prev]);
      setCurrentChat(chat);
      return chat;
    } catch (e) {
      toast.error('Failed to create chat');
      return null;
    }
  }, []);

  const selectChat = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const chat = await chatApi.getChat(id);
      setCurrentChat(chat);
      return chat;
    } catch (e) {
      toast.error('Failed to load chat');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentChat) return null;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    // Optimistically add user message
    setCurrentChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage],
    } : prev);

    try {
      const updatedChat = await chatApi.addMessage(currentChat.id, {
        id: userMessage.id,
        content: userMessage.content,
        role: userMessage.role,
        timestamp: userMessage.timestamp,
      });

      // Update with server response (includes AI message)
      setCurrentChat({
        ...updatedChat,
      });

      // Update chat list
      setChats(prev => prev.map(c =>
        c.id === updatedChat.id ? updatedChat : c
      ));

      return updatedChat;
    } catch (e) {
      toast.error('Failed to send message');
      // Revert optimistic update
      setCurrentChat(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(m => m.id !== userMessage.id),
      } : prev);
      return null;
    }
  }, [currentChat]);

  const deleteChat = useCallback(async (id: string) => {
    try {
      await chatApi.deleteChat(id);
      setChats(prev => prev.filter(c => c.id !== id));
      if (currentChat?.id === id) {
        setCurrentChat(null);
      }
      return true;
    } catch (e) {
      toast.error('Failed to delete chat');
      return false;
    }
  }, [currentChat]);

  const clearCurrentChat = useCallback(() => {
    setCurrentChat(null);
  }, []);

  return {
    chats,
    currentChat,
    loading,
    error,
    fetchChats,
    createChat,
    selectChat,
    sendMessage,
    deleteChat,
    clearCurrentChat,
  };
}
