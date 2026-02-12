/**
 * ========================================
 * 거래처 관리 페이지
 * ========================================
 * 파일: src/pages/ClientsPage.jsx
 * 설명: 거래처 목록 조회 및 검색
 * ========================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientAPI } from '../services/api';

const ClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 거래처 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    code: '',
    name: '',
    keywords: [],
    keywordInput: ''
  });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // 거래처 목록 로드
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientAPI.list();
      const clientData = response.data?.clients || response.clients || [];
      setClients(clientData);
      console.log('👥 거래처 목록 로드:', clientData.length);
    } catch (error) {
      console.error('❌ 거래처 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터링
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 거래처 클릭 핸들러 (타입에 따라 다른 페이지로 이동)
  const handleWorkOrderClick = (client, e) => {
    e.stopPropagation();
    navigate('/', { state: { selectedClient: client } });
  };

  const handlePurchaseOrderClick = (client, e) => {
    e.stopPropagation();
    navigate('/purchase-orders', { state: { selectedClient: client } });
  };

  const handleClientClick = (client) => {
    // 카드 전체 클릭 시 작업지시서로 이동
    navigate('/', { state: { selectedClient: client } });
  };

  // 거래처 추가 모달 열기/닫기
  const openAddModal = () => {
    setShowAddModal(true);
    setNewClient({ code: '', name: '', keywords: [], keywordInput: '' });
    setAddError('');
    setAddSuccess('');
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewClient({ code: '', name: '', keywords: [], keywordInput: '' });
    setAddError('');
    setAddSuccess('');
  };

  // 키워드 추가
  const addKeyword = () => {
    const keyword = newClient.keywordInput.trim();
    if (keyword && !newClient.keywords.includes(keyword)) {
      setNewClient({
        ...newClient,
        keywords: [...newClient.keywords, keyword],
        keywordInput: ''
      });
    }
  };

  // 키워드 제거
  const removeKeyword = (keyword) => {
    setNewClient({
      ...newClient,
      keywords: newClient.keywords.filter(k => k !== keyword)
    });
  };

  // Enter 키로 키워드 추가
  const handleKeywordKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  // 거래처 추가 제출
  const handleAddClient = async () => {
    try {
      setAddError('');
      
      // 유효성 검사
      if (!newClient.code.trim()) {
        setAddError('거래처 코드를 입력해주세요.');
        return;
      }
      if (!newClient.name.trim()) {
        setAddError('거래처명을 입력해주세요.');
        return;
      }
      if (newClient.keywords.length === 0) {
        setAddError('최소 1개 이상의 키워드를 추가해주세요.');
        return;
      }

      const clientData = {
        code: newClient.code.trim(),
        name: newClient.name.trim(),
        keywords: newClient.keywords,
        aliases: [],
        priority: 100
      };

      console.log('➕ 거래처 추가:', clientData);
      
      await clientAPI.create(clientData);
      
      setAddSuccess('거래처가 성공적으로 추가되었습니다!');
      
      // 1초 후 모달 닫고 목록 새로고침
      setTimeout(() => {
        closeAddModal();
        fetchClients();
      }, 1000);
      
    } catch (error) {
      console.error('❌ 거래처 추가 실패:', error);
      setAddError(error.response?.data?.error?.message || '거래처 추가에 실패했습니다.');
    }
  };

  return (
    <div className="clients-page">
      {/* 헤더 */}
      <div className="page-header">
        <h1>거래처 관리</h1>
        <div className="header-actions">
          <span className="header-info">총 {filteredClients.length}개</span>
          <button className="add-client-btn" onClick={openAddModal}>
            ➕ 거래처 추가
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="거래처 검색... (예: 삼성, 현대)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="clear-btn"
            onClick={() => setSearchQuery('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>거래처 목록을 불러오는 중...</p>
        </div>
      )}

      {/* 거래처 그리드 */}
      {!loading && (
        <div className="clients-grid">
          {filteredClients.length === 0 ? (
            <div className="empty-state">
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : (
            filteredClients.map(client => (
              <div
                key={client.id}
                className="client-card"
                onClick={() => handleClientClick(client)}
              >
                <div className="client-name">{client.name}</div>
                <div className="client-meta">
                  <span className="client-id">ID: {client.id}</span>
                </div>
                
                {/* 통계 섹션 */}
                <div className="client-stats">
                  <div 
                    className="stat-item work-order-stat"
                    onClick={(e) => handleWorkOrderClick(client, e)}
                    title="작업지시서 보기"
                  >
                    <span className="stat-icon">📋</span>
                    <span className="stat-label">작업지시서</span>
                    <span className="stat-count">{client.work_order_count || 0}</span>
                  </div>
                  
                  <div 
                    className="stat-item purchase-order-stat"
                    onClick={(e) => handlePurchaseOrderClick(client, e)}
                    title="발주서 보기"
                  >
                    <span className="stat-icon">📦</span>
                    <span className="stat-label">발주서</span>
                    <span className="stat-count">{client.purchase_order_count || 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 거래처 추가 모달 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>거래처 추가</h2>
              <button className="modal-close-btn" onClick={closeAddModal}>✕</button>
            </div>
            
            <div className="modal-body">
              {addError && <div className="error-message">❌ {addError}</div>}
              {addSuccess && <div className="success-message">✅ {addSuccess}</div>}
              
              <div className="form-group">
                <label>거래처 코드 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 1234567890"
                  value={newClient.code}
                  onChange={(e) => setNewClient({ ...newClient, code: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>거래처명 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: (주)삼성전자"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>검색 키워드 * (최소 1개)</label>
                <div className="keyword-input-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="키워드 입력 후 Enter 또는 추가 버튼"
                    value={newClient.keywordInput}
                    onChange={(e) => setNewClient({ ...newClient, keywordInput: e.target.value })}
                    onKeyPress={handleKeywordKeyPress}
                  />
                  <button className="keyword-add-btn" onClick={addKeyword}>추가</button>
                </div>
                
                {newClient.keywords.length > 0 && (
                  <div className="keyword-list">
                    {newClient.keywords.map((keyword, index) => (
                      <span key={index} className="keyword-tag">
                        {keyword}
                        <button onClick={() => removeKeyword(keyword)}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="form-hint">💡 AI 분류 시 이 키워드로 거래처를 자동 인식합니다.</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeAddModal}>취소</button>
              <button className="submit-btn" onClick={handleAddClient}>추가</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .clients-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }

        .page-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #000;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .header-info {
          font-size: 16px;
          font-weight: 600;
          color: #666;
        }

        .add-client-btn {
          padding: 10px 20px;
          font-size: 15px;
          font-weight: 600;
          color: white;
          background: #4CAF50;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-client-btn:hover {
          background: #45a049;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }

        .search-section {
          position: relative;
          margin-bottom: 30px;
        }

        .search-input {
          width: 100%;
          padding: 14px 50px 14px 20px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 12px;
          transition: all 0.2s;
          font-family: inherit;
        }

        .search-input:focus {
          outline: none;
          border-color: #000;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
        }

        .clear-btn {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          width: 30px;
          height: 30px;
          border: none;
          background: #f0f0f0;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          color: #666;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          background: #e0e0e0;
          color: #000;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 80px 20px;
          color: #666;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #f0f0f0;
          border-top: 5px solid #000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .clients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }

        .client-card {
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .client-card:hover {
          border-color: #000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .client-name {
          font-size: 18px;
          font-weight: 600;
          color: #000;
          margin-bottom: 8px;
        }

        .client-meta {
          font-size: 13px;
          color: #999;
          margin-bottom: 12px;
        }

        .client-id {
          font-family: monospace;
        }

        /* 통계 섹션 */
        .client-stats {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .stat-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 8px;
          background: #f8f8f8;
          border-radius: 8px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .stat-item:hover {
          background: #e8e8e8;
          transform: scale(1.05);
        }

        .work-order-stat:hover {
          background: #e3f2fd;
        }

        .purchase-order-stat:hover {
          background: #e8f5e9;
        }

        .stat-icon {
          font-size: 20px;
        }

        .stat-label {
          font-size: 11px;
          color: #666;
          font-weight: 500;
        }

        .stat-count {
          font-size: 18px;
          font-weight: 700;
          color: #000;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 80px 20px;
          color: #999;
          font-size: 16px;
        }

        /* 모달 스타일 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }

        .modal-close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f5f5f5;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: #e0e0e0;
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .form-input {
          width: 100%;
          padding: 12px;
          font-size: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          transition: border-color 0.2s;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #4CAF50;
        }

        .keyword-input-group {
          display: flex;
          gap: 8px;
        }

        .keyword-add-btn {
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          background: #2196F3;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .keyword-add-btn:hover {
          background: #1976D2;
        }

        .keyword-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .keyword-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #e3f2fd;
          color: #1976D2;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }

        .keyword-tag button {
          background: none;
          border: none;
          color: #1976D2;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .keyword-tag button:hover {
          color: #0d47a1;
        }

        .form-hint {
          margin-top: 8px;
          font-size: 13px;
          color: #666;
        }

        .error-message {
          padding: 12px;
          background: #ffebee;
          color: #c62828;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .success-message {
          padding: 12px;
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e0e0e0;
        }

        .cancel-btn {
          padding: 10px 24px;
          font-size: 15px;
          font-weight: 600;
          color: #666;
          background: #f5f5f5;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #e0e0e0;
        }

        .submit-btn {
          padding: 10px 24px;
          font-size: 15px;
          font-weight: 600;
          color: white;
          background: #4CAF50;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-btn:hover {
          background: #45a049;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }

        /* 반응형 */
        @media (max-width: 768px) {
          .clients-page {
            padding: 15px;
          }

          .page-header h1 {
            font-size: 24px;
          }

          .clients-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
          }

          .client-card {
            padding: 15px;
          }

          .client-name {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientsPage;
