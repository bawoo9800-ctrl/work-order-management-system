/**
 * ========================================
 * Statistics Controller
 * ========================================
 * 파일: src/controllers/stats.controller.js
 * 설명: 통계 API
 * ========================================
 */

import db from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 월별 작업지시서 전송량
 * GET /api/v1/stats/monthly
 */
export const getMonthlyStats = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const query = `
      SELECT 
        YEAR(created_at) as year,
        MONTH(created_at) as month,
        COUNT(*) as count
      FROM work_orders
      WHERE YEAR(created_at) = ?
        AND status != 'deleted'
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY month ASC
    `;

    const [results] = await db.execute(query, [targetYear]);

    // 12개월 데이터로 채우기 (데이터 없는 월은 0)
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      year: parseInt(targetYear),
      month: i + 1,
      count: 0,
    }));

    results.forEach((row) => {
      const index = row.month - 1;
      monthlyData[index].count = row.count;
    });

    logger.info('월별 통계 조회', { year: targetYear, total: results.length });

    res.json({
      success: true,
      data: {
        year: targetYear,
        monthly: monthlyData,
        total: monthlyData.reduce((sum, m) => sum + m.count, 0),
      },
    });
  } catch (error) {
    logger.error('월별 통계 조회 실패', { error: error.message });
    res.status(500).json({
      success: false,
      message: '월별 통계를 불러오는 데 실패했습니다.',
      error: error.message,
    });
  }
};

/**
 * 전송자별 작업지시서 전송량
 * GET /api/v1/stats/by-uploader
 */
export const getStatsByUploader = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        uploaded_by,
        COUNT(*) as count
      FROM work_orders
      WHERE status != 'deleted'
        AND uploaded_by IS NOT NULL
        AND uploaded_by != ''
    `;

    const params = [];

    if (startDate) {
      query += ' AND DATE(created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(created_at) <= ?';
      params.push(endDate);
    }

    query += `
      GROUP BY uploaded_by
      ORDER BY count DESC
    `;

    const [results] = await db.execute(query, params);

    logger.info('전송자별 통계 조회', {
      startDate,
      endDate,
      total: results.length,
    });

    res.json({
      success: true,
      data: {
        uploaders: results,
        total: results.reduce((sum, u) => sum + u.count, 0),
      },
    });
  } catch (error) {
    logger.error('전송자별 통계 조회 실패', { error: error.message });
    res.status(500).json({
      success: false,
      message: '전송자별 통계를 불러오는 데 실패했습니다.',
      error: error.message,
    });
  }
};

/**
 * 거래처별 작업지시서 전송량
 * GET /api/v1/stats/by-client
 */
export const getStatsByClient = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        COALESCE(wo.client_name, c.name, '거래처 미지정') as client_name,
        COUNT(*) as count
      FROM work_orders wo
      LEFT JOIN clients c ON wo.client_id = c.id
      WHERE wo.status != 'deleted'
    `;

    const params = [];

    if (startDate) {
      query += ' AND DATE(wo.created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(wo.created_at) <= ?';
      params.push(endDate);
    }

    query += `
      GROUP BY client_name
      ORDER BY count DESC
    `;

    const [results] = await db.execute(query, params);

    logger.info('거래처별 통계 조회', {
      startDate,
      endDate,
      total: results.length,
    });

    res.json({
      success: true,
      data: {
        clients: results,
        total: results.reduce((sum, c) => sum + c.count, 0),
      },
    });
  } catch (error) {
    logger.error('거래처별 통계 조회 실패', { error: error.message });
    res.status(500).json({
      success: false,
      message: '거래처별 통계를 불러오는 데 실패했습니다.',
      error: error.message,
    });
  }
};

/**
 * 작업 유형별 통계
 * GET /api/v1/stats/by-work-type
 */
export const getStatsByWorkType = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        COALESCE(work_type, '미지정') as work_type,
        COUNT(*) as count
      FROM work_orders
      WHERE status != 'deleted'
    `;

    const params = [];

    if (startDate) {
      query += ' AND DATE(created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(created_at) <= ?';
      params.push(endDate);
    }

    query += `
      GROUP BY work_type
      ORDER BY count DESC
    `;

    const [results] = await db.execute(query, params);

    logger.info('작업 유형별 통계 조회', {
      startDate,
      endDate,
      total: results.length,
    });

    res.json({
      success: true,
      data: {
        workTypes: results,
        total: results.reduce((sum, w) => sum + w.count, 0),
      },
    });
  } catch (error) {
    logger.error('작업 유형별 통계 조회 실패', { error: error.message });
    res.status(500).json({
      success: false,
      message: '작업 유형별 통계를 불러오는 데 실패했습니다.',
      error: error.message,
    });
  }
};
