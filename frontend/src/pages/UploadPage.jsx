import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { workOrderAPI, clientAPI } from '../services/api';

function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // 수동 입력 필드
  const [clientName, setClientName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  
  // 거래처 자동완성
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // 거래처 검색
  useEffect(() => {
    const searchClients = async () => {
      if (clientName.trim().length < 1) {
        setClientSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      try {
        const response = await clientAPI.search(clientName.trim());
        setClientSuggestions(response.data.clients || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('거래처 검색 실패:', error);
        setClientSuggestions([]);
      }
    };
    
    const debounce = setTimeout(searchClients, 300);
    return () => clearTimeout(debounce);
  }, [clientName]);

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

    if (!clientName.trim()) {
      setError('거래처명을 입력해주세요.');
      return;
    }

    if (!uploadedBy.trim()) {
      setError('전송자명을 입력해주세요.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      // FormData 생성
      const formData = new FormData();
      formData.append('image', file);
      formData.append('clientName', clientName);
      formData.append('siteName', siteName);
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
    setClientName('');
    setSiteName('');
    setUploadedBy('');
    setClientSuggestions([]);
    setShowSuggestions(false);
  };
  
  // 거래처 선택
  const handleSelectClient = (client) => {
    setClientName(client.name);
    setShowSuggestions(false);
  };

  return (
    <div className="upload-page">
      <h1>📤 작업지시서 업로드</h1>
      <p className="text-muted">작업지시서 이미지를 업로드하고 정보를 입력하세요.</p>

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
            <h2 className="card-title">2. 정보 입력</h2>
            
            <div className="form-group">
              <label className="form-label">거래처명 *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  onFocus={() => clientSuggestions.length > 0 && setShowSuggestions(true)}
                  className="form-input"
                  placeholder="예: 삼성전자"
                  required
                  autoComplete="off"
                />
                
                {/* 자동완성 드롭다운 */}
                {showSuggestions && clientSuggestions.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {clientSuggestions.map((client) => (
                      <div
                        key={client.id}
                        className="autocomplete-item"
                        onClick={() => handleSelectClient(client)}
                      >
                        <strong>{client.name}</strong>
                        <span className="client-code">{client.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">현장명</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="form-input"
                placeholder="예: 수원공장 A동"
              />
            </div>

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
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={handleUpload}
              disabled={!file || uploading || !clientName.trim() || !uploadedBy.trim()}
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
                <p><strong>거래처명:</strong> {result.clientName}</p>
                {result.siteName && <p><strong>현장명:</strong> {result.siteName}</p>}
                <p><strong>전송자:</strong> {result.uploadedBy}</p>
                <p><strong>업로드 시간:</strong> {new Date().toLocaleString('ko-KR')}</p>
              </div>

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
