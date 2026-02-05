/**
 * ========================================
 * 홈 페이지 (Dashboard)
 * ========================================
 * 파일: src/pages/HomePage.jsx
 * 설명: 당일 작업지시서 카드형 대시보드 + 좌측 거래처 리스트
 *       - 중고차 사이트 스타일 디자인
 *       - 깔끔한 흰색 배경, 미니멀 카드
 * ========================================
 */

import { useState, useEffect } from 'react';
import { workOrderAPI, clientAPI } from '../services/api';

const HomePage = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [editForm, setEditForm] = useState({ client_name: '', site_name: '' });
  const [zoomedImage, setZoomedImage] = useState(null);
  
  // 오늘 날짜 (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  
  // 초기 데이터 로딩
  useEffect(() => {
    fetchTodayWorkOrders();
    fetchClients();
  }, []);
  
  // 당일 작업지시서 조회
  const fetchTodayWorkOrders = async (clientId = null) => {
    setLoading(true);
    try {
      const params = {
        startDate: today,
        endDate: today,
      };
      
      if (clientId) {
        params.clientId = clientId;
      }
      
      const response = await workOrderAPI.list(params);
      const orders = response.data?.workOrders || response.workOrders || [];
      setWorkOrders(orders);
      
      console.log('📋 당일 작업지시서:', orders);
    } catch (error) {
      console.error('❌ 작업지시서 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 거래처 목록 조회
  const fetchClients = async () => {
    try {
      const response = await clientAPI.list();
      const clientsData = response.data?.clients || response.clients || [];
      setClients(clientsData);
      
      console.log('👥 거래처 목록:', clientsData);
    } catch (error) {
      console.error('❌ 거래처 목록 조회 실패:', error);
    }
  };
  
  // 거래처 검색
  const filteredClients = clients.filter(client => {
    if (!client || !client.name) return false;
    return client.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // 거래처 선택
  const handleClientClick = (client) => {
    if (selectedClient?.id === client?.id) {
      setSelectedClient(null);
      fetchTodayWorkOrders();
    } else {
      setSelectedClient(client);
      fetchTodayWorkOrders(client?.id);
    }
  };
  
  // 카드 수정
  const handleEditStart = (order) => {
    setEditingCard(order.id);
    setEditForm({
      client_name: order.client_name || '',
      site_name: order.site_name || '',
    });
  };
  
  const handleEditSave = async (orderId) => {
    try {
      await workOrderAPI.update(orderId, editForm);
      setWorkOrders(workOrders.map(order => 
        order.id === orderId ? { ...order, ...editForm } : order
      ));
      setEditingCard(null);
      console.log('✅ 수정 완료:', editForm);
    } catch (error) {
      console.error('❌ 수정 실패:', error);
      alert('수정에 실패했습니다.');
    }
  };
  
  const handleEditCancel = () => {
    setEditingCard(null);
    setEditForm({ client_name: '', site_name: '' });
  };
  
  // 이미지 확대
  const handleImageZoom = (imageUrl) => {
    setZoomedImage(imageUrl);
  };
  
  const closeImageZoom = () => {
    setZoomedImage(null);
  };
  
  // 이미지 URL 생성
  const getImageUrl = (workOrder) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200';
    const storagePath = workOrder.storage_path || '';
    
    if (storagePath.startsWith('/uploads/')) {
      return `${baseUrl}${storagePath}`;
    }
    
    return `${baseUrl}/uploads/${storagePath}`;
  };
  
  // 시간 포맷팅
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  return (
    <div className="dashboard-container">
      {/* 좌측 거래처 리스트 */}
      <aside className="client-sidebar">
        <div className="sidebar-header">
          <h2>거래처 목록</h2>
          <span className="client-count">{filteredClients.length}개</span>
        </div>
        
        {/* 검색 필드 */}
        <div className="search-box">
          <input
            type="text"
            placeholder="거래처 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="client-search-input"
          />
        </div>
        
        {/* 전체 보기 */}
        <div className="filter-section">
          <div 
            className={`client-item ${!selectedClient ? 'active' : ''}`}
            onClick={() => handleClientClick(null)}
          >
            전체 보기
          </div>
        </div>
        
        {/* 거래처 목록 */}
        <div className="client-list">
          {filteredClients.length === 0 ? (
            <div className="empty-state">검색 결과가 없습니다.</div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className={`client-item ${selectedClient?.id === client.id ? 'active' : ''}`}
                onClick={() => handleClientClick(client)}
              >
                {client.name}
              </div>
            ))
          )}
        </div>
      </aside>
      
      {/* 메인 컨텐츠 */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>{new Date().toLocaleDateString('ko-KR', { 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })} 작업지시서</h1>
            <p className="subtitle">총 {workOrders.length}건</p>
          </div>
          {selectedClient && (
            <div className="selected-badge">
              {selectedClient.name}
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>로딩 중...</p>
          </div>
        ) : workOrders.length === 0 ? (
          <div className="empty-dashboard">
            <div className="empty-icon">📭</div>
            <h2>오늘 등록된 작업지시서가 없습니다.</h2>
            <p>작업지시서를 업로드해주세요.</p>
          </div>
        ) : (
          <div className="work-order-grid">
            {workOrders.map((order) => (
              <div key={order.id} className="work-order-card">
                {/* NEW 배지 (최근 1시간 이내) */}
                {new Date() - new Date(order.created_at) < 3600000 && (
                  <div className="new-badge">NEW</div>
                )}
                
                {/* 이미지 */}
                <div 
                  className="card-image"
                  onClick={() => handleImageZoom(getImageUrl(order))}
                >
                  <img 
                    src={getImageUrl(order)} 
                    alt={order.original_filename}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect width="200" height="280" fill="%23f5f5f5"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14">이미지 없음</text></svg>';
                    }}
                  />
                </div>
                
                {/* 정보 */}
                <div className="card-info">
                  {/* 시간 */}
                  <div className="card-time">{formatTime(order.created_at)}</div>
                  
                  {/* 거래처 */}
                  {editingCard === order.id ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.client_name}
                      onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                      placeholder="거래처명"
                    />
                  ) : (
                    <div className="card-title">{order.client_name || '미분류'}</div>
                  )}
                  
                  {/* 현장명 */}
                  {editingCard === order.id ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.site_name}
                      onChange={(e) => setEditForm({ ...editForm, site_name: e.target.value })}
                      placeholder="현장명"
                    />
                  ) : (
                    <div className="card-subtitle">{order.site_name || '-'}</div>
                  )}
                  
                  {/* 전송자 */}
                  <div className="card-meta">
                    <span>전송자</span>
                    <span>{order.uploaded_by || '-'}</span>
                  </div>
                  
                  {/* 수정 버튼 */}
                  <div className="card-actions">
                    {editingCard === order.id ? (
                      <>
                        <button className="btn-save" onClick={() => handleEditSave(order.id)}>
                          저장
                        </button>
                        <button className="btn-cancel" onClick={handleEditCancel}>
                          취소
                        </button>
                      </>
                    ) : (
                      <button className="btn-edit" onClick={() => handleEditStart(order)}>
                        수정
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* 이미지 확대 모달 */}
      {zoomedImage && (
        <div className="image-zoom-modal" onClick={closeImageZoom}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-close" onClick={closeImageZoom}>✕</button>
            <img src={zoomedImage} alt="확대 이미지" />
          </div>
        </div>
      )}
      
      <style>{`
        * {
          box-sizing: border-box;
        }
        
        .dashboard-container {
          display: flex;
          height: calc(100vh - 80px);
          gap: 0;
          margin: -2rem -20px 0 -20px;
          background: #ffffff;
        }
        
        /* ===== 좌측 사이드바 (중고차 스타일) ===== */
        .client-sidebar {
          width: 280px;
          background: #f7f7f7;
          border-right: 1px solid #e0e0e0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .sidebar-header {
          padding: 20px;
          background: #ffffff;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .sidebar-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #222;
        }
        
        .client-count {
          background: #f0f0f0;
          color: #666;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .search-box {
          padding: 16px;
          background: #ffffff;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .client-search-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          background: #ffffff;
          color: #333;
        }
        
        .client-search-input:focus {
          outline: none;
          border-color: #333;
        }
        
        .filter-section {
          padding: 8px 16px;
          background: #ffffff;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .client-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          background: #f7f7f7;
        }
        
        .client-item {
          padding: 12px 16px;
          margin-bottom: 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
          background: #ffffff;
          color: #333;
          font-size: 14px;
          border: 1px solid transparent;
        }
        
        .client-item:hover {
          background: #f0f0f0;
          border-color: #ddd;
        }
        
        .client-item.active {
          background: #222;
          color: #ffffff;
          font-weight: 600;
          border-color: #222;
        }
        
        /* ===== 메인 컨텐츠 (깔끔한 흰색) ===== */
        .dashboard-main {
          flex: 1;
          overflow-y: auto;
          background: #ffffff;
          padding: 30px 40px;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .dashboard-header h1 {
          margin: 0 0 6px 0;
          color: #222;
          font-size: 26px;
          font-weight: 700;
        }
        
        .subtitle {
          margin: 0;
          color: #999;
          font-size: 14px;
          font-weight: 400;
        }
        
        .selected-badge {
          background: #222;
          color: #ffffff;
          padding: 8px 18px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
        }
        
        /* ===== 작업지시서 그리드 (1920×1080: 3-4개) ===== */
        .work-order-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          padding-bottom: 24px;
        }
        
        /* ===== 카드 디자인 (중고차 스타일) ===== */
        .work-order-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          transition: all 0.2s;
          cursor: default;
          position: relative;
        }
        
        .work-order-card:hover {
          border-color: #ccc;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .new-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #e53935;
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 2px;
          font-size: 11px;
          font-weight: 700;
          z-index: 10;
          letter-spacing: 0.5px;
        }
        
        .card-image {
          width: 100%;
          aspect-ratio: 4 / 3;
          background: #f5f5f5;
          overflow: hidden;
          cursor: pointer;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        
        .card-image:hover img {
          transform: scale(1.05);
        }
        
        .card-info {
          padding: 16px;
        }
        
        .card-time {
          color: #999;
          font-size: 12px;
          margin-bottom: 8px;
        }
        
        .card-title {
          font-size: 16px;
          font-weight: 700;
          color: #222;
          margin-bottom: 6px;
        }
        
        .card-subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
        }
        
        .card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-top: 1px solid #f0f0f0;
          font-size: 13px;
          color: #666;
          margin-bottom: 12px;
        }
        
        .card-meta span:first-child {
          color: #999;
        }
        
        .card-meta span:last-child {
          font-weight: 600;
          color: #333;
        }
        
        .edit-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .edit-input:focus {
          outline: none;
          border-color: #333;
        }
        
        .card-actions {
          display: flex;
          gap: 8px;
        }
        
        .btn-edit, .btn-save, .btn-cancel {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: #ffffff;
          color: #333;
        }
        
        .btn-edit:hover {
          background: #f5f5f5;
          border-color: #333;
        }
        
        .btn-save {
          background: #222;
          color: #ffffff;
          border-color: #222;
        }
        
        .btn-save:hover {
          background: #000;
        }
        
        .btn-cancel {
          background: #ffffff;
          color: #666;
        }
        
        .btn-cancel:hover {
          background: #f5f5f5;
          border-color: #999;
        }
        
        /* ===== 이미지 확대 모달 ===== */
        .image-zoom-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .zoom-modal-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          background: white;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .zoom-modal-content img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        
        .zoom-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          background: rgba(0,0,0,0.7);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10001;
        }
        
        .zoom-close:hover {
          background: rgba(0,0,0,0.9);
        }
        
        /* ===== 로딩 및 빈 상태 ===== */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #999;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f0f0f0;
          border-top-color: #333;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .empty-dashboard {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          text-align: center;
        }
        
        .empty-icon {
          font-size: 80px;
          margin-bottom: 20px;
        }
        
        .empty-dashboard h2 {
          color: #666;
          margin-bottom: 10px;
          font-size: 20px;
        }
        
        .empty-dashboard p {
          color: #999;
          font-size: 14px;
        }
        
        .empty-state {
          text-align: center;
          padding: 20px;
          color: #999;
          font-size: 14px;
        }
        
        /* ===== 1920×1080 최적화 ===== */
        @media (min-width: 1920px) {
          .work-order-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 28px;
          }
          
          .dashboard-main {
            padding: 36px 50px;
          }
        }
        
        /* ===== 반응형 ===== */
        @media (max-width: 1200px) {
          .work-order-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            flex-direction: column;
            height: auto;
          }
          
          .client-sidebar {
            width: 100%;
            max-height: 300px;
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .work-order-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
