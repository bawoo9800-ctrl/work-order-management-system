package com.doorlife.pocamera

import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.rememberAsyncImagePainter
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    // 상태
    var selectedImages by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var vendorName by remember { mutableStateOf("") }
    var siteName by remember { mutableStateOf("") }
    var memo by remember { mutableStateOf("") }
    var uploadedBy by remember { 
        mutableStateOf(
            context.getSharedPreferences("settings", Context.MODE_PRIVATE)
                .getString("uploadedBy", "") ?: ""
        )
    }
    var isUploading by remember { mutableStateOf(false) }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    // 오늘 날짜 (YYYY-MM-DD)
    val today = remember {
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }
    
    // 갤러리에서 이미지 선택
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        if (uris.isNotEmpty()) {
            selectedImages = uris
        }
    }
    
    // 카메라로 촬영
    var tempPhotoUri by remember { mutableStateOf<Uri?>(null) }
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success && tempPhotoUri != null) {
            selectedImages = selectedImages + tempPhotoUri!!
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("📦 발주서 촬영") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // 이미지 선택 영역
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "📸 사진 (${selectedImages.size}장)",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    // 선택된 이미지 미리보기
                    if (selectedImages.isNotEmpty()) {
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.padding(bottom = 12.dp)
                        ) {
                            items(selectedImages) { uri ->
                                Box {
                                    Image(
                                        painter = rememberAsyncImagePainter(uri),
                                        contentDescription = "선택된 이미지",
                                        modifier = Modifier
                                            .size(100.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .border(
                                                1.dp,
                                                MaterialTheme.colorScheme.outline,
                                                RoundedCornerShape(8.dp)
                                            ),
                                        contentScale = ContentScale.Crop
                                    )
                                    
                                    // 삭제 버튼
                                    IconButton(
                                        onClick = {
                                            selectedImages = selectedImages.filter { it != uri }
                                        },
                                        modifier = Modifier
                                            .align(Alignment.TopEnd)
                                            .size(32.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Close,
                                            contentDescription = "삭제",
                                            tint = Color.White,
                                            modifier = Modifier
                                                .size(24.dp)
                                                .padding(4.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                    
                    // 버튼 행
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        // 카메라 버튼
                        Button(
                            onClick = {
                                tempPhotoUri = createImageFile(context)
                                tempPhotoUri?.let { cameraLauncher.launch(it) }
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.CameraAlt, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("촬영")
                        }
                        
                        // 갤러리 버튼
                        OutlinedButton(
                            onClick = { imagePickerLauncher.launch("image/*") },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Photo, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("갤러리")
                        }
                    }
                }
            }
            
            // 입력 필드들
            OutlinedTextField(
                value = vendorName,
                onValueChange = { vendorName = it },
                label = { Text("발주처명") },
                placeholder = { Text("예: 케이씨씨창호유리(주)") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )
            
            OutlinedTextField(
                value = siteName,
                onValueChange = { siteName = it },
                label = { Text("현장명") },
                placeholder = { Text("예: 강원도-북삼청소년센터") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )
            
            OutlinedTextField(
                value = memo,
                onValueChange = { memo = it },
                label = { Text("메모") },
                placeholder = { Text("특이사항 (선택)") },
                minLines = 2,
                maxLines = 4,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )
            
            OutlinedTextField(
                value = uploadedBy,
                onValueChange = { uploadedBy = it },
                label = { Text("전송자명 *") },
                placeholder = { Text("예: 홍길동") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                isError = uploadedBy.isBlank()
            )
            
            // 업로드 버튼
            Button(
                onClick = {
                    scope.launch {
                        isUploading = true
                        errorMessage = null
                        
                        try {
                            val result = uploadPurchaseOrder(
                                context = context,
                                images = selectedImages,
                                vendorName = vendorName.ifBlank { null },
                                siteName = siteName.ifBlank { null },
                                orderDate = today,
                                memo = memo.ifBlank { null },
                                uploadedBy = uploadedBy
                            )
                            
                            if (result.success) {
                                // 전송자명 저장
                                context.getSharedPreferences("settings", Context.MODE_PRIVATE)
                                    .edit()
                                    .putString("uploadedBy", uploadedBy)
                                    .apply()
                                
                                showSuccessDialog = true
                                // 초기화
                                selectedImages = emptyList()
                                vendorName = ""
                                siteName = ""
                                memo = ""
                            } else {
                                errorMessage = result.error ?: "업로드 실패"
                            }
                        } catch (e: Exception) {
                            errorMessage = "오류: ${e.message}"
                        } finally {
                            isUploading = false
                        }
                    }
                },
                enabled = !isUploading && 
                         selectedImages.isNotEmpty() && 
                         uploadedBy.isNotBlank(),
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isUploading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White
                    )
                    Spacer(Modifier.width(8.dp))
                    Text("업로드 중...")
                } else {
                    Icon(Icons.Default.CloudUpload, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("업로드 (${selectedImages.size}장)")
                }
            }
            
            // 에러 메시지
            errorMessage?.let { error ->
                Spacer(Modifier.height(16.dp))
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Text(
                        text = "❌ $error",
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }
    }
    
    // 성공 다이얼로그
    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = { showSuccessDialog = false },
            title = { Text("✅ 업로드 완료") },
            text = { Text("발주서가 성공적으로 등록되었습니다.") },
            confirmButton = {
                TextButton(onClick = { showSuccessDialog = false }) {
                    Text("확인")
                }
            }
        )
    }
}

// 업로드 함수
suspend fun uploadPurchaseOrder(
    context: Context,
    images: List<Uri>,
    vendorName: String?,
    siteName: String?,
    orderDate: String,
    memo: String?,
    uploadedBy: String
): UploadResponse {
    val imageParts = images.mapIndexed { index, uri ->
        val file = uriToFile(context, uri, "image_$index.jpg")
        val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
        MultipartBody.Part.createFormData("images", file.name, requestFile)
    }
    
    return ApiClient.apiService.uploadPurchaseOrder(
        images = imageParts,
        vendorName = vendorName?.toRequestBody("text/plain".toMediaTypeOrNull()),
        siteName = siteName?.toRequestBody("text/plain".toMediaTypeOrNull()),
        orderDate = orderDate.toRequestBody("text/plain".toMediaTypeOrNull()),
        memo = memo?.toRequestBody("text/plain".toMediaTypeOrNull()),
        uploadedBy = uploadedBy.toRequestBody("text/plain".toMediaTypeOrNull())
    )
}

// Uri를 File로 변환
fun uriToFile(context: Context, uri: Uri, fileName: String): File {
    val inputStream = context.contentResolver.openInputStream(uri)
    val file = File(context.cacheDir, fileName)
    file.outputStream().use { outputStream ->
        inputStream?.copyTo(outputStream)
    }
    return file
}

// 임시 이미지 파일 생성
fun createImageFile(context: Context): Uri {
    val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
    val imageFileName = "JPEG_${timeStamp}_"
    val storageDir = context.getExternalFilesDir(android.os.Environment.DIRECTORY_PICTURES)
    val imageFile = File.createTempFile(imageFileName, ".jpg", storageDir)
    return androidx.core.content.FileProvider.getUriForFile(
        context,
        "${context.packageName}.fileprovider",
        imageFile
    )
}
