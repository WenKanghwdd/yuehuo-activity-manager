import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import WeeklyPlanPage from './pages/WeeklyPlanPage';
import ActivityLibraryPage from './pages/ActivityLibraryPage';
import ElderlyPage from './pages/ElderlyPage';
import SettingsPage from './pages/SettingsPage';
import ActivationDialog from './components/common/ActivationDialog';
import { useAutoSave as useDesktopAutoSave } from './electronFileStore';
import { isElectron } from './electronFileStore';

function AppInit() {
  // Electron 环境：自动持久化到本地文件
  // 浏览器环境：使用 File System Access API（可选，在 Settings 页配置）
  if (isElectron()) {
    useDesktopAutoSave();
  }
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <ActivationDialog />
      <AppInit />
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
