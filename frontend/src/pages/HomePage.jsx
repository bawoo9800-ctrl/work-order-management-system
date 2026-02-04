import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workOrderAPI } from '../services/api';

function HomePage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, recentResponse] = await Promise.all([
        workOrderAPI.stats(),
        workOrderAPI.recent(5),
      ]);
      setStats(statsResponse.data.stats);
      setRecentOrders(recentResponse.data.workOrders);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero">
        <h1>📋 작업지시서 자동 분류 시스템</h1>
        <p className="text-muted">
          AI 기반 OCR 및 자동 분류로 작업지시서 관리를 간편하게
        </p>
        <div style={{ marginTop: '2rem' }}>
          <Link to="/upload" className="btn btn-primary">
            📤 작업지시서 업로드
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-4" style={{ marginTop: '3rem' }}>
          <div className="card">
            <h3 className="text-muted text-sm">총 작업지시서</h3>
            <p className="font-bold" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
              {stats.total_orders}
            </p>
          </div>
          <div className="card">
            <h3 className="text-muted text-sm">대기 중</h3>
            <p className="font-bold" style={{ fontSize: '2rem', marginTop: '0.5rem', color: 'var(--warning-color)' }}>
              {stats.pending_orders}
            </p>
          </div>
          <div className="card">
            <h3 className="text-muted text-sm">분류 완료</h3>
            <p className="font-bold" style={{ fontSize: '2rem', marginTop: '0.5rem', color: 'var(--success-color)' }}>
              {stats.classified_orders}
            </p>
          </div>
          <div className="card">
            <h3 className="text-muted text-sm">평균 처리 시간</h3>
            <p className="font-bold" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
              {(parseFloat(stats.avg_processing_time) / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      )}

      {/* 최근 업로드 */}
      <div className="card" style={{ marginTop: '3rem' }}>
        <h2 className="card-title">📄 최근 업로드</h2>
        {recentOrders.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>파일명</th>
                <th>거래처</th>
                <th>분류 방법</th>
                <th>신뢰도</th>
                <th>업로드 시간</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.original_filename}</td>
                  <td>{order.client_name || '-'}</td>
                  <td>
                    <span className={`badge badge-${order.classification_method}`}>
                      {order.classification_method}
                    </span>
                  </td>
                  <td>{(parseFloat(order.confidence_score) * 100).toFixed(1)}%</td>
                  <td>{new Date(order.created_at).toLocaleString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted text-center">업로드된 작업지시서가 없습니다.</p>
        )}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/work-orders" className="btn btn-secondary">
            전체 목록 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
