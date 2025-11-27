package com.shaneShark.model.dto.chat;

import lombok.Data;

import java.io.Serializable;
import java.util.HashMap;
import java.util.List;

/**
 * 聊天请求 DTO
 *
 * @author Shane
 */
@Data
public class ChatRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 消息列表
     */
    private List<Message> messages;

    /**
     * 模型名称
     */
    private String model;

    /**
     * 温度参数
     */
    private Double temperature;

    /**
     * 是否启用流式输出
     */
    private Boolean stream = true;

    /**
     * 最大生成令牌数
     */
    private Integer maxTokens;

    /**
     * Top-p 采样参数
     */
    private Double topP;

    /**
     * 会话ID（用于关联历史对话）
     */
    private String sessionId;

    /**
     * 用户ID（用于隔离聊天记录）
     */
    private Long userId;

    /**
     * 思考方式
     */
    private HashMap<String,String> thinking;
}















