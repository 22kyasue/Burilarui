import { useState } from 'react';
import { SettingsMenu } from './SettingsMenu';
import { ChatInput, AttachedFile } from './ChatInput';




interface HomePageProps {
  onSendMessage?: (message: string, attachments?: AttachedFile[]) => void;
  onViewPlan?: () => void;
  onOpenTrackingDetail?: (theme: string, query: string) => void;
  theme?: 'light' | 'dark';
}

export function HomePage({ onSendMessage, onViewPlan, onOpenTrackingDetail, theme = 'light' }: HomePageProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);





  const suggestions = [
    {
      id: 7,
      title: 'Tesla Competitor Analysis',
      description: 'テスラの競合分析（EV・自動運転）',
      icon: '🚗',
      gradient: 'from-red-500 to-red-700',
    },
    {
      id: 5,
      title: 'Apple Intelligence',
      description: '最新の動向と日本市場への影響',
      icon: '🍎',
      gradient: 'from-gray-700 to-gray-900',
    },
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
    {
      id: 6,
      title: 'UIデザインのトレンド',
      description: '2025年のウェブデザインのトレンド',
      icon: '🎨',
      gradient: 'from-purple-400 to-pink-500',
    },
  ];

  const handleSuggestionClick = (title: string, description: string) => {
    // 4つのサジェスチョンは直接TrackingDetailを開く
    if (onOpenTrackingDetail) {
      onOpenTrackingDetail(title, description);
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
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion.title, suggestion.description)}
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}