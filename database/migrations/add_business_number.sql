-- 거래처 테이블에 사업자코드 필드 추가
ALTER TABLE clients 
ADD COLUMN business_number VARCHAR(50) DEFAULT NULL COMMENT '사업자등록번호' AFTER code;

-- 인덱스 추가
CREATE INDEX idx_business_number ON clients(business_number);

-- code 필드 UNIQUE 제약 조건 제거 (중복 가능하도록)
ALTER TABLE clients 
DROP INDEX code;

-- 확인
DESCRIBE clients;
