/**
 * ========================================
 * 현장 관리 페이지
 * ========================================
 * 파일: src/pages/SitesPage.jsx
 * 설명: 현장 목록 조회 및 관리 (거래처별 필터링)
 * ========================================
 */

import { useState, useEffect } from 'react';
import { siteAPI, clientAPI } from '../services/api';

function SitesPage() {
  const [sites, setSites] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentSite, setCurrentSite] = useState(null);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    address: '',
    manager: '',
    phone: '',
    notes: '',
  });
  
  // 모달 내 거래처 자동완성
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [showClientAutocomplete, setShowClientAutocomplete] = useState(false);
  const [isSearchingClient, setIsSearchingClient] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchSites();
  }, []);

  // 거래처 목록 조회
  const fetchClients = async () => {
    try {
      const response = await clientAPI.list();
      const clientList = response?.data?.clients || [];
      setClients(clientList);
      console.log('📋 거래처 목록:', clientList.length);
    } catch (error) {
      console.error('❌ 거래처 로드 실패:', error);
    }
  };

  // 현장 목록 조회
  const fetchSites = async (clientId = null) => {
    try {
      setLoading(true);
      const response = await siteAPI.list(clientId);
      const siteList = response?.data?.sites || [];
      setSites(siteList);
      console.log('🏗️ 현장 목록:', siteList.length);
    } catch (error) {
      console.error('❌ 현장 로드 실패:', error);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  // 거래처 필터 변경
  const handleClientFilterChange = (clientId) => {
    setSelectedClientId(clientId);
    fetchSites(clientId || null);
  };

  // 검색 필터링
  const filteredSites = sites.filter(site => {
    const searchLower = searchQuery.toLowerCase();
    return (
      site.name?.toLowerCase().includes(searchLower) ||
      site.address?.toLowerCase().includes(searchLower) ||
      site.manager?.toLowerCase().includes(searchLower)
    );
  });

  // 현장 추가 모달 열기
  const handleAddSite = () => {
    setModalMode('create');
    setCurrentSite(null);
    setClientSearchQuery('');
    setClientSearchResults([]);
    setFormData({
      client_id: selectedClientId || '',
      name: '',
      address: '',
      manager: '',
      phone: '',
      notes: '',
    });
    
    // 필터에서 거래처가 선택된 경우 자동으로 거래처명 표시
    if (selectedClientId) {
      const client = clients.find(c => c.id === parseInt(selectedClientId));
      if (client) {
        setClientSearchQuery(client.name);
      }
    }
    
    setShowModal(true);
  };

  // 현장 수정 모달 열기
  const handleEditSite = (site) => {
    setModalMode('edit');
    setCurrentSite(site);
    
    // 거래처명 찾아서 표시
    const client = clients.find(c => c.id === site.client_id);
    setClientSearchQuery(client ? client.name : '');
    setClientSearchResults([]);
    
    setFormData({
      client_id: site.client_id || '',
      name: site.name || '',
      address: site.address || '',
      manager: site.manager || '',
      phone: site.phone || '',
      notes: site.notes || '',
    });
    setShowModal(true);
  };
  
  // 거래처 검색 (모달 내)
  const handleClientSearch = async (value) => {
    setClientSearchQuery(value);
    setFormData({ ...formData, client_id: '' }); // 입력 중에는 ID 초기화
    
    if (value.trim().length > 0) {
      try {
        setIsSearchingClient(true);
        const response = await clientAPI.search(value);
        const results = response?.data?.clients || [];
        setClientSearchResults(results);
        setShowClientAutocomplete(results.length > 0);
      } catch (error) {
        console.error('❌ 거래처 검색 실패:', error);
        setClientSearchResults([]);
        setShowClientAutocomplete(false);
      } finally {
        setIsSearchingClient(false);
      }
    } else {
      setClientSearchResults([]);
      setShowClientAutocomplete(false);
    }
  };
  
  // 거래처 선택 (모달 내)
  const handleSelectClient = (client) => {
    setClientSearchQuery(client.name);
    setFormData({ ...formData, client_id: client.id });
    setShowClientAutocomplete(false);
  };

  // 현장 저장
  const handleSaveSite = async () => {
    try {
      if (!formData.client_id) {
        alert('거래처를 선택해주세요.');
        return;
      }
      
      if (!formData.name.trim()) {
        alert('현장명을 입력해주세요.');
        return;
      }

      if (modalMode === 'create') {
        await siteAPI.create(formData);
        alert('✅ 현장이 성공적으로 추가되었습니다!');
      } else {
        await siteAPI.update(currentSite.id, formData);
        alert('✅ 현장이 성공적으로 수정되었습니다!');
      }

      setShowModal(false);
      fetchSites(selectedClientId || null);
    } catch (error) {
      console.error('❌ 현장 저장 실패:', error);
      alert('현장 저장에 실패했습니다: ' + (error.response?.data?.message || error.message));
    }
  };

  // 현장 삭제
  const handleDeleteSite = async (siteId) => {
    if (!confirm('정말 이 현장을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await siteAPI.delete(siteId);
      alert('✅ 현장이 삭제되었습니다.');
      fetchSites(selectedClientId || null);
    } catch (error) {
      console.error('❌ 현장 삭제 실패:', error);
      alert('현장 삭제에 실패했습니다: ' + (error.response?.data?.message || error.message));
    }
  };

  // 거래처명 찾기
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || '알 수 없음';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏗️ 현장 관리</h1>
        <button onClick={handleAddSite} style={styles.addButton}>
          ➕ 현장 추가
        </button>
      </div>

      {/* 필터 섹션 */}
      <div style={styles.filterSection}>
        <select
          value={selectedClientId}
          onChange={(e) => handleClientFilterChange(e.target.value)}
          style={styles.select}
        >
          <option value="">전체 거래처</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="현장명, 주소, 담당자 검색..."
          style={styles.searchInput}
        />
      </div>

      {/* 통계 */}
      <div style={styles.stats}>
        총 <strong>{filteredSites.length}</strong>개 현장
      </div>

      {/* 현장 목록 */}
      {loading ? (
        <div style={styles.loading}>⏳ 현장 목록을 불러오는 중...</div>
      ) : filteredSites.length === 0 ? (
        <div style={styles.empty}>
          {searchQuery ? '검색 결과가 없습니다.' : '등록된 현장이 없습니다.'}
        </div>
      ) : (
        <div style={styles.table}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>거래처</th>
                <th style={styles.th}>현장명</th>
                <th style={styles.th}>주소</th>
                <th style={styles.th}>담당자</th>
                <th style={styles.th}>연락처</th>
                <th style={styles.th}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map(site => (
                <tr key={site.id} style={styles.tableRow}>
                  <td style={styles.td}>{site.id}</td>
                  <td style={styles.td}>{getClientName(site.client_id)}</td>
                  <td style={styles.td}>
                    <strong>{site.name}</strong>
                  </td>
                  <td style={styles.td}>{site.address || '-'}</td>
                  <td style={styles.td}>{site.manager || '-'}</td>
                  <td style={styles.td}>{site.phone || '-'}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleEditSite(site)}
                      style={styles.editButton}
                    >
                      ✏️ 수정
                    </button>
                    <button
                      onClick={() => handleDeleteSite(site.id)}
                      style={styles.deleteButton}
                    >
                      🗑️ 삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalMode === 'create' ? '➕ 현장 추가' : '✏️ 현장 수정'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  거래처 * {isSearchingClient && <span style={{ color: '#2196F3', fontSize: '12px' }}>검색 중...</span>}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={(e) => handleClientSearch(e.target.value)}
                    onFocus={() => {
                      if (clientSearchQuery.trim()) {
                        handleClientSearch(clientSearchQuery);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowClientAutocomplete(false), 300)}
                    placeholder="거래처명 입력하여 검색..."
                    style={styles.input}
                    required
                  />
                  
                  {showClientAutocomplete && clientSearchResults.length > 0 && (
                    <div style={styles.autocomplete}>
                      {clientSearchResults.map(client => (
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
                  
                  {formData.client_id && (
                    <div style={{ 
                      marginTop: '5px', 
                      fontSize: '12px', 
                      color: '#4CAF50',
                      fontWeight: 'bold'
                    }}>
                      ✓ 거래처 선택됨: {clientSearchQuery}
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>현장명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="현장명 입력"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>주소</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="주소 입력"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>담당자</label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="담당자 이름"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>연락처</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="연락처 입력"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>메모</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="메모 입력..."
                  rows={3}
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowModal(false)}
                style={styles.cancelButton}
              >
                취소
              </button>
              <button
                onClick={handleSaveSite}
                style={styles.saveButton}
              >
                {modalMode === 'create' ? '추가' : '저장'}
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
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  filterSection: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  select: {
    padding: '10px 15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '10px 15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
  },
  stats: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '100px 20px',
    fontSize: '16px',
    color: '#999',
  },
  table: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
  },
  tableRow: {
    borderBottom: '1px solid #eee',
  },
  td: {
    padding: '15px',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    marginRight: '5px',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
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
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  autocompleteItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s',
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
};

export default SitesPage;
