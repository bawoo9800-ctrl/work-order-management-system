/**
 * 휴지통 페이지
 * 삭제된 작업지시서 관리 (복구/영구삭제)
 */

import { useState, useEffect } from 'react';
import { workOrderAPI } from '../services/api';

export default function TrashPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 휴지통 목록 조회
  const fetchTrashWorkOrders = async (page = 1) => {
    setLoading(true);
    try {
      const response = await workOrderAPI.trash({ page, limit: 20 });
      
      if (response.success) {
        setWorkOrders(response.data.data || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        });
      }
    } catch (error) {
      console.error('❌ 휴지통 조회 실패:', error);
      alert('휴지통을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 복구
  const handleRestore = async (id, clientName) => {
    if (!window.confirm(`"${clientName || '거래처 미지정'}" 작업지시서를 복구하시겠습니까?`)) {
      return;
    }

    try {
      const response = await workOrderAPI.restore(id);
      
      if (response.success) {
        alert('복구되었습니다!');
        fetchTrashWorkOrders(pagination.page);
      }
    } catch (error) {
      console.error('❌ 복구 실패:', error);
      alert('복구에 실패했습니다.');
    }
  };

  // 영구 삭제
  const handlePermanentDelete = async (id, clientName) => {
    if (!window.confirm(
      `"${clientName || '거래처 미지정'}" 작업지시서를 영구적으로 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`
    )) {
      return;
    }

    // 두 번째 확인
    if (!window.confirm('정말로 영구 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await workOrderAPI.permanentDelete(id);
      
      if (response.success) {
        alert('영구적으로 삭제되었습니다.');
        fetchTrashWorkOrders(pagination.page);
      }
    } catch (error) {
      console.error('❌ 영구 삭제 실패:', error);
      alert('영구 삭제에 실패했습니다.');
    }
  };

  // 이미지 URL 생성
  const getImageUrl = (storagePath) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    if (storagePath.startsWith('/uploads/')) {
      return `${baseUrl}${storagePath}`;
    }
    return `${baseUrl}/uploads/${storagePath}`;
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchTrashWorkOrders(1);
  }, []);

  return (
    <div className="trash-page">
      <style>{`
        .trash-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px 20px;
        }

        .trash-header {
          margin-bottom: 30px;
        }

        .trash-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .trash-header p {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .trash-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .stat-item {
          flex: 1;
          text-align: center;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #333;
        }

        .trash-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .trash-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .trash-card:hover {
          border-color: #999;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .card-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 210 / 297;
          background: #f5f5f5;
          overflow: hidden;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .deleted-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(220, 53, 69, 0.9);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        .card-info {
          padding: 16px;
        }

        .card-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .card-label {
          font-weight: 600;
          color: #666;
          min-width: 60px;
        }

        .card-value {
          color: #333;
          flex: 1;
        }

        .card-actions {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid #eee;
          background: #fafafa;
        }

        .btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-restore {
          background: #28a745;
          color: white;
        }

        .btn-restore:hover {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
        }

        .btn-permanent {
          background: #dc3545;
          color: white;
        }

        .btn-permanent:hover {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 40px;
        }

        .page-btn {
          padding: 10px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          background: #f8f9fa;
          border-color: #999;
        }

        .page-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #999;
        }

        .empty-state-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-state h2 {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 16px;
          color: #666;
        }

        .loading {
          text-align: center;
          padding: 80px 20px;
          font-size: 18px;
          color: #666;
        }
      `}</style>

      <div className="trash-header">
        <h1>
          🗑️ 휴지통
        </h1>
        <p>삭제된 작업지시서를 복구하거나 영구적으로 삭제할 수 있습니다.</p>
      </div>

      <div className="trash-stats">
        <div className="stat-item">
          <div className="stat-label">휴지통 항목</div>
          <div className="stat-value">{pagination.total}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">현재 페이지</div>
          <div className="stat-value">{pagination.page} / {pagination.totalPages || 1}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : workOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <h2>휴지통이 비어 있습니다</h2>
          <p>삭제된 작업지시서가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="trash-grid">
            {workOrders.map((order) => (
              <div key={order.id} className="trash-card">
                <div className="card-image-container">
                  <img
                    src={getImageUrl(order.storage_path)}
                    alt={order.client_name || '작업지시서'}
                    className="card-image"
                  />
                  <div className="deleted-badge">삭제됨</div>
                </div>

                <div className="card-info">
                  <div className="card-row">
                    <span className="card-label">거래처</span>
                    <span className="card-value">{order.client_name || '-'}</span>
                  </div>
                  <div className="card-row">
                    <span className="card-label">현장</span>
                    <span className="card-value">{order.site_name || '-'}</span>
                  </div>
                  <div className="card-row">
                    <span className="card-label">삭제일</span>
                    <span className="card-value">{formatDate(order.updated_at)}</span>
                  </div>
                  <div className="card-row">
                    <span className="card-label">전송자</span>
                    <span className="card-value">{order.uploaded_by || '-'}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn btn-restore"
                    onClick={() => handleRestore(order.id, order.client_name)}
                  >
                    ↩️ 복구
                  </button>
                  <button
                    className="btn btn-permanent"
                    onClick={() => handlePermanentDelete(order.id, order.client_name)}
                  >
                    🗑️ 영구 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => fetchTrashWorkOrders(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                ← 이전
              </button>
              
              {[...Array(pagination.totalPages)].map((_, index) => {
                const pageNum = index + 1;
                // 현재 페이지 주변 5개만 표시
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      className={`page-btn ${pagination.page === pageNum ? 'active' : ''}`}
                      onClick={() => fetchTrashWorkOrders(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === pagination.page - 3 ||
                  pageNum === pagination.page + 3
                ) {
                  return <span key={pageNum}>...</span>;
                }
                return null;
              })}

              <button
                className="page-btn"
                onClick={() => fetchTrashWorkOrders(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                다음 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
