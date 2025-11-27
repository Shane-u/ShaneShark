package com.shaneShark.service;

import com.shaneShark.model.dto.chat.ChatRequest;
import com.shaneShark.model.dto.chat.ChatResponse;
import com.shaneShark.model.dto.chat.ChatSessionRequest;
import com.shaneShark.model.dto.chat.StreamChatResponse;
import com.shaneShark.model.vo.ChatMessageVO;
import com.shaneShark.model.vo.ChatSessionVO;

import java.util.List;
import java.util.function.Consumer;

/**
 * 聊天服务接口
 * 提供聊天功能的服务接口，支持流式和非流式两种模式，以及会话管理
 *
 * @author Shane
 */
public interface ChatService {

    /**
     * 发送非流式聊天请求
     *
     * @param chatRequest 聊天请求对象
     * @return 聊天响应对象
     */
    ChatResponse chat(ChatRequest chatRequest);

    /**
     * 发送流式聊天请求
     *
     * @param chatRequest 聊天请求对象
     * @param onChunk 每收到一个数据块时的回调函数
     */
    void streamChat(ChatRequest chatRequest, Consumer<StreamChatResponse> onChunk);

    /**
     * 创建聊天会话
     *
     * @param request 创建会话请求
     * @return 会话VO
     */
    ChatSessionVO createSession(ChatSessionRequest request);

    /**
     * 获取用户的会话列表
     *
     * @param userId 用户ID
     * @return 会话列表
     */
    List<ChatSessionVO> getSessions(Long userId);

    /**
     * 获取会话的消息列表
     *
     * @param sessionId 会话ID
     * @param userId 用户ID
     * @return 消息列表
     */
    List<ChatMessageVO> getMessages(String sessionId, Long userId);

    /**
     * 删除会话（软删除）
     *
     * @param sessionId 会话ID
     * @param userId 用户ID
     */
    void deleteSession(String sessionId, Long userId);
}















