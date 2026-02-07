/**
 * ========================================
 * Firebase Cloud Messaging Service Worker
 * ========================================
 * 파일: public/firebase-messaging-sw.js
 * 설명: 백그라운드 푸시 알림 처리
 * ========================================
 */

// Firebase 스크립트 임포트
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 구성
const firebaseConfig = {
  apiKey: "AIzaSyA8mVc-X-letTCFyqL8uV6Mbx0tJQvEVN8",
  authDomain: "work-order-managemen.firebaseapp.com",
  projectId: "work-order-managemen",
  storageBucket: "work-order-managemen.firebasestorage.app",
  messagingSenderId: "424153252412",
  appId: "1:424153252412:web:1b254cbdf975ab24c3b939",
  measurementId: "G-Y3FLYSNSLB"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Messaging 인스턴스 가져오기
const messaging = firebase.messaging();

// 백그라운드 메시지 수신
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || '새 알림';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: true, // 사용자가 클릭할 때까지 유지
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  // 클릭 시 앱 열기
  const clickAction = event.notification.data?.click_action || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(clickAction);
          return;
        }
      }
      
      // 열려있는 창이 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
