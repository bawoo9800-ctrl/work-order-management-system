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

function ImageGalleryViewer({ 
  images = [], 
  initialIndex = 0, 
  onClose, 
  workOrder = null,
  onUpdateWorkOrder = null,
  onDeleteWorkOrder = null
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  
  // 작업지시서 폼 상태
  const [modalForm, setModalForm] = useState({
    work_type: '',
    client_name: '',
    site_name: '',
    memo: ''
  });
  
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
  
  // 작업지시서 정보 초기화
  useEffect(() => {
    if (workOrder) {
      setModalForm({
        work_type: workOrder.work_type || '',
        client_name: workOrder.client_name || '',
        site_name: workOrder.site_name || '',
        memo: workOrder.memo || ''
      });
    }
  }, [workOrder]);
  
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
  
  // 작업지시서 저장
  const handleSaveWorkOrder = async () => {
    if (!workOrder || !onUpdateWorkOrder) return;
    
    try {
      await onUpdateWorkOrder(workOrder.id, modalForm);
      alert('저장되었습니다!');
    } catch (error) {
      console.error('❌ 저장 실패:', error);
      alert('저장에 실패했습니다.');
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
            <button className="control-btn" onClick={handleDownload} title="다운로드">
              ⬇
            </button>
            <button className="control-btn" onClick={() => setShowInfo(!showInfo)} title="정보">
              ℹ️
            </button>
          </div>
        </div>
        
        {/* 우측: 작업지시서 정보 */}
        {workOrder && (
          <div className="gallery-right">
            <div className="gallery-header">
              <h3>작업지시서 상세</h3>
              <button className="btn-close-gallery" onClick={onClose}>
                ✕
              </button>
            </div>
            
            <div className="gallery-form">
              {/* 작업 유형 */}
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
                      value="RSD"
                      checked={modalForm.work_type === 'RSD'}
                      onChange={(e) => setModalForm({ ...modalForm, work_type: e.target.value })}
                    />
                    <span>RSD</span>
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
              
              {/* 거래처명 */}
              <div className="form-group">
                <label className="form-label">거래처명</label>
                <input
                  type="text"
                  className="form-input"
                  value={modalForm.client_name}
                  onChange={(e) => setModalForm({ ...modalForm, client_name: e.target.value })}
                  placeholder="거래처명을 입력하세요"
                />
              </div>
              
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
        }
        
        .gallery-image {
          max-width: 100%;
          max-height: 100%;
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
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          color: white;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }
        
        .nav-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-50%) scale(1.1);
        }
        
        .nav-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
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
    </div>
  );
}

export default ImageGalleryViewer;
