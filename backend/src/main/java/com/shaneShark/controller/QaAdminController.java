package com.shaneShark.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shaneShark.common.BaseResponse;
import com.shaneShark.common.ErrorCode;
import com.shaneShark.common.ResultUtils;
import com.shaneShark.exception.BusinessException;
import com.shaneShark.exception.ThrowUtils;
import com.shaneShark.model.dto.qa.QaAddRequest;
import com.shaneShark.model.dto.qa.QaAdminEmailLoginRequest;
import com.shaneShark.model.dto.qa.QaAdminLoginRequest;
import com.shaneShark.model.dto.qa.QaQueryRequest;
import com.shaneShark.model.dto.qa.QaUpdateRequest;
import com.shaneShark.model.entity.QaInfo;
import com.shaneShark.model.entity.User;
import com.shaneShark.model.enums.UserRoleEnum;
import com.shaneShark.model.vo.QaVO;
import com.shaneShark.service.QaAdminAuthService;
import com.shaneShark.service.QaInfoService;
import com.shaneShark.service.UserService;
import com.shaneShark.service.VerificationCodeService;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Date;

/**
 * QA 管理端接口。
 */
@RestController
@RequestMapping("/qa/admin")
@Slf4j
public class QaAdminController {

    @Resource
    private QaInfoService qaInfoService;

    @Resource
    private QaAdminAuthService qaAdminAuthService;

    @Resource
    private UserService userService;

    @Resource
    private VerificationCodeService verificationCodeService;

    @PostMapping("/login")
    public BaseResponse<Boolean> login(@RequestBody QaAdminLoginRequest loginRequest, HttpServletRequest request) {
        ThrowUtils.throwIf(loginRequest == null, ErrorCode.PARAMS_ERROR);
        boolean success = qaAdminAuthService.login(loginRequest.getPassword(), request);
        return ResultUtils.success(success);
    }

    /**
     * 邮箱预检查：如果邮箱已存在，返回 true；如果不存在，则发送验证码邮件并返回 false。
     */
    @PostMapping("/email/check-or-send")
    public BaseResponse<Boolean> checkEmailOrSendCode(@RequestParam String email) {
        ThrowUtils.throwIf(StringUtils.isBlank(email), ErrorCode.PARAMS_ERROR, "邮箱不能为空");
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("userEmail", email);
        long count = userService.count(queryWrapper);
        boolean exists = count > 0;
        if (!exists) {
            // 仅在不存在时发送验证码（内部会根据账号类型自动选择短信或邮箱，这里传入邮箱）
            verificationCodeService.sendCode(email);
        }
        return ResultUtils.success(exists);
    }

    /**
     * 使用邮箱 + 密码 + （可选）验证码注册或登录，并为当前会话赋予 QA 管理员权限。
     *
     * - 如果邮箱不存在：必须携带验证码，验证通过后自动注册新用户
     * - 如果邮箱已存在：只校验邮箱 + 密码
     */
    @PostMapping("/email/register-or-login")
    public BaseResponse<Boolean> registerOrLoginByEmail(@RequestBody QaAdminEmailLoginRequest requestBody,
                                                        HttpServletRequest request) {
        ThrowUtils.throwIf(requestBody == null, ErrorCode.PARAMS_ERROR);
        String email = requestBody.getEmail();
        String password = requestBody.getPassword();
        String code = requestBody.getCode();
        ThrowUtils.throwIf(StringUtils.isAnyBlank(email, password), ErrorCode.PARAMS_ERROR, "邮箱和密码不能为空");

        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("userEmail", email);
        User user = userService.getOne(queryWrapper);

        String encryptPassword = DigestUtils.md5DigestAsHex(
                (com.shaneShark.service.impl.UserServiceImpl.SALT + password).getBytes());

        if (user == null) {
            // 新用户：必须先验证验证码，然后创建账号
            ThrowUtils.throwIf(StringUtils.isBlank(code), ErrorCode.PARAMS_ERROR, "验证码不能为空");
            verificationCodeService.validateCode(email, code);

            user = new User();
            user.setUserAccount(email);
            user.setUserEmail(email);
            user.setUserRole(UserRoleEnum.USER.getValue());
            user.setUserPassword(encryptPassword);
            boolean saved = userService.save(user);
            ThrowUtils.throwIf(!saved, ErrorCode.OPERATION_ERROR, "注册失败");
        } else {
            // 老用户：仅校验邮箱 + 密码
            ThrowUtils.throwIf(!encryptPassword.equals(user.getUserPassword()),
                    ErrorCode.PARAMS_ERROR, "邮箱或密码错误");
        }

        // 记录普通用户登录态
        request.getSession().setAttribute(com.shaneShark.constant.UserConstant.USER_LOGIN_STATE, user);
        boolean isAdmin = UserRoleEnum.ADMIN.getValue().equals(user.getUserRole());
        if (isAdmin) {
            // 仅管理员账号才打 QA 管理员会话标记
            request.getSession().setAttribute(QaAdminAuthService.QA_ADMIN_SESSION_KEY, Boolean.TRUE);
        } else {
            // 普通用户：如果当前 session 已经有管理员权限（可能是通过口令登录设置的），保留它
            // 这样两种登录方式可以独立工作，不会互相覆盖
            Object existingAdminFlag = request.getSession().getAttribute(QaAdminAuthService.QA_ADMIN_SESSION_KEY);
            if (existingAdminFlag == null || !(existingAdminFlag instanceof Boolean) || !((Boolean) existingAdminFlag)) {
                // 只有当 session 中没有有效的管理员权限时，才移除（防止继承上一位管理员的会话）
                request.getSession().removeAttribute(QaAdminAuthService.QA_ADMIN_SESSION_KEY);
            }
            // 如果已经有管理员权限（通过口令登录设置），就保留它，不做任何操作
        }
        return ResultUtils.success(true);
    }

    @PostMapping("/logout")
    public BaseResponse<Boolean> logout(HttpServletRequest request) {
        qaAdminAuthService.logout(request);
        return ResultUtils.success(true);
    }

    @GetMapping("/session")
    public BaseResponse<Boolean> session(HttpServletRequest request) {
        return ResultUtils.success(qaAdminAuthService.isAdmin(request));
    }

    @GetMapping("/list")
    public BaseResponse<Page<QaVO>> listQa(QaQueryRequest qaQueryRequest, HttpServletRequest request) {
        qaAdminAuthService.ensureAdmin(request);
        if (qaQueryRequest == null) {
            qaQueryRequest = new QaQueryRequest();
        }
        long current = qaQueryRequest.getCurrent() > 0 ? qaQueryRequest.getCurrent() : 1;
        long size = qaQueryRequest.getPageSize() > 0 ? qaQueryRequest.getPageSize() : 20;
        ThrowUtils.throwIf(size > 100, ErrorCode.PARAMS_ERROR, "单页最多 100 条");
        Page<QaInfo> qaPage = qaInfoService.page(new Page<>(current, size),
                qaInfoService.getQueryWrapper(qaQueryRequest));
        Page<QaVO> qaVOPage = qaInfoService.getQaVOPage(qaPage);
        return ResultUtils.success(qaVOPage);
    }

    @GetMapping("/{id}")
    public BaseResponse<QaVO> getQa(@PathVariable Long id, HttpServletRequest request) {
        qaAdminAuthService.ensureAdmin(request);
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        QaInfo qaInfo = qaInfoService.getById(id);
        ThrowUtils.throwIf(qaInfo == null, ErrorCode.NOT_FOUND_ERROR);
        QaVO qaVO = qaInfoService.getQaVO(qaInfo);
        return ResultUtils.success(qaVO);
    }

    @PostMapping
    public BaseResponse<Long> addQa(@RequestBody QaAddRequest qaAddRequest, HttpServletRequest request) {
        qaAdminAuthService.ensureAdmin(request);
        if (qaAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        QaInfo qaInfo = new QaInfo();
        BeanUtils.copyProperties(qaAddRequest, qaInfo);
        qaInfoService.validQaInfo(qaInfo, true);
        qaInfo.setViewCount(0);
        qaInfo.setIsHot(qaInfo.getIsHot() == null ? 0 : qaInfo.getIsHot());
        qaInfo.setCreateTime(new Date());
        qaInfo.setUpdateTime(new Date());
        boolean result = qaInfoService.save(qaInfo);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(qaInfo.getId());
    }

    @PutMapping("/{id}")
    public BaseResponse<Boolean> updateQa(@PathVariable Long id, @RequestBody QaUpdateRequest qaUpdateRequest,
                                          HttpServletRequest request) {
        qaAdminAuthService.ensureAdmin(request);
        if (qaUpdateRequest == null || id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        QaInfo qaInfo = qaInfoService.getById(id);
        ThrowUtils.throwIf(qaInfo == null, ErrorCode.NOT_FOUND_ERROR);
        BeanUtils.copyProperties(qaUpdateRequest, qaInfo);
        qaInfo.setId(id);
        qaInfoService.validQaInfo(qaInfo, false);
        qaInfo.setUpdateTime(new Date());
        boolean result = qaInfoService.updateById(qaInfo);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    @DeleteMapping("/{id}")
    public BaseResponse<Boolean> deleteQa(@PathVariable Long id, HttpServletRequest request) {
        qaAdminAuthService.ensureAdmin(request);
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        boolean result = qaInfoService.removeById(id);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }
}

