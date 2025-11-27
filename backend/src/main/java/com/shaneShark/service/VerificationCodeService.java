package com.shaneShark.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.shaneShark.model.entity.VerificationCode;

/**
 * 验证码服务类
 */
public interface VerificationCodeService extends IService<VerificationCode> {
    /**
     * 发送验证码
     */
    void sendCode(String account);

    /**
     * 验证验证码
     */
    void validateCode(String account, String code);
}