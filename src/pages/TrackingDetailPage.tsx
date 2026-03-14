import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../hooks/useTracking';
import { useNotifications } from '../hooks/useNotifications';
import LoginModal from '../components/auth/LoginModal';
import AppLayout, { type AppView } from '../components/layout/AppLayout';
import TrackingDetail from '../components/tracking/TrackingDetail';
import TrackingListView from '../components/tracking/TrackingListView';
import NotificationSettings from '../components/notifications/NotificationSettings';
import UpdatePanel from '../components/updates/UpdatePanel';
import SettingsModal from '../components/settings/SettingsModal';

export default function TrackingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    trackings,
    selectedTracking,
    loading,
    error,
    fetchTrackings,
    fetchTracking,
    updateTracking,
    deleteTracking,
    executeTracking,
    markAllUpdatesRead,
  } = useTracking();
  const { notifications } = useNotifications();

  const [currentView, setCurrentView] = useState<AppView>('home');
  const [updatePanelOpen, setUpdatePanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrackings();
      if (id) fetchTracking(id);
    }
  }, [isAuthenticated, id, fetchTrackings, fetchTracking]);

  const handleDelete = useCallback(async () => {
    if (id) {
      const success = await deleteTracking(id);
      if (success) navigate('/');
    }
  }, [id, deleteTracking, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl" style={{ animation: 'logo-fade-in 0.6s ease-out' }}>
          <span className="text-white text-2xl font-bold">B</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'trackingList':
        return (
          <TrackingListView
            trackings={trackings}
            onSelectTracking={(tid) => navigate(`/tracking/${tid}`)}
            onNewSearch={() => navigate('/')}
            onRefresh={fetchTrackings}
          />
        );
      case 'notificationSettings':
        return (
          <NotificationSettings
            trackings={trackings}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'home':
      default:
        return (
          <div className="flex-1 flex bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]">
            <TrackingDetail
              tracking={selectedTracking}
              loading={loading}
              error={error}
              onUpdate={(data) => id ? updateTracking(id, data) : Promise.resolve(null)}
              onDelete={handleDelete}
              onExecute={() => id ? executeTracking(id) : Promise.resolve(null)}
              onMarkAllRead={() => id ? markAllUpdatesRead(id) : Promise.resolve()}
              onClose={() => navigate('/')}
            />
          </div>
        );
    }
  };

  return (
    <>
      <AppLayout
        currentView={currentView}
        onViewChange={setCurrentView}
        updatePanelOpen={updatePanelOpen}
        onToggleUpdatePanel={() => setUpdatePanelOpen(!updatePanelOpen)}
      >
        {renderContent()}
      </AppLayout>

      <UpdatePanel
        isOpen={updatePanelOpen}
        onClose={() => setUpdatePanelOpen(false)}
        trackings={trackings}
        notifications={notifications}
        onSelectTracking={(tid) => {
          navigate(`/tracking/${tid}`);
          setUpdatePanelOpen(false);
        }}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onViewNotificationSettings={() => {
          setSettingsOpen(false);
          setCurrentView('notificationSettings');
        }}
        onViewTrackingSettings={() => {
          setSettingsOpen(false);
          setCurrentView('trackingList');
        }}
      />
    </>
  );
}
