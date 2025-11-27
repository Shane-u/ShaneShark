package com.shaneShark.model.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 聊天消息实体
 * 存储在MongoDB中，用于保存聊天记录
 *
 * @author Shane
 */
@Data
@Document(collection = "chat_messages")
public class ChatMessage {

    /**
     * 消息ID
     */
    @Id
    private String id;

    /**
     * 会话ID
     */
    private String sessionId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 消息角色：user/assistant/system
     */
    private String role;

    /**
     * 文本内容
     */
    private String content;

    /**
     * 图片URL列表（支持多张图片）
     */
    private List<String> imageUrls;

    /**
     * 视频URL列表（支持多个视频）
     */
    private List<String> videoUrls;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 是否删除
     */
    private Boolean isDelete = false;
}

