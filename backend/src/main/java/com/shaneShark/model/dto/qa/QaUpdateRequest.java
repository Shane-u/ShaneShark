package com.shaneShark.model.dto.qa;

import lombok.Data;
import java.io.Serializable;

/**
 * QA更新请求
 */
@Data
public class QaUpdateRequest implements Serializable {

    /**
     * id
     */
    private Long id;

    /**
     * 问题标题
     */
    private String question;

    /**
     * 答案内容（text/lake格式）
     */
    private String answer;

    /**
     * 标签
     */
    private String tag;

    /**
     * 是否精选（0=否，1=是）
     */
    private Integer isHot;

    private static final long serialVersionUID = 1L;
}

