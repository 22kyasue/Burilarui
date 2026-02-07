import { User, Sparkles, Share2, Download, Copy, RefreshCw, ExternalLink, Layers, X, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: number;
  images?: string[];
  attachments?: {
    id: string;
    name: string;
    type: string;
    url?: string;
    size?: number;
  }[];
}

interface ChatMessageProps {
  message: Message;
  showWhiteBackground?: boolean; // ブラッシュアップページ用の白背景を表示するかどうか
  theme?: 'light' | 'dark';
}

export function ChatMessage({ message, showWhiteBackground, theme = 'light' }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [showSources, setShowSources] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // ソースバッジを解析してレンダリングする関数
  const renderContentWithSourceBadges = (content: string) => {
    if (!content || typeof content !== 'string') return content;

    try {
      // [provider:+number] または [provider] のパターンを検出
      if (!content.includes('[')) return content;

      const parts = content.split(/(\[\w\s]+(?::\+\d+)?\])/g);

      return parts.map((part, index) => {
        // ソースバッジのパターンにマッチするか確認
        const match = part.match(/\[([\w\s]+)(?::\+(\d+))?\]/);

        if (match) {
          const provider = match[1].toLowerCase();
          const count = match[2];

          return (
            <span
              key={index}
              className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
            >
              <span className="capitalize">{provider}</span>
              {count && <span className="text-gray-400">+{count}</span>}
            </span>
          );
        }

        return part;
      });
    } catch (e) {
      console.error('Error in renderContentWithSourceBadges:', e);
      return content;
    }
  };

  // マークダウンのカスタムコンポーネント
  const components = {
    h2: ({ node, ...props }: any) => (
      <h2 className={`text-lg font-semibold mt-6 mb-3 first:mt-0 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
        }`} {...props} />
    ),
    p: ({ node, children, ...props }: any) => {
      // 段落内のテキストをソースバッジ付きでレンダリング
      if (typeof children === 'string' && children.includes('[')) {
        return (
          <p className={`leading-relaxed mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
            }`} {...props}>
            {renderContentWithSourceBadges(children)}
          </p>
        );
      }
      return <p className={`leading-relaxed mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
        }`} {...props}>{children}</p>;
    },
    ul: ({ node, ...props }: any) => (
      <ul className="space-y-2 mb-4" {...props} />
    ),
    li: ({ node, children, ...props }: any) => {
      // リスト項目内のテキストをソースバッジ付きでレンダリング
      if (typeof children === 'string' && children.includes('[')) {
        return (
          <li className={`flex items-start gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
            }`} {...props}>
            <span className={`mt-1.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>•</span>
            <span className="flex-1">{renderContentWithSourceBadges(children)}</span>
          </li>
        );
      }

      // 複数の子要素がある場合（太字など）
      return (
        <li className={`flex items-start gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`} {...props}>
          <span className={`mt-1.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>•</span>
          <span className="flex-1 inline-flex flex-wrap items-center gap-1">
            {Array.isArray(children) ? children.map((child, index) => {
              if (typeof child === 'string' && child.includes('[')) {
                return <span key={index}>{renderContentWithSourceBadges(child)}</span>;
              }
              return <span key={index}>{child}</span>;
            }) : children}
          </span>
        </li>
      );
    },
    strong: ({ node, ...props }: any) => (
      <strong className="font-semibold text-gray-900" {...props} />
    ),
  };

  // アニメーション制御
  useEffect(() => {
    if (showSources) {
      // 開く時：まずDOMに追加してから、少し遅延してアニメーション開始
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      // 閉じる時：アニメーションが終わってからDOMから削除
      setIsAnimating(false);
    }
  }, [showSources]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowSources(false);
    }, 300); // アニメーション時間と同じ
  };

  // サンプルソースデータ
  const sourcesData = [
    {
      id: 1,
      provider: 'apple',
      title: 'Apple Intelligence is available today on iPhone, iPad, and ...',
      description: 'Through a free software update available today, iPhone, iPad, and Mac users can access the first set of Apple Intelligence features.',
      url: 'https://www.apple.com/newsroom/2024/10/apple-intelligence-is-available-today/',
    },
    {
      id: 2,
      provider: 'apple',
      title: 'Apple Intelligence gets even more powerful with new ...',
      description: 'Apple today announced new Apple Intelligence features that elevate the user experience across iPhone, iPad, Mac, Apple Watch, and Apple Vision Pro.',
      url: 'https://www.apple.com/newsroom/2024/12/apple-intelligence-new-features/',
    },
    {
      id: 3,
      provider: 'apple',
      title: 'New Apple Intelligence features are available today',
      description: 'Apple today released new Apple Intelligence features that elevate the user experience across iPhone, iPad, Mac, Apple Watch, and Apple Vision Pro.',
      url: 'https://www.apple.com/newsroom/2024/12/new-features-available/',
    },
    {
      id: 4,
      provider: '9to5mac',
      title: 'WWDC25: Apple\'s quieter AI play is a developer power move',
      description: 'Catch up on the most impactful announcements coming out of WWDC25.',
      url: 'https://9to5mac.com/2025/06/10/wwdc25-apple-ai-developer/',
    },
    {
      id: 5,
      provider: 'TechCrunch',
      title: 'Apple Intelligence: Everything you need to know about ...',
      description: 'Apple Intelligence was designed to leverage things that generative AI already does well, like text and image generation, to improve upon existing features.',
      url: 'https://techcrunch.com/2024/09/09/apple-intelligence-everything-you-need-to-know/',
    },
    {
      id: 6,
      provider: 'TechCrunch',
      title: 'You Won\'t Get These Apple Intelligence Features Until 2025',
      description: 'Apple plans to introduce the first Apple Intelligence features in iOS 18.1, debuting Writing Tools, notification summaries, smart replies, and more...',
      url: 'https://techcrunch.com/2024/10/22/apple-intelligence-features-2025/',
    },
  ];

  return (
    <div className={`flex gap-4 mb-8 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={`flex-1 max-w-3xl ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`rounded-2xl ${isUser
            ? theme === 'dark'
              ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40 text-gray-200 border border-indigo-700/50 px-4 py-3 backdrop-blur-sm'
              : 'bg-gradient-to-r from-indigo-100 to-purple-100 text-gray-800 border border-indigo-200/50 px-4 py-3'
            : showWhiteBackground
              ? theme === 'dark'
                ? 'bg-gray-800/90 backdrop-blur-sm border border-gray-700 shadow-sm px-6 py-5'
                : 'bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm px-6 py-5'
              : theme === 'dark'
                ? 'bg-transparent text-gray-200'
                : 'bg-transparent text-gray-800'
            }`}
        >
          {/* アシスタントメッセージの場合、アクションボタンとソース表示を追加 */}
          {!isUser && (
            <>
              {/* メッセージ内容 */}
              <div className="prose prose-sm max-w-none mb-4">
                <div className={`whitespace-pre-wrap leading-relaxed ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                  <ReactMarkdown components={components}>{message.content}</ReactMarkdown>
                </div>
              </div>

              {/* 画像表示 */}
              {message.images && message.images.length > 0 && (
                <div className={`grid gap-2 mb-3 ${message.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {message.images.map((imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`回答に関連する画像 ${index + 1}`}
                      className="w-full h-auto max-w-xs rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    />
                  ))}
                </div>
              )}

              {/* ソースボタン - アクションボタンの上に配置 */}
              {message.sources && message.sources > 0 && (
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm font-medium shadow-sm backdrop-blur-sm ${theme === 'dark'
                      ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white border border-gray-600/50'
                      : 'bg-gray-800/90 hover:bg-gray-700/90 text-white'
                      }`}
                  >
                    <Layers className="w-4 h-4" />
                    {message.sources} sources
                  </button>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-lg transition-colors group ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  title="共有"
                >
                  <Share2 className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-800'
                    }`} />
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors group ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  title="アップロード"
                >
                  <Download className={`w-4 h-4 rotate-180 ${theme === 'dark' ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-800'
                    }`} />
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors group ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  title="ダウンロード"
                >
                  <Download className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-800'
                    }`} />
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors group ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  title="コピー"
                >
                  <Copy className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-800'
                    }`} />
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors group ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  title="リフレッシュ"
                >
                  <RefreshCw className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-800'
                    }`} />
                </button>
              </div>

              {/* ソースモーダル */}
              {showSources && message.sources && (
                <>
                  {/* オーバーレイ */}
                  <div
                    className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'
                      }`}
                    onClick={handleClose}
                  />

                  {/* サイドパネル */}
                  <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isAnimating ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                    {/* ヘッダー */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-gray-300" />
                        <h3 className="text-white font-semibold">{message.sources} sources</h3>
                      </div>
                      <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400 hover:text-gray-200" />
                      </button>
                    </div>

                    {/* ソースリスト */}
                    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-4">
                      <div className="space-y-4">
                        {sourcesData.slice(0, message.sources).map((source) => (
                          <a
                            key={source.id}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              {/* プロバイダーアイコン */}
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-medium text-gray-300">
                                  {source.provider === 'apple' ? '🍎' :
                                    source.provider === '9to5mac' ? '📱' :
                                      '📰'}
                                </span>
                              </div>

                              {/* コンテンツ */}
                              <div className="flex-1 min-w-0">
                                {/* プロバイダー名 */}
                                <div className="text-xs text-gray-500 mb-1 capitalize">
                                  {source.provider}
                                </div>

                                {/* タイトル */}
                                <div className="text-sm text-white font-medium mb-1.5 group-hover:text-indigo-300 transition-colors line-clamp-2">
                                  {source.title}
                                </div>

                                {/* 説明 */}
                                <div className="text-xs text-gray-400 line-clamp-2">
                                  {source.description}
                                </div>
                              </div>

                              {/* リンクアイコン */}
                              <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 flex-shrink-0 mt-1 transition-colors" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ユーザーメッセージの場合はシンプルに表示 */}
          {isUser && (
            <div>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap justify-end gap-2 mt-2">
                  {message.attachments.map((file, index) => (
                    <div
                      key={index}
                      className={`relative overflow-hidden rounded-xl border ${theme === 'dark' ? 'border-indigo-700/50 bg-indigo-900/20' : 'border-indigo-200/50 bg-white/50'
                        }`}
                    >
                      {file.type.startsWith('image/') && file.url ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-32 w-auto object-cover"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-3">
                          <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium truncate max-w-[150px] ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                              {file.name}
                            </span>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                              {file.size ? (file.size / 1024).toFixed(0) + ' KB' : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}
