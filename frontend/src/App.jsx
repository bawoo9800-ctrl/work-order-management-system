import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import StatsPage from './pages/StatsPage';
import ClientsPage from './pages/ClientsPage';
import AdminPage from './pages/AdminPage';

// Components
import NotificationHandler from './components/NotificationHandler';

// API
import { healthAPI } from './services/api';

function AppContent() {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState(null);
  const isUploadPage = location.pathname === '/upload';

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await healthAPI.check();
      setHealthStatus(response.data.status);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus('error');
    }
  };

  return (
    <div className="app">
      {/* 알림 핸들러 */}
      <NotificationHandler />
      
      {/* Header - 업로드 페이지에서는 숨김 */}
      {!isUploadPage && (
        <header className="app-header">
          <div className="container">
            <h1 className="app-title">📋 작업지시서 관리 시스템</h1>
            <nav className="app-nav">
              <Link to="/" className="nav-link">홈</Link>
              <Link to="/upload" className="nav-link">업로드</Link>
              <Link to="/clients" className="nav-link">거래처</Link>
              <Link to="/stats" className="nav-link">통계</Link>
              <Link to="/admin" className="nav-link">관리</Link>
            </nav>
            <div className="health-status">
              {healthStatus === 'healthy' && (
                <span className="status-badge status-healthy">✓ 정상</span>
              )}
              {healthStatus === 'error' && (
                <span className="status-badge status-error">✗ 오류</span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={isUploadPage ? "app-main-fullscreen" : "app-main"}>
        {location.pathname === '/' ? (
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        ) : (
          <div className={isUploadPage ? "" : "container"}>
            <Routes>
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </div>
        )}
      </main>

      {/* Footer - 업로드 페이지에서는 숨김 */}
      {!isUploadPage && (
        <footer className="app-footer">
          <div className="container">
            <p>&copy; 2026 작업지시서 관리 시스템 v1.0.0</p>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
