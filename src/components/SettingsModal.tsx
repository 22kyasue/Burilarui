import {
  Puzzle,
  Clock,
  Palette,
  CreditCard,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Check,
  Code2
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewIntegrations?: () => void;
  onViewTrackingSettings?: () => void;
  onViewPlanManagement?: () => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  onLoadDemoData?: () => void;
  onPlayDemoScenario?: () => void;
}

export function SettingsModal({ isOpen, onClose, onViewIntegrations, onViewTrackingSettings, onViewPlanManagement, theme = 'light', onThemeChange, onLoadDemoData, onPlayDemoScenario }: SettingsModalProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const settingsItems = [
    {
      id: 'integrations',
      icon: Puzzle,
      label: 'アプリ連携',
      hasArrow: false,
      hasDot: true,
      action: onViewIntegrations ? onViewIntegrations : () => alert('アプリ連携機能は現在開発中です')
    },
    {
      id: 'tracking',
      icon: Clock,
      label: '追跡設定',
      hasArrow: true,
      hasDot: false,
      action: onViewTrackingSettings ? onViewTrackingSettings : () => alert('追跡設定機能は現在開発中です')
    },
    {
      id: 'theme',
      icon: Palette,
      label: 'テーマ',
      hasArrow: true,
      hasDot: false,
      hasSubmenu: true,
      action: () => { } // 空のアクション
    },
    {
      id: 'plan',
      icon: CreditCard,
      label: 'プランを管理',
      hasArrow: true,
      hasDot: false,
      action: onViewPlanManagement ? onViewPlanManagement : () => alert('プラン管理機能は現在開発中です')
    },
    {
      id: 'perplexity',
      icon: Sparkles,
      label: 'Perplexity API',
      hasArrow: true,
      hasDot: false,
      action: () => alert('Perplexity API設定機能は現在開発中です')
    },
    {
      id: 'feedback',
      icon: MessageSquare,
      label: 'フィードバックを送信',
      hasArrow: false,
      hasDot: false,
      action: () => alert('フィードバック送信機能は現在開発中です')
    },
    {
      id: 'help',
      icon: HelpCircle,
      label: 'ヘルプとサポート',
      hasArrow: true,
      hasDot: false,
      action: () => alert('ヘルプとサポート機能は現在開発中です')
    },
    {
      id: 'code',
      icon: Code2,
      label: 'コードエディタ',
      hasArrow: false,
      hasDot: false,
      action: () => alert('コードエディタ機能は現在開発中です')
    },
    {
      id: 'demo',
      icon: Sparkles,
      label: 'デモデータをロード',
      hasArrow: false,
      hasDot: false,
      action: onLoadDemoData ? () => {
        onLoadDemoData();
        alert('デモデータをロードしました');
      } : () => { }
    },
    {
      id: 'demo-scenario',
      icon: Sparkles,
      label: 'デモシナリオを再生',
      hasArrow: true,
      hasDot: false,
      action: onPlayDemoScenario ? () => {
        onPlayDemoScenario();
      } : () => { }
    }
  ];

  const themeOptions = [
    { id: 'light', label: 'ライト' },
    { id: 'dark', label: 'ダーク' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-20 left-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/50"
          >
            {/* Settings List */}
            <div className="py-2">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const isTheme = item.id === 'theme';
                const showThemeSubmenu = isTheme && hoveredItem === 'theme';

                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      onClick={item.action}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-800 text-sm font-medium">
                          {item.label}
                        </span>
                        {item.hasDot && (
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        )}
                      </div>
                      {item.hasArrow && (
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      )}
                    </button>

                    {/* Theme Submenu */}
                    <AnimatePresence>
                      {showThemeSubmenu && (
                        <motion.div
                          initial={{ opacity: 0, x: -10, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -10, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-full top-0 ml-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden z-10"
                        >
                          <div className="py-1">
                            {themeOptions.map((themeOption, idx) => (
                              <div key={themeOption.id}>
                                <button
                                  onClick={() => {
                                    if (onThemeChange) {
                                      onThemeChange(themeOption.id as 'light' | 'dark');
                                    }
                                  }}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-all"
                                >
                                  <span className="text-gray-800 text-sm font-medium">
                                    {themeOption.label}
                                  </span>
                                  {theme === themeOption.id && (
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    </div>
                                  )}
                                </button>
                                {idx < themeOptions.length - 1 && (
                                  <div className="mx-3 border-b border-gray-200/50"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200/50 p-4 bg-gray-50/50 rounded-b-2xl">
              <div className="text-xs text-gray-500 text-center">
                <p className="mb-1">Version 1.00.00</p>
                <p className="mb-1">© 2026 Burilar. All rights reserved.</p>
                <p>
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 transition-colors">利用規約</a>
                  {' • '}
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 transition-colors">プライバシーポリシー</a>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}