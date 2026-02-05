/**
 * ========================================
 * 홈 페이지 (Dashboard)
 * ========================================
 * 파일: src/pages/HomePage.jsx
 * 설명: 당일 작업지시서 카드형 대시보드 + 좌측 거래처 리스트
 *       - 1920×1080 해상도 최적화
 *       - 마우스 오버 시 이미지 확대
 *       - 카드에서 거래처명/현장명 수정 기능
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
      // 이미 선택된 거래처 클릭 시 전체 보기
      setSelectedClient(null);
      fetchTodayWorkOrders();
    } else {
      // 새로운 거래처 선택
      setSelectedClient(client);
      fetchTodayWorkOrders(client?.id);
    }
  };
  
  // 카드 수정 시작
  const handleEditStart = (order) => {
    setEditingCard(order.id);
    setEditForm({
      client_name: order.client_name || '',
      site_name: order.site_name || '',
    });
  };
  
  // 카드 수정 저장
  const handleEditSave = async (orderId) => {
    try {
      await workOrderAPI.update(orderId, editForm);
      
      // 로컬 상태 업데이트
      setWorkOrders(workOrders.map(order => 
        order.id === orderId 
          ? { ...order, ...editForm }
          : order
      ));
      
      setEditingCard(null);
      console.log('✅ 수정 완료:', editForm);
    } catch (error) {
      console.error('❌ 수정 실패:', error);
      alert('수정에 실패했습니다.');
    }
  };
  
  // 카드 수정 취소
  const handleEditCancel = () => {
    setEditingCard(null);
    setEditForm({ client_name: '', site_name: '' });
  };
  
  // 이미지 확대
  const handleImageZoom = (imageUrl) => {
    setZoomedImage(imageUrl);
  };
  
  // 이미지 확대 닫기
  const closeImageZoom = () => {
    setZoomedImage(null);
  };
  
  // 이미지 URL 생성
  const getImageUrl = (workOrder) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200';
    const storagePath = workOrder.storage_path || '';
    
    // storage_path가 이미 /uploads/로 시작하면 그대로 사용
    if (storagePath.startsWith('/uploads/')) {
      return `${baseUrl}${storagePath}`;
    }
    
    // 아니면 /uploads/ 추가
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
          <h2>📋 거래처 목록</h2>
          <p className="client-count">{filteredClients.length}개</p>
        </div>
        
        {/* 검색 필드 */}
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 거래처 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="client-search-input"
          />
        </div>
        
        {/* 전체 보기 버튼 */}
        <div 
          className={`client-item ${!selectedClient ? 'active' : ''}`}
          onClick={() => handleClientClick(null)}
          style={{ borderBottom: '2px solid #e0e0e0', marginBottom: '10px', paddingBottom: '10px' }}
        >
          <strong>📊 전체 보기</strong>
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
          <h1>📅 {new Date().toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })} 작업지시서</h1>
          {selectedClient && (
            <div className="selected-client-badge">
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
                {/* 이미지 */}
                <div 
                  className="card-image"
                  onClick={() => handleImageZoom(getImageUrl(order))}
                >
                  <img 
                    src={getImageUrl(order)} 
                    alt={order.original_filename}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect width="200" height="280" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14">이미지 없음</text></svg>';
                    }}
                  />
                  <div className="zoom-hint">🔍 클릭하여 확대</div>
                </div>
                
                {/* 정보 */}
                <div className="card-info">
                  <div className="info-row">
                    <span className="label">전송자</span>
                    <span className="value">{order.uploaded_by || '-'}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">시간</span>
                    <span className="value time">{formatTime(order.created_at)}</span>
                  </div>
                  
                  {/* 거래처 (수정 가능) */}
                  <div className="info-row">
                    <span className="label">거래처</span>
                    {editingCard === order.id ? (
                      <input
                        type="text"
                        className="edit-input"
                        value={editForm.client_name}
                        onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                        placeholder="거래처명"
                      />
                    ) : (
                      <span className="value client">{order.client_name || '미분류'}</span>
                    )}
                  </div>
                  
                  {/* 현장명 (수정 가능) */}
                  <div className="info-row">
                    <span className="label">현장명</span>
                    {editingCard === order.id ? (
                      <input
                        type="text"
                        className="edit-input"
                        value={editForm.site_name}
                        onChange={(e) => setEditForm({ ...editForm, site_name: e.target.value })}
                        placeholder="현장명"
                      />
                    ) : (
                      <span className="value site">{order.site_name || '-'}</span>
                    )}
                  </div>
                  
                  {/* 수정 버튼 */}
                  <div className="card-actions">
                    {editingCard === order.id ? (
                      <>
                        <button 
                          className="btn-save"
                          onClick={() => handleEditSave(order.id)}
                        >
                          ✓ 저장
                        </button>
                        <button 
                          className="btn-cancel"
                          onClick={handleEditCancel}
                        >
                          ✕ 취소
                        </button>
                      </>
                    ) : (
                      <button 
                        className="btn-edit"
                        onClick={() => handleEditStart(order)}
                      >
                        ✎ 수정
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
        .dashboard-container {
          display: flex;
          height: calc(100vh - 80px);
          gap: 0;
          margin: -2rem -20px 0 -20px;
        }
        
        /* ===== 좌측 사이드바 (1920×1080 최적화) ===== */
        .client-sidebar {
          width: 320px;
          background: #ffffff;
          border-right: 2px solid #e0e0e0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .sidebar-header {
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .sidebar-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        
        .client-count {
          background: rgba(255,255,255,0.3);
          padding: 6px 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .search-box {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .client-search-input {
          width: 100%;
          padding: 12px 14px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.2s;
        }
        
        .client-search-input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .client-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        
        .client-item {
          padding: 14px 16px;
          margin-bottom: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: #f9f9f9;
          border: 2px solid transparent;
          font-size: 15px;
        }
        
        .client-item:hover {
          background: #f0f0f0;
          transform: translateX(5px);
        }
        
        .client-item.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          border-color: #667eea;
        }
        
        /* ===== 메인 컨텐츠 (1920×1080 최적화) ===== */
        .dashboard-main {
          flex: 1;
          overflow-y: auto;
          background: #f5f5f5;
          padding: 36px 40px;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        
        .dashboard-header h1 {
          margin: 0;
          color: #333;
          font-size: 32px;
          font-weight: 700;
        }
        
        .selected-client-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 24px;
          font-weight: 600;
          font-size: 18px;
        }
        
        /* ===== 작업지시서 그리드 (1920×1080: 4-5개씩 표시) ===== */
        .work-order-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 28px;
          padding-bottom: 24px;
        }
        
        /* ===== 작업지시서 카드 (A4 세로 비율 + 호버 효과) ===== */
        .work-order-card {
          background: white;
          border-radius: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
        }
        
        .work-order-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.15);
        }
        
        .card-image {
          width: 100%;
          aspect-ratio: 210 / 297; /* A4 세로 비율 */
          background: #f0f0f0;
          overflow: hidden;
          position: relative;
          cursor: pointer;
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
        
        .zoom-hint {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .card-image:hover .zoom-hint {
          opacity: 1;
        }
        
        .card-info {
          padding: 18px;
          background: white;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .info-row:last-of-type {
          border-bottom: none;
        }
        
        .info-row .label {
          font-size: 13px;
          color: #999;
          font-weight: 500;
        }
        
        .info-row .value {
          font-size: 15px;
          color: #333;
          font-weight: 600;
          text-align: right;
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .info-row .value.time {
          color: #667eea;
        }
        
        .info-row .value.client {
          color: #764ba2;
        }
        
        .info-row .value.site {
          color: #f59e0b;
        }
        
        .edit-input {
          padding: 6px 10px;
          border: 2px solid #667eea;
          border-radius: 6px;
          font-size: 14px;
          width: 150px;
          font-weight: 600;
        }
        
        .edit-input:focus {
          outline: none;
          border-color: #764ba2;
        }
        
        .card-actions {
          display: flex;
          gap: 8px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 2px solid #f0f0f0;
        }
        
        .btn-edit, .btn-save, .btn-cancel {
          flex: 1;
          padding: 10px 14px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-edit {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-edit:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }
        
        .btn-save {
          background: #10b981;
          color: white;
        }
        
        .btn-save:hover {
          background: #059669;
        }
        
        .btn-cancel {
          background: #ef4444;
          color: white;
        }
        
        .btn-cancel:hover {
          background: #dc2626;
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
          animation: fadeIn 0.3s;
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
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 24px 48px rgba(0,0,0,0.3);
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
          width: 40px;
          height: 40px;
          background: rgba(0,0,0,0.7);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10001;
        }
        
        .zoom-close:hover {
          background: rgba(0,0,0,0.9);
          transform: scale(1.1);
        }
        
        /* ===== 로딩 및 빈 상태 ===== */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 500px;
          color: #999;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f0f0f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .empty-dashboard {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 500px;
          text-align: center;
        }
        
        .empty-icon {
          font-size: 100px;
          margin-bottom: 24px;
        }
        
        .empty-dashboard h2 {
          color: #666;
          margin-bottom: 12px;
          font-size: 24px;
        }
        
        .empty-dashboard p {
          color: #999;
          font-size: 16px;
        }
        
        .empty-state {
          text-align: center;
          padding: 24px;
          color: #999;
          font-size: 15px;
        }
        
        /* ===== 1920×1080 최적화 ===== */
        @media (min-width: 1920px) {
          .work-order-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 32px;
          }
          
          .dashboard-main {
            padding: 40px 50px;
          }
          
          .dashboard-header h1 {
            font-size: 36px;
          }
        }
        
        /* ===== 반응형 ===== */
        @media (max-width: 1200px) {
          .work-order-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 22px;
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
            border-bottom: 2px solid #e0e0e0;
          }
          
          .work-order-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 18px;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
