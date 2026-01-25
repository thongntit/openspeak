import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const splashScreen = document.getElementById('splash-screen');
    
    if (splashScreen) {
      splashScreen.style.transition = 'opacity 0.5s ease';
      splashScreen.style.opacity = '0';
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 500);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101922]">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold text-[#111418] dark:text-white mb-4">
          Pronunciation Coach
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Master English pronunciation with AI
        </p>
        <button className="btn-primary">
          Start Practicing
        </button>
      </div>
    </div>
  );
}

export default App;
