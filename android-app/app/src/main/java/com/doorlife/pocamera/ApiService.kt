package com.doorlife.pocamera

import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.RequestBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import java.util.concurrent.TimeUnit

/**
 * API 응답 데이터 클래스
 */
data class UploadResponse(
    val success: Boolean,
    val data: UploadData?,
    val error: String?
)

data class UploadData(
    val id: Int,
    val uuid: String,
    val originalFilename: String,
    val vendorName: String?,
    val siteName: String?,
    val orderDate: String?,
    val uploadedBy: String,
    val imageCount: Int,
    val processingTimeMs: Long
)

/**
 * Retrofit API 인터페이스
 */
interface ApiService {
    
    @Multipart
    @POST("/api/v1/purchase-orders/upload")
    suspend fun uploadPurchaseOrder(
        @Part images: List<MultipartBody.Part>,
        @Part("vendorName") vendorName: RequestBody?,
        @Part("siteName") siteName: RequestBody?,
        @Part("orderDate") orderDate: RequestBody?,
        @Part("memo") memo: RequestBody?,
        @Part("uploadedBy") uploadedBy: RequestBody
    ): UploadResponse
}

/**
 * API 클라이언트 싱글톤
 */
object ApiClient {
    
    private const val BASE_URL = "https://wo.doorlife.synology.me"
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    val apiService: ApiService = retrofit.create(ApiService::class.java)
}
