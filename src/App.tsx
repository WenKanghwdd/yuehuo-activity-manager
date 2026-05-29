import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import WeeklyPlanPage from './pages/WeeklyPlanPage';
import ActivityLibraryPage from './pages/ActivityLibraryPage';
import ElderlyPage from './pages/ElderlyPage';
import StaffSchedulePage from './pages/StaffSchedulePage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import ActivationDialog from './components/common/ActivationDialog';
import { useAutoSave as useDesktopAutoSave } from './electronFileStore';
import { isElectron } from './electronFileStore';

function AppInit() {
  if (isElectron()) {
    useDesktopAutoSave();
  }

  useEffect(() => {
    import('./persistence').then(({ initPersistence }) => initPersistence()).catch(() => {});
  }, []);

  useEffect(() => {
    import('./syncInit').then(({ initSyncStores }) => initSyncStores()).catch(() => {});
  }, []);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActivationDialog />
        <AppInit />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<WeeklyPlanPage />} />
            <Route path="/activities" element={<ActivityLibraryPage />} />
            <Route path="/elderly" element={<ElderlyPage />} />
            <Route path="/schedule" element={<StaffSchedulePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
