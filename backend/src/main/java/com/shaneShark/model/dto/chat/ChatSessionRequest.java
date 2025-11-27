package com.shaneShark.model.dto.chat;

import lombok.Data;

import java.io.Serializable;

/**
 * 创建聊天会话请求
 *
 * @author Shane
 */
@Data
public class ChatSessionRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 会话标题（可选，如果不提供则使用第一条消息的前20个字符）
     */
    private String title;

    /**
     * 用户ID
     */
    private Long userId;
}

