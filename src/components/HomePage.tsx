import { Grid3x3, List, Check, Plus, MoreVertical, Users, Menu, ChevronDown, Search, Settings, Bell, Mic, Send, Paperclip, Image, Telescope, ShoppingBag, Bot, MoreHorizontal, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';
import { SettingsMenu } from './SettingsMenu';
import { ModeSelector } from './ModeSelector';

interface Chat {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>;
  updatedAt: Date;
  pinned?: boolean;
  isTracking?: boolean;
  trackingActive?: boolean;
  updateCount?: number;
  thumbnail?: string;
  category?: string;
}

interface HomePageProps {
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSendMessage?: (message: string) => void;
  onViewPlan?: () => void;
  onViewUpdatePanel?: () => void;
  currentMode?: "default" | "pro";
  onModeChange?: (mode: "default" | "pro") => void;
  onOpenTrackingDetail?: (theme: string, query: string) => void;
  theme?: 'light' | 'dark';
}

export function HomePage({ chats, onSelectChat, onNewChat, isSidebarOpen, onToggleSidebar, onSendMessage, onViewPlan, onViewUpdatePanel, currentMode, onModeChange, onOpenTrackingDetail, theme = 'light' }: HomePageProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 未読カウントを計算
  const unreadCount = chats.filter(chat => chat.isTracking && chat.updateCount && chat.updateCount > 0).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Shift+Enterは改行として処理される（デフォルトの動作）
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea with smooth animation
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  };

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

  const handleSuggestionClick = (title: string, description: string) => {
    // 4つのサジェスチョンは直接TrackingDetailを開く
    if (onOpenTrackingDetail) {
      onOpenTrackingDetail(title, description);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // ファイル処理のロジックをここに追加
      console.log('Selected files:', files);
      setIsPlusMenuOpen(false);
    }
  };

  const plusMenuItems = [
    {
      icon: <Paperclip className="w-5 h-5" />,
      label: '写真とファイルを追加',
      onClick: handleFileUpload,
    },
    {
      icon: <Image className="w-5 h-5" />,
      label: '画像を作成する',
      onClick: () => {
        console.log('画像を作成する');
        setIsPlusMenuOpen(false);
      },
    },
    {
      icon: <Telescope className="w-5 h-5" />,
      label: 'Deep Research',
      onClick: () => {
        console.log('Deep Research');
        setIsPlusMenuOpen(false);
      },
    },
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      label: 'ショッピング アシスタント',
      onClick: () => {
        console.log('ショッピング アシスタント');
        setIsPlusMenuOpen(false);
      },
    },
    {
      icon: <Bot className="w-5 h-5" />,
      label: 'エージェントモード',
      onClick: () => {
        console.log('エージェントモード');
        setIsPlusMenuOpen(false);
      },
    },
    {
      icon: <MoreHorizontal className="w-5 h-5" />,
      label: 'さらに表示',
      onClick: () => {
        console.log('さらに表示');
        setIsPlusMenuOpen(false);
      },
      showArrow: true,
    },
  ];

  return (
    <div className={`flex-1 flex flex-col min-h-screen overflow-hidden transition-colors ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-[#1a1f2e] via-[#252a3a] to-[#2a1f2e]'
        : 'bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]'
    }`}>
      {/* Settings Menu */}
      <SettingsMenu 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onViewPlan={() => {
          setIsSettingsOpen(false);
          if (onViewPlan) onViewPlan();
        }}
      />

      {/* Main Content - Centered Search */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <h2 className="text-5xl mb-4">
              <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>お手伝いできることは</span>
            </h2>
            <h2 className="text-5xl">
              <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>ありますか？</span>
            </h2>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className={`relative rounded-3xl shadow-lg border overflow-visible transition-all hover:shadow-xl ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="flex items-start gap-2 px-2 py-2">
                {/* Plus button with dropdown */}
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    aria-label="メニューを開く"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  
                  {/* Plus Menu Dropdown */}
                  {isPlusMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsPlusMenuOpen(false)}
                      />
                      
                      {/* Menu */}
                      <div className={`absolute left-0 top-full mt-2 w-64 rounded-2xl shadow-xl border py-2 z-20 ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        {plusMenuItems.map((item, index) => (
                          <button
                            key={index}
                            onClick={item.onClick}
                            className={`w-full px-4 py-3 flex items-center justify-between transition-colors text-left ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                                {item.icon}
                              </div>
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{item.label}</span>
                            </div>
                            {item.showArrow && (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="質問してみましょう"
                  style={{ transition: 'height 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  className={`flex-1 px-2 py-2 placeholder-gray-400 focus:outline-none bg-transparent resize-none ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  }`}
                  rows={1}
                />

                {/* Right buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    aria-label="音声入力"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className={`p-2 rounded-full transition-all ${
                      inputValue.trim()
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label="送信"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion.title, suggestion.description)}
                className={`rounded-2xl p-5 border transition-all text-left group ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 hover:border-indigo-500 hover:shadow-lg'
                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${suggestion.gradient} flex items-center justify-center flex-shrink-0 text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                    {suggestion.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold mb-1 text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                      {suggestion.title}
                    </h3>
                    <p className={`text-xs line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}