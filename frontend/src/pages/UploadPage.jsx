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
  const [compressing, setCompressing] = useState(false);
  
  // 전송자 필드 (localStorage에서 이전 값 불러오기)
  const [uploadedBy, setUploadedBy] = useState(() => {
    return localStorage.getItem('lastUploadedBy') || '';
  });

  // 이미지 압축 함수
  const compressImage = async (file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // 비율 유지하면서 리사이징
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Canvas를 Blob으로 변환
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Blob을 File 객체로 변환
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                
                console.log('📦 압축 완료:', {
                  원본크기: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                  압축크기: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
                  압축률: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`,
                  원본해상도: `${img.width}x${img.height}`,
                  압축해상도: `${width}x${height}`,
                });
                
                resolve(compressedFile);
              } else {
                reject(new Error('이미지 압축에 실패했습니다.'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
      };
      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
    });
  };

  // 파일 선택 처리
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setCompressing(true);
      setError(null);

      try {
        // 이미지 압축
        const compressedFile = await compressImage(selectedFile);
        setFile(compressedFile);

        // 이미지 미리보기
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error('압축 실패:', err);
        setError('이미지 처리에 실패했습니다.');
      } finally {
        setCompressing(false);
      }
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

    const trimmedUploadedBy = uploadedBy.trim();
    
    if (!trimmedUploadedBy) {
      setError('전송자명을 입력해주세요.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      // 전송자명 저장
      localStorage.setItem('lastUploadedBy', trimmedUploadedBy);
      
      // FormData 생성
      const formData = new FormData();
      formData.append('image', file);
      formData.append('uploadedBy', trimmedUploadedBy);
      formData.append('clientName', ''); // 빈 문자열로라도 전송
      formData.append('siteName', ''); // 빈 문자열로라도 전송
      
      // 디버깅 로그
      console.log('📤 업로드 시작:', {
        파일명: file.name,
        파일크기: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        전송자: trimmedUploadedBy,
        FormData확인: {
          image: file,
          uploadedBy: trimmedUploadedBy,
        }
      });
      
      const response = await workOrderAPI.upload(formData);
      
      console.log('✅ 업로드 성공:', response);
      
      // 업로드 성공 후 홈으로 이동
      navigate('/', { replace: true });
    } catch (err) {
      console.error('❌ 업로드 실패:', err);
      console.error('에러 상세:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
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
          {compressing ? (
            /* 압축 중 표시 */
            <div className="compressing-container">
              <div className="spinner-large"></div>
              <div className="compressing-text">이미지 처리 중...</div>
            </div>
          ) : (
            <button
              onClick={handleCameraClick}
              className="camera-button-center"
              disabled={uploading}
            >
              <div className="camera-icon-large">📷</div>
              <div className="camera-text-center">사진 촬영</div>
            </button>
          )}
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

        /* ===== 압축 중 표시 ===== */
        .compressing-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .spinner-large {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .compressing-text {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
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
          font-size: 15px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input-mobile {
          width: 100%;
          padding: 16px;
          font-size: 18px;
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          outline: none;
          transition: all 0.2s;
          font-weight: 500;
        }

        .form-input-mobile:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .form-input-mobile::placeholder {
          color: rgba(255, 255, 255, 0.5);
          font-weight: 400;
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
