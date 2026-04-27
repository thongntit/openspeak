import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
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

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? '#101922' : '#f6f7f8');
    }
  }, [isDark]);

  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/practice"
            element={
              <PrivateRoute>
                <Practice />
              </PrivateRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <PrivateRoute>
                <Progress />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
