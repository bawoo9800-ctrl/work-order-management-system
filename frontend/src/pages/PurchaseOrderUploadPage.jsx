/**
 * ========================================
 * 발주서 업로드 페이지
 * ========================================
 * 파일: src/pages/PurchaseOrderUploadPage.jsx
 * 설명: 발주서 촬영 및 업로드 (다중 이미지 지원)
 * ========================================
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200';

function PurchaseOrderUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  // 발주 정보
  const [vendorName, setVendorName] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  
  // 발주처 자동완성
  const [suppliers, setSuppliers] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  
  useEffect(() => {
    fetchSuppliers();
    // 로컬스토리지에서 업로더 이름 불러오기
    const savedUploader = localStorage.getItem('lastUploadedBy');
    if (savedUploader) {
      setUploadedBy(savedUploader);
    }
  }, []);
  
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/suppliers`);
      setSuppliers(response.data?.data || []);
    } catch (error) {
      console.error('발주처 조회 실패:', error);
    }
  };
  
  // 발주처 검색
  const handleVendorSearch = (value) => {
    setVendorName(value);
    
    if (value.trim()) {
      const filtered = suppliers.filter(s => 
        s.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuppliers(filtered);
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };
  
  // 파일 선택 핸들러
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    if (selectedFiles.length === 0) return;
    
    // 이미지 파일만 필터링
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length !== selectedFiles.length) {
      alert('이미지 파일만 업로드 가능합니다.');
    }
    
    setFiles(prev => [...prev, ...imageFiles]);
    setError(null);
  };
  
  // 개별 파일 삭제
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // 업로드
  const handleUpload = async () => {
    if (files.length === 0) {
      alert('이미지를 선택해주세요.');
      return;
    }
    
    if (!uploadedBy.trim()) {
      alert('전송자명을 입력해주세요.');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      
      formData.append('vendorName', vendorName);
      formData.append('orderDate', orderDate);
      formData.append('orderAmount', orderAmount);
      formData.append('memo', memo);
      formData.append('uploadedBy', uploadedBy.trim());
      
      console.log('📤 발주서 업로드 시작:', {
        fileCount: files.length,
        vendorName,
        orderDate,
        orderAmount,
        uploadedBy
      });
      
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/purchase-orders/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        }
      );
      
      console.log('✅ 업로드 성공:', response.data);
      
      // 로컬스토리지에 업로더 저장
      localStorage.setItem('lastUploadedBy', uploadedBy.trim());
      
      alert(`✅ ${files.length}장의 이미지가 업로드되었습니다!`);
      
      // 목록 페이지로 이동
      navigate('/purchase-orders');
      
    } catch (err) {
      console.error('❌ 업로드 실패:', err);
      setError(err.response?.data?.message || err.message || '업로드에 실패했습니다.');
      alert('업로드에 실패했습니다: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          onClick={() => navigate('/purchase-orders')}
          style={styles.backButton}
        >
          ← 돌아가기
        </button>
        <h1 style={styles.title}>📦 발주서 업로드</h1>
      </div>
      
      {/* 이미지 선택 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📷 이미지 선택</h2>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={styles.hiddenInput}
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          style={styles.selectButton}
          disabled={uploading}
        >
          📁 파일 선택
        </button>
        
        {/* 선택된 이미지 미리보기 */}
        {files.length > 0 && (
          <div style={styles.previewContainer}>
            <div style={styles.previewHeader}>
              선택된 이미지: <strong>{files.length}장</strong>
            </div>
            <div style={styles.previewGrid}>
              {files.map((file, index) => (
                <div key={index} style={styles.previewItem}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    style={styles.previewImage}
                  />
                  <button
                    onClick={() => removeFile(index)}
                    style={styles.removeButton}
                    disabled={uploading}
                  >
                    ✕
                  </button>
                  <div style={styles.fileName}>
                    {file.name.length > 15 
                      ? file.name.substring(0, 12) + '...' 
                      : file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 발주 정보 입력 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📋 발주 정보</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>발주처 (선택)</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => handleVendorSearch(e.target.value)}
              onFocus={() => vendorName && setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              placeholder="발주처명 입력"
              style={styles.input}
            />
            
            {showAutocomplete && filteredSuppliers.length > 0 && (
              <div style={styles.autocomplete}>
                {filteredSuppliers.map(supplier => (
                  <div
                    key={supplier.id}
                    onClick={() => {
                      setVendorName(supplier.name);
                      setShowAutocomplete(false);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    style={styles.autocompleteItem}
                  >
                    <div style={{ fontWeight: 'bold' }}>{supplier.name}</div>
                    {supplier.contact_person && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        담당자: {supplier.contact_person}
                      </div>
                    )}
                    {supplier.phone && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        연락처: {supplier.phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>발주 날짜 (선택)</label>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            style={styles.input}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>발주 금액 (선택)</label>
          <input
            type="number"
            value={orderAmount}
            onChange={(e) => setOrderAmount(e.target.value)}
            placeholder="숫자만 입력"
            style={styles.input}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>메모 (선택)</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모 입력..."
            rows={3}
            style={styles.textarea}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>전송자명 (필수) *</label>
          <input
            type="text"
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
            placeholder="이름 입력"
            style={styles.input}
            required
          />
        </div>
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <div style={styles.error}>
          ❌ {error}
        </div>
      )}
      
      {/* 업로드 버튼 */}
      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        style={{
          ...styles.uploadButton,
          opacity: uploading || files.length === 0 ? 0.5 : 1,
          cursor: uploading || files.length === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? '업로드 중...' : `📤 발주서 업로드 (${files.length}장)`}
      </button>
    </div>
  );
}

// 스타일
const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '30px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  hiddenInput: {
    display: 'none',
  },
  selectButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  previewContainer: {
    marginTop: '20px',
  },
  previewHeader: {
    marginBottom: '10px',
    fontSize: '14px',
    color: '#666',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '10px',
  },
  previewItem: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #ddd',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: '5px',
    right: '5px',
    width: '24px',
    height: '24px',
    backgroundColor: 'rgba(255,0,0,0.8)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '12px',
  },
  fileName: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '4px',
    fontSize: '10px',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  autocomplete: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
  },
  autocompleteItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s',
  },
  autocompleteItemHover: {
    backgroundColor: '#f5f5f5',
  },
  error: {
    padding: '15px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  uploadButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
};

export default PurchaseOrderUploadPage;
