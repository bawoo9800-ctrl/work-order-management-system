/**
 * ========================================
 * 발주서 목록 페이지
 * ========================================
 * 파일: src/pages/PurchaseOrderListPage.jsx
 * 설명: 발주서 그리드 + 상단 검색/필터
 * ========================================
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ImageGalleryViewer from '../components/ImageGalleryViewer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const PurchaseOrderListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 한국 시간대로 오늘 날짜
  const getKoreanDate = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return koreaTime.toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getKoreanDate());
  const today = getKoreanDate();
  
  // 이미지 갤러리
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomedOrder, setZoomedOrder] = useState(null);
  
  // 초기 데이터 로딩
  useEffect(() => {
    fetchPurchaseOrdersByDate(selectedDate);
    fetchClients();
  }, []);
  
  // 거래처 페이지 또는 업로드 페이지에서 네비게이션된 경우 처리
  useEffect(() => {
    if (location.state?.selectedClient) {
      const client = location.state.selectedClient;
      console.log('🔍 거래처에서 선택됨:', client.name);
      setSearchQuery(client.name);
    }
    
    // 업로드 후 이동한 경우
    if (location.state?.uploadedDate) {
      const uploadedDate = location.state.uploadedDate;
      console.log('📤 업로드 완료, 날짜:', uploadedDate);
      setSelectedDate(uploadedDate);
      fetchPurchaseOrdersByDate(uploadedDate);
    } else if (location.state?.showAll) {
      console.log('📤 업로드 완료, 전체 보기');
      fetchPurchaseOrdersByDate(null);
    }
  }, [location.state]);
  
  // 발주서 조회 (날짜 또는 전체)
  const fetchPurchaseOrdersByDate = async (date) => {
    try {
      setLoading(true);
      const params = date ? { startDate: date, endDate: date } : {};
      const response = await axios.get(`${API_BASE_URL}/api/v1/purchase-orders`, { params });
      const orders = response.data?.data || [];
      setPurchaseOrders(orders);
      console.log(date ? `📦 ${date} 발주서:` : '📦 전체 발주서:', orders.length);
    } catch (error) {
      console.error('❌ 발주서 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 검색 변경 핸들러
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    
    // 검색어가 있으면 전체 내역 조회, 없으면 당일
    if (value.trim()) {
      fetchPurchaseOrdersByDate(null);
    } else {
      fetchPurchaseOrdersByDate(selectedDate);
    }
  };
  
  // 거래처 조회
  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/clients`);
      setClients(response.data?.data?.clients || []);
    } catch (error) {
      console.error('❌ 거래처 로드 실패:', error);
    }
  };
  
  // 검색 필터링 (발주처, 현장명, 메모)
  const filteredOrders = purchaseOrders.filter(order => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      order.supplier_name?.toLowerCase().includes(query) ||
      order.site_name?.toLowerCase().includes(query) ||
      order.memo?.toLowerCase().includes(query)
    );
  });
  
  // 이미지 클릭 핸들러
  const handleImageClick = (order) => {
    let images = [];
    
    if (order.images) {
      try {
        let parsed = typeof order.images === 'string' ? JSON.parse(order.images) : order.images;
        
        // 이중 인코딩 체크: 파싱 후에도 여전히 문자열이면 한 번 더 파싱
        if (typeof parsed === 'string') {
          console.log('🔄 이중 인코딩 감지 (handleImageClick), 2차 파싱 시도');
          parsed = JSON.parse(parsed);
        }
        
        // parsed가 배열인지 확인
        if (Array.isArray(parsed)) {
          images = parsed.map(img => `${API_BASE_URL}/uploads/${img.path || img.storage_path}`);
        } else {
          console.warn('이미지 데이터가 배열이 아닙니다:', parsed);
        }
      } catch (e) {
        console.error('이미지 파싱 오류:', e, 'order.images:', order.images);
      }
    }
    
    // 이미지가 없으면 레거시 storage_path 사용
    if (images.length === 0 && order.storage_path) {
      images = [`${API_BASE_URL}/uploads/${order.storage_path}`];
    }
    
    if (images.length > 0) {
      setZoomedImage(images[0]);
      setZoomedOrder({ ...order, imageUrls: images });
    } else {
      console.warn('이미지가 없습니다. order:', order);
    }
  };
  
  // 발주서 수정
  const handleUpdatePurchaseOrder = async (id, updateData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/v1/purchase-orders/${id}`, updateData);
      
      // 수정 성공 메시지
      alert('✅ 발주서가 수정되었습니다.');
      
      // 수정된 발주서의 날짜 확인
      const updatedOrder = response.data?.data;
      const updatedDate = updatedOrder?.order_date;
      
      console.log('📝 서버에서 받은 업데이트된 발주서:', updatedOrder);
      console.log('📝 현장명 확인:', {
        서버응답_site_name: updatedOrder?.site_name,
        서버응답_supplier_name: updatedOrder?.supplier_name,
        현재모달_site_name: zoomedOrder?.site_name
      });
      
      // 현재 열려있는 모달의 발주서를 업데이트
      if (zoomedOrder && zoomedOrder.id === id) {
        console.log('🔄 모달 상태 업데이트 중...');
        console.log('업데이트 전 zoomedOrder:', zoomedOrder);
        
        const newZoomedOrder = {
          ...zoomedOrder,
          ...updatedOrder,
          imageUrls: zoomedOrder.imageUrls // 이미지 URL은 유지
        };
        
        console.log('업데이트 후 newZoomedOrder:', newZoomedOrder);
        setZoomedOrder(newZoomedOrder);
        console.log('✅ 모달 상태 업데이트 완료');
      }
      
      // 날짜가 변경되었는지 확인
      if (updatedDate) {
        const orderDateOnly = updatedDate.split('T')[0]; // YYYY-MM-DD만 추출
        
        // 수정된 날짜로 필터 변경
        if (orderDateOnly !== selectedDate) {
          console.log(`📅 발주일 변경됨: ${selectedDate} → ${orderDateOnly}`);
          setSelectedDate(orderDateOnly);
          fetchPurchaseOrdersByDate(orderDateOnly);
          return;
        }
      }
      
      // 날짜 변경이 없으면 현재 필터로 재조회
      // 단, 모달이 열려있으면 재조회하지 않음 (모달 상태 유지)
      if (!zoomedOrder) {
        fetchPurchaseOrdersByDate(searchQuery ? null : selectedDate);
      } else {
        console.log('📌 모달이 열려있어 목록 재조회 생략 (모달 상태 유지)');
      }
    } catch (error) {
      console.error('발주서 수정 실패:', error);
      alert('발주서 수정에 실패했습니다.');
    }
  };
  
  // 발주서 삭제
  const handleDeletePurchaseOrder = async (id) => {
    if (!confirm('이 발주서를 취소하시겠습니까?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/v1/purchase-orders/${id}`);
      fetchPurchaseOrdersByDate(searchQuery ? null : selectedDate);
      setZoomedImage(null);
      setZoomedOrder(null);
    } catch (error) {
      console.error('발주서 삭제 실패:', error);
      alert('발주서 삭제에 실패했습니다.');
    }
  };
  
  // 🆕 이미지 추가 후 처리
  const handleImagesAdded = async (orderId, updatedData) => {
    console.log('📸 이미지 추가 완료 - 모달 업데이트:', orderId, updatedData);
    
    // 이미지 목록 파싱
    let parsedImages = updatedData.images;
    if (typeof parsedImages === 'string') {
      try {
        parsedImages = JSON.parse(parsedImages);
        console.log('✅ 1차 JSON 파싱 (handleImagesAdded):', parsedImages, '타입:', typeof parsedImages);
        
        // 이중 인코딩 체크
        if (typeof parsedImages === 'string') {
          console.log('🔄 이중 인코딩 감지 (handleImagesAdded), 2차 파싱 시도');
          parsedImages = JSON.parse(parsedImages);
          console.log('✅ 2차 파싱 성공:', parsedImages);
        }
      } catch (e) {
        console.error('이미지 파싱 실패:', e);
        parsedImages = [];
      }
    }
    
    // 배열이 아니면 빈 배열로 초기화
    if (!Array.isArray(parsedImages)) {
      console.warn('parsedImages가 배열이 아닙니다:', parsedImages);
      parsedImages = [];
    }
    
    // 이미지 URL 생성
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const newImageUrls = parsedImages.map(img => 
      `${API_BASE_URL}/uploads/${img.path || img.storage_path}`
    );
    
    console.log('🔄 새 이미지 URL 목록:', newImageUrls);
    
    // zoomedOrder 상태 업데이트 (이미지 목록 갱신)
    if (zoomedOrder && zoomedOrder.id === orderId) {
      const updatedZoomedOrder = {
        ...zoomedOrder,
        ...updatedData,
        imageUrls: newImageUrls
      };
      setZoomedOrder(updatedZoomedOrder);
      console.log('✅ 모달 이미지 목록 업데이트 완료:', newImageUrls.length, '장');
    }
    
    // 발주서 목록도 업데이트
    await fetchPurchaseOrdersByDate(searchQuery ? null : selectedDate);
    
    // 목록 재조회 후, 서버에서 최신 데이터 다시 가져와서 zoomedOrder 갱신
    try {
      console.log('🔄 서버에서 최신 발주서 데이터 재조회:', orderId);
      const response = await axios.get(`${API_BASE_URL}/api/v1/purchase-orders/${orderId}`);
      console.log('📦 서버 응답 전체:', response.data);
      const latestOrder = response.data?.data;
      console.log('📦 latestOrder:', latestOrder);
      console.log('📦 latestOrder.images 타입:', typeof latestOrder?.images);
      console.log('📦 latestOrder.images 값:', latestOrder?.images);
      
      if (latestOrder) {
        // 최신 이미지 목록 파싱
        let latestImages = latestOrder.images;
        console.log('🔍 파싱 전 latestImages:', latestImages, '타입:', typeof latestImages);
        
        if (typeof latestImages === 'string') {
          try {
            latestImages = JSON.parse(latestImages);
            console.log('✅ 1차 JSON 파싱 성공, latestImages:', latestImages, '타입:', typeof latestImages);
            
            // 이중 인코딩 체크: 파싱 후에도 여전히 문자열이면 한 번 더 파싱
            if (typeof latestImages === 'string') {
              console.log('🔄 이중 인코딩 감지, 2차 파싱 시도');
              latestImages = JSON.parse(latestImages);
              console.log('✅ 2차 JSON 파싱 성공, latestImages:', latestImages);
            }
          } catch (e) {
            console.error('최신 이미지 파싱 실패:', e);
            latestImages = [];
          }
        }
        
        // 배열이 아니면 빈 배열로 초기화
        console.log('🔍 배열 검증 전 latestImages:', latestImages, 'Array.isArray:', Array.isArray(latestImages));
        if (!Array.isArray(latestImages)) {
          console.warn('⚠️ latestImages가 배열이 아닙니다:', latestImages, '타입:', typeof latestImages);
          latestImages = [];
        }
        console.log('✅ 최종 latestImages 배열:', latestImages, '길이:', latestImages.length);
        
        const latestImageUrls = latestImages.map(img => 
          `${API_BASE_URL}/uploads/${img.path || img.storage_path}`
        );
        
        // zoomedOrder를 최신 데이터로 완전히 교체
        if (zoomedOrder && zoomedOrder.id === orderId) {
          setZoomedOrder({
            ...latestOrder,
            imageUrls: latestImageUrls
          });
          console.log('✅ 서버 최신 데이터로 모달 업데이트:', latestImageUrls.length, '장');
        }
      }
    } catch (error) {
      console.error('❌ 최신 데이터 조회 실패:', error);
    }
  };
  
  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <h1 style={styles.title}>📦 발주서 관리</h1>
        <button 
          style={styles.uploadButton}
          onClick={() => navigate('/purchase-orders/upload')}
        >
          + 발주서 업로드
        </button>
      </div>
      
      {/* 검색 및 날짜 */}
      <div style={styles.filterSection}>
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            if (!searchQuery) {
              fetchPurchaseOrdersByDate(e.target.value);
            }
          }}
          style={styles.dateInput}
        />
        
        <button
          onClick={() => {
            setSelectedDate(today);
            if (!searchQuery) {
              fetchPurchaseOrdersByDate(today);
            }
          }}
          style={{
            ...styles.todayButton,
            backgroundColor: selectedDate === today ? '#4CAF50' : '#f0f0f0',
            color: selectedDate === today ? 'white' : '#333'
          }}
        >
          오늘
        </button>
        
        <input
          type="text"
          placeholder="🔍 발주처, 현장명, 메모 검색..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={styles.searchInput}
        />
        
        <div style={styles.stats}>
          총 <strong>{filteredOrders.length}</strong>건
        </div>
      </div>
      
      {/* 발주서 그리드 */}
      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={styles.empty}>
          <p>📭 발주서가 없습니다.</p>
          <button 
            style={styles.uploadButton}
            onClick={() => navigate('/purchase-orders/upload')}
          >
            첫 발주서 업로드하기
          </button>
        </div>
      ) : (
        <div style={styles.grid} className="purchase-order-grid">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              style={styles.card}
              className="purchase-order-card"
              onClick={() => handleImageClick(order)}
            >
              {/* 이미지 */}
              <div style={styles.imageContainer}>
                <img 
                  src={`${API_BASE_URL}/uploads/${order.storage_path}`}
                  alt={order.supplier_name || '발주서'}
                  style={styles.image}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23999"%3E이미지 없음%3C/text%3E%3C/svg%3E';
                  }}
                />
                
                {/* 이미지 개수 배지 */}
                {order.image_count > 1 && (
                  <div style={styles.badge}>
                    📷 {order.image_count}장
                  </div>
                )}
              </div>
              
              {/* 정보 */}
              <div style={styles.cardBody}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.vendorName}>
                    {order.supplier_name || '발주처 미지정'}
                  </h3>
                </div>
                
                <div style={styles.info}>
                  {order.site_name && (
                    <div>🏗️ 현장: {order.site_name}</div>
                  )}
                  <div>📅 발주일: {order.order_date ? new Date(order.order_date).toLocaleDateString('ko-KR') : '-'}</div>
                  {order.delivery_date && (
                    <div>🚚 납품일: {new Date(order.delivery_date).toLocaleDateString('ko-KR')}</div>
                  )}
                  {order.order_amount && (
                    <div>💰 {order.order_amount.toLocaleString()}원</div>
                  )}
                  {order.memo && (
                    <div style={styles.memo}>📝 {order.memo}</div>
                  )}
                </div>
                
                <div style={styles.meta}>
                  {order.uploaded_by || '알 수 없음'} • {new Date(order.created_at).toLocaleString('ko-KR', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 이미지 갤러리 */}
      {zoomedImage && zoomedOrder && (
        <ImageGalleryViewer
          images={zoomedOrder.imageUrls || [zoomedImage]}
          initialIndex={0}
          onClose={() => {
            setZoomedImage(null);
            setZoomedOrder(null);
          }}
          workOrder={zoomedOrder}
          onUpdateWorkOrder={handleUpdatePurchaseOrder}
          onDeleteWorkOrder={handleDeletePurchaseOrder}
          onImagesAdded={handleImagesAdded}
          clients={clients}
          type="purchaseOrder"
        />
      )}
    </div>
  );
};

// 스타일
const styles = {
  container: {
    padding: '20px',
    width: '100%',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  },
  uploadButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  filterSection: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateInput: {
    padding: '10px 15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  todayButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  searchInput: {
    flex: 1,
    minWidth: '250px',
    padding: '10px 15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
  },
  stats: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '100px 20px',
    color: '#999',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))',
    gap: '24px',
    paddingBottom: '40px',
    width: '100%',
  },
  card: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingBottom: '141.4%', // A4 세로 비율 (210:297 = 1:1.414)
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  badge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  cardBody: {
    padding: '15px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  vendorName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  info: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '10px',
  },
  memo: {
    marginTop: '5px',
    fontStyle: 'italic',
    color: '#888',
  },
  meta: {
    fontSize: '12px',
    color: '#999',
    borderTop: '1px solid #eee',
    paddingTop: '10px',
  },
};

// 미디어 쿼리를 위한 CSS 추가 (가독성 최우선)
const responsiveStyles = `
  /* 초대형 데스크톱 (2560px+) - 6열 */
  @media (min-width: 2560px) {
    .purchase-order-grid {
      grid-template-columns: repeat(6, 1fr) !important;
    }
  }
  
  /* 대형 데스크톱 (1920-2559px) - 5열 */
  @media (min-width: 1920px) and (max-width: 2559px) {
    .purchase-order-grid {
      grid-template-columns: repeat(5, 1fr) !important;
    }
  }
  
  /* 일반 데스크톱 (1600-1919px) - 4열 */
  @media (min-width: 1600px) and (max-width: 1919px) {
    .purchase-order-grid {
      grid-template-columns: repeat(4, 1fr) !important;
    }
  }
  
  /* 소형 데스크톱 (1200-1599px) - 3열 */
  @media (min-width: 1200px) and (max-width: 1599px) {
    .purchase-order-grid {
      grid-template-columns: repeat(3, 1fr) !important;
    }
  }
  
  /* 태블릿 (900-1199px) - 2열 */
  @media (min-width: 900px) and (max-width: 1199px) {
    .purchase-order-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
  
  /* 작은 태블릿 (600-899px) - 2열 */
  @media (min-width: 600px) and (max-width: 899px) {
    .purchase-order-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
  
  /* 모바일 (599px 이하) - 1열 */
  @media (max-width: 599px) {
    .purchase-order-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
  }
  
  /* 카드 hover 효과 */
  .purchase-order-card:hover {
    border-color: #999 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    transform: translateY(-2px) !important;
  }
`;

// 스타일 태그를 DOM에 추가
if (typeof document !== 'undefined') {
  const styleId = 'purchase-order-responsive-styles';
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.textContent = responsiveStyles;
    document.head.appendChild(styleTag);
  }
}

export default PurchaseOrderListPage;
