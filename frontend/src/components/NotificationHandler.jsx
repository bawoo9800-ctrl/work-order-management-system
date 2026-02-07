/**
 * ========================================
 * 실시간 알림 컴포넌트
 * ========================================
 * 파일: src/components/NotificationHandler.jsx
 * 설명: WebSocket 실시간 알림 처리 및 표시
 * ========================================
 */

import { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const NotificationHandler = () => {
  const { connected, notifications, removeNotification } = useWebSocket();

  useEffect(() => {
    // 브라우저 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('✅ 브라우저 알림 권한 승인됨');
        } else {
          console.log('❌ 브라우저 알림 권한 거부됨');
        }
      });
    }
  }, []);

  // 연결 상태 표시
  useEffect(() => {
    if (connected) {
      console.log('✅ WebSocket 연결: 실시간 알림 활성화');
    } else {
      console.log('🔕 WebSocket 연결 해제: 실시간 알림 비활성화');
    }
  }, [connected]);

  // 알림 UI 렌더링
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px'
    }}>
      {/* WebSocket 연결 상태 (개발 모드에서만 표시) */}
      {import.meta.env.DEV && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '4px',
          background: connected ? '#4caf50' : '#ff9800',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {connected ? '🔌 실시간 알림 활성화' : '🔕 연결 중...'}
        </div>
      )}

      {/* 알림 목록 */}
      {notifications.slice(0, 3).map(notification => (
        <div
          key={notification.id}
          style={{
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            animation: 'slideInRight 0.3s ease',
            minWidth: '300px',
            cursor: 'pointer'
          }}
          onClick={() => removeNotification(notification.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                {notification.title}
              </h4>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.5'
              }}>
                {notification.body}
              </p>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: '#999'
              }}>
                {new Date(notification.timestamp).toLocaleTimeString('ko-KR')}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#999',
                marginLeft: '12px',
                padding: '0',
                lineHeight: '1'
              }}
              title="닫기"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {/* 애니메이션 스타일 */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationHandler;
