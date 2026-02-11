/**
 * ========================================
 * 촬영 페이지 (Upload Page) - 다중 이미지 지원
 * ========================================
 * 파일: src/pages/UploadPage.jsx
 * 설명: 작업지시서 촬영 및 업로드 (여러 장 선택 가능)
 *       - 다중 이미지 선택
 *       - 개별 이미지 삭제
 *       - 하나의 작업지시서에 일괄 업로드
 * ========================================
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workOrderAPI } from '../services/api';
import axios from 'axios';
import { scanDocument, SCAN_PRESETS } from '../utils/documentScanner';

function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // 다중 이미지 지원: 배열로 변경
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPreset, setScanPreset] = useState('document');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    fetchUsers();
    const lastUserId = localStorage.getItem('lastSelectedUserId');
    if (lastUserId) {
      setSelectedUserId(lastUserId);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/v1/users`);
      const usersData = response.data?.data?.users || [];
      setUsers(usersData);
      console.log('👥 사용자 목록:', usersData);
    } catch (error) {
      console.error('❌ 사용자 조회 실패:', error);
    }
  };

  // 이미지 압축 함수
  const compressImage = async (file, maxWidth = 1280, maxHeight = 1280, quality = 0.70) => {
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

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                
                console.log('📦 압축 완료:', {
                  원본크기: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                  압축크기: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
                  압축률: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`,
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

  // 다중 파일 선택 처리
  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setCompressing(true);
    setScanning(true);
    setError(null);

    try {
      const processedFiles = [];
      
      for (const selectedFile of selectedFiles) {
        console.log('📄 문서 스캔 시작:', scanPreset, selectedFile.name);
        const scannedBlob = await scanDocument(selectedFile, SCAN_PRESETS[scanPreset]);
        const scannedFile = new File([scannedBlob], selectedFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        const compressedFile = await compressImage(scannedFile);
        
        // 미리보기 URL 생성
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(compressedFile);
        });
        
        processedFiles.push({
          file: compressedFile,
          preview: dataUrl,
          id: Date.now() + Math.random(),
        });
      }
      
      setFiles(prev => [...prev, ...processedFiles]);
      setScanning(false);
      
      console.log(`✅ ${processedFiles.length}개 이미지 처리 완료`);
    } catch (error) {
      console.error('❌ 이미지 처리 실패:', error);
      setError('이미지 처리에 실패했습니다.');
    } finally {
      setCompressing(false);
      setScanning(false);
    }
  };

  // 개별 이미지 삭제
  const handleRemoveFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // 카메라 촬영
  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  // 갤러리 선택
  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  // 업로드 처리
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('이미지를 선택해주세요.');
      return;
    }

    if (!selectedUserId) {
      setError('전송자를 선택해주세요.');
      return;
    }

    const selectedUser = users.find(u => u.id === parseInt(selectedUserId));
    if (!selectedUser) {
      setError('유효한 전송자를 선택해주세요.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // 여러 이미지 추가
      files.forEach((fileObj) => {
        formData.append('images', fileObj.file);
      });
      
      formData.append('uploadedBy', selectedUser.name);
      formData.append('client_name', '');
      formData.append('site_name', '');

      console.log('📤 업로드 시작:', {
        uploadedBy: selectedUser.name,
        fileCount: files.length,
        totalSize: `${(files.reduce((sum, f) => sum + f.file.size, 0) / 1024 / 1024).toFixed(2)}MB`,
      });

      await workOrderAPI.upload(formData);

      console.log('✅ 업로드 성공!');
      alert(`${files.length}장의 작업지시서가 전송되었습니다!`);

      localStorage.setItem('lastSelectedUserId', selectedUserId);

      // 상태 초기화
      setFiles([]);
      setError(null);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (error) {
      console.error('❌ 업로드 실패:', error);
      setError(error.response?.data?.message || '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 취소
  const handleCancel = () => {
    setFiles([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="upload-page">
      {/* 헤더 */}
      <div className="upload-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← 뒤로
        </button>
        <h1 className="upload-title">📋 작업지시서 촬영</h1>
        <div className="header-spacer"></div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="upload-content">
        {/* 전송자 선택 */}
        <div className="form-section">
          <label className="form-label">
            <span className="label-icon">👤</span>
            전송자 선택
          </label>
          <select
            className="form-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={uploading || compressing}
          >
            <option value="">전송자를 선택하세요</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* 스캔 품질 선택 */}
        <div className="form-section">
          <label className="form-label">
            <span className="label-icon">📄</span>
            스캔 품질
          </label>
          <select
            className="form-select"
            value={scanPreset}
            onChange={(e) => setScanPreset(e.target.value)}
            disabled={uploading || compressing}
          >
            <option value="document">📋 일반 문서 (흑백, 고대비)</option>
            <option value="color">🎨 컬러 문서 (색상 보존)</option>
            <option value="highContrast">🔍 고대비 (흐린 문서)</option>
            <option value="original">📷 원본 유지 (압축만)</option>
          </select>
          <p className={`form-hint ${scanning ? 'scanning' : ''}`}>
            {scanning ? '🔄 문서 스캔 중...' : '📸 여러 장을 선택할 수 있습니다'}
          </p>
        </div>

        {/* 미리보기 영역 - 다중 이미지 */}
        {files.length > 0 ? (
          <div className="preview-section">
            <div className="preview-header">
              <span className="preview-count">📷 {files.length}장 선택됨</span>
              <span className="preview-size">
                {(files.reduce((sum, f) => sum + f.file.size, 0) / 1024 / 1024).toFixed(2)}MB
              </span>
            </div>
            <div className="preview-grid">
              {files.map((fileObj) => (
                <div key={fileObj.id} className="preview-item">
                  <img src={fileObj.preview} alt="미리보기" className="preview-thumb" />
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveFile(fileObj.id)}
                    disabled={uploading}
                  >
                    ✕
                  </button>
                  <div className="preview-name">{fileObj.file.name}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-preview">
            <div className="empty-icon">📷</div>
            <p className="empty-text">촬영하거나 이미지를 선택하세요</p>
            <p className="empty-hint">여러 장을 한 번에 선택할 수 있습니다</p>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="action-section">
          <button
            className="btn-action btn-camera"
            onClick={handleCameraCapture}
            disabled={uploading || compressing}
          >
            <span className="btn-icon">📸</span>
            <span className="btn-text">작업지시서 촬영</span>
          </button>
          <button
            className="btn-action btn-gallery"
            onClick={handleGallerySelect}
            disabled={uploading || compressing}
          >
            <span className="btn-icon">🖼️</span>
            <span className="btn-text">갤러리에서 선택</span>
          </button>
          
          {files.length > 0 && (
            <>
              <button
                className="btn-action btn-upload"
                onClick={handleUpload}
                disabled={uploading || compressing}
              >
                {uploading ? (
                  <>
                    <span className="spinner-small"></span>
                    <span className="btn-text">전송 중...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✓</span>
                    <span className="btn-text">{files.length}장 전송하기</span>
                  </>
                )}
              </button>
              <button
                className="btn-action btn-cancel"
                onClick={handleCancel}
                disabled={uploading || compressing}
              >
                <span className="btn-icon">✕</span>
                <span className="btn-text">모두 취소</span>
              </button>
            </>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="help-section">
          <div className="help-item">
            <span className="help-icon">💡</span>
            <span className="help-text">이미지는 자동으로 압축됩니다 (1280x1280, 70% 품질)</span>
          </div>
          <div className="help-item">
            <span className="help-icon">📱</span>
            <span className="help-text">여러 장을 한 번에 선택하고 하나의 작업지시서로 전송됩니다</span>
          </div>
        </div>
      </div>

      {/* 숨겨진 파일 입력 - multiple 속성 추가 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <style>{\`
        .upload-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
        }

        .upload-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .btn-back {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateX(-4px);
        }

        .upload-title {
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .header-spacer {
          width: 80px;
        }

        .upload-content {
          flex: 1;
          padding: 20px;
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-section {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }

        .label-icon {
          font-size: 20px;
        }

        .form-select {
          width: 100%;
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          background: white;
          transition: all 0.3s;
          cursor: pointer;
        }

        .form-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .form-select:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .form-hint {
          margin-top: 8px;
          font-size: 14px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-hint.scanning {
          color: #667eea;
          font-weight: 600;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* 다중 이미지 미리보기 */
        .preview-section {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f0f0f0;
        }

        .preview-count {
          font-size: 16px;
          font-weight: 700;
          color: #333;
        }

        .preview-size {
          font-size: 14px;
          color: #666;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .preview-item {
          position: relative;
          aspect-ratio: 3 / 4;
          background: #f5f5f5;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #e0e0e0;
        }

        .preview-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .btn-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          background: rgba(255, 59, 48, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-remove:hover {
          background: rgba(255, 59, 48, 1);
          transform: scale(1.1);
        }

        .btn-remove:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .preview-name {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 11px;
          padding: 4px 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .empty-preview {
          background: white;
          border-radius: 16px;
          padding: 60px 20px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 80px;
          margin-bottom: 16px;
        }

        .empty-text {
          font-size: 18px;
          color: #666;
          margin: 0 0 8px 0;
        }

        .empty-hint {
          font-size: 14px;
          color: #999;
          margin: 0;
        }

        .error-message {
          background: #fff3f3;
          border: 2px solid #ff6b6b;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #d63031;
          font-weight: 600;
        }

        .error-icon {
          font-size: 24px;
        }

        .action-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-action {
          padding: 20px;
          border: none;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .btn-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-action:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
        }

        .btn-action:not(:disabled):active {
          transform: translateY(0);
        }

        .btn-camera {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-gallery {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .btn-upload {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        .btn-cancel {
          background: #f5f5f5;
          color: #666;
        }

        .btn-icon {
          font-size: 24px;
        }

        .btn-text {
          font-size: 18px;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .help-section {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .help-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: white;
        }

        .help-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .help-text {
          font-size: 14px;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .upload-header {
            padding: 16px;
          }

          .upload-title {
            font-size: 20px;
          }

          .btn-back {
            padding: 8px 16px;
            font-size: 14px;
          }

          .upload-content {
            padding: 16px;
          }

          .preview-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }

          .btn-action {
            padding: 16px;
            font-size: 16px;
          }

          .btn-text {
            font-size: 16px;
          }
        }

        @media (min-width: 769px) {
          .upload-content {
            padding: 40px 20px;
          }
        }
      \`}</style>
    </div>
  );
}

export default UploadPage;
