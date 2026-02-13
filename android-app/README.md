# 📱 발주서 촬영 앱 (Purchase Order Camera)

## 🎯 기능
- ✅ 카메라로 발주서 촬영
- ✅ 갤러리에서 이미지 선택
- ✅ 다중 이미지 업로드 (최대 5장)
- ✅ 발주처명, 현장명, 메모 입력
- ✅ 전송자명 자동 저장
- ✅ 서버 업로드 (`https://wo.doorlife.synology.me`)

## 🛠️ 기술 스택
- **언어**: Kotlin
- **UI**: Jetpack Compose
- **카메라**: CameraX
- **네트워크**: Retrofit + OkHttp
- **최소 SDK**: 24 (Android 7.0)
- **타겟 SDK**: 34 (Android 14)

## 📦 빌드 방법

### 1. Android Studio에서 빌드

#### 필수 사항
- Android Studio Hedgehog (2023.1.1) 이상
- JDK 17
- Android SDK 34

#### 단계
1. Android Studio 실행
2. `File` → `Open` → `PurchaseOrderCamera` 폴더 선택
3. Gradle Sync 완료 대기 (5-10분)
4. 상단 메뉴에서 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
5. 빌드 완료 후 `app/build/outputs/apk/debug/app-debug.apk` 생성

### 2. 명령줄에서 빌드

```bash
cd PurchaseOrderCamera

# Gradle Wrapper 실행 권한 부여 (Linux/Mac)
chmod +x gradlew

# Debug APK 빌드
./gradlew assembleDebug

# Release APK 빌드 (서명 필요)
./gradlew assembleRelease

# 빌드 결과
# Debug: app/build/outputs/apk/debug/app-debug.apk
# Release: app/build/outputs/apk/release/app-release-unsigned.apk
```

### 3. APK 설치

#### USB 연결
```bash
# USB 디버깅 활성화된 기기 연결
adb install app/build/outputs/apk/debug/app-debug.apk
```

#### 직접 설치
1. APK 파일을 스마트폰으로 전송
2. 파일 매니저에서 APK 클릭
3. "출처를 알 수 없는 앱 설치" 허용
4. 설치 진행

## 🚀 사용 방법

### 첫 실행
1. 앱 실행
2. 카메라 권한 허용
3. 전송자명 입력 (저장됨)

### 발주서 촬영
1. 📷 **촬영** 버튼 클릭 → 카메라 실행 → 발주서 촬영
2. 🖼️ **갤러리** 버튼 클릭 → 기존 사진 선택
3. 여러 장 추가 가능 (최대 5장)
4. ❌ 버튼으로 사진 삭제 가능

### 정보 입력
- **발주처명**: 예) 케이씨씨창호유리(주)
- **현장명**: 예) 강원도-북삼청소년센터
- **메모**: 특이사항 (선택)
- **전송자명**: 필수 (자동 저장)

### 업로드
1. 모든 정보 입력 완료
2. **업로드** 버튼 클릭
3. 업로드 중 표시
4. ✅ 완료 알림

## 📝 권한

앱에서 요청하는 권한:

- **CAMERA**: 발주서 촬영
- **INTERNET**: 서버 업로드
- **READ_MEDIA_IMAGES**: 갤러리 접근 (Android 13+)
- **READ_EXTERNAL_STORAGE**: 갤러리 접근 (Android 12 이하)

## 🔧 설정

### 서버 URL 변경
`app/src/main/java/com/doorlife/pocamera/ApiService.kt` 파일에서:

```kotlin
private const val BASE_URL = "https://wo.doorlife.synology.me"
```

원하는 URL로 변경 후 다시 빌드

### 앱 이름 변경
`app/src/main/AndroidManifest.xml` 파일에서:

```xml
android:label="발주서 촬영"
```

원하는 이름으로 변경

## 🐛 트러블슈팅

### Gradle Sync 실패
```bash
# Gradle Wrapper 다시 다운로드
./gradlew wrapper --gradle-version 8.2
```

### 빌드 오류 (JDK 버전)
```bash
# JDK 17 설치 확인
java -version

# Android Studio에서 JDK 17 설정:
# File → Project Structure → SDK Location → JDK location
```

### APK 설치 실패
- "출처를 알 수 없는 앱" 설치 허용
- USB 디버깅 활성화 (개발자 옵션)
- 기존 앱 삭제 후 재설치

### 카메라 권한 거부
- 설정 → 앱 → 발주서 촬영 → 권한 → 카메라 허용

### 업로드 실패
- 인터넷 연결 확인
- 서버 URL 확인 (`https://wo.doorlife.synology.me`)
- 서버 상태 확인

## 📊 API 엔드포인트

**POST** `/api/v1/purchase-orders/upload`

**요청**:
- `images[]`: 이미지 파일들 (multipart/form-data)
- `vendorName`: 발주처명 (선택)
- `siteName`: 현장명 (선택)
- `orderDate`: 발주일 (자동: 오늘)
- `memo`: 메모 (선택)
- `uploadedBy`: 전송자명 (필수)

**응답**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "uuid": "...",
    "imageCount": 3,
    "uploadedBy": "홍길동"
  }
}
```

## 📱 테스트 환경

- ✅ Android 7.0 (API 24)
- ✅ Android 8.0 (API 26)
- ✅ Android 9.0 (API 28)
- ✅ Android 10 (API 29)
- ✅ Android 11 (API 30)
- ✅ Android 12 (API 31)
- ✅ Android 13 (API 33)
- ✅ Android 14 (API 34)

## 📄 라이선스

MIT License

## 👨‍💻 개발자

DoorLife Work Order Management System
