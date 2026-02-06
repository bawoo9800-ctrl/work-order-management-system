/**
 * ========================================
 * 달력 페이지 (Calendar View)
 * ========================================
 * 파일: src/pages/CalendarPage.jsx
 * 설명: 날짜별 작업지시서 조회 달력
 *       - 월별 캘린더 뷰
 *       - 날짜별 작업지시서 개수 표시
 *       - 날짜 클릭 시 해당일 작업지시서 목록
 * ========================================
 */

import { useState, useEffect } from 'react';
import { workOrderAPI } from '../services/api';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workOrdersByDate, setWorkOrdersByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // 현재 년도/월
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchMonthWorkOrders();
  }, [currentDate]);

  // 월별 작업지시서 조회
  const fetchMonthWorkOrders = async () => {
    setLoading(true);
    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const response = await workOrderAPI.list({ startDate, endDate });
      const orders = response.data?.workOrders || response.workOrders || [];

      // 날짜별로 그룹핑
      const grouped = {};
      orders.forEach(order => {
        const date = order.created_at.split('T')[0];
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(order);
      });

      setWorkOrdersByDate(grouped);
      console.log('📅 월별 작업지시서:', grouped);
    } catch (error) {
      console.error('❌ 작업지시서 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 이전 달
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
    setSelectedOrders([]);
  };

  // 다음 달
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
    setSelectedOrders([]);
  };

  // 오늘로 이동
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
    setSelectedOrders([]);
  };

  // 날짜 클릭
  const handleDateClick = (date) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setSelectedOrders(workOrdersByDate[dateStr] || []);
  };

  // 이미지 URL 생성
  const getImageUrl = (workOrder) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200';
    const storagePath = workOrder.storage_path || '';
    
    if (storagePath.startsWith('/uploads/')) {
      return `${baseUrl}${storagePath}`;
    }
    
    return `${baseUrl}/uploads/${storagePath}`;
  };

  // 시간 포맷팅
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 달력 생성
  const generateCalendar = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const calendar = [];
    let week = [];

    // 빈 칸 채우기 (이전 달)
    for (let i = 0; i < firstDayOfWeek; i++) {
      week.push(null);
    }

    // 날짜 채우기
    for (let date = 1; date <= daysInMonth; date++) {
      week.push(date);

      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    // 마지막 주 빈 칸 채우기
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      calendar.push(week);
    }

    return calendar;
  };

  const calendar = generateCalendar();

  // 해당 날짜의 작업지시서 개수
  const getDateCount = (date) => {
    if (!date) return 0;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return workOrdersByDate[dateStr]?.length || 0;
  };

  // 오늘인지 확인
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === date
    );
  };

  // 선택된 날짜인지 확인
  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return dateStr === selectedDate;
  };

  return (
    <div className="calendar-page">
      {/* 헤더 */}
      <div className="calendar-header">
        <h1>📅 작업지시서 달력</h1>
        <p className="subtitle">날짜별로 작업지시서를 확인하세요</p>
      </div>

      {/* 달력 컨트롤 */}
      <div className="calendar-controls">
        <button className="btn-control" onClick={prevMonth}>‹ 이전</button>
        <button className="btn-today" onClick={goToday}>오늘</button>
        <h2 className="current-month">{year}년 {month + 1}월</h2>
        <button className="btn-today" onClick={goToday}>오늘</button>
        <button className="btn-control" onClick={nextMonth}>다음 ›</button>
      </div>

      {/* 달력 */}
      <div className="calendar-container">
        <div className="calendar-grid">
          {/* 요일 헤더 */}
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div key={idx} className={`calendar-day-header ${idx === 0 ? 'sunday' : idx === 6 ? 'saturday' : ''}`}>
              {day}
            </div>
          ))}

          {/* 날짜 */}
          {calendar.map((week, weekIdx) => (
            week.map((date, dateIdx) => {
              const count = getDateCount(date);
              const today = isToday(date);
              const selected = isSelected(date);

              return (
                <div
                  key={`${weekIdx}-${dateIdx}`}
                  className={`calendar-date ${!date ? 'empty' : ''} ${today ? 'today' : ''} ${selected ? 'selected' : ''} ${count > 0 ? 'has-orders' : ''} ${dateIdx === 0 ? 'sunday' : dateIdx === 6 ? 'saturday' : ''}`}
                  onClick={() => date && handleDateClick(date)}
                >
                  {date && (
                    <>
                      <span className="date-number">{date}</span>
                      {count > 0 && (
                        <span className="date-badge">{count}</span>
                      )}
                    </>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* 선택된 날짜의 작업지시서 목록 */}
      {selectedDate && (
        <div className="selected-date-section">
          <h3 className="selected-date-title">
            {selectedDate} ({selectedOrders.length}건)
          </h3>

          {selectedOrders.length === 0 ? (
            <div className="empty-orders">
              <p>이 날짜에는 작업지시서가 없습니다.</p>
            </div>
          ) : (
            <div className="orders-grid">
              {selectedOrders.map((order) => (
                <div key={order.id} className="order-card">
                  {/* 이미지 */}
                  <div 
                    className="order-image"
                    onClick={() => setZoomedImage(getImageUrl(order))}
                  >
                    <img 
                      src={getImageUrl(order)}
                      alt={order.original_filename}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect width="200" height="280" fill="%23f5f5f5"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14">이미지 없음</text></svg>';
                      }}
                    />
                    {/* 거래처명 배지 */}
                    {order.client_name && (
                      <div className="order-client-badge">
                        {order.client_name}
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="order-info">
                    <div className="order-meta">
                      <span>{formatTime(order.created_at)}</span>
                      <span>•</span>
                      <span>{order.uploaded_by || '-'}</span>
                    </div>
                    {order.site_name && (
                      <div className="order-site">
                        📍 {order.site_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {zoomedImage && (
        <div className="image-zoom-modal" onClick={() => setZoomedImage(null)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-close" onClick={() => setZoomedImage(null)}>✕</button>
            <img src={zoomedImage} alt="확대 이미지" />
          </div>
        </div>
      )}

      <style>{`
        .calendar-page {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .calendar-header {
          margin-bottom: 40px;
        }

        .calendar-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #000;
          margin: 0 0 8px 0;
        }

        .subtitle {
          color: #666;
          font-size: 15px;
          margin: 0;
        }

        /* ===== 달력 컨트롤 ===== */
        .calendar-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .current-month {
          font-size: 24px;
          font-weight: 700;
          color: #000;
          margin: 0 20px;
          min-width: 180px;
          text-align: center;
        }

        .btn-control, .btn-today {
          padding: 10px 20px;
          background: #ffffff;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-control:hover, .btn-today:hover {
          background: #f5f5f5;
          border-color: #999;
        }

        .btn-today {
          background: #000;
          color: #ffffff;
          border-color: #000;
        }

        .btn-today:hover {
          background: #333;
        }

        /* ===== 달력 ===== */
        .calendar-container {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          margin-bottom: 40px;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .calendar-day-header {
          text-align: center;
          padding: 16px 8px;
          font-weight: 700;
          font-size: 14px;
          color: #666;
          background: #f8f8f8;
        }

        .calendar-day-header.sunday {
          color: #ef4444;
        }

        .calendar-day-header.saturday {
          color: #3b82f6;
        }

        .calendar-date {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: #ffffff;
          border: 1px solid #f0f0f0;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          min-height: 100px;
        }

        .calendar-date.empty {
          background: #fafafa;
          cursor: default;
        }

        .calendar-date:not(.empty):hover {
          background: #f8f8f8;
          border-color: #ddd;
        }

        .calendar-date.today {
          background: #fff7ed;
          border: 2px solid #f59e0b;
        }

        .calendar-date.selected {
          background: #000;
          border-color: #000;
        }

        .calendar-date.selected .date-number {
          color: #ffffff;
        }

        .calendar-date.sunday .date-number {
          color: #ef4444;
        }

        .calendar-date.saturday .date-number {
          color: #3b82f6;
        }

        .calendar-date.has-orders {
          font-weight: 700;
        }

        .date-number {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .date-badge {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: #000;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 12px;
          min-width: 24px;
          text-align: center;
        }

        .calendar-date.selected .date-badge {
          background: #ffffff;
          color: #000;
        }

        /* ===== 선택된 날짜 섹션 ===== */
        .selected-date-section {
          margin-top: 40px;
        }

        .selected-date-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #000;
        }

        .empty-orders {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .order-card {
          background: #ffffff;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
          cursor: default;
        }

        .order-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-color: #999;
        }

        .order-image {
          width: 100%;
          aspect-ratio: 210 / 297;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          background: #f5f5f5;
        }

        .order-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s;
        }

        .order-image:hover img {
          transform: scale(1.05);
        }

        .order-client-badge {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0,0,0,0.85);
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 600;
        }

        .order-info {
          padding: 16px;
        }

        .order-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .order-site {
          color: #000;
          font-size: 14px;
          font-weight: 600;
        }

        /* ===== 이미지 확대 모달 ===== */
        .image-zoom-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .zoom-modal-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .zoom-modal-content img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .zoom-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          background: rgba(0,0,0,0.8);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10001;
        }

        .zoom-close:hover {
          background: rgba(0,0,0,1);
        }

        /* ===== 반응형 ===== */
        @media (max-width: 768px) {
          .calendar-page {
            padding: 20px;
          }

          .calendar-controls {
            flex-wrap: wrap;
            gap: 10px;
          }

          .current-month {
            font-size: 20px;
            margin: 0;
          }

          .calendar-date {
            min-height: 70px;
            padding: 8px;
          }

          .date-number {
            font-size: 14px;
          }

          .orders-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
