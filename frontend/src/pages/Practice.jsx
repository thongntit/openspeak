import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { usePronunciationStore } from '../stores/pronunciationStore';
import { ArrowLeft, Mic, MicOff, RefreshCw, ChevronRight } from 'lucide-react';
import azureSpeech from '../services/azureSpeech';
import { getRandomWordWithIPA } from '../services/wordService';

export default function Practice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { azureApiKey, azureRegion } = useSettingsStore();
  const { isRecording, isProcessing, result, error, setRecording, setProcessing, setResult, setError, clearResult } = usePronunciationStore();
  const [wordData, setWordData] = useState({ word: 'entrepreneur', ipa: '/ˌɒn.trə.prəˈnɜːr/' });
  const [initialized, setInitialized] = useState(false);
  const [isLoadingWord, setIsLoadingWord] = useState(false);

  const loadRandomWord = useCallback(async () => {
    setIsLoadingWord(true);
    try {
      const newWordData = await getRandomWordWithIPA();
      setWordData(newWordData);
      clearResult();
    } catch (_error) {
      setError('Failed to load word: ' + _error.message);
    } finally {
      setIsLoadingWord(false);
    }
  }, [setError, clearResult]);

  useEffect(() => {
    if (azureApiKey && azureRegion) {
      try {
        azureSpeech.initialize(azureApiKey, azureRegion);
        setInitialized(true);
      } catch (_err) {
        setError('Failed to initialize Azure Speech: ' + _err.message);
      }
    }
  }, [azureApiKey, azureRegion, setError]);

  useEffect(() => {
    if (initialized && !location.state?.word) {
      loadRandomWord();
    }
  }, [initialized, loadRandomWord, location.state?.word]);

  const handleRecording = async () => {
    if (!initialized) {
      setError('Azure Speech not initialized. Please check your settings.');
      return;
    }
    if (isLoadingWord) {
      setError('Please wait for word to load.');
      return;
    }

    if (isRecording) {
      handleStopRecording();
    } else {
      await handleStartRecording();
    }
  };

  const handleStartRecording = async () => {
    clearResult();
    setRecording(true);
    setProcessing(false);

    try {
      await azureSpeech.assessPronunciation(
        wordData.word,
        (azureResult) => {
          setResult(azureResult);
          setRecording(false);
          setProcessing(false);
        },
        (_err) => {
          setError(_err);
          setRecording(false);
          setProcessing(false);
        }
      );
    } catch (_err) {
      setError('Failed to start recording: ' + _err.message);
      setRecording(false);
      setProcessing(false);
    }
  };

  const handleStopRecording = () => {
    azureSpeech.stopRecognition();
    setRecording(false);
    setProcessing(false);
  };

  const handleRetry = () => {
    clearResult();
  };

  const handleNext = () => {
    loadRandomWord();
  };

  if (!azureApiKey || !azureRegion) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-[#1c2630] rounded-xl p-8 shadow-sm border border-[#dbe0e6] dark:border-gray-800">
            <div className="text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-2">
                Settings Required
              </h2>
              <p className="text-[#617589] dark:text-gray-400 mb-4">
                Please configure your Azure Speech API key first.
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="w-full bg-[#137fec] text-white px-4 py-3 rounded-lg font-medium"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex flex-col">
      <div className="bg-white dark:bg-[#1c2630] p-4 pb-2 flex items-center justify-between border-b border-[#dbe0e6] dark:border-gray-800">
        <button
          onClick={() => navigate('/')}
          className="text-[#111418] dark:text-white flex items-center"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-[#111418] dark:text-white text-center flex-1 pr-12">
          Practice
        </h2>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
        {error && (
          <div className="w-full max-w-md mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start justify-between gap-2">
            <p className="text-red-600 dark:text-red-400 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        <div className="w-full max-w-md bg-white dark:bg-[#1c2630] rounded-xl p-8 shadow-sm border border-[#dbe0e6] dark:border-gray-800 text-center mb-6">
          <h1 className="text-[42px] font-bold leading-tight tracking-tight mb-2 text-[#111418] dark:text-white">
            {isLoadingWord ? (
              <span className="text-[#617589]">Loading...</span>
            ) : (
              wordData.word
            )}
          </h1>
          <p className="text-[#617589] dark:text-gray-400 text-lg font-normal">
            {wordData.ipa || 'Loading IPA...'}
          </p>
        </div>

        {!result && (
          <div className="w-full max-w-md flex flex-wrap gap-4 mb-6">
            <div className="flex-1 flex-col gap-2 rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 bg-white dark:bg-[#1c2630]">
              <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">Accuracy Score</p>
              <div className="flex items-baseline gap-2">
                <p className="text-[#111418] dark:text-white tracking-light text-3xl font-bold">--%</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="w-full max-w-md flex flex-wrap gap-4 mb-6">
            <div className="flex-1 flex-col gap-2 rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 bg-white dark:bg-[#1c2630]">
              <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">Accuracy Score</p>
              <div className="flex items-baseline gap-2">
                <p className="text-[#111418] dark:text-white tracking-light text-3xl font-bold">
                  {result.privJSON?.DisplayText ? '85' : '--'}
                </p>
                <p className="text-[#078838] text-sm font-medium leading-normal">First attempt</p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-md bg-white dark:bg-[#1c2630] rounded-xl p-6 pb-10 shadow-sm border border-[#dbe0e6] dark:border-gray-800">

          <div className="flex items-center justify-center gap-12 w-full">
            <button
              onClick={handleRetry}
              className="flex flex-col items-center gap-1 text-[#617589] dark:text-gray-400"
            >
              <div className="p-3 rounded-full border border-[#dbe0e6] dark:border-gray-700">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider">Retry</span>
            </button>

            <div className="relative flex flex-col items-center gap-4">
              <div className="absolute inset-0 bg-[#137fec]/20 rounded-full scale-125 animate-pulse pointer-events-none"></div>
              <button
                type="button"
                onClick={handleRecording}
                disabled={isProcessing || isLoadingWord}
                className="relative bg-[#137fec] text-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-[#137fec]/30 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : isProcessing || isLoadingWord ? (
                  <svg className="w-8 h-8 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.4 31.4" />
                  </svg>
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>
            <button
              onClick={handleNext}
              disabled={isLoadingWord}
              className="flex flex-col items-center gap-1 text-[#137fec] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Next</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
