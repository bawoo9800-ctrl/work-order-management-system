import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { workOrderAPI } from '../services/api';

function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [strategy, setStrategy] = useState('auto');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

    try {
      setUploading(true);
      setError(null);
      
      const response = await workOrderAPI.upload(file, strategy);
      
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
  };

  return (
    <div className="upload-page">
      <h1>📤 작업지시서 업로드</h1>
      <p className="text-muted">작업지시서 이미지를 업로드하면 자동으로 분류됩니다.</p>

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
            <h2 className="card-title">2. 분류 전략 선택</h2>
            
            <div className="form-group">
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="form-select"
              >
                <option value="auto">자동 (권장)</option>
                <option value="keyword">키워드 매칭</option>
                <option value="ai_text">AI 텍스트 분석</option>
                <option value="ai_vision">AI Vision 분석</option>
              </select>
            </div>

            <div className="strategy-info" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.375rem' }}>
              {strategy === 'auto' && (
                <p className="text-sm">키워드 → AI 텍스트 → AI Vision 순서로 자동 시도</p>
              )}
              {strategy === 'keyword' && (
                <p className="text-sm">빠르고 무료, 정확도 낮음</p>
              )}
              {strategy === 'ai_text' && (
                <p className="text-sm">중간 정확도, 저렴한 API 비용</p>
              )}
              {strategy === 'ai_vision' && (
                <p className="text-sm">높은 정확도, API 비용 발생</p>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {uploading ? '업로드 중...' : '📤 업로드 및 분류'}
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
                <p>분류 중...</p>
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
                <p><strong>처리 시간:</strong> {(result.processingTimeMs / 1000).toFixed(2)}초</p>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.375rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>분류 결과</h3>
                <p><strong>방법:</strong> {result.classification.method}</p>
                <p><strong>거래처:</strong> {result.classification.clientName || '미분류'}</p>
                <p><strong>신뢰도:</strong> {(result.classification.confidence * 100).toFixed(1)}%</p>
                <p><strong>분석:</strong> {result.classification.reasoning}</p>
              </div>

              {result.ocr && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.375rem' }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>OCR 결과</h3>
                  <p><strong>추출된 텍스트:</strong> {result.ocr.textLength}자</p>
                  <p><strong>신뢰도:</strong> {result.ocr.confidence}%</p>
                </div>
              )}

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={() => navigate('/work-orders')}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  전체 목록 보기
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
