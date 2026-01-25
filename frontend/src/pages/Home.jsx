import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import ThemeToggle from '../components/ThemeToggle';
import { Settings } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { azureApiKey, azureRegion } = useSettingsStore();
  const hasSettings = !!azureApiKey && !!azureRegion;

  const quickStartWords = [
    { word: 'pronunciation', level: 'Beginner' },
    { word: 'schedule', level: 'Intermediate' },
    { word: 'entrepreneur', level: 'Advanced' },
  ];

  const recentActivity = [
    { word: 'hello', score: 95, date: 'Today' },
    { word: 'world', score: 88, date: 'Today' },
    { word: 'beautiful', score: 92, date: 'Yesterday' },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pronounce
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-[#137fec] hover:opacity-70 transition-opacity"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {!hasSettings && (
          <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Setup Required
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Please configure your Azure Speech API key to start practicing.
                </p>
                <button
                  onClick={() => navigate('/settings')}
                  className="btn-primary text-sm"
                >
                  Go to Settings
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Start
          </h2>
          <button
            onClick={() => navigate('/practice')}
            className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-2"
          >
            🎤 Start Pronunciation Practice
          </button>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Try These Words
          </h2>
          <div className="space-y-3">
            {quickStartWords.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate('/practice', { state: { word: item.word } })}
                disabled={!hasSettings}
                className="w-full flex items-center justify-between p-3 bg-gray-100/50 dark:bg-gray-800 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.word}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                  {item.level}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-100/50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {item.word}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {item.date}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    item.score >= 90 ? 'text-green-600' : 
                    item.score >= 70 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {item.score}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Score
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
