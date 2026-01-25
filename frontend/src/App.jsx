import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Settings from './pages/Settings';
import { useThemeStore } from './stores/themeStore';

function App() {
  const { isDark } = useThemeStore();

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

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update theme-color meta tag based on current theme
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? '#101922' : '#f6f7f8');
    }
  }, [isDark]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
