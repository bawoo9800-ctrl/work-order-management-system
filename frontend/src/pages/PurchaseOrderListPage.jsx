/**
 * ========================================
 * 발주서 목록 페이지
 * ========================================
 * 파일: src/pages/PurchaseOrderListPage.jsx
 * 설명: 발주서 그리드 + 상단 검색/필터
 * ========================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageGalleryViewer from '../components/ImageGalleryViewer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const PurchaseOrderListPage = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 필터
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  
  // 이미지 갤러리
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomedOrder, setZoomedOrder] = useState(null);
  
  // 초기 데이터 로딩
  useEffect(() => {
    fetchPurchaseOrders();
    fetchClients();
  }, []);
  
  // 발주서 조회
  const fetchPurchaseOrders = async (params = {}) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/v1/purchase-orders`, { params });
      const orders = response.data?.data || [];
      setPurchaseOrders(orders);
      console.log('📦 발주서:', orders.length);
    } catch (error) {
      console.error('❌ 발주서 로드 실패:', error);
    } finally {
      setLoading(false);
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
  
  // 검색 필터링
  const filteredOrders = purchaseOrders.filter(order => {
    const matchSearch = !searchQuery || 
      order.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.memo?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = !filters.status || order.status === filters.status;
    
    return matchSearch && matchStatus;
  });
  
  // 이미지 클릭 핸들러
  const handleImageClick = (order) => {
    let images = [];
    
    if (order.images) {
      try {
        const parsed = typeof order.images === 'string' ? JSON.parse(order.images) : order.images;
        images = parsed.map(img => `${API_BASE_URL}/uploads/${img.path}`);
      } catch (e) {
        console.error('이미지 파싱 오류:', e);
      }
    }
    
    if (images.length === 0 && order.storage_path) {
      images = [`${API_BASE_URL}/uploads/${order.storage_path}`];
    }
    
    if (images.length > 0) {
      setZoomedImage(images[0]);
      setZoomedOrder({ ...order, imageUrls: images });
    }
  };
  
  // 발주서 수정
  const handleUpdatePurchaseOrder = async (id, updateData) => {
    try {
      await axios.put(`${API_BASE_URL}/api/v1/purchase-orders/${id}`, updateData);
      fetchPurchaseOrders();
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
      fetchPurchaseOrders();
      setZoomedImage(null);
      setZoomedOrder(null);
    } catch (error) {
      console.error('발주서 삭제 실패:', error);
      alert('발주서 삭제에 실패했습니다.');
    }
  };
  
  // 상태 배지 색상
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#FFA500';
      case 'confirmed': return '#4CAF50';
      case 'shipped': return '#2196F3';
      case 'delivered': return '#9C27B0';
      case 'cancelled': return '#F44336';
      default: return '#757575';
    }
  };
  
  // 상태 한글명
  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return '대기';
      case 'confirmed': return '확인';
      case 'shipped': return '배송중';
      case 'delivered': return '완료';
      case 'cancelled': return '취소';
      default: return status;
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
      
      {/* 검색 및 필터 */}
      <div style={styles.filterSection}>
        <input
          type="text"
          placeholder="🔍 발주처 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          style={styles.select}
        >
          <option value="">전체 상태</option>
          <option value="pending">대기</option>
          <option value="confirmed">확인</option>
          <option value="shipped">배송중</option>
          <option value="delivered">완료</option>
          <option value="cancelled">취소</option>
        </select>
        
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
        <div style={styles.grid}>
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              style={styles.card}
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
                  <span 
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(order.status)
                    }}
                  >
                    {getStatusLabel(order.status)}
                  </span>
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
          clients={clients}
        />
      )}
    </div>
  );
};

// 스타일
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
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
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '10px 15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
  },
  select: {
    padding: '10px 15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingBottom: '75%',
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
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
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

export default PurchaseOrderListPage;
