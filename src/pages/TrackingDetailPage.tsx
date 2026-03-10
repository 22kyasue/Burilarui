import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../hooks/useTracking';
import LoginModal from '../components/auth/LoginModal';
import AppLayout from '../components/layout/AppLayout';
import TrackingDetail from '../components/tracking/TrackingDetail';

export default function TrackingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    selectedTracking,
    loading,
    error,
    fetchTracking,
    updateTracking,
    deleteTracking,
    executeTracking,
    markAllUpdatesRead,
  } = useTracking();

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchTracking(id);
    }
  }, [isAuthenticated, id, fetchTracking]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <TrackingDetail
          tracking={selectedTracking}
          loading={loading}
          error={error}
          onUpdate={(data) => id ? updateTracking(id, data) : Promise.resolve(null)}
          onDelete={async () => {
            if (id) {
              const success = await deleteTracking(id);
              if (success) navigate('/');
            }
          }}
          onExecute={() => id ? executeTracking(id) : Promise.resolve(null)}
          onMarkAllRead={() => id ? markAllUpdatesRead(id) : Promise.resolve()}
        />
      </div>
    </AppLayout>
  );
}
