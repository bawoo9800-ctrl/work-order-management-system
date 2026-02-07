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
  const [zoomedOrder, setZoomedOrder] = useState(null);
  const [modalForm, setModalForm] = useState({
    work_type: '',
    client_name: '',
    site_name: '',
    memo: ''
  });
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredClientNames, setFilteredClientNames] = useState([]);
  const [imageCache, setImageCache] = useState(new Map());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 오늘 날짜 (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  
  // 초기 데이터 로딩
  useEffect(() => {
    fetchTodayWorkOrders();
    fetchClients();
  }, []);
  
  // 선택한 날짜의 작업지시서 조회
  const fetchWorkOrdersByDate = async (date, clientId = null) => {
    setLoading(true);
    try {
      const params = {
        startDate: date,
        endDate: date,
      };
      
      if (clientId) {
        params.clientId = clientId;
      }
      
      const response = await workOrderAPI.list(params);
      const orders = response.data?.workOrders || response.workOrders || [];
      setWorkOrders(orders);
      
      console.log('📋 Fetched work orders:', orders.length);
      console.log('📋 First order work_type:', orders[0]?.work_type);
      console.log('📋 Sample orders:', orders.slice(0, 3).map(o => ({
        id: o.id,
        work_type: o.work_type,
        client_name: o.client_name
      })));
    } catch (error) {
      console.error('❌ 작업지시서 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 당일 작업지시서 조회 (backward compatibility)
  const fetchTodayWorkOrders = async (clientId = null) => {
    await fetchWorkOrdersByDate(selectedDate, clientId);
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
  
  // 거래처별 작업지시서 개수 계산
  const getClientOrderCount = (clientId, clientName) => {
    return workOrders.filter(order => {
      // client_id로 매칭하거나 client_name으로 매칭
      if (clientId && order.client_id === clientId) {
        return true;
      }
      if (clientName && order.client_name === clientName) {
        return true;
      }
      return false;
    }).length;
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
      
      // 로컬 상태 업데이트
      setWorkOrders(workOrders.map(order => 
        order.id === orderId ? { ...order, ...editForm } : order
      ));
      setEditingCard(null);
      
      // 서버에서 최신 데이터 다시 가져오기
      await fetchTodayWorkOrders(selectedClient?.id);
      
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
  
  // 카드 삭제
  const handleDelete = async (orderId) => {
    if (!window.confirm('정말로 이 작업지시서를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await workOrderAPI.delete(orderId);
      
      // 로컬 상태에서 제거
      setWorkOrders(workOrders.filter(order => order.id !== orderId));
      
      console.log('✅ 삭제 완료:', orderId);
    } catch (error) {
      console.error('❌ 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };
  
  // 이미지 확대
  const handleImageZoom = (order) => {
    console.log('🔍 Opening modal with order:', order);
    console.log('📋 work_type:', order.work_type);
    console.log('📝 memo:', order.memo);
    
    setZoomedImage(getImageUrl(order));
    setZoomedOrder(order);
    setModalForm({
      work_type: order.work_type || '',
      client_name: order.client_name || '',
      site_name: order.site_name || '',
      memo: order.memo || ''
    });
    
    console.log('✅ Modal form set:', {
      work_type: order.work_type || '',
      client_name: order.client_name || '',
      site_name: order.site_name || '',
      memo: order.memo || ''
    });
  };
  
  const closeImageZoom = () => {
    setZoomedImage(null);
    setZoomedOrder(null);
    setModalForm({
      work_type: '',
      client_name: '',
      site_name: '',
      memo: ''
    });
    setShowAutocomplete(false);
  };
  
  // 날짜 선택 핸들러
  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
    await fetchWorkOrdersByDate(date, selectedClient?.id);
  };
  
  // 오늘로 이동
  const handleTodayClick = async () => {
    setSelectedDate(today);
    setShowCalendar(false);
    await fetchWorkOrdersByDate(today, selectedClient?.id);
  };
  
  // 모달 거래처명 자동완성
  const handleModalClientNameChange = (e) => {
    const value = e.target.value;
    setModalForm({ ...modalForm, client_name: value });
    
    if (value.trim()) {
      const filtered = clients
        .filter(client => client.name && client.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setFilteredClientNames(filtered);
      setShowAutocomplete(filtered.length > 0);
    } else {
      setShowAutocomplete(false);
    }
  };
  
  // 모달 자동완성 선택
  const handleModalSelectClient = (clientName) => {
    setModalForm({ ...modalForm, client_name: clientName });
    setShowAutocomplete(false);
  };
  
  // 모달에서 저장
  const handleModalSave = async () => {
    if (!zoomedOrder) return;
    
    console.log('💾 Saving modal form:', modalForm);
    
    try {
      await workOrderAPI.update(zoomedOrder.id, modalForm);
      
      console.log('✅ Save successful');
      alert('저장되었습니다.');
      
      // 서버에서 최신 데이터 다시 가져오기
      console.log('🔄 Fetching latest data...');
      await fetchTodayWorkOrders(selectedClient?.id);
      console.log('✅ Data refreshed');
      
      // 모달 닫기 (데이터 새로고침 후)
      closeImageZoom();
    } catch (error) {
      console.error('❌ 저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };
  
  // 이미지 URL 생성 (메모이제이션)
  const getImageUrl = (workOrder) => {
    const cacheKey = workOrder.id;
    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey);
    }
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200';
    const storagePath = workOrder.storage_path || '';
    
    let url;
    if (storagePath.startsWith('/uploads/')) {
      url = `${baseUrl}${storagePath}`;
    } else {
      url = `${baseUrl}/uploads/${storagePath}`;
    }
    
    setImageCache(new Map(imageCache.set(cacheKey, url)));
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
    <>
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
            filteredClients.map((client) => {
              const count = getClientOrderCount(client.id, client.name);
              return (
                <div
                  key={client.id}
                  className={`client-item ${selectedClient?.id === client.id ? 'active' : ''}`}
                  onClick={() => handleClientClick(client)}
                >
                  <span className="client-name">{client.name}</span>
                  {count > 0 && (
                    <span className="client-count">{count}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>작업지시서</h1>
            <p className="subtitle">{new Date(selectedDate).toLocaleDateString('ko-KR', { 
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}</p>
          </div>
          <div className="date-actions">
            <button 
              className="btn-date-picker"
              onClick={() => setShowCalendar(true)}
            >
              📅 날짜 선택
            </button>
            {selectedDate !== today && (
              <button 
                className="btn-today"
                onClick={handleTodayClick}
              >
                오늘로 이동
              </button>
            )}
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
                  onClick={() => handleImageZoom(order)}
                >
                  <img 
                    src={getImageUrl(order)} 
                    alt={order.original_filename}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect width="200" height="280" fill="%23f5f5f5"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14">이미지 없음</text></svg>';
                    }}
                  />
                  {/* 클릭 힌트 */}
                  <div className="click-hint">🔍 클릭하여 확대</div>
                  
                  {/* 작업 유형 배지 (이미지 위 좌측 상단) */}
                  {order.work_type && (
                    <div className={`work-type-badge ${order.work_type === 'FSD' ? 'fsd-badge' : order.work_type === 'SD' ? 'sd-badge' : 'other-badge'}`}>
                      {order.work_type}
                    </div>
                  )}
                  
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
                      {/* 시간 / 전송자 / 현장명 / 수정 버튼 한 줄 */}
                      <div className="card-info-row">
                        <span className="info-item">{formatTime(order.created_at)}</span>
                        <span className="info-divider">•</span>
                        <span className="info-item">{order.uploaded_by || '전송자 미상'}</span>
                        <span className="info-divider">•</span>
                        <span className="info-item">{order.site_name || '현장명 없음'}</span>
                        <button className="btn-edit-inline" onClick={() => handleEditStart(order)}>
                          ✎
                        </button>
                        <button className="btn-delete-inline" onClick={() => handleDelete(order.id)}>
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                  
                  {/* 수정 모드 버튼 */}
                  {editingCard === order.id && (
                    <div className="card-actions">
                      <button className="btn-save" onClick={() => handleEditSave(order.id)}>
                        ✓
                      </button>
                      <button className="btn-cancel" onClick={handleEditCancel}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* 이미지 확대 모달 */}
      {zoomedImage && zoomedOrder && (
        <div className="image-zoom-modal" onClick={closeImageZoom}>
          <div className="zoom-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* 좌측: 이미지 */}
            <div className="zoom-modal-left">
              <button className="zoom-close" onClick={closeImageZoom}>✕</button>
              <img src={zoomedImage} alt="확대 이미지" className="zoom-image" />
            </div>
            
            {/* 우측: 폼 */}
            <div className="zoom-modal-right">
              <h3 className="modal-form-title">작업지시서 상세</h3>
              
              {/* 작업 유형 */}
              <div className="modal-form-group">
                <label className="modal-label">작업 유형</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="work_type"
                      value="FSD"
                      checked={modalForm.work_type === 'FSD'}
                      onChange={(e) => setModalForm({ ...modalForm, work_type: e.target.value })}
                    />
                    <span>FSD</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="work_type"
                      value="SD"
                      checked={modalForm.work_type === 'SD'}
                      onChange={(e) => setModalForm({ ...modalForm, work_type: e.target.value })}
                    />
                    <span>SD</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="work_type"
                      value="기타품목"
                      checked={modalForm.work_type === '기타품목'}
                      onChange={(e) => setModalForm({ ...modalForm, work_type: e.target.value })}
                    />
                    <span>기타품목</span>
                  </label>
                </div>
              </div>
              
              {/* 거래처명 */}
              <div className="modal-form-group">
                <label className="modal-label">거래처명</label>
                <div className="modal-autocomplete-wrapper">
                  <input
                    type="text"
                    className="modal-input"
                    value={modalForm.client_name}
                    onChange={handleModalClientNameChange}
                    onFocus={() => {
                      if (modalForm.client_name.trim() && filteredClientNames.length > 0) {
                        setShowAutocomplete(true);
                      }
                    }}
                    placeholder="거래처명을 입력하세요"
                  />
                  {showAutocomplete && (
                    <ul className="modal-autocomplete-list">
                      {filteredClientNames.map((client) => (
                        <li
                          key={client.id}
                          onClick={() => handleModalSelectClient(client.name)}
                          className="modal-autocomplete-item"
                        >
                          {client.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* 현장명 */}
              <div className="modal-form-group">
                <label className="modal-label">현장명</label>
                <input
                  type="text"
                  className="modal-input"
                  value={modalForm.site_name}
                  onChange={(e) => setModalForm({ ...modalForm, site_name: e.target.value })}
                  placeholder="현장명을 입력하세요"
                />
              </div>
              
              {/* 메모 */}
              <div className="modal-form-group">
                <label className="modal-label">메모</label>
                <textarea
                  className="modal-textarea"
                  value={modalForm.memo}
                  onChange={(e) => setModalForm({ ...modalForm, memo: e.target.value })}
                  placeholder="메모를 입력하세요"
                  rows="4"
                />
              </div>
              
              {/* 버튼 */}
              <div className="modal-buttons">
                <button className="modal-btn modal-btn-save" onClick={handleModalSave}>
                  ✓ 저장
                </button>
                <button className="modal-btn modal-btn-cancel" onClick={closeImageZoom}>
                  ✕ 취소
                </button>
              </div>
            </div>
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
          transform: translateZ(0);
          -webkit-overflow-scrolling: touch;
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
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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
          will-change: scroll-position;
          transform: translateZ(0);
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
          content-visibility: auto;
          contain: layout style paint;
        }
        
        .work-order-card:hover {
          border-color: #999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateZ(0);
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
          will-change: transform;
          content-visibility: auto;
        }
        
        .card-image:hover img {
          transform: scale(1.03) translateZ(0);
          backface-visibility: hidden;
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
          will-change: opacity;
          transform: translateZ(0);
        }
        
        .card-image:hover .click-hint {
          opacity: 1;
        }
        
        /* ===== 작업 유형 배지 (이미지 위 좌측 상단) ===== */
        .work-type-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          z-index: 10;
          letter-spacing: 0.5px;
        }
        
        .fsd-badge {
          background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%);
          color: white;
        }
        
        .sd-badge {
          background: linear-gradient(135deg, #1e90ff 0%, #4169e1 100%);
          color: white;
        }
        
        .other-badge {
          background: linear-gradient(135deg, #ffa502 0%, #ff7f50 100%);
          color: white;
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
        
        /* ===== 카드 정보 한 줄 ===== */
        .card-info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .info-item {
          color: #666;
          font-size: 13px;
          font-weight: 400;
        }
        
        .info-divider {
          color: #ccc;
          font-size: 12px;
        }
        
        .btn-edit-inline {
          margin-left: auto;
          padding: 4px 10px;
          background: #ffffff;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: #666;
        }
        
        .btn-edit-inline:hover {
          background: #f5f5f5;
          border-color: #999;
          color: #000;
        }
        
        .btn-delete-inline {
          padding: 4px 10px;
          background: #ffffff;
          border: 1px solid #ffdddd;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: #666;
        }
        
        .btn-delete-inline:hover {
          background: #ffe5e5;
          border-color: #ff6666;
          color: #ff0000;
        }
        
        /* ===== 메타 정보 (시간 + 전송자) - 삭제 예정 ===== */
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
          background: rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s;
          padding: 20px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .zoom-modal-container {
          display: flex;
          width: 90%;
          max-width: 1400px;
          height: 90vh;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        
        .zoom-modal-left {
          flex: 1;
          position: relative;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .zoom-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
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
          transform: rotate(90deg);
        }
        
        .zoom-modal-right {
          width: 400px;
          background: white;
          padding: 30px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        
        .modal-form-title {
          font-size: 24px;
          font-weight: 700;
          color: #222;
          margin: 0 0 24px 0;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .modal-form-group {
          margin-bottom: 24px;
        }
        
        .modal-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        
        .radio-group {
          display: flex;
          gap: 16px;
        }
        
        .radio-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 15px;
          color: #666;
        }
        
        .radio-label input[type="radio"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .radio-label:hover {
          color: #222;
        }
        
        .modal-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 15px;
          transition: border-color 0.2s;
        }
        
        .modal-input:focus {
          outline: none;
          border-color: #4CAF50;
        }
        
        .modal-autocomplete-wrapper {
          position: relative;
        }
        
        .modal-autocomplete-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 6px 6px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          margin: 0;
          padding: 0;
          list-style: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .modal-autocomplete-item {
          padding: 12px;
          cursor: pointer;
          font-size: 15px;
          color: #333;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }
        
        .modal-autocomplete-item:last-child {
          border-bottom: none;
        }
        
        .modal-autocomplete-item:hover {
          background: #f5f5f5;
          color: #000;
        }
        
        .modal-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 15px;
          resize: vertical;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        
        .modal-textarea:focus {
          outline: none;
          border-color: #4CAF50;
        }
        
        .modal-buttons {
          display: flex;
          gap: 12px;
          margin-top: auto;
          padding-top: 24px;
        }
        
        .modal-btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .modal-btn-save {
          background: #4CAF50;
          color: white;
        }
        
        .modal-btn-save:hover {
          background: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
        
        .modal-btn-cancel {
          background: #f5f5f5;
          color: #666;
        }
        
        .modal-btn-cancel:hover {
          background: #e0e0e0;
        }
        
        /* 모바일 대응 */
        @media (max-width: 768px) {
          .zoom-modal-container {
            flex-direction: column;
            width: 95%;
            height: 95vh;
          }
          
          .zoom-modal-left {
            flex: 1;
          }
          
          .zoom-modal-right {
            width: 100%;
            max-height: 50%;
            padding: 20px;
          }
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
        
        /* ===== 날짜 선택 버튼 ===== */
        .date-actions {
          display: flex;
          gap: 12px;
        }
        
        .btn-date-picker,
        .btn-today {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-date-picker {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .btn-date-picker:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }
        
        .btn-today {
          background: #f0f0f0;
          color: #333;
        }
        
        .btn-today:hover {
          background: #e0e0e0;
        }
        
        /* ===== 달력 모달 ===== */
        .calendar-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          animation: fadeIn 0.2s ease;
        }
        
        .calendar-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          width: 400px;
          max-width: 90%;
          animation: slideUp 0.3s ease;
          position: relative;
          z-index: 1000000;
        }
        
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .calendar-header h2 {
          margin: 0;
          font-size: 20px;
          color: #333;
        }
        
        .btn-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .btn-close:hover {
          background: #f0f0f0;
          color: #333;
        }
        
        .calendar-body {
          padding: 24px;
        }
        
        .date-input {
          width: 100%;
          padding: 14px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }
        
        .date-input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 20px;
        }
        
        .btn-quick {
          padding: 12px;
          background: #f8f8f8;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-quick:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
    
    {/* 달력 모달 - dashboard-container 외부 */}
    <div 
      className={`calendar-modal-overlay ${showCalendar ? 'active' : ''}`}
      onClick={() => setShowCalendar(false)}
      style={{ display: showCalendar ? 'flex' : 'none' }}
    >
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <h2>📅 날짜 선택</h2>
          <button className="btn-close" onClick={() => setShowCalendar(false)}>✕</button>
        </div>
        <div className="calendar-body">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateSelect(e.target.value)}
            max={today}
            className="date-input"
          />
          <div className="quick-actions">
            <button className="btn-quick" onClick={handleTodayClick}>
              오늘
            </button>
            <button className="btn-quick" onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              handleDateSelect(yesterday.toISOString().split('T')[0]);
            }}>
              어제
            </button>
            <button className="btn-quick" onClick={() => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              handleDateSelect(weekAgo.toISOString().split('T')[0]);
            }}>
              7일 전
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default HomePage;
