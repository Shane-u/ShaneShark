package com.shaneShark.model.dto.chat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;

/**
 * 聊天响应 DTO
 *
 * @author Shane
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChatResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 响应ID
     */
    private String id;

    /**
     * 响应对象类型
     */
    private String object;

    /**
     * 创建时间戳
     */
    private Long created;

    /**
     * 使用的模型
     */
    private String model;

    /**
     * 响应选择列表
     */
    private Choice[] choices;

    /**
     * 使用情况统计
     */
    private Usage usage;

    /**
     * 会话ID（用于后续请求关联历史对话）
     */
    private String sessionId;

    /**
     * 响应选择项
     */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Choice implements Serializable {
        private static final long serialVersionUID = 1L;

        /**
         * 选择索引
         */
        private Integer index;

        /**
         * 消息对象
         */
        private Message message;

        /**
         * 完成原因
         */
        @JsonProperty("finish_reason")
        private String finishReason;
    }

    /**
     * 使用情况统计
     */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Usage implements Serializable {
        private static final long serialVersionUID = 1L;

        /**
         * 提示词令牌数
         */
        @JsonProperty("prompt_tokens")
        private Integer promptTokens;

        /**
         * 完成令牌数
         */
        @JsonProperty("completion_tokens")
        private Integer completionTokens;

        /**
         * 总令牌数
         */
        @JsonProperty("total_tokens")
        private Integer totalTokens;
    }

    /**
     * 获取响应的文本内容
     *
     * @return 响应文本，如果没有则返回空字符串
     */
    public String getContent() {
        if (choices != null && choices.length > 0 && choices[0].getMessage() != null) {
            return choices[0].getMessage().getContent();
        }
        return "";
    }
}

