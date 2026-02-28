import { useState, useEffect } from 'react';
import { SettingsMenu } from './SettingsMenu';
import { ChatInput, AttachedFile } from './ChatInput';




interface HomePageProps {
  onSendMessage?: (message: string, attachments?: AttachedFile[]) => void;
  onViewPlan?: () => void;
  onOpenTrackingDetail?: (theme: string, query: string) => void;
  theme?: 'light' | 'dark';
}

interface Suggestion {
  id?: number;
  title: string;
  description: string;
  query?: string;
  icon: string;
  gradient: string;
}

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { id: 7, title: 'Tesla Competitor Analysis', description: 'テスラの競合分析（EV・自動運転）', query: 'テスラの競合分析（EV・自動運転）', icon: '🚗', gradient: 'from-red-500 to-red-700' },
  { id: 5, title: 'Apple Intelligence', description: '最新の動向と日本市場への影響', query: 'Apple Intelligenceの最新動向について', icon: '🍎', gradient: 'from-gray-700 to-gray-900' },
  { id: 1, title: '最新のAIモデルについて', description: '最新のLLMやマルチモーダルAIの動向を教えて', query: '最新のLLMやマルチモーダルAIの動向を教えて', icon: '🤖', gradient: 'from-indigo-400 to-purple-500' },
  { id: 2, title: 'ビジネストレンド分析', description: '今年注目のビジネストレンドを分析', query: '今年注目のビジネストレンドを分析してほしい', icon: '📊', gradient: 'from-cyan-400 to-blue-500' },
  { id: 3, title: 'マーケティング戦略', description: 'SNSを活用した最新のマーケティング手法', query: 'SNSを活用した最新マーケティング手法について', icon: '📱', gradient: 'from-pink-400 to-rose-500' },
  { id: 4, title: 'テクノロジー最前線', description: '量子コンピューティングの実用化状況', query: '量子コンピューティングの実用化最新状況', icon: '⚡', gradient: 'from-amber-400 to-orange-500' },
  { id: 6, title: 'UIデザインのトレンド', description: '2025年のウェブデザインのトレンド', query: '2025年のUIデザインのトレンドを教えて', icon: '🎨', gradient: 'from-purple-400 to-pink-500' },
];

export function HomePage({ onSendMessage, onViewPlan, onOpenTrackingDetail: _onOpenTrackingDetail, theme = 'light' }: HomePageProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(DEFAULT_SUGGESTIONS);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    fetch('/api/suggestions')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
        }
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => setLoadingSuggestions(false));
  }, []);


  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (onSendMessage) {
      onSendMessage(suggestion.query || suggestion.description);
    }
  };



  return (
    <div className={`flex-1 flex flex-col min-h-screen overflow-hidden transition-colors ${theme === 'dark'
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
            <h2 className="text-5xl mb-4 animate-stagger-in" style={{ animationDelay: '0.1s' }}>
              <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>お手伝いできることは</span>
            </h2>
            <h2 className="text-5xl animate-stagger-in" style={{ animationDelay: '0.25s' }}>
              <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>ありますか？</span>
            </h2>
          </div>

          {/* Search Input */}
          <div className="mb-4 animate-stagger-in" style={{ animationDelay: '0.4s' }}>
            <ChatInput
              onSendMessage={(message, attachments) => {
                if (onSendMessage) onSendMessage(message, attachments);
              }}
              isHome={true}
            />
          </div>

          {/* Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingSuggestions
              ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-5 border animate-pulse ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/60 border-gray-200/50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-300/50 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-300/50 rounded w-3/4" />
                      <div className="h-2 bg-gray-300/30 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))
              : suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id ?? index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`rounded-2xl p-5 border transition-all duration-300 text-left group animate-stagger-in ${theme === 'dark'
                    ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700/50 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 hover:bg-gray-800'
                    : 'bg-white/80 backdrop-blur-sm border-gray-200/50 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5'
                  }`}
                  style={{ animationDelay: `${0.5 + index * 0.08}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${suggestion.gradient} flex items-center justify-center flex-shrink-0 text-2xl shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold mb-1 text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                        {suggestion.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            }
          </div>
        </div>
      </main>
    </div>
  );
}