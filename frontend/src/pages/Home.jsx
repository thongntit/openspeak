import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import ThemeToggle from '../components/ThemeToggle';
import { Settings } from 'lucide-react';
import { getWordsByDifficulty } from '../services/wordService';

const DIFFICULTY_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export default function Home() {
  const navigate = useNavigate();
  const { azureApiKey, azureRegion } = useSettingsStore();
  const hasSettings = !!azureApiKey && !!azureRegion;

  const [featuredWords, setFeaturedWords] = useState([]);

  useEffect(() => {
    async function loadFeaturedWords() {
      try {
        const [beginners, intermediates, advanced] = await Promise.all([
          getWordsByDifficulty('beginner', 1),
          getWordsByDifficulty('intermediate', 1),
          getWordsByDifficulty('advanced', 1),
        ]);
        const words = [
          beginners[0] && { word: beginners[0].word, difficulty: 'beginner' },
          intermediates[0] && { word: intermediates[0].word, difficulty: 'intermediate' },
          advanced[0] && { word: advanced[0].word, difficulty: 'advanced' },
        ].filter(Boolean);
        setFeaturedWords(words);
      } catch {
        // Silently fall back to empty list if API unavailable
      }
    }
    loadFeaturedWords();
  }, []);

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

        {featuredWords.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Try These Words
            </h2>
            <div className="space-y-3">
              {featuredWords.map((item) => (
                <button
                  key={item.word}
                  onClick={() => navigate('/practice', { state: { word: item.word } })}
                  disabled={!hasSettings}
                  className="w-full flex items-center justify-between p-3 bg-gray-100/50 dark:bg-gray-800 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.word}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                    {DIFFICULTY_LABEL[item.difficulty]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
