import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import StatsPage from './pages/StatsPage';
import ClientsPage from './pages/ClientsPage';
import SitesPage from './pages/SitesPage';
import AdminPage from './pages/AdminPage';
import TrashPage from './pages/TrashPage';
import PurchaseOrderListPage from './pages/PurchaseOrderListPage';
import PurchaseOrderUploadPage from './pages/PurchaseOrderUploadPage';

// Components
import NotificationHandler from './components/NotificationHandler';

// API
import { healthAPI } from './services/api';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState(null);
  const isUploadPage = location.pathname === '/upload';
  
  // iOS 감지
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // 모바일 감지 및 자동 리다이렉트 (최초 1회만)
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasRedirected = sessionStorage.getItem('mobile_redirected');
    
    // 모바일이고 홈 페이지(/)에 있으며, 아직 리다이렉트하지 않았다면
    if (isMobile && location.pathname === '/' && !hasRedirected) {
      console.log('📱 모바일 감지: 촬영 페이지로 자동 이동');
      sessionStorage.setItem('mobile_redirected', 'true');
      navigate('/upload', { replace: true });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await healthAPI.check();
      // API 응답 구조 확인
      const status = response?.data?.status || response?.status || 'healthy';
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus('error');
    }
  };

  return (
    <div className="app">
      {/* 알림 핸들러 - iOS에서는 비활성화 */}
      {!isIOS && <NotificationHandler />}
      
      {/* Header - 업로드 페이지에서는 숨김 */}
      {!isUploadPage && (
        <header className="app-header">
          <div className="container">
            <nav className="app-nav">
              <Link to="/" className="nav-link">작업지시서</Link>
              <Link to="/upload" className="nav-link">작업지시서 업로드</Link>
              <Link to="/purchase-orders" className="nav-link">발주서</Link>
              <Link to="/clients" className="nav-link">거래처</Link>
              <Link to="/sites" className="nav-link">현장</Link>
              <Link to="/stats" className="nav-link">통계</Link>
              <Link to="/trash" className="nav-link">휴지통</Link>
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
        ) : location.pathname === '/purchase-orders' ? (
          // 발주서 페이지는 container 없이 전체 너비 사용
          <Routes>
            <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
          </Routes>
        ) : (
          <div className={isUploadPage ? "" : "container"}>
            <Routes>
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/purchase-orders/upload" element={<PurchaseOrderUploadPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/sites" element={<SitesPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/trash" element={<TrashPage />} />
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
