/**
 * ========================================
 * 고급 이미지 갤러리 뷰어
 * ========================================
 * 기능:
 * - 확대/축소/회전
 * - 핀치 줌 제스처
 * - 슬라이드 네비게이션
 * - 전체화면 모드
 * - 이미지 다운로드
 * - 로딩 상태 표시
 * ========================================
 */

import { useState, useEffect, useRef } from 'react';
import ImageEditor from './ImageEditor';

function ImageGalleryViewer({ 
  images = [], 
  initialIndex = 0, 
  onClose, 
  workOrder = null,
  onUpdateWorkOrder = null,
  onDeleteWorkOrder = null,
  onImagesAdded = null, // 🆕 이미지 추가 후 콜백
  clients = [],
  type = 'workOrder' // 'workOrder' 또는 'purchaseOrder'
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  
  // 사진 추가 관련 상태
  const [uploading, setUploading] = useState(false);
  const addImageInputRef = useRef(null);
  
  // 자동완성 상태
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  
  // 폼 상태 (타입에 따라 다름)
  const [modalForm, setModalForm] = useState(
    type === 'purchaseOrder' 
      ? {
          supplier_name: '',
          site_name: '',
          order_date: '',
          memo: ''
        }
      : {
          work_type: '',
          client_name: '',
          site_name: '',
          memo: ''
        }
  );
  
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  // 모달 열릴 때 body 스크롤 막기
  useEffect(() => {
    // 현재 스크롤 위치 저장
    const scrollY = window.scrollY;
    
    // body 스크롤 막기
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // 컴포넌트 언마운트 시 복원
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);
  
  // 작업지시서/발주서 정보 초기화
  useEffect(() => {
    if (workOrder) {
      if (type === 'purchaseOrder') {
        // 날짜를 로컬 시간대로 변환 (타임존 문제 완전 해결)
        let formattedDate = '';
        if (workOrder.order_date) {
          // ISO 날짜 문자열에서 날짜 부분만 추출
          // 방법 1: 'T' 이전 부분 추출
          let dateStr = workOrder.order_date.split('T')[0];
          
          // 방법 2: 만약 'T'가 없다면 공백으로 split
          if (!dateStr.includes('-')) {
            dateStr = workOrder.order_date.split(' ')[0];
          }
          
          // 최종 확인: YYYY-MM-DD 형식인지 검증
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            formattedDate = dateStr;
          } else {
            // 형식이 맞지 않으면 Date 객체 사용하되 UTC로 처리
            const date = new Date(workOrder.order_date + 'T00:00:00Z');
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
          }
        }
        
        setModalForm({
          supplier_name: workOrder.supplier_name || '',
          site_name: workOrder.site_name || '',
          order_date: formattedDate,
          memo: workOrder.memo || ''
        });
      } else {
        setModalForm({
          work_type: workOrder.work_type || '',
          client_name: workOrder.client_name || '',
          site_name: workOrder.site_name || '',
          memo: workOrder.memo || ''
        });
      }
    }
  }, [workOrder, type]);
  
  // 현재 이미지
  const currentImage = images[currentIndex];
  
  // 이미지 로딩 완료
  const handleImageLoad = () => {
    setLoading(false);
  };
  
  // 이미지 변경 시 상태 리셋
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setLoading(true);
  }, [currentIndex]);
  
  // 이전 이미지
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  // 다음 이미지
  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  // 확대
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };
  
  // 축소
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // 회전
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };
  
  // 회전 저장
  const handleSaveRotation = async () => {
    if (rotation === 0 || rotation === 360) {
      alert('회전 각도가 0도입니다. 회전 후 저장해주세요.');
      return;
    }

    if (!workOrder || !workOrder.id) {
      alert('발주서 정보를 찾을 수 없습니다.');
      return;
    }

    const currentImage = images[currentIndex];
    if (!currentImage) {
      alert('이미지를 찾을 수 없습니다.');
      return;
    }

    // 이미지 경로 추출 (URL에서 /uploads/ 이후 부분)
    const imagePath = currentImage.split('/uploads/')[1];
    if (!imagePath) {
      alert('이미지 경로가 올바르지 않습니다.');
      return;
    }

    const confirmed = confirm(`현재 이미지를 ${rotation}도 회전하여 저장하시겠습니까?\n\n⚠️ 원본 이미지가 변경됩니다!`);
    if (!confirmed) return;

    try {
      setUploading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      await fetch(`${baseUrl}/api/v1/purchase-orders/${workOrder.id}/rotate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_path: imagePath,
          rotation: rotation
        })
      });

      alert('✅ 이미지가 회전되어 저장되었습니다!');
      
      // 회전 값 리셋
      setRotation(0);
      
      // 페이지 새로고침하여 회전된 이미지 표시
      window.location.reload();
    } catch (error) {
      console.error('이미지 회전 저장 실패:', error);
      alert('이미지 회전 저장에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };
  
  // 리셋
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };
  
  // 마우스 다운
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };
  
  // 마우스 이동
  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  // 마우스 업
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 휠 줌
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };
  
  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);
  
  // 터치 제스처 (핀치 줌)
  const [touchDistance, setTouchDistance] = useState(0);
  
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistance(distance);
    }
  };
  
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const delta = (distance - touchDistance) * 0.01;
      setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
      setTouchDistance(distance);
    }
  };
  
  // 이미지 다운로드
  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `작업지시서_${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ 다운로드 실패:', error);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };
  
  // 편집된 이미지 저장
  const handleSaveEditedImage = async (blob) => {
    if (!workOrder) {
      alert('작업지시서 정보가 없습니다.');
      return;
    }
    
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('image', blob, 'edited_image.jpg');
      
      // 서버에 업로드
      const response = await fetch(`/api/v1/work-orders/${workOrder.id}/upload-edited-image`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 성공: 에디터 닫기 및 이미지 새로고침
        setShowEditor(false);
        alert('✅ 이미지가 보정되어 저장되었습니다!');
        
        // 작업지시서 새로고침 (부모 컴포넌트에서 처리)
        if (onUpdateWorkOrder) {
          // 페이지 새로고침으로 최신 이미지 반영
          window.location.reload();
        }
      } else {
        throw new Error(result.message || '이미지 저장 실패');
      }
    } catch (error) {
      console.error('❌ 이미지 저장 실패:', error);
      alert('이미지 저장에 실패했습니다.\n' + error.message);
    }
  };
  
  // 작업지시서 저장
  const handleSaveWorkOrder = async () => {
    if (!workOrder || !onUpdateWorkOrder) return;
    
    try {
      console.log('💾 저장 시도:', {
        id: workOrder.id,
        data: modalForm
      });
      
      await onUpdateWorkOrder(workOrder.id, modalForm);
      
      console.log('✅ 저장 성공');
      alert('저장되었습니다!');
      
      // 모달을 닫아서 변경사항 확인 가능
      // onClose();  // 주석: 계속 볼 수 있도록 닫지 않음
    } catch (error) {
      console.error('❌ 저장 실패:', error);
      alert('저장에 실패했습니다.\n' + (error.message || '알 수 없는 오류'));
    }
  };
  
  // 작업지시서 삭제
  const handleDeleteWorkOrder = async () => {
    if (!workOrder) return;
    
    const confirmed = window.confirm(
      `정말 삭제하시겠습니까?\n\n거래처: ${workOrder.client_name || '-'}\n현장: ${workOrder.site_name || '-'}\n\n이 작업은 되돌릴 수 없습니다.`
    );
    
    if (!confirmed) return;
    
    try {
      if (onDeleteWorkOrder) {
        await onDeleteWorkOrder(workOrder.id);
        alert('삭제되었습니다!');
        onClose(); // 모달 닫기
      }
    } catch (error) {
      console.error('❌ 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };
  
  // 거래처명/발주처명 입력 핸들러 (자동완성)
  const handleClientNameChange = (e) => {
    const value = e.target.value;
    
    if (type === 'purchaseOrder') {
      setModalForm({ ...modalForm, supplier_name: value });
    } else {
      setModalForm({ ...modalForm, client_name: value });
    }
    
    // 자동완성 필터링
    if (value.trim() && clients.length > 0) {
      const filtered = clients
        .filter(client => 
          client.name.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5); // 최대 5개
      
      setFilteredClients(filtered);
      setShowAutocomplete(filtered.length > 0);
    } else {
      setShowAutocomplete(false);
      setFilteredClients([]);
    }
  };
  
  // 자동완성 항목 선택
  const handleSelectClient = (clientName) => {
    if (type === 'purchaseOrder') {
      setModalForm({ ...modalForm, supplier_name: clientName });
    } else {
      setModalForm({ ...modalForm, client_name: clientName });
    }
    setShowAutocomplete(false);
    setFilteredClients([]);
  };
  
  // 🆕 사진 추가 버튼 클릭
  const handleAddImageClick = () => {
    addImageInputRef.current?.click();
  };
  
  // 🆕 사진 추가 처리
  const handleAddImage = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0 || !workOrder) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      
      // 여러 이미지 추가
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });
      
      console.log('📸 사진 추가 시작:', workOrder.id, selectedFiles.length, 'type:', type);
      
      // type에 따라 올바른 API 경로 선택
      const apiPath = type === 'purchaseOrder' 
        ? `/api/v1/purchase-orders/${workOrder.id}/add-images`
        : `/api/v1/work-orders/${workOrder.id}/add-images`;
      
      console.log('🌐 API 경로:', apiPath);
      
      // API 호출
      const response = await fetch(apiPath, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 사진 추가 성공:', result.data);
        alert(`✅ ${selectedFiles.length}장의 사진이 추가되었습니다!`);
        
        // 부모 컴포넌트에 이미지 추가 알림
        if (onImagesAdded && result.data) {
          console.log('🔄 부모 컴포넌트에 이미지 추가 알림');
          onImagesAdded(workOrder.id, result.data);
        } else {
          // 콜백이 없으면 페이지 리로드 (기존 동작)
          window.location.reload();
        }
      } else {
        throw new Error(result.message || '사진 추가 실패');
      }
    } catch (error) {
      console.error('❌ 사진 추가 실패:', error);
      alert('사진 추가에 실패했습니다.\n' + error.message);
    } finally {
      setUploading(false);
      if (addImageInputRef.current) {
        addImageInputRef.current.value = '';
      }
    }
  };
  
  return (
    <div className="image-gallery-viewer">
      {/* 배경 오버레이 */}
      <div className="gallery-overlay" onClick={onClose} />
      
      {/* 메인 컨테이너 */}
      <div className="gallery-container">
        {/* 좌측: 이미지 뷰어 */}
        <div 
          className="gallery-left"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {/* 로딩 스피너 */}
          {loading && (
            <div className="image-loading">
              <div className="spinner-large"></div>
              <p>이미지 로딩 중...</p>
            </div>
          )}
          
          {/* 이미지 */}
          <img
            ref={imageRef}
            src={currentImage}
            alt={`이미지 ${currentIndex + 1}`}
            className="gallery-image"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onLoad={handleImageLoad}
            onError={() => setLoading(false)}
            draggable={false}
          />
          
          {/* 이미지 정보 오버레이 */}
          {showInfo && !loading && (
            <div className="image-info-overlay">
              <span>{currentIndex + 1} / {images.length}</span>
              <span>확대: {Math.round(scale * 100)}%</span>
              <span>회전: {rotation}°</span>
            </div>
          )}
          
          {/* 네비게이션 버튼 */}
          {images.length > 1 && (
            <>
              <button
                className="nav-button nav-prev"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                ◀
              </button>
              <button
                className="nav-button nav-next"
                onClick={handleNext}
                disabled={currentIndex === images.length - 1}
              >
                ▶
              </button>
            </>
          )}
          
          {/* 하단 컨트롤 바 */}
          <div className="gallery-controls">
            <button className="control-btn" onClick={handleZoomOut} title="축소 (-)">
              🔍−
            </button>
            <button className="control-btn" onClick={handleReset} title="리셋">
              ⟲
            </button>
            <button className="control-btn" onClick={handleZoomIn} title="확대 (+)">
              🔍+
            </button>
            <button className="control-btn" onClick={handleRotate} title="회전 (R)">
              ↻
            </button>
            <button 
              className="control-btn" 
              onClick={handleSaveRotation} 
              title="회전 저장"
              disabled={rotation === 0 || uploading}
              style={{
                backgroundColor: rotation !== 0 ? '#4CAF50' : undefined,
                color: rotation !== 0 ? 'white' : undefined,
                cursor: rotation === 0 || uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? '⏳' : '💾'}
            </button>
            <button className="control-btn" onClick={() => setShowEditor(true)} title="이미지 보정">
              ✨
            </button>
            <button className="control-btn" onClick={handleDownload} title="다운로드">
              ⬇
            </button>
            <button className="control-btn" onClick={() => setShowInfo(!showInfo)} title="정보">
              ℹ️
            </button>
          </div>
        </div>
        
        {/* 우측: 작업지시서/발주서 정보 */}
        {workOrder && (
          <div className="gallery-right">
            <div className="gallery-header">
              <h3>{type === 'purchaseOrder' ? '발주서 상세' : '작업지시서 상세'}</h3>
              <button className="btn-close-gallery" onClick={onClose}>
                ✕
              </button>
            </div>
            
            <div className="gallery-form">
              {/* 작업 유형 (작업지시서만) */}
              {type === 'workOrder' && (
                <div className="form-group">
                  <label className="form-label">작업 유형</label>
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
                        value="기타"
                        checked={modalForm.work_type === '기타'}
                        onChange={(e) => setModalForm({ ...modalForm, work_type: e.target.value })}
                      />
                      <span>기타</span>
                    </label>
                  </div>
                </div>
              )}
              
              {/* 거래처명 (작업지시서) / 발주처명 (발주서) */}
              <div className="form-group">
                <label className="form-label">
                  {type === 'purchaseOrder' ? '발주처명' : '거래처명'}
                </label>
                <div className="autocomplete-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    value={type === 'purchaseOrder' ? modalForm.supplier_name : modalForm.client_name}
                    onChange={handleClientNameChange}
                    onFocus={() => {
                      const currentValue = type === 'purchaseOrder' ? modalForm.supplier_name : modalForm.client_name;
                      if (currentValue && filteredClients.length > 0) {
                        setShowAutocomplete(true);
                      }
                    }}
                    placeholder={type === 'purchaseOrder' ? '발주처명을 입력하세요' : '거래처명을 입력하세요'}
                  />
                  
                  {/* 자동완성 드롭다운 */}
                  {showAutocomplete && filteredClients.length > 0 && (
                    <div className="autocomplete-list">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className="autocomplete-item"
                          onClick={() => handleSelectClient(client.name)}
                        >
                          {client.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 발주일 (발주서만) */}
              {type === 'purchaseOrder' && (
                <div className="form-group">
                  <label className="form-label">발주일</label>
                  <input
                    type="date"
                    className="form-input"
                    value={modalForm.order_date}
                    onChange={(e) => setModalForm({ ...modalForm, order_date: e.target.value })}
                  />
                </div>
              )}
              
              {/* 현장명 */}
              <div className="form-group">
                <label className="form-label">현장명</label>
                <input
                  type="text"
                  className="form-input"
                  value={modalForm.site_name}
                  onChange={(e) => setModalForm({ ...modalForm, site_name: e.target.value })}
                  placeholder="현장명을 입력하세요"
                />
              </div>
              
              {/* 메모 */}
              <div className="form-group">
                <label className="form-label">메모</label>
                <textarea
                  className="form-textarea"
                  value={modalForm.memo}
                  onChange={(e) => setModalForm({ ...modalForm, memo: e.target.value })}
                  placeholder="메모를 입력하세요"
                  rows={4}
                />
              </div>
              
              {/* 사진 추가 버튼 */}
              <div className="button-group" style={{ marginBottom: '10px' }}>
                <button 
                  className="btn-add-image-gallery" 
                  onClick={handleAddImageClick}
                  disabled={uploading}
                >
                  {uploading ? '⏳ 업로드 중...' : '📸 사진 추가'}
                </button>
              </div>
              
              {/* 저장/삭제 버튼 */}
              <div className="button-group">
                <button className="btn-save-gallery" onClick={handleSaveWorkOrder}>
                  💾 저장
                </button>
                <button className="btn-delete-gallery" onClick={handleDeleteWorkOrder}>
                  🗑️ 삭제
                </button>
              </div>
              
              {/* 작업지시서 정보 */}
              <div className="work-order-meta">
                <div className="meta-item">
                  <span className="meta-label">등록일:</span>
                  <span className="meta-value">
                    {new Date(workOrder.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">전송자:</span>
                  <span className="meta-value">{workOrder.uploaded_by || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .image-gallery-viewer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .gallery-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
        }
        
        .gallery-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          width: 85vw;
          height: 80vh;
          max-width: 1200px;
          max-height: 800px;
          background: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          z-index: 10001;
        }
        
        .gallery-left {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          overflow: hidden;
          user-select: none;
          aspect-ratio: 210 / 297; /* A4 세로 비율 */
          max-width: calc(80vh * 210 / 297); /* 높이 기준으로 너비 제한 */
        }
        
        .gallery-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.1s ease-out;
          will-change: transform;
        }
        
        .image-loading {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: white;
        }
        
        .spinner-large {
          width: 60px;
          height: 60px;
          border: 5px solid rgba(255, 255, 255, 0.1);
          border-top: 5px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .image-info-overlay {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(0, 0, 0, 0.7);
          padding: 12px 16px;
          border-radius: 8px;
          color: white;
          font-size: 13px;
          font-weight: 500;
        }
        
        .nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          color: white;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }
        
        .nav-button:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.8);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-50%) scale(1.15);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }
        
        .nav-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: rgba(0, 0, 0, 0.3);
        }
        
        .nav-prev {
          left: 20px;
        }
        
        .nav-next {
          right: 20px;
        }
        
        .gallery-controls {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          background: rgba(0, 0, 0, 0.7);
          padding: 12px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }
        
        .control-btn {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .control-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        
        .gallery-right {
          width: 350px;
          height: 100%;
          background: white;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          flex-shrink: 0;
        }
        
        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e0e0e0;
          flex-shrink: 0;
        }
        
        .gallery-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #333;
        }
        
        .btn-close-gallery {
          width: 32px;
          height: 32px;
          background: #f5f5f5;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-close-gallery:hover {
          background: #e0e0e0;
        }
        
        .gallery-form {
          flex: 1;
          padding: 16px 20px;
          overflow-y: auto;
          min-height: 0;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }
        
        .radio-group {
          display: flex;
          gap: 12px;
        }
        
        .radio-label {
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          font-size: 13px;
        }
        
        .radio-label input[type="radio"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        
        .form-input,
        .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
        }
        
        .form-input:focus,
        .form-textarea:focus {
          border-color: #000;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .autocomplete-wrapper {
          position: relative;
        }
        
        .autocomplete-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #e0e0e0;
          border-top: none;
          border-radius: 0 0 8px 8px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .autocomplete-item {
          padding: 10px 12px;
          cursor: pointer;
          font-size: 13px;
          color: #333;
          transition: all 0.2s;
        }
        
        .autocomplete-item:hover {
          background: #f8f8f8;
        }
        
        .autocomplete-item:active {
          background: #f0f0f0;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
        }
        
        .btn-save-gallery {
          flex: 1;
          padding: 12px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-save-gallery:hover {
          background: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
        
        .btn-delete-gallery {
          flex: 1;
          padding: 12px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-delete-gallery:hover {
          background: #da190b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
        }
        
        .btn-add-image-gallery {
          width: 100%;
          padding: 12px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-add-image-gallery:hover:not(:disabled) {
          background: #1976D2;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }
        
        .btn-add-image-gallery:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .work-order-meta {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
        
        .meta-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
        }
        
        .meta-label {
          font-weight: 600;
          color: #666;
        }
        
        .meta-value {
          color: #333;
        }
        
        @media (max-width: 768px) {
          .gallery-container {
            flex-direction: column;
            width: 100vw;
            height: 100vh;
            border-radius: 0;
          }
          
          .gallery-left {
            flex: 1;
          }
          
          .gallery-right {
            width: 100%;
            max-height: 40vh;
          }
          
          .nav-button {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }
          
          .gallery-controls {
            bottom: 10px;
            padding: 8px;
          }
          
          .control-btn {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }
        }
      `}</style>
      
      {/* 이미지 편집기 */}
      {showEditor && (
        <ImageEditor
          imageUrl={currentImage}
          workOrderId={workOrder?.id}
          onSave={handleSaveEditedImage}
          onCancel={() => setShowEditor(false)}
        />
      )}
      
      {/* 사진 추가 파일 입력 */}
      <input
        ref={addImageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleAddImage}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default ImageGalleryViewer;
