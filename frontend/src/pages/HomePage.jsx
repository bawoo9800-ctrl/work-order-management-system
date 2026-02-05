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
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredClientNames, setFilteredClientNames] = useState([]);
  
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
    setShowAutocomplete(false);
  };
  
  // 거래처명 입력 시 자동완성
  const handleClientNameChange = (e) => {
    const value = e.target.value;
    setEditForm({ ...editForm, client_name: value });
    
    if (value.trim()) {
      const filtered = clients
        .filter(client => client.name && client.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5); // 최대 5개만 표시
      setFilteredClientNames(filtered);
      setShowAutocomplete(filtered.length > 0);
    } else {
      setShowAutocomplete(false);
    }
  };
  
  // 자동완성 선택
  const handleSelectClient = (clientName) => {
    setEditForm({ ...editForm, client_name: clientName });
    setShowAutocomplete(false);
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
      {/* 좌측 사이드바 - 거래처 리스트 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>거래처 목록</h2>
        </div>
        
        {/* 검색 필드 */}
        <div className="search-box">
          <input
            type="text"
            placeholder="거래처 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* 전체 보기 버튼 */}
        <div 
          className={`client-item ${!selectedClient ? 'active' : ''}`}
          onClick={() => handleClientClick(null)}
        >
          <span className="client-name">전체 보기</span>
          <span className="client-count">{workOrders.length}</span>
        </div>
        
        {/* 거래처 목록 */}
        <div className="client-list">
          {filteredClients.length === 0 ? (
            <div className="empty-list">
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className={`client-item ${selectedClient?.id === client.id ? 'active' : ''}`}
                onClick={() => handleClientClick(client)}
              >
                <span className="client-name">{client.name}</span>
                <span className="client-badge">●</span>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>작업지시서</h1>
            <p className="subtitle">{new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}</p>
          </div>
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
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect width="200" height="280" fill="%23f5f5f5"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14">이미지 없음</text></svg>';
                    }}
                  />
                  {/* 클릭 힌트 */}
                  <div className="click-hint">🔍 클릭하여 확대</div>
                  
                  {/* 거래처명 배지 (이미지 위 우측 하단) */}
                  {!editingCard && order.client_name && (
                    <div className="client-badge">
                      {order.client_name}
                    </div>
                  )}
                </div>
                
                {/* 정보 영역 */}
                <div className="card-info">
                  {/* 거래처명 / 현장명 */}
                  {editingCard === order.id ? (
                    <>
                      <div className="autocomplete-wrapper">
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.client_name}
                          onChange={handleClientNameChange}
                          onFocus={() => {
                            if (editForm.client_name.trim() && filteredClientNames.length > 0) {
                              setShowAutocomplete(true);
                            }
                          }}
                          placeholder="거래처명"
                        />
                        {showAutocomplete && editingCard === order.id && (
                          <ul className="autocomplete-list">
                            {filteredClientNames.map((client) => (
                              <li
                                key={client.id}
                                onClick={() => handleSelectClient(client.name)}
                                className="autocomplete-item"
                              >
                                {client.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <input
                        type="text"
                        className="edit-input"
                        value={editForm.site_name}
                        onChange={(e) => setEditForm({ ...editForm, site_name: e.target.value })}
                        placeholder="현장명"
                      />
                    </>
                  ) : (
                    <>
                      {/* 시간 + 전송자 (한 줄, 작은 폰트) */}
                      <div className="meta-row">
                        <span className="meta-text">{formatTime(order.created_at)}</span>
                        <span className="meta-divider">•</span>
                        <span className="meta-text">{order.uploaded_by || '전송자 미상'}</span>
                      </div>
                      
                      {/* 현장명 */}
                      <div className="info-row">
                        <span className="info-label">현장명</span>
                        <span className="info-value">{order.site_name || '-'}</span>
                      </div>
                    </>
                  )}
                  
                  {/* 수정 버튼 */}
                  <div className="card-actions">
                    {editingCard === order.id ? (
                      <>
                        <button className="btn-save" onClick={() => handleEditSave(order.id)}>
                          ✓
                        </button>
                        <button className="btn-cancel" onClick={handleEditCancel}>
                          ✕
                        </button>
                      </>
                    ) : (
                      <button className="btn-edit" onClick={() => handleEditStart(order)}>
                        ✎
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
          min-height: calc(100vh - 60px - 56px);
          background: #f8f8f8;
          padding: 0;
          margin: 0;
          display: flex;
          width: 100%;
        }
        
        /* ===== 좌측 사이드바 ===== */
        .sidebar {
          width: 280px;
          background: #ffffff;
          border-right: 1px solid #ddd;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          flex-shrink: 0;
        }
        
        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .sidebar-header h2 {
          font-size: 18px;
          font-weight: 700;
          color: #000;
          margin: 0;
        }
        
        .search-box {
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .search-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        
        .search-input:focus {
          border-color: #000;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
        }
        
        .client-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }
        
        .client-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }
        
        .client-item:hover {
          background: #f5f5f5;
        }
        
        .client-item.active {
          background: #f0f0f0;
          border-left-color: #000;
        }
        
        .client-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          flex: 1;
        }
        
        .client-item.active .client-name {
          font-weight: 700;
          color: #000;
        }
        
        .client-count {
          font-size: 13px;
          font-weight: 600;
          color: #666;
          background: #f0f0f0;
          padding: 2px 8px;
          border-radius: 10px;
        }
        
        .client-badge {
          font-size: 10px;
          color: #999;
        }
        
        .client-item.active .client-badge {
          color: #000;
        }
        
        .empty-list {
          padding: 40px 20px;
          text-align: center;
        }
        
        .empty-list p {
          font-size: 14px;
          color: #999;
          margin: 0;
        }
        
        /* ===== 메인 컨텐츠 ===== */
        .dashboard-main {
          flex: 1;
          max-width: 100%;
          padding: 40px 60px;
          background: #f8f8f8;
        }
        
        .dashboard-header {
          margin-bottom: 40px;
        }
        
        .dashboard-header h1 {
          margin: 0 0 8px 0;
          color: #000;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        .subtitle {
          margin: 0;
          color: #666;
          font-size: 15px;
          font-weight: 400;
        }
        
        /* ===== 작업지시서 그리드 (1920×1080 최적화) ===== */
        .work-order-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 30px;
          padding-bottom: 40px;
        }
        
        /* ===== 카드 디자인 (심플 작업지시서) ===== */
        .work-order-card {
          background: #ffffff;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
          cursor: default;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }
        
        .work-order-card:hover {
          border-color: #999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .card-image {
          width: 100%;
          aspect-ratio: 210 / 297;
          background: #ffffff;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          border-bottom: 1px solid #ddd;
        }
        
        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s;
        }
        
        .card-image:hover img {
          transform: scale(1.03);
        }
        
        .click-hint {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        
        .card-image:hover .click-hint {
          opacity: 1;
        }
        
        /* ===== 거래처명 배지 (이미지 위 우측 하단) ===== */
        .client-badge {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.85);
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          backdrop-filter: blur(4px);
          z-index: 10;
        }
        
        .card-info {
          padding: 20px;
        }
        
        /* ===== 메타 정보 (시간 + 전송자) ===== */
        .meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .meta-text {
          color: #666;
          font-size: 13px;
          font-weight: 400;
        }
        
        .meta-divider {
          color: #ccc;
          font-size: 12px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 16px;
        }
        
        .info-label {
          color: #666;
          font-size: 15px;
          font-weight: 500;
          flex-shrink: 0;
        }
        
        .info-value {
          color: #000;
          font-size: 16px;
          font-weight: 600;
          text-align: right;
          word-break: break-all;
        }
        
        .edit-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 15px;
          margin-bottom: 10px;
          font-weight: 500;
        }
        
        .edit-input:focus {
          outline: none;
          border-color: #000;
        }
        
        /* ===== 자동완성 ===== */
        .autocomplete-wrapper {
          position: relative;
          margin-bottom: 10px;
        }
        
        .autocomplete-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #ccc;
          border-top: none;
          border-radius: 0 0 4px 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          margin: 0;
          padding: 0;
          list-style: none;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .autocomplete-item {
          padding: 10px 12px;
          cursor: pointer;
          font-size: 15px;
          color: #333;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .autocomplete-item:last-child {
          border-bottom: none;
        }
        
        .autocomplete-item:hover {
          background: #f5f5f5;
          color: #000;
        }
        
        .card-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }
        
        .btn-edit, .btn-save, .btn-cancel {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 20px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s;
          background: #ffffff;
          color: #666;
          line-height: 1;
        }
        
        .btn-edit:hover {
          background: #f5f5f5;
          border-color: #999;
          color: #000;
        }
        
        .btn-save {
          background: #000;
          color: #ffffff;
          border-color: #000;
        }
        
        .btn-save:hover {
          background: #333;
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
          background: rgba(0,0,0,0.95);
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
          border-radius: 8px;
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
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          background: rgba(0,0,0,0.8);
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
          background: rgba(0,0,0,1);
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
        
        /* ===== 1920×1080 최적화 ===== */
        @media (min-width: 1920px) {
          .work-order-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 36px;
          }
          
          .dashboard-main {
            padding: 50px 80px;
          }
          
          .dashboard-header h1 {
            font-size: 36px;
          }
        }
        
        @media (min-width: 1440px) and (max-width: 1919px) {
          .work-order-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
          }
        }
        
        @media (min-width: 1200px) and (max-width: 1439px) {
          .work-order-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
        }
        
        /* ===== 반응형 ===== */
        @media (max-width: 1199px) {
          .work-order-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
          }
          
          .dashboard-main {
            padding: 30px 40px;
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-main {
            padding: 20px;
          }
          
          .work-order-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 12px;
          }
          
          .dashboard-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
