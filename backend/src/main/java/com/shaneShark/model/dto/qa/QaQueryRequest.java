package com.shaneShark.model.dto.qa;

import com.shaneShark.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.io.Serializable;

/**
 * QA查询请求
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class QaQueryRequest extends PageRequest implements Serializable {

    /**
     * 标签筛选
     */
    private String tag;

    /**
     * 模糊搜索标题
     */
    private String keyword;

    /**
     * 是否精选
     */
    private Integer isHot;

    private static final long serialVersionUID = 1L;
}

