import {
  Puzzle,
  Clock,
  Palette,
  CreditCard,
  Sparkles,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewNotificationSettings?: () => void;
  onViewTrackingSettings?: () => void;
  onViewPlan?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onViewNotificationSettings: _onViewNotificationSettings,
  onViewTrackingSettings,
  onViewPlan,
}: SettingsModalProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const settingsItems = [
    {
      id: 'integrations',
      icon: Puzzle,
      label: 'アプリ連携',
      hasArrow: false,
      hasDot: true,
      action: () => { toast('アプリ連携は近日公開予定です'); onClose(); },
    },
    {
      id: 'tracking',
      icon: Clock,
      label: '追跡設定',
      hasArrow: true,
      hasDot: false,
      action: () => {
        onViewTrackingSettings?.();
        onClose();
      },
    },
    {
      id: 'theme',
      icon: Palette,
      label: 'テーマ',
      hasArrow: true,
      hasDot: false,
      hasSubmenu: true,
      action: () => {},
    },
    {
      id: 'plan',
      icon: CreditCard,
      label: 'プランを管理',
      hasArrow: true,
      hasDot: false,
      action: () => { onViewPlan?.(); onClose(); },
    },
    {
      id: 'perplexity',
      icon: Sparkles,
      label: 'Perplexity API',
      hasArrow: true,
      hasDot: false,
      action: () => { toast('API設定は近日公開予定です'); onClose(); },
    },
    {
      id: 'feedback',
      icon: MessageSquare,
      label: 'フィードバックを送信',
      hasArrow: false,
      hasDot: false,
      action: () => { window.open('mailto:feedback@burilar.com?subject=Burilar フィードバック', '_blank'); onClose(); },
    },
    {
      id: 'help',
      icon: HelpCircle,
      label: 'ヘルプとサポート',
      hasArrow: true,
      hasDot: false,
      action: () => { toast('ヘルプページは近日公開予定です'); onClose(); },
    },
  ];

  const { theme: currentTheme, setTheme } = useTheme();

  const themeOptions = [
    { id: 'light' as const, label: 'ライト' },
    { id: 'dark' as const, label: 'ダーク' },
    { id: 'system' as const, label: 'システム' },
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-20 left-4 z-50 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700"
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
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">{item.label}</span>
                        {item.hasDot && (
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                        )}
                      </div>
                      {item.hasArrow && (
                        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                      )}
                    </button>

                    {/* Theme Submenu */}
                    <AnimatePresence>
                      {showThemeSubmenu && (
                        <motion.div
                          initial={{ opacity: 0, x: -10, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -10, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute left-full top-0 ml-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700 overflow-hidden z-10"
                        >
                          <div className="py-1">
                            {themeOptions.map((themeOption, idx) => (
                              <div key={themeOption.id}>
                                <button onClick={() => setTheme(themeOption.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                                  <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">{themeOption.label}</span>
                                  {currentTheme === themeOption.id && (
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    </div>
                                  )}
                                </button>
                                {idx < themeOptions.length - 1 && (
                                  <div className="mx-3 border-b border-gray-200/50 dark:border-gray-700" />
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
            <div className="border-t border-gray-200/50 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                <p className="mb-1">&copy; 2026 Burilar. All rights reserved.</p>
                <p>
                  <span className="text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer">利用規約</span>
                  {' • '}
                  <span className="text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer">プライバシーポリシー</span>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
