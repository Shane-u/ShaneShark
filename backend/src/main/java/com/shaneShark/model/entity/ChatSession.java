package com.shaneShark.model.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * 聊天会话实体
 * 存储在MongoDB中，用于管理用户的聊天会话
 *
 * @author Shane
 */
@Data
@Document(collection = "chat_sessions")
public class ChatSession {

    /**
     * 会话ID
     */
    @Id
    private String id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 会话标题（默认使用第一条消息的前20个字符）
     */
    private String title;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;

    /**
     * 是否删除
     */
    private Boolean isDelete = false;
}

