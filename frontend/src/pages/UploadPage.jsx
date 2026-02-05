import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { workOrderAPI } from '../services/api';

function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // 전송자 필드만 유지
  const [uploadedBy, setUploadedBy] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setResult(null);
      setError(null);

      // 이미지 미리보기
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    if (!uploadedBy.trim()) {
      setError('전송자명을 입력해주세요.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      // FormData 생성 (거래처/현장명 제거)
      const formData = new FormData();
      formData.append('image', file);
      formData.append('uploadedBy', uploadedBy);
      
      const response = await workOrderAPI.upload(formData);
      
      setResult(response.data);
      setError(null);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error?.message || '업로드에 실패했습니다.');
      setResult(null);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setUploadedBy('');
  };

  return (
    <div className="upload-page">
      <h1>📤 작업지시서 업로드</h1>
      <p className="text-muted">작업지시서 이미지를 업로드하세요. 거래처/현장명은 홈 화면에서 수정할 수 있습니다.</p>

      <div className="grid grid-2" style={{ marginTop: '2rem' }}>
        {/* 업로드 영역 */}
        <div>
          <div className="card">
            <h2 className="card-title">1. 이미지 선택</h2>
            
            <div
              {...getRootProps()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '0.5rem',
                padding: '3rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? 'var(--background)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p style={{ color: 'var(--primary-color)' }}>📥 여기에 놓으세요...</p>
              ) : (
                <>
                  <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</p>
                  <p>이미지를 드래그하거나 클릭하여 선택</p>
                  <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>
                    JPG, PNG, WebP (최대 10MB)
                  </p>
                </>
              )}
            </div>

            {file && (
              <div style={{ marginTop: '1rem' }}>
                <p className="text-sm">
                  <strong>선택된 파일:</strong> {file.name}
                </p>
                <p className="text-sm text-muted">
                  크기: {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h2 className="card-title">2. 전송자 입력</h2>
            
            <div className="form-group">
              <label className="form-label">전송자 *</label>
              <input
                type="text"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                className="form-input"
                placeholder="예: 홍길동"
                required
              />
            </div>

            <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
              * 필수 입력 항목
            </p>
            <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>
              💡 거래처/현장명은 홈 화면 카드에서 수정할 수 있습니다.
            </p>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={handleUpload}
              disabled={!file || uploading || !uploadedBy.trim()}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {uploading ? '업로드 중...' : '📤 업로드'}
            </button>
            {file && !uploading && (
              <button
                onClick={handleReset}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                다시 선택
              </button>
            )}
          </div>
        </div>

        {/* 미리보기 및 결과 */}
        <div>
          {preview && (
            <div className="card">
              <h2 className="card-title">미리보기</h2>
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border-color)',
                }}
              />
            </div>
          )}

          {uploading && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="loading">
                <div className="spinner"></div>
                <p>업로드 중...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginTop: '1.5rem' }}>
              <strong>오류:</strong> {error}
            </div>
          )}

          {result && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h2 className="card-title">✅ 업로드 완료</h2>
              
              <div style={{ marginTop: '1rem' }}>
                <p><strong>파일명:</strong> {result.originalFilename}</p>
                <p><strong>전송자:</strong> {result.uploadedBy}</p>
                <p><strong>업로드 시간:</strong> {new Date().toLocaleString('ko-KR')}</p>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={() => navigate('/')}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  홈으로 이동하여 수정하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
