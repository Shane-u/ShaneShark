package com.shaneShark.service;

import com.shaneShark.common.ErrorCode;
import com.shaneShark.exception.BusinessException;
import com.shaneShark.exception.ThrowUtils;
import com.shaneShark.manager.DeepSeekManager;
import com.shaneShark.model.dto.chat.ChatRequest;
import com.shaneShark.model.dto.chat.ChatResponse;
import com.shaneShark.model.dto.chat.ChatSessionRequest;
import com.shaneShark.model.dto.chat.Message;
import com.shaneShark.model.dto.chat.StreamChatResponse;
import com.shaneShark.model.entity.ChatMessage;
import com.shaneShark.model.entity.ChatSession;
import com.shaneShark.model.vo.ChatMessageVO;
import com.shaneShark.model.vo.ChatSessionVO;
import com.shaneShark.repository.ChatMessageRepository;
import com.shaneShark.repository.ChatSessionRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import jakarta.annotation.Resource;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * DeepSeek聊天服务实现类
 * 复用ChatService的逻辑，使用DeepSeekManager
 *
 * @author Shane
 */
@Service("deepSeekChatService")
@Slf4j
public class DeepSeekChatService implements ChatService {

    @Resource
    private DeepSeekManager deepSeekManager;

    @Resource
    private ChatSessionRepository chatSessionRepository;

    @Resource
    private ChatMessageRepository chatMessageRepository;

    @Override
    public ChatResponse chat(ChatRequest chatRequest) {
        // 参数校验
        validateChatRequest(chatRequest);

        // 获取或创建会话
        String sessionId = getOrCreateSession(chatRequest);

        // 构建完整的消息列表（包含历史记录）
        List<Message> fullMessages = buildMessageList(chatRequest, sessionId);

        // 打印完整的消息列表用于调试
        log.info("准备发送给DeepSeek的消息列表: sessionId={}, userId={}, 总消息数={}", 
                sessionId, chatRequest.getUserId(), fullMessages.size());

        // 处理多模态消息
        List<Message> processedMessages = processMultimodalMessages(fullMessages);

        // 创建新的请求对象（包含历史消息）
        ChatRequest fullRequest = new ChatRequest();
        BeanUtils.copyProperties(chatRequest, fullRequest);
        fullRequest.setMessages(processedMessages);
        fullRequest.setSessionId(sessionId);

        // 保存用户消息
        saveUserMessage(chatRequest, sessionId);

        // 调用Manager层执行聊天请求
        ChatResponse response = deepSeekManager.chat(fullRequest);

        // 设置sessionId到响应中，方便客户端后续使用
        response.setSessionId(sessionId);

        // 保存AI回复
        saveAssistantMessage(response, sessionId, chatRequest.getUserId());

        // 更新会话时间
        updateSessionTime(sessionId);

        log.info("DeepSeek聊天完成: sessionId={}, userId={}, 历史消息数={}, 当前消息数={}", 
                sessionId, chatRequest.getUserId(), 
                fullMessages.size() - chatRequest.getMessages().size(), 
                chatRequest.getMessages().size());

        return response;
    }

    @Override
    public void streamChat(ChatRequest chatRequest, Consumer<StreamChatResponse> onChunk) {
        // 参数校验
        validateChatRequest(chatRequest);

        // 获取或创建会话
        String sessionId = getOrCreateSession(chatRequest);

        // 构建完整的消息列表（包含历史记录）
        List<Message> fullMessages = buildMessageList(chatRequest, sessionId);

        // 处理多模态消息
        List<Message> processedMessages = processMultimodalMessages(fullMessages);

        // 创建新的请求对象（包含历史消息）
        ChatRequest fullRequest = new ChatRequest();
        BeanUtils.copyProperties(chatRequest, fullRequest);
        fullRequest.setMessages(processedMessages);
        fullRequest.setSessionId(sessionId);

        // 保存用户消息
        saveUserMessage(chatRequest, sessionId);

        // 用于收集流式响应内容
        StringBuilder responseContent = new StringBuilder();

        // 调用Manager层执行流式聊天请求
        deepSeekManager.streamChat(fullRequest, streamResponse -> {
            // 收集内容
            String deltaContent = streamResponse.getDeltaContent();
            if (deltaContent != null) {
                responseContent.append(deltaContent);
            }

            // 调用回调
            onChunk.accept(streamResponse);

            // 如果流结束，保存AI回复
            if (streamResponse.isFinished()) {
                saveAssistantMessage(responseContent.toString(), sessionId, chatRequest.getUserId());
                updateSessionTime(sessionId);
            }
        });
    }

    // 以下方法复用ChatServiceImpl的逻辑，为了代码简洁，直接复制实现
    // 在实际项目中，可以考虑抽取为基类或工具类

    private String getOrCreateSession(ChatRequest chatRequest) {
        Long userId = chatRequest.getUserId();
        ThrowUtils.throwIf(userId == null, ErrorCode.PARAMS_ERROR, "用户ID不能为空");

        String sessionId = chatRequest.getSessionId();
        if (StringUtils.isNotBlank(sessionId)) {
            log.info("查找会话: sessionId={}, userId={}", sessionId, userId);
            ChatSession session = chatSessionRepository.findByIdAndUserId(sessionId, userId);
            if (session == null) {
                log.warn("会话不存在: sessionId={}, userId={}", sessionId, userId);
                List<ChatSession> recentSessions = chatSessionRepository
                        .findByUserIdAndIsDeleteOrderByUpdateTimeDesc(userId, false);
                if (!recentSessions.isEmpty()) {
                    String recentSessionId = recentSessions.get(0).getId();
                    log.info("未找到指定会话，使用最近会话: sessionId={}, userId={}", recentSessionId, userId);
                    return recentSessionId;
                }
                ThrowUtils.throwIf(true, ErrorCode.NOT_FOUND_ERROR, 
                        String.format("会话不存在: sessionId=%s", sessionId));
            }
            if (session.getIsDelete()) {
                log.warn("会话已删除: sessionId={}, userId={}", sessionId, userId);
                List<ChatSession> recentSessions = chatSessionRepository
                        .findByUserIdAndIsDeleteOrderByUpdateTimeDesc(userId, false);
                if (!recentSessions.isEmpty()) {
                    String recentSessionId = recentSessions.get(0).getId();
                    log.info("指定会话已删除，使用最近会话: sessionId={}, userId={}", recentSessionId, userId);
                    return recentSessionId;
                }
                ThrowUtils.throwIf(true, ErrorCode.NOT_FOUND_ERROR, "会话不存在或已删除");
            }
            log.info("找到会话: sessionId={}, userId={}, title={}", sessionId, userId, session.getTitle());
            return sessionId;
        }
        
        List<ChatSession> recentSessions = chatSessionRepository
                .findByUserIdAndIsDeleteOrderByUpdateTimeDesc(userId, false);
        if (!recentSessions.isEmpty()) {
            String recentSessionId = recentSessions.get(0).getId();
            log.info("未提供sessionId，使用最近会话: sessionId={}, userId={}, title={}", 
                    recentSessionId, userId, recentSessions.get(0).getTitle());
            return recentSessionId;
        }

        ChatSession session = new ChatSession();
        String newSessionId = UUID.randomUUID().toString();
        session.setId(newSessionId);
        session.setUserId(userId);
        session.setTitle(generateSessionTitle(chatRequest));
        session.setCreateTime(LocalDateTime.now());
        session.setUpdateTime(LocalDateTime.now());
        session.setIsDelete(false);
        
        try {
            ChatSession saved = chatSessionRepository.save(session);
            log.info("创建新会话成功: sessionId={}, userId={}, title={}", saved.getId(), userId, session.getTitle());
            return saved.getId();
        } catch (Exception e) {
            log.error("创建新会话失败: userId={}, title={}, error={}", userId, session.getTitle(), e.getMessage(), e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "创建会话失败: " + e.getMessage());
        }
    }

    private String generateSessionTitle(ChatRequest chatRequest) {
        if (chatRequest.getMessages() == null || chatRequest.getMessages().isEmpty()) {
            return "新对话";
        }
        for (Message msg : chatRequest.getMessages()) {
            if ("user".equals(msg.getRole())) {
                String content = msg.getContent();
                if (StringUtils.isNotBlank(content)) {
                    return content.length() > 20 ? content.substring(0, 20) + "..." : content;
                }
                if (msg.hasMultimodalContent()) {
                    return "包含图片/视频的对话";
                }
            }
        }
        return "新对话";
    }

    private List<Message> buildMessageList(ChatRequest chatRequest, String sessionId) {
        List<Message> messages = new ArrayList<>();
        Long userId = chatRequest.getUserId();

        if (userId == null) {
            log.warn("用户ID为空，无法加载历史消息: sessionId={}", sessionId);
            if (chatRequest.getMessages() != null) {
                messages.addAll(chatRequest.getMessages());
            }
            return messages;
        }

        try {
            List<ChatMessage> historyMessages = chatMessageRepository
                    .findBySessionIdAndUserIdAndIsDeleteOrderByCreateTimeAsc(sessionId, userId, false);

            log.info("加载历史消息: sessionId={}, userId={}, 历史消息数={}", 
                    sessionId, userId, historyMessages.size());

            for (ChatMessage historyMsg : historyMessages) {
                if (!userId.equals(historyMsg.getUserId()) || !sessionId.equals(historyMsg.getSessionId())) {
                    log.warn("消息归属验证失败，跳过: messageId={}", historyMsg.getId());
                    continue;
                }

                Message msg = new Message();
                msg.setRole(historyMsg.getRole());
                msg.setContent(historyMsg.getContent());
                if (historyMsg.getImageUrls() != null && !historyMsg.getImageUrls().isEmpty()) {
                    msg.setImageUrls(historyMsg.getImageUrls());
                }
                if (historyMsg.getVideoUrls() != null && !historyMsg.getVideoUrls().isEmpty()) {
                    msg.setVideoUrls(historyMsg.getVideoUrls());
                }
                messages.add(msg);
            }
        } catch (Exception e) {
            log.error("加载历史消息失败: sessionId={}, userId={}, error={}", 
                    sessionId, userId, e.getMessage(), e);
        }

        if (chatRequest.getMessages() != null) {
            messages.addAll(chatRequest.getMessages());
        }

        return messages;
    }

    private List<Message> processMultimodalMessages(List<Message> messages) {
        return messages.stream().map(msg -> {
            if (msg.hasMultimodalContent()) {
                Message processedMsg = new Message();
                processedMsg.setRole(msg.getRole());
                List<Message.ContentItem> contentList = new ArrayList<>();
                if (StringUtils.isNotBlank(msg.getContent())) {
                    Message.ContentItem textItem = new Message.ContentItem();
                    textItem.setType("text");
                    textItem.setText(msg.getContent());
                    contentList.add(textItem);
                }
                if (msg.getImageUrls() != null && !msg.getImageUrls().isEmpty()) {
                    for (String imageUrl : msg.getImageUrls()) {
                        Message.ContentItem imageItem = new Message.ContentItem();
                        imageItem.setType("image_url");
                        Message.ImageUrl imageUrlObj = new Message.ImageUrl();
                        imageUrlObj.setUrl(imageUrl);
                        imageItem.setImageUrl(imageUrlObj);
                        contentList.add(imageItem);
                    }
                }
                if (msg.getVideoUrls() != null && !msg.getVideoUrls().isEmpty()) {
                    for (String videoUrl : msg.getVideoUrls()) {
                        Message.ContentItem videoItem = new Message.ContentItem();
                        videoItem.setType("video_url");
                        Message.VideoUrl videoUrlObj = new Message.VideoUrl();
                        videoUrlObj.setUrl(videoUrl);
                        videoItem.setVideoUrl(videoUrlObj);
                        contentList.add(videoItem);
                    }
                }
                processedMsg.setContentList(contentList);
                processedMsg.setContent(null);
                return processedMsg;
            }
            return msg;
        }).collect(Collectors.toList());
    }

    private void saveUserMessage(ChatRequest chatRequest, String sessionId) {
        if (chatRequest.getMessages() == null || chatRequest.getMessages().isEmpty()) {
            return;
        }
        Long userId = chatRequest.getUserId();
        if (userId == null) {
            log.error("用户ID为空，无法保存消息: sessionId={}", sessionId);
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "用户ID不能为空");
        }
        for (Message msg : chatRequest.getMessages()) {
            if ("user".equals(msg.getRole())) {
                try {
                    ChatMessage chatMessage = new ChatMessage();
                    chatMessage.setId(UUID.randomUUID().toString());
                    chatMessage.setSessionId(sessionId);
                    chatMessage.setUserId(userId);
                    chatMessage.setRole(msg.getRole());
                    chatMessage.setContent(msg.getContent());
                    chatMessage.setImageUrls(msg.getImageUrls());
                    chatMessage.setVideoUrls(msg.getVideoUrls());
                    chatMessage.setCreateTime(LocalDateTime.now());
                    chatMessage.setIsDelete(false);
                    chatMessageRepository.save(chatMessage);
                    log.info("保存用户消息成功: sessionId={}, messageId={}, userId={}", 
                            sessionId, chatMessage.getId(), userId);
                } catch (Exception e) {
                    log.error("保存用户消息失败: sessionId={}, userId={}, error={}", 
                            sessionId, userId, e.getMessage(), e);
                    throw new BusinessException(ErrorCode.SYSTEM_ERROR, "保存用户消息失败: " + e.getMessage());
                }
            }
        }
    }

    private void saveAssistantMessage(ChatResponse response, String sessionId, Long userId) {
        if (userId == null) {
            return;
        }
        String content = response.getContent();
        if (StringUtils.isBlank(content)) {
            return;
        }
        try {
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setId(UUID.randomUUID().toString());
            chatMessage.setSessionId(sessionId);
            chatMessage.setUserId(userId);
            chatMessage.setRole("assistant");
            chatMessage.setContent(content);
            chatMessage.setCreateTime(LocalDateTime.now());
            chatMessage.setIsDelete(false);
            chatMessageRepository.save(chatMessage);
            log.info("保存AI回复成功: sessionId={}, messageId={}, userId={}", 
                    sessionId, chatMessage.getId(), userId);
        } catch (Exception e) {
            log.error("保存AI回复失败: sessionId={}, userId={}, error={}", 
                    sessionId, userId, e.getMessage(), e);
        }
    }

    private void saveAssistantMessage(String content, String sessionId, Long userId) {
        if (userId == null || StringUtils.isBlank(content)) {
            return;
        }
        try {
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setId(UUID.randomUUID().toString());
            chatMessage.setSessionId(sessionId);
            chatMessage.setUserId(userId);
            chatMessage.setRole("assistant");
            chatMessage.setContent(content);
            chatMessage.setCreateTime(LocalDateTime.now());
            chatMessage.setIsDelete(false);
            chatMessageRepository.save(chatMessage);
            log.info("保存AI回复成功: sessionId={}, messageId={}, userId={}", 
                    sessionId, chatMessage.getId(), userId);
        } catch (Exception e) {
            log.error("保存AI回复失败: sessionId={}, userId={}, error={}", 
                    sessionId, userId, e.getMessage(), e);
        }
    }

    private void updateSessionTime(String sessionId) {
        try {
            ChatSession session = chatSessionRepository.findById(sessionId).orElse(null);
            if (session != null) {
                session.setUpdateTime(LocalDateTime.now());
                chatSessionRepository.save(session);
            }
        } catch (Exception e) {
            log.error("更新会话时间失败: sessionId={}, error={}", sessionId, e.getMessage(), e);
        }
    }

    private void validateChatRequest(ChatRequest chatRequest) {
        ThrowUtils.throwIf(chatRequest == null, ErrorCode.PARAMS_ERROR, "请求参数不能为空");
        List<Message> messages = chatRequest.getMessages();
        ThrowUtils.throwIf(messages == null || messages.isEmpty(), 
                ErrorCode.PARAMS_ERROR, "消息列表不能为空");
        for (Message message : messages) {
            ThrowUtils.throwIf(message == null, ErrorCode.PARAMS_ERROR, "消息对象不能为空");
            ThrowUtils.throwIf(StringUtils.isBlank(message.getRole()), 
                    ErrorCode.PARAMS_ERROR, "消息角色不能为空");
            boolean hasContent = StringUtils.isNotBlank(message.getContent()) ||
                    (message.getImageUrls() != null && !message.getImageUrls().isEmpty()) ||
                    (message.getVideoUrls() != null && !message.getVideoUrls().isEmpty());
            ThrowUtils.throwIf(!hasContent, 
                    ErrorCode.PARAMS_ERROR, "消息内容不能为空");
            String role = message.getRole();
            if (!"system".equals(role) && !"user".equals(role) && !"assistant".equals(role)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, 
                        "消息角色必须是 system、user 或 assistant 之一");
            }
        }
    }

    @Override
    public ChatSessionVO createSession(ChatSessionRequest request) {
        ThrowUtils.throwIf(request == null, ErrorCode.PARAMS_ERROR, "请求参数不能为空");
        ThrowUtils.throwIf(request.getUserId() == null, ErrorCode.PARAMS_ERROR, "用户ID不能为空");
        ChatSession session = new ChatSession();
        session.setId(UUID.randomUUID().toString());
        session.setUserId(request.getUserId());
        session.setTitle(StringUtils.isNotBlank(request.getTitle()) ? 
                request.getTitle() : "新对话");
        session.setCreateTime(LocalDateTime.now());
        session.setUpdateTime(LocalDateTime.now());
        session.setIsDelete(false);
        chatSessionRepository.save(session);
        ChatSessionVO vo = new ChatSessionVO();
        BeanUtils.copyProperties(session, vo);
        return vo;
    }

    @Override
    public List<ChatSessionVO> getSessions(Long userId) {
        ThrowUtils.throwIf(userId == null, ErrorCode.PARAMS_ERROR, "用户ID不能为空");
        List<ChatSession> sessions = chatSessionRepository
                .findByUserIdAndIsDeleteOrderByUpdateTimeDesc(userId, false);
        return sessions.stream().map(session -> {
            ChatSessionVO vo = new ChatSessionVO();
            BeanUtils.copyProperties(session, vo);
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public List<ChatMessageVO> getMessages(String sessionId, Long userId) {
        ThrowUtils.throwIf(StringUtils.isBlank(sessionId), ErrorCode.PARAMS_ERROR, "会话ID不能为空");
        ThrowUtils.throwIf(userId == null, ErrorCode.PARAMS_ERROR, "用户ID不能为空");
        ChatSession session = chatSessionRepository.findByIdAndUserId(sessionId, userId);
        ThrowUtils.throwIf(session == null || session.getIsDelete(), 
                ErrorCode.NOT_FOUND_ERROR, "会话不存在");
        List<ChatMessage> messages = chatMessageRepository
                .findBySessionIdAndUserIdAndIsDeleteOrderByCreateTimeAsc(sessionId, userId, false);
        return messages.stream().map(msg -> {
            ChatMessageVO vo = new ChatMessageVO();
            BeanUtils.copyProperties(msg, vo);
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public void deleteSession(String sessionId, Long userId) {
        ThrowUtils.throwIf(StringUtils.isBlank(sessionId), ErrorCode.PARAMS_ERROR, "会话ID不能为空");
        ThrowUtils.throwIf(userId == null, ErrorCode.PARAMS_ERROR, "用户ID不能为空");
        ChatSession session = chatSessionRepository.findByIdAndUserId(sessionId, userId);
        ThrowUtils.throwIf(session == null || session.getIsDelete(), 
                ErrorCode.NOT_FOUND_ERROR, "会话不存在");
        session.setIsDelete(true);
        session.setUpdateTime(LocalDateTime.now());
        chatSessionRepository.save(session);
        List<ChatMessage> messages = chatMessageRepository
                .findBySessionIdAndUserIdAndIsDeleteOrderByCreateTimeAsc(sessionId, userId, false);
        for (ChatMessage msg : messages) {
            msg.setIsDelete(true);
            chatMessageRepository.save(msg);
        }
    }
}

