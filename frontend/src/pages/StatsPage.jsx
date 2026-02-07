/**
 * ========================================
 * 통계 페이지 (Statistics Page) - 리뉴얼
 * ========================================
 * 파일: src/pages/StatsPage.jsx
 * 설명: 월별/전송자별/거래처별 작업지시서 전송량 통계
 * ========================================
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

const StatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [uploaderStats, setUploaderStats] = useState([]);
  const [clientStats, setClientStats] = useState([]);
  const [workTypeStats, setWorkTypeStats] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    fetchAllStats();
  }, [selectedYear, dateRange]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMonthlyStats(),
        fetchUploaderStats(),
        fetchClientStats(),
        fetchWorkTypeStats(),
      ]);
    } catch (error) {
      console.error('❌ 통계 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 월별 통계
  const fetchMonthlyStats = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/v1/stats/monthly`, {
        params: { year: selectedYear },
      });
      setMonthlyStats(response.data.data.monthly || []);
    } catch (error) {
      console.error('❌ 월별 통계 실패:', error);
    }
  };

  // 전송자별 통계
  const fetchUploaderStats = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/v1/stats/by-uploader`, {
        params: dateRange,
      });
      setUploaderStats(response.data.data.uploaders || []);
    } catch (error) {
      console.error('❌ 전송자별 통계 실패:', error);
    }
  };

  // 거래처별 통계
  const fetchClientStats = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/v1/stats/by-client`, {
        params: dateRange,
      });
      setClientStats(response.data.data.clients || []);
    } catch (error) {
      console.error('❌ 거래처별 통계 실패:', error);
    }
  };

  // 작업 유형별 통계
  const fetchWorkTypeStats = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/v1/stats/by-work-type`, {
        params: dateRange,
      });
      setWorkTypeStats(response.data.data.workTypes || []);
    } catch (error) {
      console.error('❌ 작업 유형별 통계 실패:', error);
    }
  };

  const handleYearChange = (delta) => {
    setSelectedYear(selectedYear + delta);
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ];

  const maxMonthlyCount = Math.max(...monthlyStats.map(m => m.count), 1);

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>📊 작업지시서 통계</h1>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>통계 데이터를 불러오는 중...</p>
        </div>
      ) : (
        <>
          {/* 날짜 필터 */}
          <div className="filter-section">
            <div className="filter-group">
              <label>기간 필터 (전송자/거래처/작업유형)</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="date-input"
                />
                <span>~</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="date-input"
                />
                <button
                  className="btn-reset"
                  onClick={() => setDateRange({ startDate: '', endDate: '' })}
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          {/* 월별 통계 */}
          <div className="stats-section">
            <div className="section-header">
              <h2>📅 월별 작업지시서 전송량</h2>
              <div className="year-selector">
                <button onClick={() => handleYearChange(-1)}>‹</button>
                <span>{selectedYear}년</span>
                <button onClick={() => handleYearChange(1)}>›</button>
              </div>
            </div>
            <div className="chart-container">
              <div className="bar-chart">
                {monthlyStats.map((data, index) => (
                  <div key={index} className="bar-item">
                    <div className="bar-value">{data.count}</div>
                    <div
                      className="bar"
                      style={{
                        height: `${(data.count / maxMonthlyCount) * 100}%`,
                      }}
                    ></div>
                    <div className="bar-label">{monthNames[index]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="stats-summary">
              <span className="summary-label">연간 총계:</span>
              <span className="summary-value">
                {monthlyStats.reduce((sum, m) => sum + m.count, 0)}건
              </span>
            </div>
          </div>

          {/* 전송자별 통계 */}
          <div className="stats-section">
            <div className="section-header">
              <h2>👤 전송자별 작업지시서 전송량</h2>
            </div>
            <div className="table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>전송자</th>
                    <th>전송량</th>
                    <th>비율</th>
                  </tr>
                </thead>
                <tbody>
                  {uploaderStats.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-message">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    uploaderStats.map((uploader, index) => {
                      const total = uploaderStats.reduce((sum, u) => sum + u.count, 0);
                      const percentage = ((uploader.count / total) * 100).toFixed(1);
                      return (
                        <tr key={index}>
                          <td className="rank">{index + 1}</td>
                          <td className="uploader-name">{uploader.uploaded_by}</td>
                          <td className="count">{uploader.count}건</td>
                          <td>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${percentage}%` }}
                              ></div>
                              <span className="progress-text">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 거래처별 통계 */}
          <div className="stats-section">
            <div className="section-header">
              <h2>🏢 거래처별 작업지시서 전송량</h2>
            </div>
            <div className="table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>거래처명</th>
                    <th>전송량</th>
                    <th>비율</th>
                  </tr>
                </thead>
                <tbody>
                  {clientStats.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-message">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    clientStats.map((client, index) => {
                      const total = clientStats.reduce((sum, c) => sum + c.count, 0);
                      const percentage = ((client.count / total) * 100).toFixed(1);
                      return (
                        <tr key={index}>
                          <td className="rank">{index + 1}</td>
                          <td className="client-name">{client.client_name}</td>
                          <td className="count">{client.count}건</td>
                          <td>
                            <div className="progress-bar">
                              <div
                                className="progress-fill client-fill"
                                style={{ width: `${percentage}%` }}
                              ></div>
                              <span className="progress-text">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 작업 유형별 통계 */}
          <div className="stats-section">
            <div className="section-header">
              <h2>📋 작업 유형별 전송량</h2>
            </div>
            <div className="work-type-grid">
              {workTypeStats.length === 0 ? (
                <div className="empty-message">데이터가 없습니다.</div>
              ) : (
                workTypeStats.map((workType, index) => {
                  const total = workTypeStats.reduce((sum, w) => sum + w.count, 0);
                  const percentage = ((workType.count / total) * 100).toFixed(1);
                  return (
                    <div key={index} className="work-type-card">
                      <div className="work-type-icon">
                        {workType.work_type === 'FSD' ? '🔵' : 
                         workType.work_type === 'SD' ? '🟢' : 
                         workType.work_type === '기타품목' ? '🟡' : '⚪'}
                      </div>
                      <div className="work-type-name">{workType.work_type}</div>
                      <div className="work-type-count">{workType.count}건</div>
                      <div className="work-type-percentage">{percentage}%</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .stats-page {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
          background: #f8f9fa;
          min-height: calc(100vh - 120px);
        }

        .stats-header {
          margin-bottom: 30px;
        }

        .stats-header h1 {
          font-size: 32px;
          color: #222;
          margin: 0;
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
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .filter-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .filter-group label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }

        .date-inputs {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .date-input {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .btn-reset {
          padding: 10px 20px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-reset:hover {
          background: #e0e0e0;
        }

        .stats-section {
          background: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }

        .section-header h2 {
          font-size: 24px;
          color: #222;
          margin: 0;
        }

        .year-selector {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .year-selector button {
          width: 36px;
          height: 36px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .year-selector button:hover {
          background: #f5f5f5;
          border-color: #999;
        }

        .year-selector span {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          min-width: 80px;
          text-align: center;
        }

        .chart-container {
          padding: 20px 0;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 300px;
          gap: 8px;
          padding: 20px 0;
          border-bottom: 2px solid #ddd;
        }

        .bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
        }

        .bar-value {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          min-height: 20px;
        }

        .bar {
          width: 100%;
          background: linear-gradient(180deg, #4CAF50 0%, #45a049 100%);
          border-radius: 4px 4px 0 0;
          min-height: 4px;
          transition: all 0.3s;
        }

        .bar:hover {
          opacity: 0.8;
        }

        .bar-label {
          font-size: 13px;
          color: #666;
          margin-top: 12px;
          font-weight: 500;
        }

        .stats-summary {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-top: 20px;
        }

        .summary-label {
          font-size: 16px;
          color: #666;
          font-weight: 500;
        }

        .summary-value {
          font-size: 24px;
          color: #4CAF50;
          font-weight: 700;
        }

        .table-container {
          overflow-x: auto;
        }

        .stats-table {
          width: 100%;
          border-collapse: collapse;
        }

        .stats-table thead {
          background: #f8f9fa;
        }

        .stats-table th {
          padding: 14px 16px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
        }

        .stats-table td {
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
        }

        .stats-table tbody tr:hover {
          background: #f8f9fa;
        }

        .rank {
          width: 60px;
          text-align: center;
          font-weight: 700;
          color: #4CAF50;
          font-size: 18px;
        }

        .uploader-name,
        .client-name {
          font-weight: 600;
          color: #222;
        }

        .count {
          font-weight: 600;
          color: #4CAF50;
        }

        .progress-bar {
          position: relative;
          width: 100%;
          height: 32px;
          background: #e9ecef;
          border-radius: 16px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
          transition: width 0.3s;
        }

        .progress-fill.client-fill {
          background: linear-gradient(90deg, #2196F3 0%, #1976D2 100%);
        }

        .progress-text {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }

        .work-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .work-type-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 0.2s;
        }

        .work-type-card:hover {
          transform: translateY(-4px);
        }

        .work-type-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .work-type-name {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .work-type-count {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .work-type-percentage {
          font-size: 16px;
          opacity: 0.9;
        }

        .empty-message {
          text-align: center;
          color: #999;
          padding: 40px;
        }

        @media (max-width: 768px) {
          .stats-page {
            padding: 20px;
          }

          .stats-header h1 {
            font-size: 24px;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .bar-chart {
            height: 200px;
          }

          .bar-label {
            font-size: 11px;
          }

          .work-type-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StatsPage;
