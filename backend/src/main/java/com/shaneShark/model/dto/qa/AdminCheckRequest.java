package com.shaneShark.model.dto.qa;

import lombok.Data;
import java.io.Serializable;

/**
 * 管理员口令校验请求
 */
@Data
public class AdminCheckRequest implements Serializable {

    /**
     * 加密后的口令
     */
    private String password;

    private static final long serialVersionUID = 1L;
}

