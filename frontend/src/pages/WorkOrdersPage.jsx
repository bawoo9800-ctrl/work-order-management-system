import { useState, useEffect } from 'react';
import { workOrderAPI } from '../services/api';

function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState({
    status: '',
    clientId: '',
  });

  useEffect(() => {
    loadWorkOrders();
  }, [currentPage, filter]);

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await workOrderAPI.list({
        page: currentPage,
        limit: 20,
        ...filter,
      });
      setWorkOrders(response.data.workOrders);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await workOrderAPI.delete(id);
      alert('삭제되었습니다.');
      loadWorkOrders();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('삭제에 실패했습니다.');
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
    <div className="work-orders-page">
      <h1>📄 작업지시서 목록</h1>
      <p className="text-muted">업로드된 작업지시서를 확인하고 관리합니다.</p>

      {/* 필터 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="grid grid-3">
          <div className="form-group">
            <label className="form-label">상태</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="form-select"
            >
              <option value="">전체</option>
              <option value="pending">대기</option>
              <option value="classified">분류 완료</option>
              <option value="completed">처리 완료</option>
              <option value="failed">실패</option>
            </select>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        {workOrders.length > 0 ? (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>파일명</th>
                  <th>거래처</th>
                  <th>분류 방법</th>
                  <th>신뢰도</th>
                  <th>상태</th>
                  <th>업로드 시간</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.original_filename}</td>
                    <td>{order.client_name || '-'}</td>
                    <td>
                      <span className={`badge badge-${order.classification_method}`}>
                        {order.classification_method}
                      </span>
                    </td>
                    <td>{(parseFloat(order.confidence_score) * 100).toFixed(1)}%</td>
                    <td>
                      <span className={`badge badge-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleString('ko-KR')}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="btn btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                >
                  이전
                </button>
                <span style={{ padding: '0.625rem 1.25rem' }}>
                  {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="btn btn-secondary"
                >
                  다음
                </button>
              </div>
            )}

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <p className="text-sm text-muted">
                총 {pagination?.total || 0}개의 작업지시서
              </p>
            </div>
          </>
        ) : (
          <div className="text-center" style={{ padding: '3rem' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</p>
            <p className="text-muted">작업지시서가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkOrdersPage;
