import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import CollapsedSidebar from './CollapsedSidebar';
import type { Chat } from '../../types/chat';

export type AppView = 'home' | 'trackingList' | 'notificationSettings';

interface AppLayoutProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  children: React.ReactNode;
  // Update panel
  updatePanelOpen?: boolean;
  onToggleUpdatePanel?: () => void;
  // Settings modal
  settingsOpen?: boolean;
  onToggleSettings?: () => void;
  // Plan modal
  onViewPlan?: () => void;
  // Chat data
  chats?: Chat[];
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => Promise<boolean>;
  onRenameChat?: (id: string, title: string) => Promise<boolean>;
  onViewProfile?: () => void;
}

export default function AppLayout({
  currentView,
  onViewChange,
  children,
  updatePanelOpen: _updatePanelOpen,
  onToggleUpdatePanel,
  onViewPlan,
  chats,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onViewProfile,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shouldScrollToHistory, setShouldScrollToHistory] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogoClick = useCallback(() => {
    onViewChange('home');
    navigate('/');
  }, [onViewChange, navigate]);

  const handleNewSearch = useCallback(() => {
    onViewChange('home');
    navigate('/');
    setSidebarOpen(false);
  }, [onViewChange, navigate]);

  const handleViewTracking = useCallback(() => {
    onViewChange('trackingList');
    setSidebarOpen(false);
  }, [onViewChange]);

  const handleViewNotificationSettings = useCallback(() => {
    onViewChange('notificationSettings');
    setSidebarOpen(false);
  }, [onViewChange]);

  const handleSelectTracking = useCallback((id: string) => {
    navigate(`/tracking/${id}`);
    setSidebarOpen(false);
  }, [navigate]);

  const handleSelectChat = useCallback((id: string) => {
    onSelectChat?.(id);
    setSidebarOpen(false);
  }, [onSelectChat]);

  const handleScrollToHistory = useCallback(() => {
    setShouldScrollToHistory(true);
  }, []);

  const handleNotificationClick = useCallback(() => {
    onToggleUpdatePanel?.();
  }, [onToggleUpdatePanel]);

  return (
    <div className="min-h-screen bg-white">
      {/* Collapsed Sidebar - always visible */}
      <CollapsedSidebar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewSearch={handleNewSearch}
        onViewTracking={handleViewTracking}
        onViewNotificationSettings={handleViewNotificationSettings}
        onViewSettings={() => setSettingsOpen(!settingsOpen)}
        onScrollToHistory={handleScrollToHistory}
      />

      {/* Full Sidebar - toggle */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectTracking={handleSelectTracking}
        onNewSearch={handleNewSearch}
        onViewTracking={handleViewTracking}
        onViewNotificationSettings={handleViewNotificationSettings}
        onViewSettings={() => setSettingsOpen(!settingsOpen)}
        shouldScrollToHistory={shouldScrollToHistory}
        onScrollToHistoryComplete={() => setShouldScrollToHistory(false)}
        chats={chats}
        onSelectChat={handleSelectChat}
        onDeleteChat={onDeleteChat}
        onRenameChat={onRenameChat}
      />

      {/* Main area - offset by collapsed sidebar */}
      <div className="pl-16 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          onLogoClick={handleLogoClick}
          onNotificationClick={handleNotificationClick}
          onViewSettings={() => setSettingsOpen(!settingsOpen)}
          onViewPlan={onViewPlan}
          onViewProfile={onViewProfile}
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
