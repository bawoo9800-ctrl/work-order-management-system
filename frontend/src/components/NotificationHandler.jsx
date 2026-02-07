/**
 * ========================================
 * 알림 컴포넌트
 * ========================================
 * 파일: src/components/NotificationHandler.jsx
 * 설명: Firebase 알림 초기화 및 처리
 * ========================================
 */

import { useEffect, useState } from 'react';
import { requestNotificationPermission, onMessageListener } from '../config/firebase';
import { notificationAPI } from '../services/api';

const NotificationHandler = () => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // VAPID 키 (Firebase Console → 프로젝트 설정 → Cloud Messaging → 웹 푸시 인증서)
      // ⚠️ 나중에 실제 VAPID 키로 교체해야 합니다!
      const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE';

      if (VAPID_KEY === 'YOUR_VAPID_KEY_HERE') {
        console.warn('⚠️ VAPID key not configured. Please add it to .env file.');
        return;
      }

      // FCM 토큰 요청
      const token = await requestNotificationPermission(VAPID_KEY);

      if (token) {
        console.log('✅ FCM Token obtained:', token);

        // 토큰을 백엔드에 저장
        try {
          await notificationAPI.registerToken(token);
          console.log('✅ Token registered to backend');
        } catch (error) {
          console.error('❌ Failed to register token:', error);
        }

        // 포그라운드 메시지 리스너 설정
        const unsubscribe = onMessageListener((payload) => {
          console.log('📬 Foreground message received:', payload);

          // 알림 표시
          setNotification({
            title: payload.notification?.title || '새 알림',
            body: payload.notification?.body || '',
            data: payload.data,
          });

          // 브라우저 알림 표시
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || '새 알림', {
              body: payload.notification?.body || '',
              icon: '/logo192.png',
              badge: '/logo192.png',
              tag: payload.data?.type || 'default',
            });
          }

          // 5초 후 알림 제거
          setTimeout(() => setNotification(null), 5000);
        });

        // 컴포넌트 언마운트 시 리스너 해제
        return () => {
          if (unsubscribe) unsubscribe();
        };
      }
    } catch (error) {
      console.error('❌ Notification initialization error:', error);
    }
  };

  // 인앱 알림 표시 (선택사항)
  if (notification) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          minWidth: '300px',
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
              {notification.title}
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              {notification.body}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#999',
              marginLeft: '12px',
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default NotificationHandler;
