package com.shaneShark.service.impl;

import com.shaneShark.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.annotation.Resource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 邮箱服务实现（支持HTML模板）
 */
@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Resource
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    @Override
    public void sendEmail(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            mailSender.send(message);
            log.info("邮件发送成功，收件人：{}", to);
        } catch (Exception e) {
            log.error("邮件发送失败，收件人：{}，错误：{}", to, e.getMessage());
            throw new RuntimeException("邮件发送失败");
        }
    }
    
    /**
     * 发送验证码邮件（使用HTML模板）
     */
    @Override
    public void sendVerificationCodeEmail(String to, String verificationCode) {
        try {
            String htmlTemplate = loadEmailTemplate();
            String htmlContent = htmlTemplate.replace("{{VERIFICATION_CODE}}", verificationCode);
            sendEmail(to, "【数字大学生平台】验证码通知", htmlContent);
            
        } catch (Exception e) {
            log.error("发送验证码邮件失败，收件人：{}，错误：{}", to, e.getMessage());
            throw new RuntimeException("验证码邮件发送失败");
        }
    }
    
    /**
     * 加载邮件模板
     */
    private String loadEmailTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource("templates/verification-email.html");
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("加载邮件模板失败：{}", e.getMessage());
            return "";
        }
    }
}
