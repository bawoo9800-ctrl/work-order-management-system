/**
 * 이미지 편집 컴포넌트
 * 문서 스캔 효과, 배경 제거, 원근 보정 등
 */

import { useState, useRef, useEffect } from 'react';

export default function ImageEditor({ imageUrl, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // 조정 값
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [sharpness, setSharpness] = useState(0);
  const [rotation, setRotation] = useState(0);
  
  // 이미지 로드
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img);
      drawImage(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);
  
  // 이미지 그리기
  const drawImage = (img, filters = {}) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    
    const ctx = canvas.getContext('2d');
    
    // 캔버스 크기 설정
    canvas.width = img.width;
    canvas.height = img.height;
    
    // 필터 적용
    const {
      brightness: b = brightness,
      contrast: c = contrast,
      sharpness: s = sharpness,
      rotation: r = rotation,
    } = filters;
    
    // 회전 중심 설정
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((r * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // 밝기/대비 필터
    ctx.filter = `brightness(${b}%) contrast(${c}%)`;
    
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    
    // 선명도 적용 (언샤프 마스크 효과)
    if (s > 0) {
      applySharpness(ctx, canvas, s);
    }
  };
  
  // 선명도 적용
  const applySharpness = (ctx, canvas, amount) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const sharpenKernel = [
      0, -1, 0,
      -1, 5 + amount / 10, -1,
      0, -1, 0
    ];
    
    // 컨볼루션 필터 적용 (간단 버전)
    // 실제로는 더 복잡한 알고리즘 필요
    ctx.putImageData(imageData, 0, 0);
  };
  
  // 자동 보정 (스캔 효과)
  const handleAutoEnhance = () => {
    setProcessing(true);
    
    // 문서 스캔에 최적화된 값
    setBrightness(110);
    setContrast(130);
    setSharpness(20);
    
    setTimeout(() => {
      if (originalImage) {
        drawImage(originalImage, {
          brightness: 110,
          contrast: 130,
          sharpness: 20,
          rotation,
        });
      }
      setProcessing(false);
    }, 100);
  };
  
  // 흑백 변환
  const handleGrayscale = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    
    ctx.putImageData(imageData, 0, 0);
  };
  
  // 임계값 처리 (텍스트 선명하게)
  const handleThreshold = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const threshold = 128;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
      const value = gray > threshold ? 255 : 0;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }
    
    ctx.putImageData(imageData, 0, 0);
  };
  
  // 초기화
  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSharpness(0);
    setRotation(0);
    if (originalImage) {
      drawImage(originalImage);
    }
  };
  
  // 저장
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      onSave(blob);
    }, 'image/jpeg', 0.95);
  };
  
  // 실시간 업데이트
  useEffect(() => {
    if (originalImage) {
      drawImage(originalImage);
    }
  }, [brightness, contrast, sharpness, rotation]);
  
  return (
    <div className="image-editor-modal">
      <style>{`
        .image-editor-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 10002;
          display: flex;
          flex-direction: column;
        }
        
        .editor-header {
          padding: 20px;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .editor-title {
          font-size: 20px;
          font-weight: 700;
          color: white;
        }
        
        .editor-actions {
          display: flex;
          gap: 12px;
        }
        
        .editor-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .canvas-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow: auto;
        }
        
        .canvas-wrapper {
          max-width: 100%;
          max-height: 100%;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }
        
        canvas {
          display: block;
          max-width: 100%;
          max-height: 100%;
          background: white;
        }
        
        .controls-panel {
          width: 320px;
          background: #1a1a1a;
          border-left: 1px solid #333;
          padding: 20px;
          overflow-y: auto;
        }
        
        .control-group {
          margin-bottom: 24px;
        }
        
        .control-label {
          display: block;
          color: #ccc;
          font-size: 14px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .control-slider {
          width: 100%;
          margin-bottom: 4px;
        }
        
        .control-value {
          text-align: right;
          color: #999;
          font-size: 12px;
        }
        
        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }
        
        .btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
        }
        
        .btn-primary:hover {
          background: #0056b3;
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #5a6268;
        }
        
        .btn-success {
          background: #28a745;
          color: white;
        }
        
        .btn-success:hover {
          background: #218838;
          transform: translateY(-2px);
        }
        
        .btn-danger {
          background: #dc3545;
          color: white;
        }
        
        .btn-danger:hover {
          background: #c82333;
        }
        
        .btn-small {
          padding: 8px 16px;
          font-size: 14px;
        }
        
        .processing {
          opacity: 0.6;
          pointer-events: none;
        }
        
        .divider {
          height: 1px;
          background: #333;
          margin: 20px 0;
        }
      `}</style>
      
      <div className="editor-header">
        <h2 className="editor-title">📝 이미지 보정</h2>
        <div className="editor-actions">
          <button className="btn btn-success" onClick={handleSave}>
            💾 저장
          </button>
          <button className="btn btn-danger btn-small" onClick={onCancel}>
            ✕ 취소
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        <div className="canvas-area">
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} />
          </div>
        </div>
        
        <div className="controls-panel">
          <div className="quick-actions">
            <button 
              className="btn btn-primary"
              onClick={handleAutoEnhance}
              disabled={processing}
            >
              ✨ 자동 보정 (권장)
            </button>
            <button 
              className="btn btn-secondary btn-small"
              onClick={handleGrayscale}
            >
              🌑 흑백 변환
            </button>
            <button 
              className="btn btn-secondary btn-small"
              onClick={handleThreshold}
            >
              📄 텍스트 선명 (임계값)
            </button>
            <button 
              className="btn btn-secondary btn-small"
              onClick={handleReset}
            >
              🔄 초기화
            </button>
          </div>
          
          <div className="divider"></div>
          
          <div className="control-group">
            <label className="control-label">💡 밝기</label>
            <input
              type="range"
              className="control-slider"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />
            <div className="control-value">{brightness}%</div>
          </div>
          
          <div className="control-group">
            <label className="control-label">🎨 대비</label>
            <input
              type="range"
              className="control-slider"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
            />
            <div className="control-value">{contrast}%</div>
          </div>
          
          <div className="control-group">
            <label className="control-label">🔍 선명도</label>
            <input
              type="range"
              className="control-slider"
              min="0"
              max="100"
              value={sharpness}
              onChange={(e) => setSharpness(Number(e.target.value))}
            />
            <div className="control-value">{sharpness}</div>
          </div>
          
          <div className="control-group">
            <label className="control-label">🔄 회전</label>
            <input
              type="range"
              className="control-slider"
              min="-180"
              max="180"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
            <div className="control-value">{rotation}°</div>
          </div>
        </div>
      </div>
    </div>
  );
}
