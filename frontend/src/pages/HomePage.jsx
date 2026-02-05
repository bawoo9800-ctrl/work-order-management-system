/**
 * ========================================
 * 홈 페이지 (Dashboard)
 * ========================================
 * 파일: src/pages/HomePage.jsx
 * 설명: 당일 작업지시서 카드형 대시보드 + 좌측 거래처 리스트
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
    if (selectedClient?.id === client.id) {
      // 이미 선택된 거래처 클릭 시 전체 보기
      setSelectedClient(null);
      fetchTodayWorkOrders();
    } else {
      // 새로운 거래처 선택
      setSelectedClient(client);
      fetchTodayWorkOrders(client.id);
    }
  };
  
  // 이미지 URL 생성
  const getImageUrl = (workOrder) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200';
    const storagePath = workOrder.storage_path || '';
    
    console.log('🖼️ 이미지 URL 생성:', {
      baseUrl,
      storagePath,
      workOrderId: workOrder.id,
    });
    
    // storage_path가 이미 /uploads/로 시작하면 그대로 사용
    if (storagePath.startsWith('/uploads/')) {
      const url = `${baseUrl}${storagePath}`;
      console.log('✅ URL (절대 경로):', url);
      return url;
    }
    
    // 아니면 /uploads/ 추가
    const url = `${baseUrl}/uploads/${storagePath}`;
    console.log('✅ URL (상대 경로):', url);
    return url;
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
                <div className="card-image">
                  <img 
                    src={getImageUrl(order)} 
                    alt={order.original_filename}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect width="200" height="280" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14">이미지 없음</text></svg>';
                    }}
                  />
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
                  
                  <div className="info-row">
                    <span className="label">거래처</span>
                    <span className="value client">{order.client_name || '미분류'}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">현장명</span>
                    <span className="value site">{order.site_name || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <style>{`
        .dashboard-container {
          display: flex;
          height: calc(100vh - 100px);
          gap: 0;
          margin: -2rem -20px 0 -20px;
        }
        
        /* ===== 좌측 사이드바 ===== */
        .client-sidebar {
          width: 280px;
          background: #ffffff;
          border-right: 2px solid #e0e0e0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .sidebar-header {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .sidebar-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .client-count {
          background: rgba(255,255,255,0.3);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .search-box {
          padding: 15px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .client-search-input {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        .client-search-input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .client-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }
        
        .client-item {
          padding: 12px 15px;
          margin-bottom: 5px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: #f9f9f9;
          border: 2px solid transparent;
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
        
        /* ===== 메인 컨텐츠 ===== */
        .dashboard-main {
          flex: 1;
          overflow-y: auto;
          background: #f5f5f5;
          padding: 30px;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .dashboard-header h1 {
          margin: 0;
          color: #333;
          font-size: 28px;
          font-weight: 700;
        }
        
        .selected-client-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 16px;
        }
        
        /* ===== 작업지시서 그리드 ===== */
        .work-order-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 25px;
          padding-bottom: 20px;
        }
        
        /* ===== 작업지시서 카드 (A4 세로 비율) ===== */
        .work-order-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: all 0.3s;
          cursor: pointer;
        }
        
        .work-order-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }
        
        .card-image {
          width: 100%;
          aspect-ratio: 210 / 297; /* A4 세로 비율 */
          background: #f0f0f0;
          overflow: hidden;
        }
        
        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .card-info {
          padding: 15px;
          background: white;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .info-row:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        
        .info-row .label {
          font-size: 12px;
          color: #999;
          font-weight: 500;
        }
        
        .info-row .value {
          font-size: 14px;
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
        
        /* ===== 로딩 및 빈 상태 ===== */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #999;
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
        }
        
        .empty-dashboard p {
          color: #999;
        }
        
        .empty-state {
          text-align: center;
          padding: 20px;
          color: #999;
          font-size: 14px;
        }
        
        /* ===== 반응형 ===== */
        @media (max-width: 1200px) {
          .work-order-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
            border-bottom: 2px solid #e0e0e0;
          }
          
          .work-order-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 15px;
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
