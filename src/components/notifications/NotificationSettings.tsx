import { useState, useCallback } from 'react';
import { Bell, Pin } from 'lucide-react';
import { toast } from 'sonner';
import { useTracking } from '../../hooks/useTracking';
import type { TrackingListItem } from '../../types/tracking';

interface NotificationSettingsProps {
  trackings: TrackingListItem[];
  onBack: () => void;
}

interface PromptSettings {
  frequency: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notifyOnNewUpdate: boolean;
  notifyOnDailyDigest: boolean;
  notifyOnWeeklyDigest: boolean;
  notificationDetail: 'summary' | 'normal' | 'detailed';
}

const defaultSettings: PromptSettings = {
  frequency: 'daily',
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  notifyOnNewUpdate: true,
  notifyOnDailyDigest: false,
  notifyOnWeeklyDigest: false,
  notificationDetail: 'summary',
};

const frequencyOptions = [
  { label: '1h', value: 'hourly' },
  { label: '6h', value: '6h' },
  { label: '12h', value: '12h' },
  { label: '1d', value: 'daily' },
  { label: '3d', value: '3d' },
  { label: '1w', value: 'weekly' },
];

export default function NotificationSettings({ trackings, onBack: _onBack }: NotificationSettingsProps) {
  const { updateTracking } = useTracking();
  const activeTrackings = trackings.filter(t => t.isActive);

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [promptSettings, setPromptSettings] = useState<Record<string, PromptSettings>>({});
  const [standardSettings, setStandardSettings] = useState<PromptSettings>(defaultSettings);

  const getCurrentSettings = (): PromptSettings => {
    if (selectedPromptId === null) return standardSettings;
    return promptSettings[selectedPromptId] || { ...standardSettings };
  };

  const updateCurrentSettings = (updates: Partial<PromptSettings>) => {
    if (selectedPromptId === null) {
      setStandardSettings(prev => ({ ...prev, ...updates }));
    } else {
      setPromptSettings(prev => ({
        ...prev,
        [selectedPromptId]: {
          ...(prev[selectedPromptId] || standardSettings),
          ...updates,
        },
      }));
    }
  };

  const currentSettings = getCurrentSettings();

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${days}日前`;
  };

  const handleSave = useCallback(async () => {
    if (selectedPromptId) {
      const settings = getCurrentSettings();
      const frequencyMap: Record<string, string> = {
        'hourly': 'hourly',
        '6h': 'custom',
        '12h': 'custom',
        'daily': 'daily',
        '3d': 'custom',
        'weekly': 'weekly',
      };
      await updateTracking(selectedPromptId, {
        frequency: (frequencyMap[settings.frequency] || 'daily') as any,
        notificationEnabled: settings.emailNotifications || settings.pushNotifications || settings.inAppNotifications,
        emailEnabled: settings.emailNotifications,
        pushEnabled: settings.pushNotifications,
        detailLevel: settings.notificationDetail,
      });
    }
    toast.success('設定を保存しました');
  }, [selectedPromptId, updateTracking]);

  return (
    <div className="min-h-full bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl text-gray-900 dark:text-gray-100 mb-2 font-semibold">通知設定</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">追跡検索の頻度と通知形式を管理</p>
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6 min-h-[calc(100vh-260px)]">
          {/* Left: Prompt list */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-8 shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30">
                <h2 className="text-sm text-gray-700 dark:text-gray-300 font-semibold">通知設定の管理</h2>
              </div>

              <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                {/* Standard settings */}
                <button
                  onClick={() => setSelectedPromptId(null)}
                  className={`w-full p-4 text-left border-b border-gray-100 dark:border-gray-800 transition-colors ${
                    selectedPromptId === null
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-l-4 border-l-amber-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate font-semibold">スタンダード設定</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">全てのプロンプトのデフォルト</p>
                    </div>
                  </div>
                </button>

                {/* Tracked prompts */}
                {activeTrackings.map(tracking => (
                  <button
                    key={tracking.id}
                    onClick={() => setSelectedPromptId(tracking.id)}
                    className={`w-full p-4 text-left border-b border-gray-100 dark:border-gray-800 transition-colors ${
                      selectedPromptId === tracking.id
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-l-4 border-l-amber-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        tracking.isActive ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate font-medium">{tracking.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatTimeAgo(tracking.updatedAt)}</p>
                      </div>
                      {tracking.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                    </div>
                  </button>
                ))}

                {activeTrackings.length === 0 && (
                  <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
                    追跡中のプロンプトはありません
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Settings form */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {selectedPromptId === null
                  ? 'スタンダード設定'
                  : activeTrackings.find(t => t.id === selectedPromptId)?.title || '設定'}
              </h2>

              {/* Frequency */}
              <div className="mb-8">
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-3 font-medium flex items-center gap-2">
                  <span className="text-amber-600">🔄</span>
                  追跡検索の頻度
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  このプロンプトに対して、どのくらいの頻度で新しい情報を検索するかを設定します
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {frequencyOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateCurrentSettings({ frequency: opt.value })}
                      className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        currentSettings.frequency === opt.value
                          ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Methods */}
              <div className="mb-8">
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-3 font-medium flex items-center gap-2">
                  <span className="text-orange-600">🔔</span>
                  通知形式
                </label>
                <div className="space-y-3">
                  {/* Email */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-amber-100 dark:border-amber-800 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 flex items-center justify-center">
                        <span className="text-lg">✉️</span>
                      </div>
                      <div>
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">メール通知</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">登録メールアドレスに通知を送信</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateCurrentSettings({ emailNotifications: !currentSettings.emailNotifications })}
                      className={`w-12 h-6 rounded-full relative transition-all ${
                        currentSettings.emailNotifications
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                        currentSettings.emailNotifications ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Push */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-orange-100 dark:border-orange-800 bg-gradient-to-r from-orange-50/50 to-pink-50/50 dark:from-orange-900/20 dark:to-pink-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 flex items-center justify-center">
                        <span className="text-lg">📱</span>
                      </div>
                      <div>
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">プッシュ通知</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">モバイルデバイスに通知を送信</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateCurrentSettings({ pushNotifications: !currentSettings.pushNotifications })}
                      className={`w-12 h-6 rounded-full relative transition-all ${
                        currentSettings.pushNotifications
                          ? 'bg-gradient-to-r from-orange-500 to-pink-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                        currentSettings.pushNotifications ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* In-app */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-pink-100 dark:border-pink-800 bg-gradient-to-r from-pink-50/50 to-amber-50/50 dark:from-pink-900/20 dark:to-amber-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-700 flex items-center justify-center">
                        <span className="text-lg">💬</span>
                      </div>
                      <div>
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">アプリ内通知</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Burilarアプリ内で通知を表示</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateCurrentSettings({ inAppNotifications: !currentSettings.inAppNotifications })}
                      className={`w-12 h-6 rounded-full relative transition-all ${
                        currentSettings.inAppNotifications
                          ? 'bg-gradient-to-r from-pink-500 to-amber-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                        currentSettings.inAppNotifications ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Timing */}
              <div className="mb-8">
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-3 font-medium flex items-center gap-2">
                  <span className="text-pink-600">⏰</span>
                  通知のタイミング
                </label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                    currentSettings.notifyOnNewUpdate
                      ? 'border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30'
                      : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-900/20'
                  }`}>
                    <input
                      type="checkbox"
                      checked={currentSettings.notifyOnNewUpdate}
                      onChange={() => updateCurrentSettings({ notifyOnNewUpdate: !currentSettings.notifyOnNewUpdate })}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-amber-400 text-amber-600 focus:ring-2 focus:ring-amber-200"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">新しいアップデートがあった時</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">追跡中のプロンプトに新しい情報が見つかった時に即座に通知</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                    currentSettings.notifyOnDailyDigest
                      ? 'border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30'
                      : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-900/20'
                  }`}>
                    <input
                      type="checkbox"
                      checked={currentSettings.notifyOnDailyDigest}
                      onChange={() => updateCurrentSettings({ notifyOnDailyDigest: !currentSettings.notifyOnDailyDigest })}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-200"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">日次ダイジェスト</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">1日のアップデートをまとめて通知（毎日午前9時）</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                    currentSettings.notifyOnWeeklyDigest
                      ? 'border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30'
                      : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-900/20'
                  }`}>
                    <input
                      type="checkbox"
                      checked={currentSettings.notifyOnWeeklyDigest}
                      onChange={() => updateCurrentSettings({ notifyOnWeeklyDigest: !currentSettings.notifyOnWeeklyDigest })}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-200"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">週次ダイジェスト</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">1週間のアップデートをまとめて通知（毎週月曜午前9時）</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Detail Level */}
              <div className="mb-8">
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-3 font-medium flex items-center gap-2">
                  <span className="text-amber-600">📊</span>
                  通知の詳細度
                </label>
                <div className="space-y-2">
                  {(['summary', 'normal', 'detailed'] as const).map(level => {
                    const labels: Record<string, { title: string; desc: string }> = {
                      summary: { title: '概要のみ', desc: 'アップデートのタイトルと簡単な要約のみ' },
                      normal: { title: '通常', desc: '要約に加えて、主要なポイントと参考文献を含む' },
                      detailed: { title: '詳細', desc: 'すべての詳細情報と完全なレポートを含む' },
                    };
                    return (
                      <label
                        key={level}
                        className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                          currentSettings.notificationDetail === level
                            ? 'border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30'
                            : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-900/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="detail-level"
                          checked={currentSettings.notificationDetail === level}
                          onChange={() => updateCurrentSettings({ notificationDetail: level })}
                          className="mt-0.5 w-5 h-5 border-2 border-amber-400 text-amber-600 focus:ring-2 focus:ring-amber-200"
                        />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{labels[level].title}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{labels[level].desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-600 hover:to-orange-700 text-white font-medium transition-all shadow-md hover:shadow-lg"
              >
                設定を保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
