/**
 * ========================================
 * WebSocket Hook
 * ========================================
 * 파일: src/hooks/useWebSocket.js
 * 설명: Socket.IO 클라이언트 연결 및 실시간 알림 수신
 * ========================================
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.doorlife.synology.me';

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('🔌 WebSocket 연결 시작:', SOCKET_URL);

    // Socket.IO 클라이언트 생성
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = newSocket;

    // 연결 성공
    newSocket.on('connect', () => {
      console.log('✅ WebSocket 연결됨:', newSocket.id);
      setConnected(true);
    });

    // 연결 끊김
    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket 연결 해제:', reason);
      setConnected(false);
    });

    // 재연결 시도
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 WebSocket 재연결 시도 (${attemptNumber}회)...`);
    });

    // 재연결 성공
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ WebSocket 재연결 성공 (${attemptNumber}회 시도 후)`);
      setConnected(true);
    });

    // 연결 오류
    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket 연결 오류:', error.message);
      setConnected(false);
    });

    // 실시간 알림 수신
    newSocket.on('notification', (data) => {
      console.log('🔔 실시간 알림 수신:', data);
      
      // 알림 목록에 추가
      setNotifications(prev => [{
        ...data,
        id: Date.now(),
        received: new Date().toISOString()
      }, ...prev]);

      // 브라우저 알림 표시
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: data.type
        });
      }
    });

    setSocket(newSocket);

    // 정리 함수
    return () => {
      console.log('🔌 WebSocket 연결 종료');
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  // 사용자 등록 (옵션)
  const registerUser = useCallback((userId, userName) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('register', { userId, userName });
      console.log('📝 사용자 등록:', userName);
    }
  }, []);

  // 알림 제거
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // 모든 알림 제거
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    socket,
    connected,
    notifications,
    registerUser,
    removeNotification,
    clearNotifications
  };
};
