import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';

export default function Settings() {
  const navigate = useNavigate();
  const { azureApiKey, azureRegion, setAzureApiKey, setAzureRegion } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState(azureApiKey);
  const [regionInput, setRegionInput] = useState(azureRegion);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setAzureApiKey(apiKeyInput);
    setAzureRegion(regionInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setApiKeyInput('');
    setRegionInput('');
    setAzureApiKey('');
    setAzureRegion('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101922]">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 text-[#137fec] font-medium"
        >
          ← Back
        </button>
        
        <div className="card">
          <h1 className="text-2xl font-bold text-[#111418] dark:text-white mb-6">
            Settings
          </h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Azure Speech API Key
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your Azure Speech API key"
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get free key at{' '}
                <a 
                  href="https://portal.azure.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#137fec] hover:underline"
                >
                  Azure Portal
                </a>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Azure Region
              </label>
              <input
                type="text"
                value={regionInput}
                onChange={(e) => setRegionInput(e.target.value)}
                placeholder="e.g., eastus, westus2, southeastasia"
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Common regions: eastus, westus2, southeastasia
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="btn-primary flex-1"
              >
                Save Settings
              </button>
              <button
                onClick={handleClear}
                className="btn-secondary"
              >
                Clear
              </button>
            </div>
            
            {saved && (
              <div className="text-green-600 text-sm font-medium">
                ✓ Settings saved!
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Getting Started
          </h2>
          <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Go to Azure Portal</li>
            <li>Create Speech Service resource (Free tier)</li>
            <li>Get API Key and Region</li>
            <li>Enter above and save</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
