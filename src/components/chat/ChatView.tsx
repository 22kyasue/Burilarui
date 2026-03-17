import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Sparkles, User, Copy, RefreshCw, Share2, Radar, Pencil, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import PlusMenu from '../ui/PlusMenu';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  sources?: number;
  images?: string[];
}

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onTrackThis?: (query: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export default function ChatView({ messages, onSendMessage, isLoading, onTrackThis, onEditMessage }: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = inputValue.trim();
    if (!query || isLoading) return;
    onSendMessage(query);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
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

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleShare = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('コピーしました');
  };

  const handleRegenerate = (aiMessageId: string) => {
    const aiIndex = messages.findIndex(m => m.id === aiMessageId);
    if (aiIndex < 0) return;
    // Find the last user message before this AI message
    for (let i = aiIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        onSendMessage(messages[i].content);
        return;
      }
    }
  };

  const handleEditStart = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditedContent(message.content);
  };

  const handleEditSave = () => {
    if (!editingMessageId) return;
    if (onEditMessage) {
      onEditMessage(editingMessageId, editedContent);
    }
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  // Find the last user message for "Track this" button
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 mb-6 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {/* AI avatar */}
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`flex-1 max-w-3xl ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div
                    className={`rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 text-gray-800 dark:text-gray-200 border border-amber-200/50 dark:border-amber-700/50 px-4 py-3'
                        : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm px-5 py-4'
                    }`}
                  >
                    {message.role === 'user' ? (
                      editingMessageId === message.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={handleEditCancel}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <X className="w-3 h-3" />
                              キャンセル
                            </button>
                            <button
                              onClick={handleEditSave}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group/msg flex items-start gap-2">
                          <p className="whitespace-pre-wrap text-sm flex-1">{message.content}</p>
                          <button
                            onClick={() => handleEditStart(message)}
                            className="p-1 rounded-md hover:bg-amber-200/50 dark:hover:bg-amber-700/50 transition-colors opacity-0 group-hover/msg:opacity-100 flex-shrink-0"
                            title="編集"
                          >
                            <Pencil className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                      )
                    ) : (
                      <>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              h2: ({ children, ...props }) => (
                                <h2 className="text-base font-semibold mt-5 mb-2 first:mt-0 text-gray-900 dark:text-gray-100" {...props}>{children}</h2>
                              ),
                              h3: ({ children, ...props }) => (
                                <h3 className="text-sm font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props}>{children}</h3>
                              ),
                              p: ({ children, ...props }) => (
                                <p className="leading-relaxed mb-3 text-gray-700 dark:text-gray-300 text-sm" {...props}>{children}</p>
                              ),
                              ul: ({ children, ...props }) => (
                                <ul className="space-y-1.5 mb-3 ml-1" {...props}>{children}</ul>
                              ),
                              li: ({ children, ...props }) => (
                                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm" {...props}>
                                  <span className="text-gray-400 dark:text-gray-500 mt-1.5 text-xs">•</span>
                                  <span className="flex-1">{children}</span>
                                </li>
                              ),
                              strong: ({ children, ...props }) => (
                                <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>{children}</strong>
                              ),
                              a: ({ children, href, ...props }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline" {...props}>{children}</a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <button
                            onClick={() => handleCopy(message.content)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            title="コピー"
                          >
                            <Copy className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                          </button>
                          <button
                            onClick={() => handleShare(message.content)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            title="共有"
                          >
                            <Share2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                          </button>
                          <button
                            onClick={() => handleRegenerate(message.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            title="再生成"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                          </button>

                          {/* Track this button */}
                          {onTrackThis && lastUserMessage && (
                            <button
                              onClick={() => onTrackThis(lastUserMessage.content)}
                              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium hover:shadow-md transition-all"
                              title="この話題を追跡する"
                            >
                              <Radar className="w-3.5 h-3.5" />
                              追跡する
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* User avatar */}
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-6"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">考え中...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit}>
            <div className="relative rounded-2xl shadow-md border overflow-visible transition-all hover:shadow-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-gray-200/50 dark:border-gray-700/50">
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
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-1 py-2 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none bg-transparent resize-none text-gray-800 dark:text-gray-200 text-sm"
                  rows={1}
                  style={{ transition: 'height 0.15s ease' }}
                />

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className={`p-2 rounded-full transition-all ${
                      inputValue.trim() && !isLoading
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
