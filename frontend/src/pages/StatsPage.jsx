import { useState, useEffect } from 'react';
import { workOrderAPI } from '../services/api';

function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await workOrderAPI.stats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  if (!stats) {
    return <div className="alert alert-error">통계를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="stats-page">
      <h1>📊 통계</h1>
      <p className="text-muted">작업지시서 처리 통계를 확인합니다.</p>

      {/* 전체 통계 */}
      <div className="grid grid-4" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3 className="text-muted text-sm">총 작업지시서</h3>
          <p className="font-bold" style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>
            {stats.total_orders}
          </p>
        </div>

        <div className="card">
          <h3 className="text-muted text-sm">대기 중</h3>
          <p className="font-bold" style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: 'var(--warning-color)' }}>
            {stats.pending_orders}
          </p>
        </div>

        <div className="card">
          <h3 className="text-muted text-sm">분류 완료</h3>
          <p className="font-bold" style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: 'var(--success-color)' }}>
            {stats.classified_orders}
          </p>
        </div>

        <div className="card">
          <h3 className="text-muted text-sm">처리 완료</h3>
          <p className="font-bold" style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: 'var(--primary-color)' }}>
            {stats.completed_orders}
          </p>
        </div>
      </div>

      {/* 성능 통계 */}
      <div className="grid grid-3" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <h3 className="text-muted text-sm">평균 신뢰도</h3>
          <p className="font-bold" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
            {(parseFloat(stats.avg_confidence) * 100).toFixed(1)}%
          </p>
        </div>

        <div className="card">
          <h3 className="text-muted text-sm">평균 처리 시간</h3>
          <p className="font-bold" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
            {(parseFloat(stats.avg_processing_time) / 1000).toFixed(1)}s
          </p>
        </div>

        <div className="card">
          <h3 className="text-muted text-sm">총 API 비용</h3>
          <p className="font-bold" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
            ${parseFloat(stats.total_api_cost).toFixed(3)}
          </p>
        </div>
      </div>

      {/* 상태별 분포 */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 className="card-title">상태별 분포</h2>
        <div className="grid grid-2" style={{ marginTop: '1rem' }}>
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>대기 중</span>
                <span className="font-bold">{stats.pending_orders}</span>
              </div>
              <div style={{ background: 'var(--background)', height: '0.5rem', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: 'var(--warning-color)',
                    height: '100%',
                    width: `${(parseInt(stats.pending_orders) / parseInt(stats.total_orders)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>분류 완료</span>
                <span className="font-bold">{stats.classified_orders}</span>
              </div>
              <div style={{ background: 'var(--background)', height: '0.5rem', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: 'var(--success-color)',
                    height: '100%',
                    width: `${(parseInt(stats.classified_orders) / parseInt(stats.total_orders)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>처리 완료</span>
                <span className="font-bold">{stats.completed_orders}</span>
              </div>
              <div style={{ background: 'var(--background)', height: '0.5rem', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: 'var(--primary-color)',
                    height: '100%',
                    width: `${(parseInt(stats.completed_orders) / parseInt(stats.total_orders)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>실패</span>
                <span className="font-bold">{stats.failed_orders}</span>
              </div>
              <div style={{ background: 'var(--background)', height: '0.5rem', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: 'var(--error-color)',
                    height: '100%',
                    width: `${(parseInt(stats.failed_orders) / parseInt(stats.total_orders)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📊</div>
              <p className="text-muted">상세 통계는 추후 업데이트 예정</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsPage;
