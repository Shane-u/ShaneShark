package com.shaneShark.service;

/**
 * 短信服务接口
 */
public interface SmsService {
    /**
     * 发送短信
     * @param phone 手机号
     * @param code 验证码
     */
    void sendSms(String phone, String code);
}
