package com.shaneShark.controller;

import com.shaneShark.common.BaseResponse;
import com.shaneShark.common.ResultUtils;
import com.shaneShark.model.dto.chat.ChatRequest;
import com.shaneShark.model.dto.chat.ChatSessionRequest;
import com.shaneShark.model.dto.chat.Message;
import com.shaneShark.model.entity.User;
import com.shaneShark.model.vo.ChatMessageVO;
import com.shaneShark.model.vo.ChatSessionVO;
import com.shaneShark.service.ChatService;
import com.shaneShark.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.Nullable;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

/**
 * 聊天控制器
 * 提供聊天功能的HTTP接口，支持流式和非流式两种模式
 *
 * @author Shane
 */
@RestController
@RequestMapping("/chat")
@Slf4j
public class ChatController {

    @Resource
    private ChatService chatService;

    @Resource
    private UserService userService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 流式聊天接口
     * 使用Server-Sent Events (SSE) 实现流式输出
     *
     * @param chatRequest 聊天请求对象
     * @return SseEmitter 用于发送流式数据
     */
    @PostMapping("/completions/stream")
    public SseEmitter streamChat(@RequestBody ChatRequest chatRequest) {
        // 确保使用流式模式
        chatRequest.setStream(true);

        // 创建SseEmitter，设置超时时间为5分钟
        SseEmitter emitter = new SseEmitter(300000L);

        // 执行流式聊天
        chatService.streamChat(chatRequest, streamResponse -> {
            try {
                // 构建SSE格式的数据
                String data = "data: " + objectMapper.writeValueAsString(streamResponse) + "\n\n";

                // 发送数据
                emitter.send(SseEmitter.event()
                        .data(data)
                        .name("message"));

                log.debug("发送流式数据块: {}", streamResponse.getDeltaContent());

                // 如果流结束，关闭连接
                if (streamResponse.isFinished()) {
                    // 发送结束标记
                    emitter.send(SseEmitter.event()
                            .data("data: [DONE]\n\n")
                            .name("done"));
                    emitter.complete();
                    log.debug("流式响应完成");
                }
            } catch (IOException e) {
                log.error("发送流式数据失败", e);
                emitter.completeWithError(e);
            }
        });

        // 设置错误处理和超时处理
        emitter.onError(throwable -> {
            log.error("SseEmitter发生错误", throwable);
            emitter.completeWithError(throwable);
        });

        emitter.onTimeout(() -> {
            log.warn("SseEmitter超时");
            emitter.complete();
        });

        emitter.onCompletion(() -> {
            log.debug("SseEmitter完成");
        });

        return emitter;
    }

    /**
     * 基于WebFlux的流式接口
     * 返回Flux<String>，由浏览器原生EventSource或任意支持SSE的客户端消费
     */
    @GetMapping(value = "/stream/flux", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChatFlux(@RequestParam(required = false, defaultValue = "user") String role,
                                       @RequestParam(required = false) String content,
                                       @RequestParam(required = false) String sessionId,
                                       @RequestParam(required = false, name = "userId") String userIdStr,
                                       HttpServletRequest request) {
        Long resolvedUserId = resolveUserId(request);
        if (resolvedUserId == null && StringUtils.isNotBlank(userIdStr)) {
            try {
                BigInteger bi = new BigInteger(userIdStr.trim());
                BigInteger max = BigInteger.valueOf(Long.MAX_VALUE);
                BigInteger min = BigInteger.valueOf(Long.MIN_VALUE);
                if (bi.compareTo(max) > 0 || bi.compareTo(min) < 0) {
                    throw new NumberFormatException("userId 超出 Long 范围");
                }
                resolvedUserId = bi.longValue();
            } catch (Exception ex) {
                final String errMsg = "非法的 userId 参数：" + ex.getMessage();
                return Flux.just(errMsg);
            }
        }
        if (resolvedUserId == null) {
            return Flux.just("缺少用户身份，请先登录或在query传userId");
        }

        // 组装最小请求
        ChatRequest chatRequest = new ChatRequest();
        chatRequest.setStream(true);
        chatRequest.setSessionId(sessionId);
        chatRequest.setUserId(resolvedUserId);
        HashMap<String, String> thinking = new HashMap<>();
        thinking.put("type", "disabled");
        chatRequest.setThinking(thinking);

        List<Message> messages = new ArrayList<>();
        if (StringUtils.isNotBlank(content)) {
            String finalRole = StringUtils.isBlank(role) ? "user" : role.trim();
            if (!"user".equals(finalRole) && !"assistant".equals(finalRole) && !"system".equals(finalRole)) {
                finalRole = "user";
            }
            messages.add(new Message(finalRole, content));
        } else if ("user".equalsIgnoreCase(role)) {
            messages.add(new Message("user", " "));
        }
        chatRequest.setMessages(messages);

        // 将回调式API桥接为Flux
        return Flux.<String>create(sink -> {
            // 将阻塞的下游调用放到弹性线程池，避免占用 Netty 事件循环导致“看起来阻塞”
            Schedulers.boundedElastic().schedule(() -> {
                chatService.streamChat(chatRequest, streamResponse -> {
                    if (sink.isCancelled()) {
                        return;
                    }
                    String delta = streamResponse.getDeltaContent();
                    if (StringUtils.isNotEmpty(delta)) {
                        String encoded = delta.replace(" ", "&#32;").replace("\n", "&#92n");
                        sink.next(encoded);
                    }
                    if (streamResponse.isFinished()) {
                        sink.next("[DONE]");
                        sink.complete();
                    }
                });
            });
        }).publishOn(Schedulers.boundedElastic());
    }

    @Nullable
    private Long resolveUserId(HttpServletRequest request) {
        // 解析 userId：优先登录态，其次 query
        Long resolvedUserId = null;
        try {
            User loginUser = userService.getLoginUser(request);
            if (loginUser != null) {
                resolvedUserId = loginUser.getId();
            }
        } catch (Exception ignored) {
        }
        return resolvedUserId;
    }

    /**
     * 基于WebFlux的流式接口（POST版本）
     * 返回Flux<ServerSentEvent<String>>，由浏览器原生EventSource或任意支持SSE的客户端消费
     * @param chatRequest
     * @param request
     * @return
     */
    @PostMapping(value = "/stream/flux", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamChatFluxByPost(@RequestBody ChatRequest chatRequest,
                                                              HttpServletRequest request) {
        // 解析用户身份：优先登录态，其次请求体中的 userId
        Long resolvedUserId = resolveUserId(request);
        if (resolvedUserId == null && chatRequest.getUserId() != null) {
            resolvedUserId = chatRequest.getUserId();
        }
        if (resolvedUserId == null) {
            return Flux.just(ServerSentEvent.builder("缺少用户身份，请先登录或携带 userId").event("error").build());
        }
        
        // 设置请求参数
        chatRequest.setUserId(resolvedUserId);
        chatRequest.setStream(true);
        
        // 设置 thinking
//        if (chatRequest.getThinking() == null) {
//            HashMap<String, String> thinking = new HashMap<>();
//            thinking.put("type", "enabled");
//            chatRequest.setThinking(thinking);
//        }
        
        // 确保消息列表不为空
        if (chatRequest.getMessages() == null || chatRequest.getMessages().isEmpty()) {
            List<Message> messages = new ArrayList<>();
            messages.add(new Message("user", " "));
            chatRequest.setMessages(messages);
        }

        // 将回调式API桥接为Flux
        return Flux.<ServerSentEvent<String>>create(sink -> {
            // 弹性线程池
            Schedulers.boundedElastic().schedule(() -> {
                chatService.streamChat(chatRequest, streamResponse -> {
                    if (sink.isCancelled()) {
                        return;
                    }

                    // 1. 深度思考内容，推送 thinking 事件
                    try {
                        JsonNode root = objectMapper.valueToTree(streamResponse);
                        JsonNode choices = root.get("choices");
                        if (choices != null && choices.isArray() && choices.size() > 0) {
                            JsonNode delta = choices.get(0).path("delta");
                            if (delta != null && delta.has("reasoning_content")) {
                                String reasoning = delta.get("reasoning_content").asText(null);
                                if (StringUtils.isNotEmpty(reasoning)) {
                                    String encodedThinking = reasoning.replace(" ", "&#32;").replace("\n", "&#92n");
                                    sink.next(ServerSentEvent.builder(encodedThinking).event("thinking").build());
                                }
                            }
                        }
                    } catch (Exception ignored) {
                    }

                    // 2. 普通消息内容，推送 message 事件
                    String delta = streamResponse.getDeltaContent();
                    if (StringUtils.isNotEmpty(delta)) {
                        String encoded = delta.replace(" ", "&#32;").replace("\n", "&#92n");
                        sink.next(ServerSentEvent.builder(encoded).event("message").build());
                    }
                    if (streamResponse.isFinished()) {
                        sink.next(ServerSentEvent.builder("[DONE]").event("done").build());
                        sink.complete();
                    }
                });
            });
        }).publishOn(Schedulers.boundedElastic());
    }

    /**
     * 创建聊天会话
     *
     * @param request 创建会话请求
     * @return 会话VO
     */
    @PostMapping("/sessions")
    public BaseResponse<ChatSessionVO> createSession(@RequestBody ChatSessionRequest request) {
        ChatSessionVO session = chatService.createSession(request);
        return ResultUtils.success(session);
    }

    /**
     * 获取用户的会话列表
     *
     * @param userId 用户ID
     * @return 会话列表
     */
    @GetMapping("/sessions")
    public BaseResponse<List<ChatSessionVO>> getSessions(@RequestParam Long userId) {
        List<ChatSessionVO> sessions = chatService.getSessions(userId);
        return ResultUtils.success(sessions);
    }

    /**
     * 获取会话的消息列表
     *
     * @param sessionId 会话ID
     * @param userId 用户ID
     * @return 消息列表
     */
    @GetMapping("/sessions/{sessionId}/messages")
    public BaseResponse<List<ChatMessageVO>> getMessages(
            @PathVariable String sessionId,
            @RequestParam Long userId) {
        List<ChatMessageVO> messages = chatService.getMessages(sessionId, userId);
        return ResultUtils.success(messages);
    }

    /**
     * 删除会话（软删除）
     *
     * @param sessionId 会话ID
     * @param userId 用户ID
     * @return 操作结果
     */
    @DeleteMapping("/sessions/{sessionId}")
    public BaseResponse<Void> deleteSession(
            @PathVariable String sessionId,
            @RequestParam Long userId) {
        chatService.deleteSession(sessionId, userId);
        return ResultUtils.success(null);
    }
}

