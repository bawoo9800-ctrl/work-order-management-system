/**
 * ========================================
 * 관리 페이지 (Admin Page)
 * ========================================
 * 파일: src/pages/AdminPage.jsx
 * 설명: 사용자(전송자) 관리 페이지
 *       - 사용자 목록 조회
 *       - 사용자 추가
 *       - 사용자 삭제
 * ========================================
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // 사용자 목록 조회
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/v1/users`);
      const usersData = response.data?.data?.users || [];
      setUsers(usersData);
      console.log('👥 사용자 목록:', usersData);
    } catch (error) {
      console.error('❌ 사용자 조회 실패:', error);
      alert('사용자 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 사용자 추가
  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      alert('사용자명을 입력해주세요.');
      return;
    }
    
    try {
      await axios.post(`${baseUrl}/api/v1/users`, {
        name: newUserName.trim(),
      });
      
      alert('사용자가 추가되었습니다.');
      setNewUserName('');
      setShowAddModal(false);
      fetchUsers();
    } catch (error) {
      console.error('❌ 사용자 추가 실패:', error);
      const message = error.response?.data?.message || '사용자 추가에 실패했습니다.';
      alert(message);
    }
  };
  
  // 사용자 삭제
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`"${userName}" 사용자를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      await axios.delete(`${baseUrl}/api/v1/users/${userId}`);
      alert('사용자가 삭제되었습니다.');
      fetchUsers();
    } catch (error) {
      console.error('❌ 사용자 삭제 실패:', error);
      const message = error.response?.data?.message || '사용자 삭제에 실패했습니다.';
      alert(message);
    }
  };
  
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>👤 사용자 관리</h1>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>
          ➕ 사용자 추가
        </button>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>로딩 중...</p>
        </div>
      ) : (
        <div className="users-container">
          <div className="users-stats">
            <div className="stat-card">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">총 사용자</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {users.reduce((sum, user) => sum + (user.workOrderCount || 0), 0)}
              </div>
              <div className="stat-label">총 작업지시서</div>
            </div>
          </div>
          
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>사용자명</th>
                  <th>작업지시서 수</th>
                  <th>등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-message">
                      등록된 사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td className="user-name">{user.name}</td>
                      <td>
                        <span className="work-order-count">
                          {user.workOrderCount || 0}건
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={user.workOrderCount > 0}
                          title={
                            user.workOrderCount > 0
                              ? '작업지시서가 있는 사용자는 삭제할 수 없습니다.'
                              : '사용자 삭제'
                          }
                        >
                          🗑️ 삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 사용자 추가 모달 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>사용자 추가</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>사용자명</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="사용자명을 입력하세요"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddUser();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                취소
              </button>
              <button className="btn-save" onClick={handleAddUser}>
                추가
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .admin-page {
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .admin-header h1 {
          font-size: 32px;
          color: #222;
          margin: 0;
        }
        
        .btn-add {
          padding: 12px 24px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-add:hover {
          background: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .users-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .users-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 30px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }
        
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: #4CAF50;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
        }
        
        .users-table-container {
          overflow-x: auto;
        }
        
        .users-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .users-table thead {
          background: #f8f9fa;
        }
        
        .users-table th {
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
        }
        
        .users-table td {
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .users-table tbody tr:hover {
          background: #f8f9fa;
        }
        
        .user-name {
          font-weight: 600;
          color: #222;
        }
        
        .work-order-count {
          display: inline-block;
          padding: 4px 12px;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .btn-delete {
          padding: 8px 16px;
          background: #ffffff;
          color: #f44336;
          border: 1px solid #f44336;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-delete:hover:not(:disabled) {
          background: #f44336;
          color: white;
        }
        
        .btn-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: #ccc;
          color: #999;
        }
        
        .empty-message {
          text-align: center;
          color: #999;
          padding: 40px !important;
        }
        
        /* 모달 */
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
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .modal-header h2 {
          font-size: 24px;
          color: #222;
          margin: 0;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        
        .modal-close:hover {
          background: #f5f5f5;
          color: #222;
        }
        
        .modal-body {
          padding: 24px;
        }
        
        .form-group {
          margin-bottom: 0;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #222;
        }
        
        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.2s;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #4CAF50;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e9ecef;
        }
        
        .btn-cancel {
          padding: 10px 20px;
          background: #f5f5f5;
          color: #666;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-cancel:hover {
          background: #e0e0e0;
        }
        
        .btn-save {
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-save:hover {
          background: #45a049;
        }
        
        @media (max-width: 768px) {
          .admin-page {
            padding: 20px;
          }
          
          .admin-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .users-stats {
            grid-template-columns: 1fr;
          }
          
          .users-table {
            font-size: 14px;
          }
          
          .users-table th,
          .users-table td {
            padding: 12px 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
