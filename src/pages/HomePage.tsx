import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../hooks/useTracking';
import { useSearch } from '../hooks/useSearch';
import LoginModal from '../components/auth/LoginModal';
import AppLayout from '../components/layout/AppLayout';
import TrackingCreate from '../components/tracking/TrackingCreate';
import TrackingList from '../components/tracking/TrackingList';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { trackings, loading, fetchTrackings } = useTracking();
  const searchHook = useSearch();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrackings();
    }
  }, [isAuthenticated, fetchTrackings]);

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
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        <TrackingCreate
          searchHook={searchHook}
          onTrackingCreated={fetchTrackings}
        />
        <TrackingList trackings={trackings} loading={loading} />
      </div>
    </AppLayout>
  );
}
