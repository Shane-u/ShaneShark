package com.shaneShark.model.dto.user;

import lombok.Data;

import java.io.Serializable;

/**
 * 验证码登录请求
 */
@Data
public class CodeLoginRequest implements Serializable {
    private String account; // 手机号/邮箱
    private String code; // 短信/邮箱验证码
    private String captcha; // 图形验证码
}