package com.shaneShark.manager;

import com.shaneShark.config.KimiConfig;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.output.Response;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 火山引擎Kimi大模型ChatLanguageModel实现
 * 使用langchain4j框架接入Kimi大模型
 *
 * @author Shane
 */
@Component
@Slf4j
public class KimiChatModel implements ChatLanguageModel {

    @Resource
    private KimiConfig kimiConfig;

    @Resource(name = "kimiOkHttpClient")
    private OkHttpClient okHttpClient;

    private static final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    static {
        objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages) {
        try {
            // 构建请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", kimiConfig.getModel());
            requestBody.put("stream", false);
            
            // 转换消息格式
            List<Map<String, Object>> apiMessages = convertMessages(messages);
            requestBody.put("messages", apiMessages);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);
            log.debug("发送Kimi请求: {}", requestBodyJson);

            // 构建HTTP请求
            Request request = new Request.Builder()
                    .url(kimiConfig.getBaseUrl() + "/chat/completions")
                    .post(RequestBody.create(
                            requestBodyJson,
                            MediaType.get("application/json; charset=utf-8")
                    ))
                    .addHeader("Authorization", "Bearer " + kimiConfig.getApiKey())
                    .addHeader("Content-Type", "application/json")
                    .build();

            // 执行请求
            try (okhttp3.Response response = okHttpClient.newCall(request).execute()) {
                ResponseBody responseBody = response.body();
                if (responseBody == null) {
                    throw new RuntimeException("响应体为空");
                }

                String responseText = responseBody.string();
                log.debug("收到Kimi响应: {}", responseText);

                if (!response.isSuccessful()) {
                    log.error("Kimi API请求失败，状态码: {}, 响应: {}", response.code(), responseText);
                    throw new RuntimeException("AI服务请求失败: " + responseText);
                }

                // 解析响应
                @SuppressWarnings("unchecked")
                Map<String, Object> responseMap = objectMapper.readValue(responseText, Map.class);
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    String content = (String) message.get("content");
                    
                    return Response.from(AiMessage.from(content));
                }
                
                throw new RuntimeException("响应中没有内容");
            }
        } catch (IOException e) {
            log.error("调用火山引擎Kimi API失败", e);
            throw new RuntimeException("AI服务调用异常: " + e.getMessage(), e);
        }
    }

    /**
     * 转换langchain4j消息格式为API格式
     */
    private List<Map<String, Object>> convertMessages(List<ChatMessage> messages) {
        List<Map<String, Object>> apiMessages = new ArrayList<>();
        
        for (ChatMessage message : messages) {
            Map<String, Object> apiMessage = new HashMap<>();
            
            if (message instanceof UserMessage) {
                apiMessage.put("role", "user");
                UserMessage userMessage = (UserMessage) message;
                
                // 处理多模态内容
                List<dev.langchain4j.data.message.Content> contents = userMessage.contents();
                if (contents != null && !contents.isEmpty()) {
                    List<Map<String, Object>> contentList = new ArrayList<>();
                    
                    for (dev.langchain4j.data.message.Content content : contents) {
                        if (content instanceof TextContent) {
                            Map<String, Object> textItem = new HashMap<>();
                            textItem.put("type", "text");
                            textItem.put("text", ((TextContent) content).text());
                            contentList.add(textItem);
                        } else if (content instanceof ImageContent) {
                            Map<String, Object> imageItem = new HashMap<>();
                            imageItem.put("type", "image_url");
                            Map<String, String> imageUrl = new HashMap<>();
                            ImageContent imageContent = (ImageContent) content;
                            String url = null;
                            try {
                                java.lang.reflect.Method urlMethod = ImageContent.class.getMethod("url");
                                url = (String) urlMethod.invoke(imageContent);
                            } catch (Exception e) {
                                try {
                                    java.lang.reflect.Method base64Method = ImageContent.class.getMethod("base64Data");
                                    String base64 = (String) base64Method.invoke(imageContent);
                                    if (base64 != null) {
                                        url = "data:image/jpeg;base64," + base64;
                                    }
                                } catch (Exception ex) {
                                    log.warn("无法获取ImageContent的URL", ex);
                                }
                            }
                            if (url != null) {
                                imageUrl.put("url", url);
                                imageItem.put("image_url", imageUrl);
                                contentList.add(imageItem);
                            }
                        }
                    }
                    
                    apiMessage.put("content", contentList);
                } else {
                    apiMessage.put("content", userMessage.singleText());
                }
            } else if (message instanceof AiMessage) {
                apiMessage.put("role", "assistant");
                apiMessage.put("content", ((AiMessage) message).text());
            } else if (message instanceof dev.langchain4j.data.message.SystemMessage) {
                apiMessage.put("role", "system");
                apiMessage.put("content", ((dev.langchain4j.data.message.SystemMessage) message).text());
            }
            
            apiMessages.add(apiMessage);
        }
        
        return apiMessages;
    }
}

