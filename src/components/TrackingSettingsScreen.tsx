import { useState } from 'react';
import { X, Clock, Bell, Mail, Calendar, Smartphone, Globe, Shield, ChevronRight, History } from 'lucide-react';

interface TrackingSettingsScreenProps {
  onClose?: () => void;

}

export function TrackingSettingsScreen({ onClose }: TrackingSettingsScreenProps) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    trackingReminder: true,
    autoArchive: false,
    shareAnalytics: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const settingSections = [
    {
      title: '通知設定',
      icon: Bell,
      description: 'トラッキングに関する通知の受信方法を管理します',
      items: [
        {
          id: 'emailNotifications',
          icon: Mail,
          label: 'メール通知',
          description: '重要なトラッキング更新をメールで受信',
          enabled: settings.emailNotifications,
        },
        {
          id: 'pushNotifications',
          icon: Smartphone,
          label: 'プッシュ通知',
          description: 'リアルタイムでトラッキング状態を通知',
          enabled: settings.pushNotifications,
        },
        {
          id: 'weeklyDigest',
          icon: Calendar,
          label: '週次レポート',
          description: '毎週月曜日にトラッキングサマリーを送信',
          enabled: settings.weeklyDigest,
        },
      ],
    },
    {
      title: 'トラッキング管理',
      icon: Clock,
      description: 'トラッキングの動作と保存に関する設定',
      items: [
        {
          id: 'trackingReminder',
          icon: Bell,
          label: 'リマインダー',
          description: '未完了のトラッキングを定期的に通知',
          enabled: settings.trackingReminder,
        },
        {
          id: 'autoArchive',
          icon: History,
          label: '自動アーカイブ',
          description: '30日経過したトラッキングを自動的にアーカイブ',
          enabled: settings.autoArchive,
        },
      ],
    },
    {
      title: 'プライバシーとデータ',
      icon: Shield,
      description: 'データの共有と保存に関する設定',
      items: [
        {
          id: 'shareAnalytics',
          icon: Globe,
          label: '使用状況データの共有',
          description: 'サービス改善のため匿名データを共有',
          enabled: settings.shareAnalytics,
        },
      ],
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0 overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-6 pt-12 pb-6 bg-white">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-gray-900">追跡設定</h1>
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
            トラッキング機能の動作をカスタマイズして、最適な体験を実現しましょう。
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 bg-white" style={{ overflowY: 'scroll' }}>
        <div className="max-w-4xl mx-auto w-full px-6 pb-32">
          <div className="space-y-10">
            {settingSections.map((section, sectionIndex) => {
              const SectionIcon = section.icon;
              return (
                <div key={sectionIndex} className="space-y-4">
                  {/* Section Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <SectionIcon className="w-5 h-5 text-indigo-600" />
                      <h2 className="text-gray-900">{section.title}</h2>
                    </div>
                    <p className="text-sm text-gray-500">{section.description}</p>
                  </div>

                  {/* Settings Cards */}
                  <div className="space-y-3">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              {/* Icon */}
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-indigo-600" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-gray-900 mb-1 text-base">
                                  {item.label}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            {/* Toggle Switch */}
                            <button
                              onClick={() => toggleSetting(item.id as keyof typeof settings)}
                              className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-all duration-300 ${item.enabled
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                  : 'bg-gray-300'
                                }`}
                              aria-label={`${item.label}を${item.enabled ? 'オフ' : 'オン'}にする`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${item.enabled ? 'translate-x-6' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Advanced Settings Section */}
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-gray-900 mb-2">詳細設定</h2>
                <p className="text-sm text-gray-500">その他の高度な設定とオプション</p>
              </div>

              <div className="space-y-3">
                {/* Export Data */}
                <button className="w-full bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-200 text-left group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 mb-1 text-base">
                          データのエクスポート
                        </h3>
                        <p className="text-sm text-gray-500">
                          すべてのトラッキングデータをダウンロード
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </button>

                {/* Delete All Tracking */}
                <button className="w-full bg-white border border-gray-200 rounded-2xl p-5 hover:border-red-200 hover:shadow-md transition-all duration-200 text-left group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center">
                        <X className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 mb-1 text-base">
                          すべてのトラッキングを削除
                        </h3>
                        <p className="text-sm text-gray-500">
                          保存されているすべてのトラッキングデータを削除
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                  </div>
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-900 mb-2 text-base">
                    トラッキング機能について
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Burilarのトラッキング機能は、重要な情報やタスクを継続的に監視し、変更があった際に通知します。プロジェクトの進捗管理や情報収集の効率化に最適です。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}