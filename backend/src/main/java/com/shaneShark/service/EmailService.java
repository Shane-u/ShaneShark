package com.shaneShark.service;

/**
 * 邮箱服务接口
 */
public interface EmailService {
    /**
     * 发送邮件
     * @param to 收件人邮箱
     * @param subject 邮件主题
     * @param content 邮件内容
     */
    void sendEmail(String to, String subject, String content);
    
    /**
     * 发送验证码邮件（使用HTML模板）
     * @param to 收件人邮箱
     * @param verificationCode 验证码
     */
    void sendVerificationCodeEmail(String to, String verificationCode);
}
