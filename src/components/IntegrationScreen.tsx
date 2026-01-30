import React, { useState } from 'react';
import { IntegrationCard } from './IntegrationCard';
import { Github, Mail, Calendar, FileText, CheckSquare, FolderOpen, Music, Lightbulb, X, Menu } from 'lucide-react';

type Category = '仕事効率化' | 'メディア' | 'その他';

interface IntegrationScreenProps {
  onClose?: () => void;
  onBack?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function IntegrationScreen({ onClose, onBack, isSidebarOpen, onToggleSidebar }: IntegrationScreenProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('仕事効率化');
  const [integrations, setIntegrations] = useState({
    github: false,
    googleWorkspace: false,
    youtubeMusic: false,
    notion: false,
    ticktick: false,
  });

  const toggleIntegration = (key: keyof typeof integrations) => {
    setIntegrations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const categories: Category[] = ['仕事効率化', 'メディア', 'その他'];

  const getIntegrationsForCategory = (category: Category) => {
    switch (category) {
      case '仕事効率化':
        return (
          <>
            <IntegrationCard
              name="GitHub"
              handle="@GitHub"
              description="公開または非公開のリポジトリからコードをインポートし、それにいて質問できます。"
              icon={<Github className="w-6 h-6" />}
              isEnabled={integrations.github}
              onToggle={() => toggleIntegration('github')}
              actionText="添付したコードでは、どのような外部ライブラリが使用されている？"
            />
            <IntegrationCard
              name="Google Workspace"
              description="自身のコンテンツから、情報を要約・検索し、回答を素早く得ることができます"
              icon={
                <div className="flex items-center gap-0.5">
                  <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                  <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
                  <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                </div>
              }
              isEnabled={integrations.googleWorkspace}
              onToggle={() => toggleIntegration('googleWorkspace')}
              expandable
              subApps={[
                {
                  name: 'Gmail',
                  handle: '@Gmail',
                  icon: <Mail className="w-5 h-5 text-red-500" />,
                  detailLink: true,
                },
                {
                  name: 'Google Calendar',
                  handle: '@Google Calendar',
                  icon: <Calendar className="w-5 h-5 text-blue-500" />,
                  detailLink: true,
                },
                {
                  name: 'Google Keep',
                  handle: '@Google Keep',
                  icon: <Lightbulb className="w-5 h-5 text-yellow-600" />,
                  detailLink: true,
                },
                {
                  name: 'Google ToDo リスト',
                  handle: '@Google ToDo リスト',
                  icon: <CheckSquare className="w-5 h-5 text-blue-600" />,
                  detailLink: true,
                },
                {
                  name: 'Google ドキュメント',
                  handle: '@Google ドキュメント',
                  icon: <FileText className="w-5 h-5 text-blue-500" />,
                },
                {
                  name: 'Google ドライブ',
                  handle: '@Google ドライブ',
                  icon: <FolderOpen className="w-5 h-5 text-green-500" />,
                },
              ]}
            />
            <IntegrationCard
              name="Notion"
              handle="@Notion"
              description="Notionのワークスペースからページやデータベースにアクセスし、情報を要約・検索できます。"
              icon={
                <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center text-white text-sm">
                  N
                </div>
              }
              isEnabled={integrations.notion}
              onToggle={() => toggleIntegration('notion')}
            />
            <IntegrationCard
              name="TickTick"
              handle="@TickTick"
              description="TickTickのタスクやプロジェクトにアクセスし、情報を要約・検索できます。"
              icon={
                <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center text-white text-sm">
                  T
                </div>
              }
              isEnabled={integrations.ticktick}
              onToggle={() => toggleIntegration('ticktick')}
            />
          </>
        );
      case 'メディア':
        return (
          <IntegrationCard
            name="YouTube Music"
            handle="@YouTube Music"
            description="お気に入りの曲、アーティスト、プレイリストなどを再生、検索、発見"
            icon={<Music className="w-6 h-6 text-red-600" />}
            isEnabled={integrations.youtubeMusic}
            onToggle={() => toggleIntegration('youtubeMusic')}
            actionText="音楽を再生"
          />
        );
      case 'その他':
        return (
          <div className="text-center py-12 text-gray-500">
            その他のアプリ連携は近日公開予定です
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Fixed Header */}
      <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-6 pt-12 pb-6 bg-white">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-gray-900">アプリ連携</h1>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="閉じる"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          <p className="text-gray-600">
            お気に入りのアプリを接続して、よりスマートなサポートを受けましょう。{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-700">
              詳細
            </a>
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                activeCategory === category
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Category Title */}
        <h2 className="text-gray-900 mb-6">{activeCategory}</h2>
      </div>

      {/* Scrollable Integration Cards */}
      <div className="flex-1 min-h-0 bg-white" style={{ overflowY: 'scroll' }}>
        <div className="max-w-4xl mx-auto w-full px-6 pb-32">
          <div className="space-y-4">
            {getIntegrationsForCategory(activeCategory)}
          </div>
        </div>
      </div>
    </div>
  );
}