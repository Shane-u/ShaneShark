package com.shaneShark.model.dto.chat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;

/**
 * 流式聊天响应 DTO
 *
 * @author Shane
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class StreamChatResponse implements Serializable {

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
     * 系统指纹
     */
    @JsonProperty("system_fingerprint")
    private String systemFingerprint;

    /**
     * 使用情况统计
     */
    private Usage usage;

    /**
     * 响应选择列表
     */
    private StreamChoice[] choices;

    /**
     * 流式响应选择项
     */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StreamChoice implements Serializable {
        private static final long serialVersionUID = 1L;

        /**
         * 选择索引
         */
        private Integer index;

        /**
         * 增量消息对象
         */
        private Message delta;

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
     * 获取增量内容
     *
     * @return 增量文本，如果没有则返回空字符串
     */
    public String getDeltaContent() {
        if (choices != null && choices.length > 0 && choices[0].getDelta() != null) {
            return choices[0].getDelta().getContent();
        }
        return "";
    }

    /**
     * 判断是否是流结束标记
     *
     * @return true表示流已结束
     */
    public boolean isFinished() {
        return choices != null && choices.length > 0 && choices[0].getFinishReason() != null;
    }
}

