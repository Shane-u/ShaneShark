package com.shaneShark.model.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

/**
 * QA视图对象
 */
@Data
public class QaVO implements Serializable {

    /**
     * id
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING)
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

    /**
     * 浏览量
     */
    private Integer viewCount;

    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 更新时间
     */
    private Date updateTime;

    private static final long serialVersionUID = 1L;
}

