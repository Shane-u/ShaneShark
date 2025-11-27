package com.shaneShark.manager;

import com.shaneShark.config.DoubaoConfig;
import com.shaneShark.exception.BusinessException;
import com.shaneShark.common.ErrorCode;
import com.shaneShark.model.dto.chat.ChatRequest;
import com.shaneShark.model.dto.chat.ChatResponse;
import com.shaneShark.model.dto.chat.StreamChatResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.function.Consumer;

/**
 * 火山引擎Doubao AI管理器
 * 负责与火山引擎API进行通信，支持流式和非流式两种模式，支持多模态输入
 *
 * @author Shane
 */
@Component
@Slf4j
public class DoubaoManager {

    @Resource
    private DoubaoConfig doubaoConfig;

    @Resource(name = "doubaoOkHttpClient")
    private OkHttpClient okHttpClient;

    private final ObjectMapper objectMapper;

    /**
     * 构造函数，初始化 ObjectMapper
     */
    public DoubaoManager() {
        this.objectMapper = new ObjectMapper();
        // 配置 ObjectMapper 忽略未知属性
        this.objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * 发送非流式聊天请求
     *
     * @param chatRequest 聊天请求对象
     * @return 聊天响应对象
     * @throws BusinessException 当请求失败时抛出
     */
    public ChatResponse chat(ChatRequest chatRequest) {
        try {
            // 确保使用非流式模式
            chatRequest.setStream(false);

            // 如果没有指定模型，使用配置中的默认模型
            if (chatRequest.getModel() == null || chatRequest.getModel().trim().isEmpty()) {
                chatRequest.setModel(doubaoConfig.getModel());
            }

            // 构建请求体
            String requestBody = objectMapper.writeValueAsString(chatRequest);
            log.debug("发送Doubao聊天请求: {}", requestBody);

            // 构建HTTP请求
            Request request = buildRequest(requestBody, false);

            // 执行请求
            try (Response response = okHttpClient.newCall(request).execute()) {
                ResponseBody responseBody = response.body();
                if (responseBody == null) {
                    throw new BusinessException(ErrorCode.SYSTEM_ERROR, "响应体为空");
                }

                String responseText = responseBody.string();
                log.debug("收到Doubao响应: {}", responseText);

                if (!response.isSuccessful()) {
                    log.error("Doubao API请求失败，状态码: {}, 响应: {}", response.code(), responseText);
                    throw new BusinessException(ErrorCode.SYSTEM_ERROR, "AI服务请求失败: " + responseText);
                }

                // 解析响应
                return objectMapper.readValue(responseText, ChatResponse.class);
            }
        } catch (IOException e) {
            log.error("调用火山引擎Doubao API失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "AI服务调用异常: " + e.getMessage());
        }
    }

    /**
     * 发送流式聊天请求
     *
     * @param chatRequest 聊天请求对象
     * @param onChunk 每收到一个数据块时的回调函数
     * @throws BusinessException 当请求失败时抛出
     */
    public void streamChat(ChatRequest chatRequest, Consumer<StreamChatResponse> onChunk) {
        try {
            // 确保使用流式模式
            chatRequest.setStream(true);

            // 如果没有指定模型，使用配置中的默认模型
            if (chatRequest.getModel() == null || chatRequest.getModel().trim().isEmpty()) {
                chatRequest.setModel(doubaoConfig.getModel());
            }

            // 构建请求体
            String requestBody = objectMapper.writeValueAsString(chatRequest);
            log.debug("发送Doubao流式聊天请求: {}", requestBody);

            // 构建HTTP请求
            Request request = buildRequest(requestBody, true);

            // 执行请求
            try (Response response = okHttpClient.newCall(request).execute()) {
                ResponseBody responseBody = response.body();
                if (responseBody == null) {
                    throw new BusinessException(ErrorCode.SYSTEM_ERROR, "响应体为空");
                }

                if (!response.isSuccessful()) {
                    String errorText = responseBody.string();
                    log.error("Doubao API请求失败，状态码: {}, 响应: {}", response.code(), errorText);
                    throw new BusinessException(ErrorCode.SYSTEM_ERROR, "AI服务请求失败: " + errorText);
                }

                // 读取流式响应
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(responseBody.byteStream(), StandardCharsets.UTF_8))) {
                    String line;
                    StringBuilder dataBuffer = new StringBuilder();

                    while ((line = reader.readLine()) != null) {
                        // SSE格式: data: {...}\n\n
                        if (line.startsWith("data: ")) {
                            String data = line.substring(6); // 去掉 "data: " 前缀

                            // 检查是否是结束标记
                            if ("[DONE]".equals(data.trim())) {
                                log.debug("Doubao流式响应结束");
                                break;
                            }

                            // 解析JSON数据
                            try {
                                StreamChatResponse streamResponse = objectMapper.readValue(
                                        data, StreamChatResponse.class);
                                onChunk.accept(streamResponse);
                            } catch (Exception e) {
                                log.warn("解析Doubao流式响应数据失败: {}", data, e);
                            }
                        } else if (line.trim().isEmpty()) {
                            continue;
                        } else {
                            dataBuffer.append(line);
                        }
                    }
                }
            }
        } catch (IOException e) {
            log.error("调用火山引擎Doubao API失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "AI服务调用异常: " + e.getMessage());
        }
    }

    /**
     * 构建HTTP请求对象
     *
     * @param requestBody 请求体JSON字符串
     * @param isStream 是否为流式请求
     * @return Request对象
     */
    private Request buildRequest(String requestBody, boolean isStream) {
        // 构建URL
        String url = doubaoConfig.getBaseUrl() + "/chat/completions";

        // 构建请求体
        RequestBody body = RequestBody.create(
                requestBody,
                MediaType.get("application/json; charset=utf-8")
        );

        // 构建请求
        return new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("Authorization", "Bearer " + doubaoConfig.getApiKey())
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", isStream ? "text/event-stream" : "application/json")
                .build();
    }
}

