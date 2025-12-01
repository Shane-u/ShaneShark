package com.shaneShark.service;

import com.shaneShark.common.ErrorCode;
import com.shaneShark.exception.BusinessException;
import com.shaneShark.exception.ThrowUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 简单的 QA 管理员认证服务，基于 session 存储状态。
 */
@Service
@Slf4j
public class QaAdminAuthService {

    public static final String QA_ADMIN_SESSION_KEY = "qa_admin_authenticated";

    @Value("${qa.admin.password}")
    private String adminPassword;

    /**
     * 执行登录，校验口令并在 session 中打标。
     *
     * @param rawPassword 明文口令
     * @param request     Http 请求
     * @return 是否登录成功
     */
    public boolean login(String rawPassword, HttpServletRequest request) {
        ThrowUtils.throwIf(StringUtils.isBlank(rawPassword), ErrorCode.PARAMS_ERROR, "管理员口令不能为空");
        boolean success = StringUtils.equals(adminPassword, rawPassword);
        if (success) {
            request.getSession().setAttribute(QA_ADMIN_SESSION_KEY, Boolean.TRUE);
        } else {
            request.getSession().removeAttribute(QA_ADMIN_SESSION_KEY);
        }
        log.info("QA admin login result={}, ip={}", success, request.getRemoteAddr());
        return success;
    }

    /**
     * 退出登录，移除 session 标记。
     */
    public void logout(HttpServletRequest request) {
        request.getSession().removeAttribute(QA_ADMIN_SESSION_KEY);
    }

    /**
     * 判断当前 session 是否具备管理员权限。
     */
    public boolean isAdmin(HttpServletRequest request) {
        Object flag = request.getSession().getAttribute(QA_ADMIN_SESSION_KEY);
        return flag instanceof Boolean && (Boolean) flag;
    }

    /**
     * 未登录管理员时抛出异常。
     */
    public void ensureAdmin(HttpServletRequest request) {
        if (!isAdmin(request)) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR, "需要管理员权限");
        }
    }
}

