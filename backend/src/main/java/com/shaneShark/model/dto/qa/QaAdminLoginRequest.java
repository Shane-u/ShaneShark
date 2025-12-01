package com.shaneShark.model.dto.qa;

import lombok.Data;

import java.io.Serializable;

/**
 * QA 管理员登录请求体。
 */
@Data
public class QaAdminLoginRequest implements Serializable {

    /**
     * 明文口令
     */
    private String password;

    private static final long serialVersionUID = 1L;
}

