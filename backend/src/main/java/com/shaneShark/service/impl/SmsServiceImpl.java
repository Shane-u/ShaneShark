package com.shaneShark.service.impl;

import com.shaneShark.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * 短信服务实现（使用OkHttp调用第三方短信服务）
 */
@Service
@Slf4j
public class SmsServiceImpl implements SmsService {

    private static final String SMS_URL = "https://push.spug.cc/send/RNAXprQVy08JQ0ew";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    private final OkHttpClient client;

    public SmsServiceImpl() {
        this.client = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    @Override
    public void sendSms(String phone, String code) {
        try {
            // 构建请求体
            String jsonBody = String.format("{\"name\":\"数字大学生平台\",\"code\":\"%s\",\"targets\":\"%s\"}", code, phone);
            RequestBody body = RequestBody.create(jsonBody, JSON);
            
            // 构建请求
            Request request = new Request.Builder()
                    .url(SMS_URL)
                    .post(body)
                    .addHeader("Content-Type", "application/json")
                    .build();
            
            log.info("发送短信请求：手机号={}, 验证码={}", phone, code);
            
            // 发送请求
            try (Response response = client.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    String responseBody = response.body() != null ? response.body().string() : "";
                    log.info("短信发送成功，手机号：{}，响应：{}", phone, responseBody);
                } else {
                    String errorBody = response.body() != null ? response.body().string() : "";
                    log.error("短信发送失败，手机号：{}，状态码：{}，错误信息：{}", phone, response.code(), errorBody);
                    throw new RuntimeException("短信发送失败，状态码：" + response.code());
                }
            }
            
        } catch (IOException e) {
            log.error("短信发送异常，手机号：{}，错误：{}", phone, e.getMessage(), e);
            throw new RuntimeException("短信发送失败：" + e.getMessage());
        } catch (Exception e) {
            log.error("短信发送失败，手机号：{}，错误：{}", phone, e.getMessage(), e);
            throw new RuntimeException("短信发送失败");
        }
    }
}
