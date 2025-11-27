package com.shaneShark.utils;

import com.shaneShark.common.ErrorCode;
import com.shaneShark.exception.BusinessException;
import com.shaneShark.model.entity.VerificationCode;

/**
 * 账号工具类
 */
public class AccountUtils {
    // 手机号正则
    private static final String PHONE_REGEX = "^1[3-9]\\d{9}$";
    // 邮箱正则
    private static final String EMAIL_REGEX = "^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\\.[a-zA-Z0-9_-]+)+$";

    public static boolean isPhone(String account) {
        return account.matches(PHONE_REGEX);
    }

    public static boolean isEmail(String account) {
        return account.matches(EMAIL_REGEX);
    }

    public static String getAccountType(String account) {
        if (isPhone(account)) {
            return VerificationCode.TYPE_PHONE;
        } else if (isEmail(account)) {
            return VerificationCode.TYPE_EMAIL;
        } else {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "账号格式错误（必须是手机号或邮箱）");
        }
    }
}