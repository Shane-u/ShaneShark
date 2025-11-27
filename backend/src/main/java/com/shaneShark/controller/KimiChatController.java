package com.shaneShark.controller;

import com.shaneShark.common.BaseResponse;
import com.shaneShark.common.ResultUtils;
import com.shaneShark.model.dto.chat.ChatRequest;
import com.shaneShark.model.dto.chat.ChatResponse;
import com.shaneShark.model.dto.chat.ChatSessionRequest;
import com.shaneShark.model.dto.chat.Message;
import com.shaneShark.model.entity.User;
import com.shaneShark.model.vo.ChatMessageVO;
import com.shaneShark.model.vo.ChatSessionVO;
import com.shaneShark.service.ChatService;
import com.shaneShark.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.Nullable;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

/**
 * Kimi聊天控制器
 * 提供Kimi聊天功能的HTTP接口，支持流式和非流式两种模式
 *
 * @author Shane
 */
@RestController
@RequestMapping("/chat/kimi")
@Slf4j
public class KimiChatController {

    @Resource(name = "kimiChatService")
    private ChatService kimiChatService;

    @Resource
    private UserService userService;

    /**
     * 基于WebFlux的流式接口
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

        return Flux.<String>create(sink -> {
            Schedulers.boundedElastic().schedule(() -> {
                kimiChatService.streamChat(chatRequest, streamResponse -> {
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

    /**
     * 基于WebFlux的流式接口（POST版本）
     */
    @PostMapping(value = "/stream/flux", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamChatFluxByPost(@RequestBody ChatRequest chatRequest,
                                                              HttpServletRequest request) {
        Long resolvedUserId = resolveUserId(request);
        if (resolvedUserId == null && chatRequest.getUserId() != null) {
            resolvedUserId = chatRequest.getUserId();
        }
        if (resolvedUserId == null) {
            return Flux.just(ServerSentEvent.builder("缺少用户身份，请先登录或携带 userId").event("error").build());
        }
        
        chatRequest.setUserId(resolvedUserId);
        chatRequest.setStream(true);
        
        if (chatRequest.getThinking() == null) {
            HashMap<String, String> thinking = new HashMap<>();
            thinking.put("type", "disabled");
            chatRequest.setThinking(thinking);
        }
        
        if (chatRequest.getMessages() == null || chatRequest.getMessages().isEmpty()) {
            List<Message> messages = new ArrayList<>();
            messages.add(new Message("user", " "));
            chatRequest.setMessages(messages);
        }

        return Flux.<ServerSentEvent<String>>create(sink -> {
            Schedulers.boundedElastic().schedule(() -> {
                kimiChatService.streamChat(chatRequest, streamResponse -> {
                    if (sink.isCancelled()) {
                        return;
                    }
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
     * 非流式聊天接口（等待完整响应）
     */
    @PostMapping("/completions")
    public BaseResponse<ChatResponse> chat(@RequestBody ChatRequest chatRequest,
                                           HttpServletRequest request) {
        Long resolvedUserId = resolveUserId(request);
        if (resolvedUserId == null && chatRequest.getUserId() != null) {
            resolvedUserId = chatRequest.getUserId();
        }
        if (resolvedUserId == null) {
            return new BaseResponse<>(com.shaneShark.common.ErrorCode.NOT_LOGIN_ERROR.getCode(), null, "缺少用户身份，请先登录或携带 userId");
        }

        chatRequest.setUserId(resolvedUserId);
        chatRequest.setStream(false);

        if (chatRequest.getThinking() == null) {
            HashMap<String, String> thinking = new HashMap<>();
            thinking.put("type", "disabled");
            chatRequest.setThinking(thinking);
        }

        if (chatRequest.getMessages() == null || chatRequest.getMessages().isEmpty()) {
            List<Message> messages = new ArrayList<>();
            messages.add(new Message("user", " "));
            chatRequest.setMessages(messages);
        }

        ChatResponse response = kimiChatService.chat(chatRequest);
        return ResultUtils.success(response);
    }

    /**
     * 创建聊天会话
     */
    @PostMapping("/sessions")
    public BaseResponse<ChatSessionVO> createSession(@RequestBody ChatSessionRequest request) {
        ChatSessionVO session = kimiChatService.createSession(request);
        return ResultUtils.success(session);
    }

    /**
     * 获取用户的会话列表
     */
    @GetMapping("/sessions")
    public BaseResponse<List<ChatSessionVO>> getSessions(@RequestParam Long userId) {
        List<ChatSessionVO> sessions = kimiChatService.getSessions(userId);
        return ResultUtils.success(sessions);
    }

    /**
     * 获取会话的消息列表
     */
    @GetMapping("/sessions/{sessionId}/messages")
    public BaseResponse<List<ChatMessageVO>> getMessages(
            @PathVariable String sessionId,
            @RequestParam Long userId) {
        List<ChatMessageVO> messages = kimiChatService.getMessages(sessionId, userId);
        return ResultUtils.success(messages);
    }

    /**
     * 删除会话（软删除）
     */
    @DeleteMapping("/sessions/{sessionId}")
    public BaseResponse<Void> deleteSession(
            @PathVariable String sessionId,
            @RequestParam Long userId) {
        kimiChatService.deleteSession(sessionId, userId);
        return ResultUtils.success(null);
    }

    @Nullable
    private Long resolveUserId(HttpServletRequest request) {
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
}

