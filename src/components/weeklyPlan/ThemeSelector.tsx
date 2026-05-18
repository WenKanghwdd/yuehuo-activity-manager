import { THEME_CONFIGS, type ThemeType } from '../../types';
import { useWeeklyPlanStore } from '../../store/weeklyPlanStore';
import { useThemeStore } from '../../store/themeStore';

export default function ThemeSelector() {
  const { currentPlan, setTheme: setPlanTheme } = useWeeklyPlanStore();
  const { setTheme: setGlobalTheme, currentTheme } = useThemeStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = e.target.value as ThemeType;
    setPlanTheme(theme);
    setGlobalTheme(theme);
  };

  return (
    <div className="flex items-center gap-2 no-print">
      <label className="text-sm text-gray-600 whitespace-nowrap">主题风格：</label>
      <select
        value={currentPlan?.theme || currentTheme}
        onChange={handleChange}
        className="px-3 py-1.5 border border-warm-200 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        {Object.values(THEME_CONFIGS).map((config) => (
          <option key={config.key} value={config.key}>
            {config.label}
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        <div
          className="w-5 h-5 rounded-full border"
          style={{ backgroundColor: THEME_CONFIGS[currentPlan?.theme || currentTheme]?.headerBg || '#e67414' }}
        />
        <div
          className="w-5 h-5 rounded-full border"
          style={{ backgroundColor: THEME_CONFIGS[currentPlan?.theme || currentTheme]?.accent || '#e67414' }}
        />
      </div>
    </div>
  );
}
