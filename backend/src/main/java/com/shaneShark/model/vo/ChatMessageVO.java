package com.shaneShark.model.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 聊天消息VO
 *
 * @author Shane
 */
@Data
public class ChatMessageVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 消息ID
     */
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
     * 图片URL列表
     */
    private List<String> imageUrls;

    /**
     * 视频URL列表
     */
    private List<String> videoUrls;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;
}

