import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import WeeklyPlanPage from './pages/WeeklyPlanPage';
import ActivityLibraryPage from './pages/ActivityLibraryPage';
import ElderlyPage from './pages/ElderlyPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<WeeklyPlanPage />} />
          <Route path="/activities" element={<ActivityLibraryPage />} />
          <Route path="/elderly" element={<ElderlyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
