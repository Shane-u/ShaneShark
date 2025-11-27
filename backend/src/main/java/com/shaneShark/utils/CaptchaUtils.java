package com.shaneShark.utils;

import cn.hutool.captcha.CaptchaUtil;
import cn.hutool.captcha.LineCaptcha;
import com.alibaba.excel.util.StringUtils;
import com.shaneShark.common.ErrorCode;
import com.shaneShark.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 图形验证码工具类
 */
public class CaptchaUtils {
    // 图形验证码Session键
    public static final String CAPTCHA_SESSION_KEY = "captcha_code";

    /**
     * 生成图形验证码
     */
    public static LineCaptcha generateCaptcha(HttpServletRequest request) {
        // 使用hutools的工具类
        LineCaptcha captcha = CaptchaUtil.createLineCaptcha(200, 100, 4, 10);
        // 存入Session
        request.getSession().setAttribute(CAPTCHA_SESSION_KEY, captcha.getCode());
        return captcha;
    }

    /**
     * 验证图形验证码
     */
    public static void validateCaptcha(HttpServletRequest request, String inputCode) {
        String sessionCode = (String) request.getSession().getAttribute(CAPTCHA_SESSION_KEY);
        if (StringUtils.isBlank(inputCode) || !inputCode.equalsIgnoreCase(sessionCode)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "图形验证码错误");
        }
        // 验证成功后移除，防止重复使用
        request.getSession().removeAttribute(CAPTCHA_SESSION_KEY);
    }
}