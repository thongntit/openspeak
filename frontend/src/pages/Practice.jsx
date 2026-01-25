import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { usePronunciationStore } from '../stores/pronunciationStore';
import { ArrowLeft, Mic, MicOff, Volume2, RefreshCw, ChevronRight } from 'lucide-react';
import azureSpeech from '../services/azureSpeech';

export default function Practice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { azureApiKey, azureRegion } = useSettingsStore();
  const { isRecording, isProcessing, result, error, setRecording, setProcessing, setResult, setError, clearResult } = usePronunciationStore();  
  const [word, setWord] = useState(location.state?.word || 'entrepreneur');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (azureApiKey && azureRegion) {
      try {
        azureSpeech.initialize(azureApiKey, azureRegion);
        setInitialized(true);
      } catch (err) {
        setError('Failed to initialize Azure Speech: ' + err.message);
      }
    }
  }, [azureApiKey, azureRegion, setError]);

  const handleStartRecording = async () => {
    if (!initialized) {
      setError('Azure Speech not initialized. Please check your settings.');
      return;
    }

    clearResult();
    setRecording(true);
    
    try {
      await azureSpeech.assessPronunciation(
        word,
        (azureResult) => {
          setResult(azureResult);
          setRecording(false);
          setProcessing(false);
          azureSpeech.stopRecognition();
        },
        (err) => {
          setError(err);
          setRecording(false);
          setProcessing(false);
          azureSpeech.stopRecognition();
        }
      );
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
      setRecording(false);
    }
  };

  const handleStopRecording = () => {
    azureSpeech.stopRecognition();
    setRecording(false);
    setProcessing(true);
  };

  const handleRetry = () => {
    clearResult();
  };

  const handleNext = () => {
    navigate('/');
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-[#078838]';
    if (score >= 70) return 'text-[#f59e0b]';
    return 'text-[#dc2626]';
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
        <div className="w-full max-w-md bg-white dark:bg-[#1c2630] rounded-xl p-8 shadow-sm border border-[#dbe0e6] dark:border-gray-800 text-center mb-6">
          <h1 className="text-[42px] font-bold leading-tight tracking-tight mb-2 text-[#111418] dark:text-white">
            <span className="text-[#078838]">En</span>
            <span className="text-[#f59e0b]">tre</span>
            <span className="text-[#dc2626]">pre</span>
            <span className="text-[#078838]">neur</span>
          </h1>
          <p className="text-[#617589] dark:text-gray-400 text-lg font-normal">
            /ˌɒn.trə.prəˈnɜːr/
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

        <div className="w-full max-w-xs mb-8">
          <div className="flex flex-row items-center justify-between gap-4 rounded-xl border border-[#dbe0e6] dark:border-gray-800 bg-white dark:bg-[#1c2630] p-5">
            <div className="flex flex-col gap-1">
              <p className="text-[#111418] dark:text-white text-base font-bold leading-tight">Native Model</p>
              <p className="text-[#617589] dark:text-gray-400 text-xs">Standard American Accent</p>
            </div>
            <button className="flex min-w-[100px] items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-medium">
              <Volume2 className="w-5 h-5" />
              <span>Listen</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c2630] p-6 pb-10 border-t border-[#dbe0e6] dark:border-gray-800">
          <p className="text-sm text-[#617589] dark:text-gray-400 text-center italic mb-6">
            Focus on third syllable "pre" - try to soften 'r'
          </p>
          
          <div className="flex items-center justify-center gap-12 w-full max-w-xs">
            <button
              onClick={handleRetry}
              className="flex flex-col items-center gap-1 text-[#617589] dark:text-gray-400"
            >
              <div className="p-3 rounded-full border border-[#dbe0e6] dark:border-gray-700">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider">Retry</span>
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 bg-[#137fec]/20 rounded-full scale-125 animate-pulse"></div>
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isProcessing}
                className="relative bg-[#137fec] text-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-[#137fec]/30 active:scale-95 transition-transform"
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : isProcessing ? (
                  <svg className="w-8 h-8 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.4 31.4"/>
                  </svg>
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>
            
            <button
              onClick={handleNext}
              className="flex flex-col items-center gap-1 text-[#137fec]"
            >
              <div className="p-3 rounded-full bg-[#137fec]/10">
                <ChevronRight className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider">Next</span>
            </button>
          </div>
          
          <div className="flex gap-4 w-full mt-6">
            <button className="flex-1 border border-[#dbe0e6] dark:border-gray-700 h-12 rounded-lg text-sm font-bold text-[#111418] dark:text-white bg-white dark:bg-transparent">
              Play My Recording
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
