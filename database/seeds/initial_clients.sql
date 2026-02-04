-- ========================================
-- 작업지시서 관리 시스템 - 초기 거래처 데이터
-- ========================================
-- 작성일: 2026-02-04
-- ========================================

USE work_order_management;

-- ========================================
-- 거래처 초기 데이터 삽입
-- ========================================

-- 1. 삼성전자
INSERT INTO clients (code, name, keywords, aliases, contact_info, priority, notes) VALUES (
    'SAMSUNG_ELEC',
    '삼성전자',
    JSON_ARRAY(
        '삼성', '삼성전자', 'Samsung', 'SAMSUNG', 'Samsung Electronics',
        '삼성전자주식회사', '삼성전자(주)', '(주)삼성전자'
    ),
    JSON_ARRAY(
        '삼성전자 주식회사',
        'Samsung Electronics Co., Ltd.',
        'SEC'
    ),
    JSON_OBJECT(
        'phone', '1588-3366',
        'website', 'https://www.samsung.com/sec/',
        'address', '경기도 수원시 영통구 삼성로 129'
    ),
    10,
    '국내 최대 전자제품 제조업체'
);

-- 2. LG화학
INSERT INTO clients (code, name, keywords, aliases, contact_info, priority, notes) VALUES (
    'LG_CHEM',
    'LG화학',
    JSON_ARRAY(
        'LG화학', 'LG', 'LG Chem', 'LGCHEM', 'LG CHEM',
        'LG화학주식회사', 'LG화학(주)', '(주)LG화학', 'LG케미컬'
    ),
    JSON_ARRAY(
        'LG화학 주식회사',
        'LG Chem, Ltd.',
        'LGC'
    ),
    JSON_OBJECT(
        'phone', '1544-7711',
        'website', 'https://www.lgchem.com/',
        'address', '서울특별시 영등포구 여의도동 20'
    ),
    20,
    '종합 화학 기업, 배터리 및 석유화학 제품 제조'
);

-- 3. 현대자동차
INSERT INTO clients (code, name, keywords, aliases, contact_info, priority, notes) VALUES (
    'HYUNDAI_MOTOR',
    '현대자동차',
    JSON_ARRAY(
        '현대', '현대자동차', 'Hyundai', 'HYUNDAI', 'Hyundai Motor',
        '현대자동차주식회사', '현대자동차(주)', '(주)현대자동차', '현대차'
    ),
    JSON_ARRAY(
        '현대자동차 주식회사',
        'Hyundai Motor Company',
        'HMC'
    ),
    JSON_OBJECT(
        'phone', '1899-6611',
        'website', 'https://www.hyundai.com/kr/ko',
        'address', '서울특별시 서초구 헌릉로 12'
    ),
    30,
    '국내 최대 자동차 제조업체'
);

-- 4. SK하이닉스
INSERT INTO clients (code, name, keywords, aliases, contact_info, priority, notes) VALUES (
    'SK_HYNIX',
    'SK하이닉스',
    JSON_ARRAY(
        'SK하이닉스', 'SK', 'SKhynix', 'SK Hynix', 'SKHYNIX',
        'SK하이닉스주식회사', 'SK하이닉스(주)', '(주)SK하이닉스', '하이닉스'
    ),
    JSON_ARRAY(
        'SK하이닉스 주식회사',
        'SK hynix Inc.',
        'SKH'
    ),
    JSON_OBJECT(
        'phone', '031-5185-4114',
        'website', 'https://www.skhynix.com/',
        'address', '경기도 이천시 부발읍 경충대로 2091'
    ),
    40,
    '반도체 메모리 제조 전문 기업'
);

-- 5. 포스코
INSERT INTO clients (code, name, keywords, aliases, contact_info, priority, notes) VALUES (
    'POSCO',
    '포스코',
    JSON_ARRAY(
        '포스코', 'POSCO', 'Posco', '포항제철', 'POHANG',
        '포스코주식회사', '포스코(주)', '(주)포스코'
    ),
    JSON_ARRAY(
        '포스코 주식회사',
        'POSCO Holdings Inc.',
        'POSCO'
    ),
    JSON_OBJECT(
        'phone', '1644-7300',
        'website', 'https://www.posco.co.kr/',
        'address', '경상북도 포항시 남구 동해안로 6261'
    ),
    50,
    '종합 철강 제조 기업'
);

-- ========================================
-- 초기 데이터 삽입 완료
-- ========================================

-- 삽입된 데이터 확인
SELECT 
    id,
    code,
    name,
    JSON_LENGTH(keywords) AS keyword_count,
    JSON_LENGTH(aliases) AS alias_count,
    is_active,
    priority,
    created_at
FROM clients
ORDER BY priority;
