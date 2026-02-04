/**
 * ========================================
 * 거래처 관리 페이지 (ClientsPage)
 * ========================================
 * 파일: src/pages/ClientsPage.jsx
 * 설명: 거래처 목록, 검색, Excel 업로드
 * ========================================
 */

import { useState, useEffect } from 'react';
import api from '../services/api';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [stats, setStats] = useState(null);
  
  // 거래처 목록 조회
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/clients');
      console.log('📊 API 응답:', response);
      console.log('📋 응답 데이터:', response.data);
      console.log('👥 거래처 목록:', response.data?.data?.clients);
      
      // API 응답 구조 확인
      const clientsData = response.data?.data?.clients || response.data?.clients || [];
      console.log('✅ 최종 거래처 데이터:', clientsData);
      
      setClients(clientsData);
    } catch (error) {
      console.error('❌ 거래처 목록 조회 실패:', error);
      console.error('에러 상세:', error.response?.data);
      alert('거래처 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 거래처 통계 조회
  const fetchStats = async () => {
    try {
      const response = await api.get('/api/v1/clients/stats');
      console.log('📊 통계 응답:', response.data);
      
      const statsData = response.data?.data?.stats || response.data?.stats || null;
      console.log('📈 최종 통계:', statsData);
      
      setStats(statsData);
    } catch (error) {
      console.error('❌ 통계 조회 실패:', error);
    }
  };
  
  // 초기 로딩
  useEffect(() => {
    fetchClients();
    fetchStats();
  }, []);
  
  // 검색
  const filteredClients = clients.filter(
    client => {
      if (!client || !client.name || !client.code) return false;
      return (
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  );
  
  console.log('🔍 전체 거래처 수:', clients.length);
  console.log('🔍 필터된 거래처 수:', filteredClients.length);
  console.log('🔍 검색어:', searchQuery);
  
  // Excel 업로드
  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 확장자 확인
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Excel 파일만 업로드 가능합니다.');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadProgress(0);
    setUploadStatus('업로드 중...');
    
    try {
      // 진행 상황 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);
      
      const response = await api.post('/api/v1/clients/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log('📤 업로드 응답:', response.data);
      
      // API 응답 구조 확인
      const uploadData = response.data?.data || response.data || {};
      const { validRows = 0, invalidRows = 0, insertedCount = 0 } = uploadData;
      
      console.log('✅ 업로드 결과:', { validRows, invalidRows, insertedCount });
      
      setUploadStatus(`✅ 업로드 완료: ${insertedCount}개 등록 (유효: ${validRows}, 무효: ${invalidRows})`);
      
      // 목록 새로고침
      console.log('🔄 목록 새로고침 시작...');
      await fetchClients();
      await fetchStats();
      console.log('🔄 새로고침 완료');
      
      // 3초 후 상태 초기화
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('');
      }, 3000);
    } catch (error) {
      console.error('Excel 업로드 실패:', error);
      setUploadStatus(`❌ 업로드 실패: ${error.response?.data?.error?.message || error.message}`);
      setUploadProgress(0);
    }
    
    // 파일 입력 초기화
    event.target.value = '';
  };
  
  return (
    <div className="clients-page">
      <div className="clients-header">
        <h1>📋 거래처 관리</h1>
        {stats && (
          <div className="stats-summary">
            <span>전체: {stats.total_clients}</span>
            <span>활성: {stats.active_clients}</span>
          </div>
        )}
      </div>
      
      {/* Excel 업로드 섹션 */}
      <div className="upload-section">
        <h2>📤 Excel 업로드</h2>
        <p className="upload-info">
          ⚠️ 업로드 시 <strong>기존 거래처가 모두 삭제</strong>되고 새 파일로 교체됩니다.
        </p>
        <div className="upload-controls">
          <label htmlFor="excel-upload" className="upload-button">
            📁 Excel 파일 선택
          </label>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            style={{ display: 'none' }}
          />
        </div>
        
        {/* 진행 상황 표시 */}
        {uploadProgress > 0 && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="progress-text">{uploadStatus}</p>
          </div>
        )}
      </div>
      
      {/* 검색 섹션 */}
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 거래처명 또는 사업자코드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>
      
      {/* 거래처 목록 */}
      <div className="clients-list">
        {loading ? (
          <div className="loading">⏳ 로딩 중...</div>
        ) : filteredClients.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 거래처가 없습니다.'}
          </div>
        ) : (
          <table className="clients-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>사업자코드</th>
                <th>거래처명</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, index) => (
                <tr key={client.id}>
                  <td>{index + 1}</td>
                  <td className="code">{client.code}</td>
                  <td className="name">{client.name}</td>
                  <td className="date">
                    {new Date(client.created_at).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <style>{`
        .clients-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .clients-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .clients-header h1 {
          margin: 0;
          color: #333;
        }
        
        .stats-summary {
          display: flex;
          gap: 15px;
          font-size: 14px;
          color: #666;
        }
        
        .stats-summary span {
          padding: 5px 10px;
          background: #f0f0f0;
          border-radius: 4px;
        }
        
        .upload-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .upload-section h2 {
          margin-top: 0;
          color: #333;
        }
        
        .upload-info {
          color: #d32f2f;
          font-size: 14px;
          margin: 10px 0;
        }
        
        .upload-button {
          display: inline-block;
          padding: 10px 20px;
          background: #2196f3;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .upload-button:hover {
          background: #1976d2;
        }
        
        .upload-progress {
          margin-top: 15px;
        }
        
        .progress-bar {
          width: 100%;
          height: 24px;
          background: #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #8bc34a);
          transition: width 0.3s ease;
        }
        
        .progress-text {
          margin-top: 8px;
          font-size: 14px;
          color: #666;
        }
        
        .search-section {
          margin-bottom: 20px;
        }
        
        .search-input {
          width: 100%;
          max-width: 500px;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #2196f3;
        }
        
        .clients-list {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .loading, .empty-state {
          text-align: center;
          padding: 40px;
          color: #999;
        }
        
        .clients-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .clients-table thead {
          background: #f5f5f5;
        }
        
        .clients-table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #ddd;
        }
        
        .clients-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }
        
        .clients-table tbody tr:hover {
          background: #f9f9f9;
        }
        
        .clients-table .code {
          font-family: 'Courier New', monospace;
          color: #666;
        }
        
        .clients-table .name {
          font-weight: 500;
          color: #333;
        }
        
        .clients-table .date {
          color: #999;
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .clients-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .clients-table {
            font-size: 14px;
          }
          
          .clients-table th,
          .clients-table td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientsPage;
