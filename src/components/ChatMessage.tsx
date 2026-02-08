import { User, Sparkles, Share2, Download, Copy, RefreshCw, ExternalLink, Layers, X, FileText, ArrowRight, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types/chat';

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

      return content.split(/(\[[^[\]]+\])/g).map((part, index) => {
        // [1], [2] などの引用番号パターン
        const citationMatch = part.match(/^\[(\d+)\]$/);
        if (citationMatch) {
          const num = citationMatch[1];
          return (
            <button
              key={index}
              onClick={() => setShowSources(true)}
              className="inline-flex items-center justify-center w-5 h-5 ml-1 -mt-1 text-[10px] font-medium rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-all align-top transform hover:scale-110 active:scale-95 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {num}
            </button>
          );
        }

        // 既存の [provider:+number] パターン
        const badgeMatch = part.match(/^\[([\w\s]+)(?::\+(\d+))?\]$/);
        if (badgeMatch) {
          const provider = badgeMatch[1].toLowerCase();
          const count = badgeMatch[2];
          return (
            <span
              key={index}
              className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setShowSources(true)}
            >
              <span className="capitalize">{provider}</span>
              {count && <span className="text-gray-500 dark:text-gray-400">+{count}</span>}
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
      <h2 className={`text-lg font-semibold mt-8 mb-4 first:mt-0 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`} {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className={`text-base font-semibold mt-6 mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
        }`} {...props} />
    ),
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm text-left border-collapse" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => (
      <thead className={`text-xs uppercase font-semibold ${theme === 'dark' ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500'
        }`} {...props} />
    ),
    tbody: ({ node, ...props }: any) => (
      <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
        }`} {...props} />
    ),
    tr: ({ node, ...props }: any) => (
      <tr className={`transition-colors ${theme === 'dark' ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50/50'
        }`} {...props} />
    ),
    th: ({ node, ...props }: any) => (
      <th className="px-6 py-3 whitespace-nowrap" {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td className={`px-6 py-4 align-top leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`} {...props} />
    ),
    p: ({ node, children, ...props }: any) => {
      // 子供要素が文字列の場合のみ処理
      if (typeof children === 'string' || (Array.isArray(children) && children.some(c => typeof c === 'string' && c.includes('[')))) {
        return (
          <p className={`leading-7 mb-5 last:mb-0 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`} {...props}>
            {Array.isArray(children)
              ? children.map((child, i) => typeof child === 'string' ? <span key={i}>{renderContentWithSourceBadges(child)}</span> : child)
              : typeof children === 'string' ? renderContentWithSourceBadges(children) : children
            }
          </p>
        );
      }
      return <p className={`leading-7 mb-5 last:mb-0 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`} {...props}>{children}</p>;
    },
    ul: ({ node, ...props }: any) => (
      <ul className="space-y-3 mb-6 list-none ml-2" {...props} />
    ),
    li: ({ node, children, ...props }: any) => (
      <li className={`flex items-start gap-3 relative pl-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`} {...props}>
        <span className={`flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'}`} />
        <span className="flex-1 leading-relaxed">
          {Array.isArray(children)
            ? children.map((child, i) => typeof child === 'string' ? <span key={i}>{renderContentWithSourceBadges(child)}</span> : child)
            : typeof children === 'string' ? renderContentWithSourceBadges(children) : children
          }
        </span>
      </li>
    ),
    strong: ({ node, ...props }: any) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />
    ),
    a: ({ node, ...props }: any) => (
      <a className="text-indigo-500 hover:text-indigo-600 font-medium underline underline-offset-2 transition-colors" {...props} />
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

  // テスラ関連のソースデータ (モック)
  const sourcesData = [
    {
      id: 1,
      provider: 'Bloomberg',
      title: 'Global EV Market Share Report Q4 2023: BYD Overtakes Tesla',
      description: 'BYD became the world\'s top-selling electric car maker in the final quarter of 2023, overtaking Tesla as the Chinese company benefits from strong domestic demand.',
      url: '#',
    },
    {
      id: 2,
      provider: 'The Verge',
      title: 'Tesla FSD v12 Review: End-to-End Neural Net Changes Everything',
      description: 'Tesla\'s latest FSD update replaces hundreds of thousands of lines of code with a single end-to-end neural network, promising more human-like driving behavior.',
      url: '#',
    },
    {
      id: 3,
      provider: 'Reuters',
      title: 'Waymo vs Tesla: Autonomous Driving Comparison 2024',
      description: 'An in-depth comparison of Waymo\'s LIDAR-based approach versus Tesla\'s vision-only system in real-world urban driving scenarios.',
      url: '#',
    },
    {
      id: 4,
      provider: 'CNBC',
      title: 'China\'s EV Price War: Impact on Tesla\'s Margins',
      description: 'As Xiaomi and other tech giants enter the EV space, the price war in China intensifies, forcing established players like Tesla to reconsider their pricing strategy.',
      url: '#',
    },
    {
      id: 5,
      provider: 'TechCrunch',
      title: 'The State of Autonomous Driving in 2024',
      description: 'From Cruise\'s setbacks to Waymo\'s expansion and Tesla\'s FSD beta, we analyze the current state of self-driving technology and regulation.',
      url: '#',
    },
  ];

  return (
    <div className={`flex gap-4 mb-8 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white" />
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{message.content}</ReactMarkdown>
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

              {/* Follow-ups (Perplexity style) */}
              {message.role !== 'user' && message.followUps && message.followUps.length > 0 && (
                <div className="mt-6 border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-4 h-4" />
                    <span>Follow-ups</span>
                  </div>
                  <div className="space-y-2">
                    {message.followUps.map((question, idx) => (
                      <button
                        key={idx}
                        className={`w-full text-left flex items-center justify-between p-3 rounded-xl text-sm transition-all duration-200 group ${theme === 'dark'
                          ? 'bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/50 hover:border-indigo-500/30'
                          : 'bg-gray-50/80 hover:bg-white text-gray-700 hover:text-gray-900 border border-gray-100 hover:border-indigo-200 hover:shadow-sm'
                          }`}
                      >
                        <span>{question}</span>
                        <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'
                          }`} />
                      </button>
                    ))}
                  </div>
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
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-400/20">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}
