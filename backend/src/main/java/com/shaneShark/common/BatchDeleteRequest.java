package com.shaneShark.common;

import java.io.Serializable;
import java.util.List;
import lombok.Data;

/**
 * 批量删除请求
 *
 * @author Shane
 */
@Data
public class BatchDeleteRequest implements Serializable {

    /**
     * id 列表
     */
    private List<Long> ids;

    private static final long serialVersionUID = 1L;
}















