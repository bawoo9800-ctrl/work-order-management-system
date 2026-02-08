/**
 * ========================================
 * Firebase 설정
 * ========================================
 * 파일: src/config/firebase.js
 * 설명: Firebase 초기화 및 Cloud Messaging 설정
 * ========================================
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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
const app = initializeApp(firebaseConfig);

// Cloud Messaging 초기화
let messaging = null;

try {
  // Service Worker가 지원되는 경우에만 초기화
  if ('serviceWorker' in navigator) {
    messaging = getMessaging(app);
  } else {
    console.warn('Service Worker not supported. Push notifications disabled.');
  }
} catch (error) {
  console.error('Firebase messaging initialization error:', error);
}

/**
 * FCM 토큰 가져오기
 * @param {string} vapidKey - VAPID 키
 * @returns {Promise<string|null>}
 */
export const requestNotificationPermission = async (vapidKey) => {
  if (!messaging) {
    console.warn('Firebase messaging not initialized');
    return null;
  }

  // iOS Safari에서 Notification API 미지원 체크
  if (typeof Notification === 'undefined') {
    console.warn('⚠️ Notification API not supported (iOS Safari)');
    return null;
  }

  try {
    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      // FCM 토큰 가져오기
      const token = await getToken(messaging, { vapidKey });
      
      if (token) {
        console.log('📱 FCM Token:', token);
        return token;
      } else {
        console.warn('No registration token available');
        return null;
      }
    } else {
      console.warn('⚠️ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
    return null;
  }
};

/**
 * 포그라운드 메시지 리스너 설정
 * @param {function} callback - 메시지 수신 콜백
 */
export const onMessageListener = (callback) => {
  if (!messaging) {
    console.warn('Firebase messaging not initialized');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('📬 Message received:', payload);
    callback(payload);
  });
};

export { app, messaging };
