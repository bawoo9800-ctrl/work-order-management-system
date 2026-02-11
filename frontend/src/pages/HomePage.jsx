/**
 * ========================================
 * 홈 페이지 (작업지시서 대시보드)
 * ========================================
 * 파일: src/pages/HomePage.jsx
 * 설명: 작업지시서 그리드 + 상단 검색/필터
 * ========================================
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { workOrderAPI, clientAPI } from '../services/api';
import ImageGalleryViewer from '../components/ImageGalleryViewer';

const HomePage = () => {
  const location = useLocation();
  const [workOrders, setWorkOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 고급 필터
  const [filters, setFilters] = useState({
    workType: '',
    siteName: '',
    memo: '',
    startDate: '',
    endDate: '',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // 이미지 갤러리
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomedOrder, setZoomedOrder] = useState(null);
  
  // 자동완성
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredClientNames, setFilteredClientNames] = useState([]);
  
  const [imageCache, setImageCache] = useState(new Map());
  
  // 한국 시간대로 오늘 날짜
  const getKoreanDate = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return koreaTime.toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getKoreanDate());
  const today = getKoreanDate();
  
  // 초기 데이터 로딩
  useEffect(() => {
    fetchWorkOrdersByDate(selectedDate);
    fetchClients();
  }, []);
  
  // WebSocket 알림 처리
  useEffect(() => {
    const handleWorkOrderUpdate = (event) => {
      const { type } = event.detail;
      if (type === 'work_order_created') {
        fetchWorkOrdersByDate(selectedDate);
      }
    };
    
    window.addEventListener('workOrderUpdate', handleWorkOrderUpdate);
    return () => window.removeEventListener('workOrderUpdate', handleWorkOrderUpdate);
  }, [selectedDate]);
  
  // 작업지시서 조회 (날짜 또는 전체)
  const fetchWorkOrdersByDate = async (date) => {
    try {
      setLoading(true);
      const params = date ? { startDate: date, endDate: date } : {};
      const response = await workOrderAPI.list(params);
      
      const orders = response.data?.workOrders || response.workOrders || [];
      setWorkOrders(orders);
      console.log(date ? `📋 ${date} 작업지시서:` : '📋 전체 작업지시서:', orders.length);
    } catch (error) {
      console.error('❌ 작업지시서 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 거래처 검색 핸들러
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    
    // 검색어가 있으면 전체 내역 조회, 없으면 필터 상태 확인
    if (value.trim()) {
      fetchWorkOrdersByDate(null);
    } else {
      // 다른 필터가 있으면 전체, 없으면 당일
      const hasOtherFilters = filters.workType || filters.siteName || filters.memo;
      fetchWorkOrdersByDate(hasOtherFilters ? null : selectedDate);
    }
  };
  
  // 필터 변경 핸들러
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // 필터가 하나라도 있으면 전체 내역 조회
    const hasFilters = newFilters.workType || newFilters.siteName || newFilters.memo || searchQuery;
    fetchWorkOrdersByDate(hasFilters ? null : selectedDate);
  };
  
  // 거래처 목록 조회
  const fetchClients = async () => {
    try {
      const response = await clientAPI.list();
      const clientData = response.data?.clients || response.clients || [];
      setClients(clientData);
    } catch (error) {
      console.error('❌ 거래처 로드 실패:', error);
    }
  };
  
  // 작업 유형 목록 (중복 제거)
  const workTypes = [...new Set(workOrders.map(o => o.work_type).filter(Boolean))];
  
  // 필터링된 작업지시서
  const filteredWorkOrders = workOrders.filter(order => {
    // 거래처 검색
    if (searchQuery && !order.client_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // 작업 유형 필터
    if (filters.workType && order.work_type !== filters.workType) {
      return false;
    }
    
    // 현장명 검색
    if (filters.siteName && !order.site_name?.toLowerCase().includes(filters.siteName.toLowerCase())) {
      return false;
    }
    
    // 메모 검색
    if (filters.memo && !order.memo?.toLowerCase().includes(filters.memo.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // 필터 초기화
  const handleResetFilters = () => {
    setFilters({
      workType: '',
      siteName: '',
      memo: '',
      startDate: '',
      endDate: '',
    });
    setSearchQuery('');
    // 모든 필터 초기화 → 당일로 복귀
    fetchWorkOrdersByDate(selectedDate);
  };
  
  // 날짜 변경
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    fetchWorkOrdersByDate(newDate);
  };
  
  // 오늘로 이동
  const handleTodayClick = () => {
    handleDateChange(today);
  };
  
  // 이미지 클릭
  const handleImageClick = (order) => {
    const imageUrl = getImageUrl(order);
    setZoomedImage(imageUrl);
    setZoomedOrder(order);
  };
  
  // 이미지 갤러리 닫기
  const closeImageZoom = () => {
    setZoomedImage(null);
    setZoomedOrder(null);
  };
  
  // 이미지 URL 생성
  const getImageUrl = (workOrder) => {
    if (imageCache.has(workOrder.id)) {
      return imageCache.get(workOrder.id);
    }
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const storagePath = workOrder.storage_path;
    
    let url;
    if (storagePath.startsWith('/uploads/')) {
      url = `${baseUrl}${storagePath}`;
    } else {
      url = `${baseUrl}/uploads/${storagePath}`;
    }
    
    setImageCache(new Map(imageCache.set(workOrder.id, url)));
    return url;
  };
  
  // 작업지시서 업데이트
  const handleUpdateWorkOrder = async (id, data) => {
    try {
      await workOrderAPI.update(id, data);
      await fetchWorkOrdersByDate(selectedDate);
    } catch (error) {
      console.error('❌ 작업지시서 업데이트 실패:', error);
    }
  };
  
  // 작업지시서 삭제
  const handleDeleteWorkOrder = async (id) => {
    try {
      await workOrderAPI.delete(id);
      await fetchWorkOrdersByDate(selectedDate);
      console.log('✅ 작업지시서 삭제 완료:', id);
    } catch (error) {
      console.error('❌ 작업지시서 삭제 실패:', error);
      throw error;
    }
  };

  return (
    <>
      <div className="homepage-container">
        {/* 상단 헤더 + 검색 */}
        <div className="page-header">
          <div className="header-top">
            <div>
              <h1>작업지시서</h1>
              <p className="subtitle">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
            <div className="header-actions">
              <input
                type="date"
                className="date-input"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              {selectedDate !== today && (
                <button className="btn-today" onClick={handleTodayClick}>
                  오늘로 이동
                </button>
              )}
            </div>
          </div>
          
          {/* 거래처 검색 */}
          <div className="search-section">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 거래처 검색... (예: 삼성, 현대) - 전체 내역 검색"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="clear-btn"
                  onClick={() => handleSearchChange('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {/* 고급 필터 토글 */}
          <div className="filters-toggle">
            <button 
              className="btn-toggle-filters"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              🔍 고급 검색/필터 {showAdvancedFilters ? '▲' : '▼'}
            </button>
            {(filters.workType || filters.siteName || filters.memo) && (
              <button 
                className="btn-reset-filters"
                onClick={handleResetFilters}
              >
                ✕ 필터 초기화
              </button>
            )}
            <div className="filter-stats">
              총 {filteredWorkOrders.length}건 / {workOrders.length}건
            </div>
          </div>
          
          {/* 고급 필터 패널 */}
          {showAdvancedFilters && (
            <div className="filters-panel">
              <div className="filters-grid">
                {/* 작업 유형 */}
                <div className="filter-item">
                  <label>🔧 작업 유형</label>
                  <select
                    value={filters.workType}
                    onChange={(e) => handleFilterChange('workType', e.target.value)}
                  >
                    <option value="">전체</option>
                    {workTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                {/* 현장명 */}
                <div className="filter-item">
                  <label>🏗️ 현장명</label>
                  <input
                    type="text"
                    placeholder="현장명 검색... (전체 내역)"
                    value={filters.siteName}
                    onChange={(e) => handleFilterChange('siteName', e.target.value)}
                  />
                </div>
                
                {/* 메모 */}
                <div className="filter-item">
                  <label>📝 메모</label>
                  <input
                    type="text"
                    placeholder="메모 검색... (전체 내역)"
                    value={filters.memo}
                    onChange={(e) => handleFilterChange('memo', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 로딩 */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>작업지시서를 불러오는 중...</p>
          </div>
        )}
        
        {/* 작업지시서 그리드 */}
        {!loading && (
          <div className="work-order-grid">
            {filteredWorkOrders.length === 0 ? (
              <div className="empty-state">
                <p>작업지시서가 없습니다.</p>
              </div>
            ) : (
              filteredWorkOrders.map((order) => (
                <div key={order.id} className="work-order-card">
                  <div 
                    className="card-image"
                    onClick={() => handleImageClick(order)}
                  >
                    <img 
                      src={getImageUrl(order)} 
                      alt="작업지시서" 
                      loading="lazy"
                    />
                    <div className="click-hint">클릭하여 확대</div>
                    
                    {/* 거래처명 배지 */}
                    {order.client_name && (
                      <div className="client-badge">
                        {order.client_name}
                      </div>
                    )}
                  </div>
                  
                  <div className="card-info">
                    <div className="card-row">
                      <span className="card-label">현장:</span>
                      <span className="card-value">{order.site_name || '-'}</span>
                    </div>
                    {order.work_type && (
                      <div className="card-row">
                        <span className="card-label">유형:</span>
                        <span className="card-value">{order.work_type}</span>
                      </div>
                    )}
                    {order.memo && (
                      <div className="card-row">
                        <span className="card-label">메모:</span>
                        <span className="card-value card-memo">{order.memo}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 하단 메타 정보 */}
                  <div className="card-footer">
                    <span className="footer-user">👤 {order.uploaded_by || '알 수 없음'}</span>
                    <span className="footer-divider">•</span>
                    <span className="footer-time">
                      {new Date(order.created_at).toLocaleDateString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* 이미지 갤러리 */}
      {zoomedImage && zoomedOrder && (
        <ImageGalleryViewer
          images={[zoomedImage]}
          initialIndex={0}
          onClose={closeImageZoom}
          workOrder={zoomedOrder}
          onUpdateWorkOrder={handleUpdateWorkOrder}
          onDeleteWorkOrder={handleDeleteWorkOrder}
          clients={clients}
        />
      )}
      
      <style>{`
        .homepage-container {
          max-width: 1600px;
          margin: 0 auto;
          padding: 20px;
        }
        
        /* ===== 페이지 헤더 ===== */
        .page-header {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .page-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
          color: #000;
        }
        
        .subtitle {
          margin: 0;
          font-size: 14px;
          color: #666;
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
        }
        
        .date-input {
          padding: 10px 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .date-input:focus {
          outline: none;
          border-color: #000;
        }
        
        .btn-today {
          padding: 10px 20px;
          background: #000;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-today:hover {
          background: #333;
        }
        
        /* ===== 검색 섹션 ===== */
        .search-section {
          margin-bottom: 20px;
        }
        
        .search-box {
          position: relative;
        }
        
        .search-input {
          width: 100%;
          padding: 14px 50px 14px 20px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 12px;
          transition: all 0.2s;
          font-family: inherit;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #000;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
        }
        
        .clear-btn {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          width: 30px;
          height: 30px;
          border: none;
          background: #f0f0f0;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          color: #666;
          transition: all 0.2s;
        }
        
        .clear-btn:hover {
          background: #e0e0e0;
          color: #000;
        }
        
        /* ===== 필터 토글 ===== */
        .filters-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .btn-toggle-filters {
          padding: 10px 20px;
          background: #f8f8f8;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-toggle-filters:hover {
          background: #f0f0f0;
          border-color: #ccc;
        }
        
        .btn-reset-filters {
          padding: 10px 16px;
          background: #fff;
          border: 2px solid #ff4444;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #ff4444;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-reset-filters:hover {
          background: #ff4444;
          color: white;
        }
        
        .filter-stats {
          margin-left: auto;
          font-size: 14px;
          font-weight: 600;
          color: #666;
        }
        
        /* ===== 고급 필터 패널 ===== */
        .filters-panel {
          margin-top: 20px;
          padding: 20px;
          background: #f8f8f8;
          border-radius: 12px;
        }
        
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        
        .filter-item label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        
        .filter-item input,
        .filter-item select {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s;
        }
        
        .filter-item input:focus,
        .filter-item select:focus {
          outline: none;
          border-color: #000;
        }
        
        /* ===== 로딩 ===== */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 80px 20px;
          color: #666;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #f0f0f0;
          border-top: 5px solid #000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* ===== 작업지시서 그리드 ===== */
        .work-order-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          padding-bottom: 40px;
          max-width: 1920px;
          margin: 0 auto;
        }
        
        .work-order-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }
        
        .work-order-card:hover {
          border-color: #999;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .card-image {
          width: 100%;
          height: 350px;
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
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .card-image:hover .click-hint {
          opacity: 1;
        }
        
        .client-badge {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          max-width: calc(100% - 24px);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .card-info {
          padding: 16px;
          padding-bottom: 12px;
        }
        
        .card-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 13px;
        }
        
        .card-row:last-child {
          margin-bottom: 0;
        }
        
        .card-label {
          font-weight: 600;
          color: #666;
          min-width: 50px;
        }
        
        .card-value {
          color: #000;
          font-weight: 500;
        }
        
        .card-memo {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .card-footer {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          border-top: 1px solid #f0f0f0;
          background: #fafafa;
          font-size: 12px;
          color: #666;
        }
        
        .footer-user {
          font-weight: 600;
        }
        
        .footer-divider {
          margin: 0 8px;
          color: #ccc;
        }
        
        .footer-time {
          color: #999;
        }
        
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 80px 20px;
          color: #999;
          font-size: 16px;
        }
        
        /* ===== 반응형 ===== */
        
        /* 대형 데스크톱 (1920px+) */
        @media (min-width: 1920px) {
          .work-order-grid {
            grid-template-columns: repeat(5, 1fr);
            max-width: 1920px;
          }
        }
        
        /* 일반 데스크톱 (1440-1919px) */
        @media (min-width: 1440px) and (max-width: 1919px) {
          .work-order-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        /* 소형 데스크톱/태블릿 (1024-1439px) */
        @media (min-width: 1024px) and (max-width: 1439px) {
          .work-order-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        /* 태블릿 (768-1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .work-order-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }
        
        /* 모바일 (768px 이하) */
        @media (max-width: 768px) {
          .homepage-container {
            padding: 15px;
          }
          
          .page-header {
            padding: 20px;
          }
          
          .header-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .work-order-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 15px;
          }
          
          .card-image {
            height: 250px;
          }
          
          .filters-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default HomePage;
