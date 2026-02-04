import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import StatsPage from './pages/StatsPage';
import ClientsPage from './pages/ClientsPage';

// API
import { healthAPI } from './services/api';

function App() {
  const [healthStatus, setHealthStatus] = useState(null);

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
    <Router>
      <div className="app">
        {/* Header */}
        <header className="app-header">
          <div className="container">
            <h1 className="app-title">📋 작업지시서 관리 시스템</h1>
            <nav className="app-nav">
              <Link to="/" className="nav-link">홈</Link>
              <Link to="/upload" className="nav-link">업로드</Link>
              <Link to="/work-orders" className="nav-link">작업지시서</Link>
              <Link to="/clients" className="nav-link">거래처</Link>
              <Link to="/stats" className="nav-link">통계</Link>
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

        {/* Main Content */}
        <main className="app-main">
          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/work-orders" element={<WorkOrdersPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/stats" element={<StatsPage />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="container">
            <p>&copy; 2026 작업지시서 관리 시스템 v1.0.0</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
