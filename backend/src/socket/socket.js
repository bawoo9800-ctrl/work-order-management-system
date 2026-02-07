/**
 * ========================================
 * Socket.IO 서버 설정
 * ========================================
 * 파일: src/socket/socket.js
 * 설명: WebSocket 실시간 통신 서버 설정
 * ========================================
 */

import { Server } from 'socket.io';
import logger from '../utils/logger.js';

let io = null;

/**
 * Socket.IO 서버 초기화
 * @param {Object} server - HTTP 서버 인스턴스
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'https://wo.doorlife.synology.me',
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    logger.info(`✅ WebSocket 클라이언트 연결: ${socket.id}`);

    // 클라이언트 정보 저장 (옵션)
    socket.on('register', (data) => {
      socket.userId = data.userId;
      socket.userName = data.userName;
      logger.info(`📝 사용자 등록: ${data.userName} (${socket.id})`);
    });

    // 연결 해제
    socket.on('disconnect', (reason) => {
      logger.info(`❌ WebSocket 클라이언트 연결 해제: ${socket.id} (이유: ${reason})`);
    });

    // 에러 처리
    socket.on('error', (error) => {
      logger.error(`❌ WebSocket 에러: ${error.message}`);
    });
  });

  logger.info('🚀 Socket.IO 서버가 시작되었습니다.');
  return io;
};

/**
 * Socket.IO 인스턴스 가져오기
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO가 초기화되지 않았습니다. initializeSocket()을 먼저 호출하세요.');
  }
  return io;
};

/**
 * 모든 클라이언트에게 알림 전송
 * @param {string} event - 이벤트 이름
 * @param {Object} data - 전송할 데이터
 */
const emitToAll = (event, data) => {
  if (!io) {
    logger.warn('Socket.IO가 초기화되지 않았습니다.');
    return;
  }
  io.emit(event, data);
  logger.info(`📡 [${event}] 알림 전송 (모든 클라이언트)`);
};

/**
 * 특정 사용자에게 알림 전송
 * @param {string} userId - 사용자 ID
 * @param {string} event - 이벤트 이름
 * @param {Object} data - 전송할 데이터
 */
const emitToUser = (userId, event, data) => {
  if (!io) {
    logger.warn('Socket.IO가 초기화되지 않았습니다.');
    return;
  }
  
  const sockets = Array.from(io.sockets.sockets.values());
  const userSocket = sockets.find(socket => socket.userId === userId);
  
  if (userSocket) {
    userSocket.emit(event, data);
    logger.info(`📡 [${event}] 알림 전송 (사용자: ${userId})`);
  } else {
    logger.warn(`사용자를 찾을 수 없습니다: ${userId}`);
  }
};

/**
 * 작업지시서 생성 알림
 * @param {Object} workOrder - 작업지시서 데이터
 */
const notifyWorkOrderCreated = (workOrder) => {
  emitToAll('notification', {
    type: 'work_order_created',
    title: '📋 새 작업지시서 등록',
    body: `${workOrder.client_name || '거래처 미지정'} - ${workOrder.uploaded_by || '작성자 미상'}`,
    data: {
      workOrderId: workOrder.id,
      clientName: workOrder.client_name,
      uploadedBy: workOrder.uploaded_by,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 작업지시서 수정 알림
 * @param {Object} workOrder - 작업지시서 데이터
 */
const notifyWorkOrderUpdated = (workOrder) => {
  emitToAll('notification', {
    type: 'work_order_updated',
    title: '✏️ 작업지시서 수정',
    body: `${workOrder.client_name || '거래처 미지정'} - 정보가 수정되었습니다.`,
    data: {
      workOrderId: workOrder.id,
      clientName: workOrder.client_name,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 작업지시서 삭제 알림
 * @param {Object} workOrder - 작업지시서 데이터
 */
const notifyWorkOrderDeleted = (workOrder) => {
  emitToAll('notification', {
    type: 'work_order_deleted',
    title: '🗑️ 작업지시서 삭제',
    body: `${workOrder.client_name || '거래처 미지정'} - 작업지시서가 삭제되었습니다.`,
    data: {
      workOrderId: workOrder.id,
      clientName: workOrder.client_name,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 연결된 클라이언트 수 가져오기
 */
const getConnectedClientsCount = () => {
  if (!io) return 0;
  return io.sockets.sockets.size;
};

export {
  initializeSocket,
  getIO,
  emitToAll,
  emitToUser,
  notifyWorkOrderCreated,
  notifyWorkOrderUpdated,
  notifyWorkOrderDeleted,
  getConnectedClientsCount
};
