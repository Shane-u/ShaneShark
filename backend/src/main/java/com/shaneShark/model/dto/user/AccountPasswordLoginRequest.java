package com.shaneShark.model.dto.user;

import lombok.Data;

import java.io.Serializable;

/**
 * 账号密码登录请求
 */
@Data
public class AccountPasswordLoginRequest implements Serializable {
    private String account; // 手机号/邮箱
    private String password;
    private String captcha; // 图形验证码
}