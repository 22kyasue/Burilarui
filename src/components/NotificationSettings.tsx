import { Bell, Mail, Smartphone, Monitor, Clock, Check, Pin, Activity, Pause, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Chat {
  id: string;
  title: string;
  messages: any[];
  updatedAt: Date;
  pinned?: boolean;
  isTracking?: boolean;
  trackingActive?: boolean;
  updateCount?: number;
}

interface NotificationSettingsProps {
  onBack: () => void;
  chats: Chat[];

}

// プロンプトの通知設定の型
interface PromptNotificationSettings {
  searchFrequency: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notifyOnNewUpdate: boolean;
  notifyOnDailyDigest: boolean;
  notifyOnWeeklyDigest: boolean;
  notifyOnNoUpdate: boolean;
  notificationDetail: 'summary' | 'detailed' | 'full';
}



// デフォルト設定
const defaultSettings: PromptNotificationSettings = {
  searchFrequency: 24,
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  notifyOnNewUpdate: true,
  notifyOnDailyDigest: false,
  notifyOnWeeklyDigest: false,
  notifyOnNoUpdate: false,
  notificationDetail: 'summary',
};

export function NotificationSettings({ onBack, chats }: NotificationSettingsProps) {
  // 追跡中のプロンプトをchatsから取得
  const trackedPrompts = chats
    .filter(chat => chat.isTracking)
    .map(chat => {
      // 最終更新時刻を計算
      const now = new Date();
      const diff = now.getTime() - chat.updatedAt.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let lastUpdated: string;
      if (minutes < 60) {
        lastUpdated = `${minutes}分前`;
      } else if (hours < 24) {
        lastUpdated = `${hours}時間前`;
      } else {
        lastUpdated = `${days}日前`;
      }

      return {
        id: chat.id,
        title: chat.title,
        status: (chat.trackingActive ? 'active' : 'paused') as 'active' | 'paused',
        isPinned: chat.pinned || false,
        lastUpdated,
        settings: undefined, // 設定を追加できるように
      };
    });

  // 選択されたプロンプト（nullの場合はスタンダード設定）
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  // 各プロンプトの設定を管理
  const [promptSettings, setPromptSettings] = useState<Record<string, PromptNotificationSettings>>({});

  // スタンダード設定を管理
  const [standardSettings, setStandardSettings] = useState<PromptNotificationSettings>(defaultSettings);

  // Loading state


  // Load global settings from API on mount
  useEffect(() => {
    const loadGlobalSettings = async () => {
      try {
        const response = await fetch('/api/notifications/settings/global');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setStandardSettings({
              searchFrequency: data.settings.frequency_hours || 24,
              emailNotifications: data.settings.email_enabled ?? true,
              pushNotifications: data.settings.push_enabled ?? true,
              inAppNotifications: data.settings.in_app_enabled ?? true,
              notifyOnNewUpdate: data.settings.notify_on_update ?? true,
              notifyOnDailyDigest: data.settings.daily_digest ?? false,
              notifyOnWeeklyDigest: data.settings.weekly_digest ?? false,
              notifyOnNoUpdate: data.settings.notify_on_no_change ?? false,
              notificationDetail: data.settings.detail_level || 'summary',
            });
          }
        }
      } catch (error) {
        console.error('Failed to load global settings:', error);
      } finally {
        // setIsLoadingSettings(false);
      }
    };

    loadGlobalSettings();
  }, []);

  // Load tracking-specific settings when a prompt is selected
  useEffect(() => {
    if (selectedPromptId === null) return;

    const loadTrackingSettings = async () => {
      try {
        const response = await fetch(`/api/notifications/settings/tracking/${selectedPromptId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setPromptSettings(prev => ({
              ...prev,
              [selectedPromptId]: {
                searchFrequency: data.settings.frequency_hours || standardSettings.searchFrequency,
                emailNotifications: data.settings.email_enabled ?? standardSettings.emailNotifications,
                pushNotifications: data.settings.push_enabled ?? standardSettings.pushNotifications,
                inAppNotifications: data.settings.in_app_enabled ?? standardSettings.inAppNotifications,
                notifyOnNewUpdate: data.settings.notify_on_update ?? standardSettings.notifyOnNewUpdate,
                notifyOnDailyDigest: data.settings.daily_digest ?? standardSettings.notifyOnDailyDigest,
                notifyOnWeeklyDigest: data.settings.weekly_digest ?? standardSettings.notifyOnWeeklyDigest,
                notifyOnNoUpdate: data.settings.notify_on_no_change ?? standardSettings.notifyOnNoUpdate,
                notificationDetail: data.settings.detail_level || standardSettings.notificationDetail,
              },
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load tracking settings:', error);
      }
    };

    loadTrackingSettings();
  }, [selectedPromptId, standardSettings]);

  // 各プロンプトのステータスを管理
  const [promptStatuses, setPromptStatuses] = useState<Record<string, 'active' | 'paused'>>({});

  // プロンプトのステータスを切り替える
  const togglePromptStatus = (promptId: string) => {
    const currentStatus = promptStatuses[promptId] || trackedPrompts.find(p => p.id === promptId)?.status || 'active';
    setPromptStatuses({
      ...promptStatuses,
      [promptId]: currentStatus === 'active' ? 'paused' : 'active',
    });
  };

  // 現在のステータスを取得
  const getPromptStatus = (promptId: string): 'active' | 'paused' => {
    return promptStatuses[promptId] || trackedPrompts.find(p => p.id === promptId)?.status || 'active';
  };

  // 現在表示している設定を取得
  const getCurrentSettings = (): PromptNotificationSettings => {
    if (selectedPromptId === null) {
      return standardSettings;
    }
    return promptSettings[selectedPromptId] || { ...standardSettings };
  };

  // 設定を更新
  const updateCurrentSettings = (updates: Partial<PromptNotificationSettings>) => {
    if (selectedPromptId === null) {
      setStandardSettings({ ...standardSettings, ...updates });
    } else {
      setPromptSettings({
        ...promptSettings,
        [selectedPromptId]: {
          ...(promptSettings[selectedPromptId] || standardSettings),
          ...updates,
        },
      });
    }
  };

  const currentSettings = getCurrentSettings();
  const [showCustomInput, setShowCustomInput] = useState(false);


  // バリデーション
  const hasNotificationMethod = currentSettings.emailNotifications || currentSettings.pushNotifications || currentSettings.inAppNotifications;
  const hasNotificationTiming = currentSettings.notifyOnNewUpdate || currentSettings.notifyOnDailyDigest || currentSettings.notifyOnWeeklyDigest;
  const hasSearchFrequency = currentSettings.searchFrequency > 0 && currentSettings.searchFrequency <= 168;
  const hasNotificationDetail = currentSettings.notificationDetail !== null;

  const canSave = hasNotificationMethod && hasNotificationTiming && hasSearchFrequency && hasNotificationDetail;

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!canSave || isSaving) {
      return;
    }

    setIsSaving(true);

    const apiSettings = {
      frequency_hours: currentSettings.searchFrequency,
      email_enabled: currentSettings.emailNotifications,
      push_enabled: currentSettings.pushNotifications,
      in_app_enabled: currentSettings.inAppNotifications,
      notify_on_update: currentSettings.notifyOnNewUpdate,
      daily_digest: currentSettings.notifyOnDailyDigest,
      weekly_digest: currentSettings.notifyOnWeeklyDigest,
      notify_on_no_change: currentSettings.notifyOnNoUpdate,
      detail_level: currentSettings.notificationDetail,
    };

    try {
      const endpoint = selectedPromptId === null
        ? '/api/notifications/settings/global'
        : `/api/notifications/settings/tracking/${selectedPromptId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiSettings),
      });

      if (response.ok) {
        alert('設定を保存しました');
      } else {
        const error = await response.json();
        alert(`保存に失敗しました: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('保存に失敗しました。ネットワークエラーが発生しました。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl text-gray-900 mb-2 font-semibold">通知設定</h1>
          <p className="text-sm text-gray-600">追跡検索の頻度と通知形式を管理</p>
        </div>
      </div>

      {/* 2ペインレイアウト */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6 h-[calc(100vh-160px)]">
          {/* 左側: 追跡中のプロンプトリスト */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-8 shadow-sm">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <h2 className="text-sm text-gray-700 font-semibold">通知設定の管理</h2>
              </div>

              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* スタンダード設定 */}
                <button
                  onClick={() => setSelectedPromptId(null)}
                  className={`w-full p-4 text-left border-b border-gray-100 transition-colors ${selectedPromptId === null
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-l-indigo-500'
                    : 'hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate font-semibold">スタンダード設定</p>
                      <p className="text-xs text-gray-600 mt-0.5">全てのプロンプトのデフォルト</p>
                    </div>
                  </div>
                </button>

                {/* 追跡中のプロンプトリスト */}
                <div className="p-3 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                  <p className="text-xs text-gray-600 px-1 font-semibold">追跡中のプロンプト</p>
                </div>

                {trackedPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => setSelectedPromptId(prompt.id)}
                    className={`w-full p-4 text-left border-b border-gray-100 transition-colors ${selectedPromptId === prompt.id
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-l-indigo-500'
                      : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* ステータスアイコン */}
                      <div className={`mt-1 flex-shrink-0 ${getPromptStatus(prompt.id) === 'active' ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                        {getPromptStatus(prompt.id) === 'active' ? (
                          <Activity className="w-4 h-4" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-900 line-clamp-2 font-medium">{prompt.title}</p>
                          {prompt.isPinned && (
                            <Pin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${getPromptStatus(prompt.id) === 'active' ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                            {getPromptStatus(prompt.id) === 'active' ? 'アクティブ' : '中断中'}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <RefreshCw className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600">{prompt.lastUpdated}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            {(() => {
                              const settings = promptSettings[prompt.id] || standardSettings;
                              const freq = settings.searchFrequency;
                              if (freq === 1) return '1h';
                              if (freq < 24) return `${freq}h`;
                              if (freq === 24) return '1d';
                              if (freq === 72) return '3d';
                              if (freq === 168) return '1w';
                              if (freq % 168 === 0) return `${freq / 168}w`;
                              if (freq % 24 === 0) return `${freq / 24}d`;
                              return `${freq}h`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右側: 通知設定フォーム */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-6 pb-[600px]">
              {/* 選択中の項目表示 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    {selectedPromptId === null ? (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg text-gray-900 font-semibold">スタンダード設定</h2>
                          <p className="text-sm text-gray-600">新しく追跡するプロンプトのデフォルト設定</p>
                        </div>
                      </>
                    ) : (
                      <>
                        {(() => {
                          const prompt = trackedPrompts.find(p => p.id === selectedPromptId);
                          if (!prompt) return null;
                          return (
                            <>
                              <div className={`mt-1 flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${getPromptStatus(prompt.id) === 'active' ? 'bg-gradient-to-br from-emerald-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-rose-500'
                                }`}>
                                {getPromptStatus(prompt.id) === 'active' ? (
                                  <Activity className="w-6 h-6 text-white" />
                                ) : (
                                  <Pause className="w-6 h-6 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h2 className="text-lg text-gray-900 font-semibold">{prompt.title}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs font-medium ${getPromptStatus(prompt.id) === 'active' ? 'text-emerald-600' : 'text-red-600'
                                    }`}>
                                    {getPromptStatus(prompt.id) === 'active' ? 'アクティブ' : '中断中'}
                                  </span>
                                  {prompt.isPinned && (
                                    <>
                                      <span className="text-xs text-gray-400">•</span>
                                      <Pin className="w-3 h-3 text-indigo-500" />
                                      <span className="text-xs text-gray-600">ピン留め中</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {/* ステータス切り替えボタン（プロンプト選択時のみ表示） */}
                  {selectedPromptId !== null && (() => {
                    const prompt = trackedPrompts.find(p => p.id === selectedPromptId);
                    if (!prompt) return null;
                    const status = getPromptStatus(prompt.id);
                    return (
                      <button
                        onClick={() => togglePromptStatus(prompt.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all shadow-sm border-2 ${status === 'active'
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 hover:from-green-100 hover:to-emerald-100'
                          : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-400 hover:from-red-100 hover:to-orange-100'
                          }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                        <span className={`text-sm font-medium whitespace-nowrap ${status === 'active' ? 'text-green-700' : 'text-red-700'
                          }`}>
                          {status === 'active' ? 'アクティブ' : '中断中'}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* 追跡検索の頻度設定 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg text-gray-900 font-semibold">追跡検索の頻度</h2>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        updateCurrentSettings({ searchFrequency: 1 });
                        setShowCustomInput(false);
                      }}
                      className={`p-3 rounded-xl border transition-all font-medium ${currentSettings.searchFrequency === 1 && !showCustomInput
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 text-gray-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-center">
                        <p className="text-sm">1h</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        updateCurrentSettings({ searchFrequency: 6 });
                        setShowCustomInput(false);
                      }}
                      className={`p-3 rounded-xl border transition-all font-medium ${currentSettings.searchFrequency === 6 && !showCustomInput
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 text-gray-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-center">
                        <p className="text-sm">6h</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        updateCurrentSettings({ searchFrequency: 12 });
                        setShowCustomInput(false);
                      }}
                      className={`p-3 rounded-xl border transition-all font-medium ${currentSettings.searchFrequency === 12 && !showCustomInput
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 text-gray-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-center">
                        <p className="text-sm">12h</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        updateCurrentSettings({ searchFrequency: 24 });
                        setShowCustomInput(false);
                      }}
                      className={`p-3 rounded-xl border transition-all font-medium ${currentSettings.searchFrequency === 24 && !showCustomInput
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 text-gray-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-center">
                        <p className="text-sm">1d</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        updateCurrentSettings({ searchFrequency: 72 });
                        setShowCustomInput(false);
                      }}
                      className={`p-3 rounded-xl border transition-all font-medium ${currentSettings.searchFrequency === 72 && !showCustomInput
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 text-gray-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-center">
                        <p className="text-sm">3d</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        updateCurrentSettings({ searchFrequency: 168 });
                        setShowCustomInput(false);
                      }}
                      className={`p-3 rounded-xl border transition-all font-medium ${currentSettings.searchFrequency === 168 && !showCustomInput
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 text-gray-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-center">
                        <p className="text-sm">1w</p>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className={`w-full px-4 py-3 rounded-xl border text-left transition-all font-medium ${showCustomInput
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 text-gray-900'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">カスタム設定</span>
                      {showCustomInput && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                  </button>

                  {showCustomInput && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-sm text-gray-700 font-medium">頻度を調整</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg text-indigo-600 font-semibold">
                            {currentSettings.searchFrequency}
                          </span>
                          <span className="text-sm text-gray-600">時間毎</span>
                        </div>
                      </div>

                      <div>
                        <input
                          type="range"
                          min="1"
                          max="168"
                          value={currentSettings.searchFrequency}
                          onChange={(e) => updateCurrentSettings({ searchFrequency: Number(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(currentSettings.searchFrequency / 168) * 100}%, #e5e7eb ${(currentSettings.searchFrequency / 168) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-gray-600">
                          <span>1h</span>
                          <span>24h</span>
                          <span>72h</span>
                          <span>168h</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700 whitespace-nowrap font-medium">
                          または直接入力:
                        </label>
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="number"
                            min="1"
                            max="168"
                            value={currentSettings.searchFrequency}
                            onChange={(e) => updateCurrentSettings({ searchFrequency: Number(e.target.value) })}
                            className="flex-1 bg-white text-gray-900 rounded-xl px-4 py-2.5 border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          />
                          <span className="text-sm text-gray-600">時間</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          💡 {currentSettings.searchFrequency === 1 ? '1時間' :
                            currentSettings.searchFrequency < 24 ? `${currentSettings.searchFrequency}時間` :
                              currentSettings.searchFrequency === 24 ? '1日' :
                                currentSettings.searchFrequency < 168 ? `約${Math.floor(currentSettings.searchFrequency / 24)}日` :
                                  `約${Math.floor(currentSettings.searchFrequency / 168)}週間`}に1回の検索頻度です
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 通知形式設定 */}
              <div className={`bg-white rounded-2xl border p-6 shadow-sm ${!hasNotificationMethod ? 'border-red-300' : 'border-gray-200'
                }`}>
                <div className="flex items-start gap-3 mb-6">
                  <Bell className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="text-lg text-gray-900 mb-2 font-semibold">
                      通知形式 <span className="text-red-500 text-sm">*</span>
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      アップデートがあった時の通知方法を選択します
                    </p>
                    {!hasNotificationMethod && (
                      <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                        ⚠️ 少なくとも1つの通知方法を選択してください
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    onClick={() => updateCurrentSettings({ emailNotifications: !currentSettings.emailNotifications })}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${currentSettings.emailNotifications
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Mail className={`w-5 h-5 ${currentSettings.emailNotifications ? 'text-indigo-600' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-sm font-medium ${currentSettings.emailNotifications ? 'text-gray-900' : 'text-gray-700'}`}>
                          メール通知
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          登録メールアドレスに通知を送信
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-12 h-6 rounded-full transition-colors relative ${currentSettings.emailNotifications ? 'bg-indigo-500' : 'bg-gray-300'
                        }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${currentSettings.emailNotifications ? 'transform translate-x-6' : ''
                          }`}
                      />
                    </div>
                  </div>

                  <div
                    onClick={() => updateCurrentSettings({ pushNotifications: !currentSettings.pushNotifications })}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${currentSettings.pushNotifications
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className={`w-5 h-5 ${currentSettings.pushNotifications ? 'text-indigo-600' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-sm font-medium ${currentSettings.pushNotifications ? 'text-gray-900' : 'text-gray-700'}`}>
                          プッシュ通知
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          モバイルデバイスに通知を送信
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-12 h-6 rounded-full transition-colors relative ${currentSettings.pushNotifications ? 'bg-indigo-500' : 'bg-gray-300'
                        }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${currentSettings.pushNotifications ? 'transform translate-x-6' : ''
                          }`}
                      />
                    </div>
                  </div>

                  <div
                    onClick={() => updateCurrentSettings({ inAppNotifications: !currentSettings.inAppNotifications })}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${currentSettings.inAppNotifications
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Monitor className={`w-5 h-5 ${currentSettings.inAppNotifications ? 'text-indigo-600' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-sm font-medium ${currentSettings.inAppNotifications ? 'text-gray-900' : 'text-gray-700'}`}>
                          アプリ内通知
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Burilarアプリ内で通知を表示
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-12 h-6 rounded-full transition-colors relative ${currentSettings.inAppNotifications ? 'bg-indigo-500' : 'bg-gray-300'
                        }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${currentSettings.inAppNotifications ? 'transform translate-x-6' : ''
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 通知タイミング */}
              <div className={`bg-white rounded-2xl border p-6 shadow-sm ${!hasNotificationTiming ? 'border-red-300' : 'border-gray-200'
                }`}>
                <div className="flex items-start gap-3 mb-6">
                  <Bell className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="text-lg text-gray-900 mb-2 font-semibold">
                      通知タイミング <span className="text-red-500 text-sm">*</span>
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      どのタイミングで通知を受け取るかを設定します
                    </p>
                    {!hasNotificationTiming && (
                      <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                        ⚠️ 少なくとも1つの通知タイミングを選択してください
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={currentSettings.notifyOnNewUpdate}
                      onChange={(e) => updateCurrentSettings({ notifyOnNewUpdate: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">新しいアップデートがあった時</p>
                      <p className="text-xs text-gray-600 mt-1">追跡中のプロンプトに新しい情報が見つかったら即座に通知</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={currentSettings.notifyOnNoUpdate}
                      onChange={(e) => updateCurrentSettings({ notifyOnNoUpdate: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">再検索したタイミング</p>
                      <p className="text-xs text-gray-600 mt-1">検索を実行するたびに通知（新しい情報の有無に関わらず）</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={currentSettings.notifyOnDailyDigest}
                      onChange={(e) => updateCurrentSettings({ notifyOnDailyDigest: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">日次ダイジェスト</p>
                      <p className="text-xs text-gray-600 mt-1">1日のアップデートをまとめて通知（毎日午前9時）</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={currentSettings.notifyOnWeeklyDigest}
                      onChange={(e) => updateCurrentSettings({ notifyOnWeeklyDigest: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">週次ダイジェスト</p>
                      <p className="text-xs text-gray-600 mt-1">1週間のアップデートをまとめて通知（毎週月曜午前9時）</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 通知の詳細度 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start gap-3 mb-6">
                  <Bell className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="text-lg text-gray-900 mb-2 font-semibold">通知の詳細度</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      通知に含める情報量を選択します
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => updateCurrentSettings({ notificationDetail: 'summary' })}
                    className={`w-full flex items-start justify-between p-4 rounded-xl border transition-all ${currentSettings.notificationDetail === 'summary'
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-left">
                      <p className={`text-sm mb-1 font-medium ${currentSettings.notificationDetail === 'summary' ? 'text-gray-900' : 'text-gray-700'
                        }`}>要約のみ</p>
                      <p className="text-xs text-gray-600">アップデートのタイトルと簡単な説明のみ</p>
                    </div>
                    {currentSettings.notificationDetail === 'summary' && (
                      <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => updateCurrentSettings({ notificationDetail: 'detailed' })}
                    className={`w-full flex items-start justify-between p-4 rounded-xl border transition-all ${currentSettings.notificationDetail === 'detailed'
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-left">
                      <p className={`text-sm mb-1 font-medium ${currentSettings.notificationDetail === 'detailed' ? 'text-gray-900' : 'text-gray-700'
                        }`}>詳細</p>
                      <p className="text-xs text-gray-600">要約に加えて、主要なポイントと参考文献を含む</p>
                    </div>
                    {currentSettings.notificationDetail === 'detailed' && (
                      <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => updateCurrentSettings({ notificationDetail: 'full' })}
                    className={`w-full flex items-start justify-between p-4 rounded-xl border transition-all ${currentSettings.notificationDetail === 'full'
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-left">
                      <p className={`text-sm mb-1 font-medium ${currentSettings.notificationDetail === 'full' ? 'text-gray-900' : 'text-gray-700'
                        }`}>完全版</p>
                      <p className="text-xs text-gray-600">すべての情報（内容全文、参考文献、分析結果）を含む</p>
                    </div>
                    {currentSettings.notificationDetail === 'full' && (
                      <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* 保存ボタン */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={onBack}
                  className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave || isSaving}
                  className={`px-6 py-2.5 rounded-xl transition-colors font-medium ${canSave && !isSaving
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 cursor-pointer shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                    }`}
                  title={!canSave ? '全ての必須項目を設定してください' : ''}
                >
                  {isSaving ? '保存中...' : '設定を保存'}
                </button>
              </div>

              {!canSave && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 mb-2 font-semibold">⚠️ 以下の項目を確認してください:</p>
                  <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                    {!hasNotificationMethod && (
                      <li>通知形式: 少なくとも1つの通知方法を選択してください</li>
                    )}
                    {!hasNotificationTiming && (
                      <li>通知タイミング: 少なくとも1つの通知タイミングを選択してください</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}