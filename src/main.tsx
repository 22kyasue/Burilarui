import { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { initErrorTracking } from './utils/errorTracker';
import './index.css';
import './styles/globals.css';

// Initialize global error tracking
initErrorTracking();

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const TrackingDetailPage = lazy(() => import('./pages/TrackingDetailPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tracking/:id" element={<TrackingDetailPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
