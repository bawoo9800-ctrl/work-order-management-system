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

  // 거래처 클릭 시 홈으로 이동 (해당 거래처 작업지시서 표시)
  const handleClientClick = (client) => {
    navigate('/', { state: { selectedClient: client } });
  };

  return (
    <div className="clients-page">
      {/* 헤더 */}
      <div className="page-header">
        <h1>거래처 관리</h1>
        <div className="header-info">
          <span>총 {filteredClients.length}개</span>
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
              </div>
            ))
          )}
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

        .header-info {
          font-size: 16px;
          font-weight: 600;
          color: #666;
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
        }

        .client-id {
          font-family: monospace;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 80px 20px;
          color: #999;
          font-size: 16px;
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
