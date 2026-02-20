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
import { siteAPI, clientAPI } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function PurchaseOrderUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // 발주 정보
  const [vendorName, setVendorName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [siteName, setSiteName] = useState('');
  
  // 오늘 날짜를 기본값으로 설정
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [orderDate, setOrderDate] = useState(getTodayDate());
  const [memo, setMemo] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  
  // 발주처(거래처) 자동완성
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // 현장 자동완성
  const [showSiteAutocomplete, setShowSiteAutocomplete] = useState(false);
  const [filteredSites, setFilteredSites] = useState([]);
  const [isSearchingSite, setIsSearchingSite] = useState(false);
  
  // 거래처 추가 모달
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    code: '',
    name: '',
    keywords: [],
  });
  const [keywordInput, setKeywordInput] = useState('');
  
  // 현장 추가 모달
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [siteFormData, setSiteFormData] = useState({
    client_id: '',
    name: '',
    address: '',
    manager: '',
    phone: '',
    notes: '',
  });
  
  useEffect(() => {
    // 로컬스토리지에서 업로더 이름 불러오기
    const savedUploader = localStorage.getItem('lastUploadedBy');
    if (savedUploader) {
      setUploadedBy(savedUploader);
    }
  }, []);
  
  // 발주처(거래처) 검색
  const handleVendorSearch = async (value) => {
    setVendorName(value);
    setSelectedClientId(null); // 거래처가 변경되면 clientId 초기화
    
    if (value.trim().length > 0) {
      try {
        setIsSearching(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/clients/search?q=${encodeURIComponent(value)}`
        );
        
        console.log('🔍 거래처 검색 결과:', response.data);
        
        const results = response.data?.data?.clients || [];
        setFilteredClients(results);
        setShowAutocomplete(results.length > 0);
      } catch (error) {
        console.error('❌ 거래처 검색 실패:', error);
        setFilteredClients([]);
        setShowAutocomplete(false);
      } finally {
        setIsSearching(false);
      }
    } else {
      setFilteredClients([]);
      setShowAutocomplete(false);
    }
  };
  
  // 거래처 선택 핸들러
  const handleSelectClient = (client) => {
    setVendorName(client.name);
    setSelectedClientId(client.id);
    setShowAutocomplete(false);
    
    // 거래처 선택 시 해당 거래처의 현장 목록 미리 불러오기
    if (client.id) {
      fetchClientSites(client.id);
    }
  };
  
  // 현장 검색
  const handleSiteSearch = async (value) => {
    setSiteName(value);
    
    if (value.trim().length > 0) {
      try {
        setIsSearchingSite(true);
        const response = await siteAPI.search(value, selectedClientId);
        
        console.log('🏗️ 현장 검색 결과:', response);
        
        const results = response?.data?.sites || [];
        setFilteredSites(results);
        setShowSiteAutocomplete(results.length > 0);
      } catch (error) {
        console.error('❌ 현장 검색 실패:', error);
        setFilteredSites([]);
        setShowSiteAutocomplete(false);
      } finally {
        setIsSearchingSite(false);
      }
    } else {
      setFilteredSites([]);
      setShowSiteAutocomplete(false);
    }
  };
  
  // 거래처별 현장 목록 불러오기
  const fetchClientSites = async (clientId) => {
    try {
      const response = await siteAPI.list(clientId);
      const sites = response?.data?.sites || [];
      setFilteredSites(sites);
      console.log(`📍 거래처 ${clientId}의 현장 목록:`, sites);
    } catch (error) {
      console.error('❌ 현장 목록 로드 실패:', error);
    }
  };
  
  // 거래처 추가 모달 열기
  const handleOpenClientModal = () => {
    setClientFormData({
      code: '',
      name: '',
      keywords: [],
    });
    setKeywordInput('');
    setShowClientModal(true);
  };
  
  // 키워드 추가
  const handleAddKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !clientFormData.keywords.includes(keyword)) {
      setClientFormData({
        ...clientFormData,
        keywords: [...clientFormData.keywords, keyword],
      });
      setKeywordInput('');
    }
  };
  
  // 키워드 삭제
  const handleRemoveKeyword = (index) => {
    setClientFormData({
      ...clientFormData,
      keywords: clientFormData.keywords.filter((_, i) => i !== index),
    });
  };
  
  // 거래처 저장
  const handleSaveClient = async () => {
    try {
      if (!clientFormData.code.trim()) {
        alert('거래처 코드를 입력해주세요.');
        return;
      }
      if (!clientFormData.name.trim()) {
        alert('거래처명을 입력해주세요.');
        return;
      }
      if (clientFormData.keywords.length === 0) {
        alert('최소 1개의 키워드를 입력해주세요.');
        return;
      }
      
      const response = await clientAPI.create({
        code: clientFormData.code,
        name: clientFormData.name,
        keywords: clientFormData.keywords,
        aliases: [],
        priority: 100,
      });
      
      console.log('✅ 거래처 추가 성공:', response);
      
      // 추가된 거래처를 자동으로 선택
      const newClient = response?.data?.client;
      if (newClient) {
        setVendorName(newClient.name);
        setSelectedClientId(newClient.id);
      }
      
      alert('✅ 거래처가 성공적으로 추가되었습니다!');
      setShowClientModal(false);
    } catch (error) {
      console.error('❌ 거래처 추가 실패:', error);
      alert('거래처 추가에 실패했습니다: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 현장 추가 모달 열기
  const handleOpenSiteModal = () => {
    if (!selectedClientId) {
      alert('먼저 발주처(거래처)를 선택해주세요.');
      return;
    }
    
    setSiteFormData({
      client_id: selectedClientId,
      name: '',
      address: '',
      manager: '',
      phone: '',
      notes: '',
    });
    setShowSiteModal(true);
  };
  
  // 현장 저장
  const handleSaveSite = async () => {
    try {
      if (!siteFormData.name.trim()) {
        alert('현장명을 입력해주세요.');
        return;
      }
      
      const response = await siteAPI.create(siteFormData);
      
      console.log('✅ 현장 추가 성공:', response);
      
      // 추가된 현장을 자동으로 선택
      const newSite = response?.data?.site;
      if (newSite) {
        setSiteName(newSite.name);
        // 현장 목록 새로고침
        fetchClientSites(selectedClientId);
      }
      
      alert('✅ 현장이 성공적으로 추가되었습니다!');
      setShowSiteModal(false);
    } catch (error) {
      console.error('❌ 현장 추가 실패:', error);
      alert('현장 추가에 실패했습니다: ' + (error.response?.data?.message || error.message));
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
  
  // Drag & Drop 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length === 0) return;
    
    // 이미지 파일만 필터링
    const imageFiles = droppedFiles.filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length !== droppedFiles.length) {
      alert('이미지 파일만 업로드 가능합니다.');
    }
    
    if (imageFiles.length > 0) {
      setFiles(prev => [...prev, ...imageFiles]);
      setError(null);
    }
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
      formData.append('siteName', siteName);
      formData.append('orderDate', orderDate);
      formData.append('memo', memo);
      formData.append('uploadedBy', uploadedBy.trim());
      
      console.log('📤 발주서 업로드 시작:', {
        fileCount: files.length,
        vendorName,
        siteName,
        orderDate,
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
      
      // 업로드 페이지에 계속 머물면서 폼 초기화
      // 파일 목록 초기화
      setFiles([]);
      
      // 입력 필드 초기화 (전송자명은 유지)
      setVendorName('');
      setSiteName('');
      setOrderDate(today);
      setMemo('');
      
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('📝 폼 초기화 완료 - 다음 업로드 준비됨');
      
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
        
        {/* Drag & Drop 영역 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            ...styles.dropZone,
            ...(isDragging ? styles.dropZoneActive : {})
          }}
        >
          <div style={styles.dropZoneContent}>
            <div style={styles.dropZoneIcon}>📁</div>
            <div style={styles.dropZoneText}>
              파일을 드래그하거나 클릭하여 선택하세요
            </div>
            <div style={styles.dropZoneHint}>
              (여러 이미지 선택 가능)
            </div>
          </div>
        </div>
        
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
          <div style={styles.labelWithButton}>
            <label style={styles.label}>
              발주처 (선택) {isSearching && <span style={{ color: '#2196F3', fontSize: '12px' }}>검색 중...</span>}
            </label>
            <button
              type="button"
              onClick={handleOpenClientModal}
              style={styles.addButton}
            >
              ➕ 거래처 추가
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => handleVendorSearch(e.target.value)}
              onFocus={() => {
                if (vendorName.trim()) {
                  handleVendorSearch(vendorName);
                }
              }}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 300)}
              placeholder="발주처명 입력 (거래처 검색)"
              style={styles.input}
            />
            
            {showAutocomplete && filteredClients.length > 0 && (
              <div style={styles.autocomplete}>
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    style={styles.autocompleteItem}
                  >
                    <div style={{ fontWeight: 'bold' }}>{client.name}</div>
                    {client.code && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        거래처코드: {client.code}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <div style={styles.labelWithButton}>
            <label style={styles.label}>
              현장명 (선택) {isSearchingSite && <span style={{ color: '#2196F3', fontSize: '12px' }}>검색 중...</span>}
            </label>
            <button
              type="button"
              onClick={handleOpenSiteModal}
              style={styles.addButton}
              disabled={!selectedClientId}
            >
              ➕ 현장 추가
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={siteName}
              onChange={(e) => handleSiteSearch(e.target.value)}
              onFocus={() => {
                if (selectedClientId) {
                  // 거래처가 선택된 경우 해당 거래처의 현장 목록 표시
                  fetchClientSites(selectedClientId);
                  if (filteredSites.length > 0) {
                    setShowSiteAutocomplete(true);
                  }
                } else if (siteName.trim()) {
                  // 거래처 미선택 시 전체 현장 검색
                  handleSiteSearch(siteName);
                }
              }}
              onBlur={() => setTimeout(() => setShowSiteAutocomplete(false), 300)}
              placeholder={selectedClientId ? "현장명 입력 (거래처 현장 검색)" : "현장명 입력 (먼저 거래처 선택 권장)"}
              style={styles.input}
            />
            
            {showSiteAutocomplete && filteredSites.length > 0 && (
              <div style={styles.autocomplete}>
                {filteredSites.map(site => (
                  <div
                    key={site.id}
                    onClick={() => {
                      setSiteName(site.name);
                      setShowSiteAutocomplete(false);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    style={styles.autocompleteItem}
                  >
                    <div style={{ fontWeight: 'bold' }}>{site.name}</div>
                    {site.address && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        주소: {site.address}
                      </div>
                    )}
                    {site.manager && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        담당자: {site.manager}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>발주일 (선택)</label>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
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
      
      {/* 거래처 추가 모달 */}
      {showClientModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>➕ 거래처 추가</h2>
              <button
                onClick={() => setShowClientModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>거래처 코드 (사업자번호 10자리) *</label>
                <input
                  type="text"
                  value={clientFormData.code}
                  onChange={(e) => setClientFormData({ ...clientFormData, code: e.target.value })}
                  placeholder="예: 1234567890"
                  maxLength={10}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>거래처명 *</label>
                <input
                  type="text"
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                  placeholder="예: (주)삼성전자"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>검색 키워드 (최소 1개) *</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    placeholder="키워드 입력 후 엔터"
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    style={styles.keywordAddButton}
                  >
                    추가
                  </button>
                </div>
                
                <div style={styles.keywordList}>
                  {clientFormData.keywords.map((keyword, index) => (
                    <div key={index} style={styles.keywordTag}>
                      <span>{keyword}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(index)}
                        style={styles.keywordRemoveButton}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {clientFormData.keywords.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      키워드를 추가해주세요 (예: 삼성, 삼성전자, Samsung)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowClientModal(false)}
                style={styles.cancelButton}
              >
                취소
              </button>
              <button
                onClick={handleSaveClient}
                style={styles.saveButton}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 현장 추가 모달 */}
      {showSiteModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>➕ 현장 추가</h2>
              <button
                onClick={() => setShowSiteModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>거래처</label>
                <input
                  type="text"
                  value={vendorName}
                  disabled
                  style={{ ...styles.input, backgroundColor: '#f5f5f5' }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>현장명 *</label>
                <input
                  type="text"
                  value={siteFormData.name}
                  onChange={(e) => setSiteFormData({ ...siteFormData, name: e.target.value })}
                  placeholder="현장명 입력"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>주소</label>
                <input
                  type="text"
                  value={siteFormData.address}
                  onChange={(e) => setSiteFormData({ ...siteFormData, address: e.target.value })}
                  placeholder="주소 입력"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>담당자</label>
                <input
                  type="text"
                  value={siteFormData.manager}
                  onChange={(e) => setSiteFormData({ ...siteFormData, manager: e.target.value })}
                  placeholder="담당자 이름"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>연락처</label>
                <input
                  type="tel"
                  value={siteFormData.phone}
                  onChange={(e) => setSiteFormData({ ...siteFormData, phone: e.target.value })}
                  placeholder="연락처 입력"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>메모</label>
                <textarea
                  value={siteFormData.notes}
                  onChange={(e) => setSiteFormData({ ...siteFormData, notes: e.target.value })}
                  placeholder="메모 입력..."
                  rows={3}
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowSiteModal(false)}
                style={styles.cancelButton}
              >
                취소
              </button>
              <button
                onClick={handleSaveSite}
                style={styles.saveButton}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
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
  dropZone: {
    width: '100%',
    minHeight: '200px',
    padding: '40px 20px',
    border: '3px dashed #2196F3',
    borderRadius: '12px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976D2',
    transform: 'scale(1.02)',
  },
  dropZoneContent: {
    textAlign: 'center',
  },
  dropZoneIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  dropZoneText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  dropZoneHint: {
    fontSize: '14px',
    color: '#666',
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
  labelWithButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
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
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #f0f0f0',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
  },
  modalBody: {
    padding: '20px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '20px',
    borderTop: '2px solid #f0f0f0',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  keywordAddButton: {
    padding: '10px 15px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  keywordList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    minHeight: '40px',
    padding: '10px',
    border: '2px dashed #ddd',
    borderRadius: '8px',
  },
  keywordTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '16px',
    fontSize: '14px',
  },
  keywordRemoveButton: {
    width: '18px',
    height: '18px',
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: 'white',
    borderRadius: '50%',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
};

export default PurchaseOrderUploadPage;
