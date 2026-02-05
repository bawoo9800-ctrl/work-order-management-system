import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { workOrderAPI } from '../services/api';

function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  // 전송자 필드 (localStorage에서 이전 값 불러오기)
  const [uploadedBy, setUploadedBy] = useState(() => {
    return localStorage.getItem('lastUploadedBy') || '';
  });

  // 파일 선택 처리
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      // 이미지 미리보기
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // 카메라 촬영 버튼 클릭
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  // 업로드 처리
  const handleUpload = async () => {
    if (!file) {
      setError('사진을 촬영해주세요.');
      return;
    }

    if (!uploadedBy.trim()) {
      setError('전송자명을 입력해주세요.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      // 전송자명 저장
      localStorage.setItem('lastUploadedBy', uploadedBy.trim());
      
      // FormData 생성
      const formData = new FormData();
      formData.append('image', file);
      formData.append('uploadedBy', uploadedBy);
      
      await workOrderAPI.upload(formData);
      
      // 업로드 성공 후 홈으로 이동
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error?.message || '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 다시 촬영
  const handleRetake = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="mobile-upload-page">
      {/* 숨겨진 파일 입력 (카메라 직접 접근) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {!preview ? (
        /* 촬영 화면 */
        <div className="camera-screen">
          <button
            onClick={handleCameraClick}
            className="camera-button-center"
            disabled={uploading}
          >
            <div className="camera-icon-large">📷</div>
            <div className="camera-text-center">사진 촬영</div>
          </button>
        </div>
      ) : (
        /* 미리보기 및 전송 화면 */
        <div className="preview-screen">
          {/* 미리보기 이미지 */}
          <div className="preview-image-container">
            <img src={preview} alt="Preview" className="preview-image" />
          </div>

          {/* 전송자 입력 */}
          <div className="upload-form">
            <div className="form-field">
              <label className="form-label">전송자</label>
              <input
                type="text"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                className="form-input-mobile"
                placeholder="이름을 입력하세요"
                disabled={uploading}
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* 버튼 그룹 */}
            <div className="button-group">
              <button
                onClick={handleRetake}
                className="btn-retake"
                disabled={uploading}
              >
                다시 촬영
              </button>
              <button
                onClick={handleUpload}
                className="btn-upload"
                disabled={uploading || !uploadedBy.trim()}
              >
                {uploading ? '전송 중...' : '📤 전송'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .mobile-upload-page {
          min-height: 100vh;
          background: #000;
          color: #fff;
          display: flex;
          flex-direction: column;
          padding: 0;
          margin: -2rem -20px 0 -20px;
        }

        /* ===== 촬영 화면 ===== */
        .camera-screen {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;
          margin: 0;
        }

        .camera-button-center {
          width: 200px;
          height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
        }

        .camera-button-center:active {
          transform: scale(0.9);
          background: rgba(255, 255, 255, 0.15);
        }

        .camera-button-center:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .camera-icon-large {
          font-size: 64px;
          margin-bottom: 8px;
        }

        .camera-text-center {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          text-align: center;
        }

        /* ===== 미리보기 화면 ===== */
        .preview-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .preview-image-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #000;
          overflow: hidden;
          min-height: 0;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        /* ===== 업로드 폼 ===== */
        .upload-form {
          background: #1a1a1a;
          padding: 24px;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
        }

        .form-field {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
        }

        .form-input-mobile {
          width: 100%;
          padding: 16px;
          font-size: 16px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          outline: none;
          transition: all 0.2s;
        }

        .form-input-mobile:focus {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .form-input-mobile::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .form-input-mobile:disabled {
          opacity: 0.5;
        }

        /* ===== 에러 메시지 ===== */
        .error-message {
          padding: 12px 16px;
          background: rgba(255, 59, 48, 0.2);
          border: 1px solid rgba(255, 59, 48, 0.4);
          border-radius: 8px;
          color: #ff3b30;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* ===== 버튼 그룹 ===== */
        .button-group {
          display: flex;
          gap: 12px;
        }

        .btn-retake,
        .btn-upload {
          flex: 1;
          padding: 16px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-retake {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-retake:active {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-upload {
          background: #fff;
          color: #000;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
        }

        .btn-upload:active {
          transform: scale(0.95);
        }

        .btn-retake:disabled,
        .btn-upload:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* ===== 반응형 ===== */
        @media (max-width: 768px) {
          .mobile-upload-page {
            margin: 0;
          }
        }

        @media (min-width: 769px) {
          .mobile-upload-page {
            max-width: 500px;
            margin: 0 auto;
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </div>
  );
}

export default UploadPage;
