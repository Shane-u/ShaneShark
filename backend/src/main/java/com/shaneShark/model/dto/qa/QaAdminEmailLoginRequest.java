package com.shaneShark.model.dto.qa;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * QA 管理员邮箱登录 / 注册请求
 */
@Data
public class QaAdminEmailLoginRequest implements Serializable {

    /**
     * 邮箱
     */
    private String email;

    /**
     * 密码
     */
    private String password;

    /**
     * 邮箱验证码（仅当邮箱不存在时必填）
     */
    private String code;

    @Serial
    private static final long serialVersionUID = 1L;
}


