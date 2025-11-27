package com.shaneShark.controller;

import cn.hutool.captcha.LineCaptcha;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shaneShark.annotation.AuthCheck;
import com.shaneShark.common.BaseResponse;
import com.shaneShark.common.DeleteRequest;
import com.shaneShark.common.ErrorCode;
import com.shaneShark.common.ResultUtils;
import com.shaneShark.config.WxOpenConfig;
import com.shaneShark.constant.UserConstant;
import com.shaneShark.exception.BusinessException;
import com.shaneShark.exception.ThrowUtils;
import com.shaneShark.model.dto.user.*;
import com.shaneShark.model.entity.User;
import com.shaneShark.model.vo.LoginUserVO;
import com.shaneShark.model.vo.UserVO;
import com.shaneShark.service.UserService;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Base64;
import java.util.List;

import com.shaneShark.service.VerificationCodeService;
import com.shaneShark.utils.CaptchaUtils;
import com.shaneShark.manager.MinioManager;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import static com.shaneShark.service.impl.UserServiceImpl.SALT;

/**
 * 用户接口
 *
 */
@RestController
@RequestMapping("/user")
@Slf4j
public class UserController {

    @Resource
    private UserService userService;

    @Resource
    private WxOpenConfig wxOpenConfig;

    @Resource
    private VerificationCodeService verificationCodeService;

    @Resource
    private MinioManager minioManager;

    /**
     * 获取图形验证码
     */
    @GetMapping("/captcha")
    public String getCaptcha(HttpServletRequest request, HttpServletResponse response) throws IOException {
        LineCaptcha captcha = CaptchaUtils.generateCaptcha(request);

        // 将图片流写入字节数组
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        captcha.write(baos);
        byte[] imageBytes = baos.toByteArray();

        // 转换为Base64字符串
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
    }


    /**
     * 发送验证码（手机/邮箱）
     */
    @PostMapping("/sendCode")
    public BaseResponse<Boolean> sendCode(@RequestParam String account) {
        verificationCodeService.sendCode(account);
        return ResultUtils.success(true);
    }

    /**
     * 账号密码登录
     */
    @PostMapping("/login/account")
    public BaseResponse<LoginUserVO> loginByAccount(@RequestBody AccountPasswordLoginRequest request, HttpServletRequest httpRequest) {
        String account = request.getAccount();
        String password = request.getPassword();
        String captcha = request.getCaptcha();
        LoginUserVO loginUserVO = userService.loginByAccountAndPassword(account, password, captcha, httpRequest);
        return ResultUtils.success(loginUserVO);
    }

    /**
     * 验证码登录
     */
    @PostMapping("/login/code")
    public BaseResponse<LoginUserVO> loginByCode(@RequestBody CodeLoginRequest request, HttpServletRequest httpRequest) {
        String account = request.getAccount();
        String code = request.getCode();
        String captcha = request.getCaptcha();
        LoginUserVO loginUserVO = userService.loginByAccountAndCode(account, code, captcha, httpRequest);
        return ResultUtils.success(loginUserVO);
    }

    // region 登录相关

    /**
     * 用户注册
     *
     * @param userRegisterRequest
     * @return
     */
    @PostMapping("/register")
    public BaseResponse<Long> userRegister(@RequestBody UserRegisterRequest userRegisterRequest, HttpServletRequest httpRequest) {
        if (userRegisterRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String userAccount = userRegisterRequest.getUserAccount(); // 手机号/邮箱
        String userPassword = userRegisterRequest.getUserPassword();
        String checkPassword = userRegisterRequest.getCheckPassword();
        String code = userRegisterRequest.getCode();
        String captcha = userRegisterRequest.getCaptcha();
        if (StringUtils.isAnyBlank(userAccount, userPassword, checkPassword, code, captcha)) {
            return null;
        }
        long result = userService.userRegister(userAccount, userPassword, checkPassword, code, captcha, httpRequest);
        return ResultUtils.success(result);
    }

    /**
     * 用户登录
     *
     * @param userLoginRequest
     * @param request
     * @return
     */
    @PostMapping("/login")
    public BaseResponse<LoginUserVO> userLogin(@RequestBody UserLoginRequest userLoginRequest, HttpServletRequest request) {
        if (userLoginRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String userAccount = userLoginRequest.getUserAccount();
        String userPassword = userLoginRequest.getUserPassword();
        if (StringUtils.isAnyBlank(userAccount, userPassword)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        LoginUserVO loginUserVO = userService.userLogin(userAccount, userPassword, request);
        return ResultUtils.success(loginUserVO);
    }

    /**
     * 用户注销
     *
     * @param request
     * @return
     */
    @PostMapping("/logout")
    public BaseResponse<Boolean> userLogout(HttpServletRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        boolean result = userService.userLogout(request);
        return ResultUtils.success(result);
    }

    /**
     * 获取当前登录用户
     *
     * @param request
     * @return
     */
    @GetMapping("/get/login")
    public BaseResponse<LoginUserVO> getLoginUser(HttpServletRequest request) {
        User user = userService.getLoginUser(request);
        return ResultUtils.success(userService.getLoginUserVO(user));
    }

    // endregion

    // region 增删改查

    /**
     * 创建用户
     *
     * @param userAddRequest
     * @param request
     * @return
     */
    @PostMapping("/add")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Long> addUser(@RequestBody UserAddRequest userAddRequest, HttpServletRequest request) {
        if (userAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User user = new User();
        BeanUtils.copyProperties(userAddRequest, user);
        // 默认密码 12345678
        String defaultPassword = "12345678";
        String encryptPassword = DigestUtils.md5DigestAsHex((SALT + defaultPassword).getBytes());
        user.setUserPassword(encryptPassword);
        boolean result = userService.save(user);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(user.getId());
    }

    /**
     * 删除用户
     *
     * @param deleteRequest
     * @param request
     * @return
     */
    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deleteUser(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        boolean b = userService.removeById(deleteRequest.getId());
        return ResultUtils.success(b);
    }

    /**
     * 更新用户
     *
     * @param userUpdateRequest
     * @param request
     * @return
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updateUser(@RequestBody UserUpdateRequest userUpdateRequest,
                                            HttpServletRequest request) {
        if (userUpdateRequest == null || userUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User user = new User();
        BeanUtils.copyProperties(userUpdateRequest, user);
        boolean result = userService.updateById(user);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 根据 id 获取用户（仅管理员）
     *
     * @param id
     * @param request
     * @return
     */
    @GetMapping("/get")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<User> getUserById(long id, HttpServletRequest request) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User user = userService.getById(id);
        ThrowUtils.throwIf(user == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(user);
    }

    /**
     * 根据 id 获取包装类
     *
     * @param id
     * @param request
     * @return
     */
    @GetMapping("/get/vo")
    public BaseResponse<UserVO> getUserVOById(long id, HttpServletRequest request) {
        BaseResponse<User> response = getUserById(id, request);
        User user = response.getData();
        return ResultUtils.success(userService.getUserVO(user));
    }

    /**
     * 分页获取用户列表（仅管理员）
     *
     * @param userQueryRequest
     * @param request
     * @return
     */
    @PostMapping("/list/page")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Page<User>> listUserByPage(@RequestBody UserQueryRequest userQueryRequest,
                                                   HttpServletRequest request) {
        long current = userQueryRequest.getCurrent();
        long size = userQueryRequest.getPageSize();
        Page<User> userPage = userService.page(new Page<>(current, size),
                userService.getQueryWrapper(userQueryRequest));
        return ResultUtils.success(userPage);
    }

    /**
     * 分页获取用户封装列表
     *
     * @param userQueryRequest
     * @param request
     * @return
     */
    @PostMapping("/list/page/vo")
    public BaseResponse<Page<UserVO>> listUserVOByPage(@RequestBody UserQueryRequest userQueryRequest,
                                                       HttpServletRequest request) {
        if (userQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = userQueryRequest.getCurrent();
        long size = userQueryRequest.getPageSize();
        // 限制爬虫
        ThrowUtils.throwIf(size > 20, ErrorCode.PARAMS_ERROR);
        Page<User> userPage = userService.page(new Page<>(current, size),
                userService.getQueryWrapper(userQueryRequest));
        Page<UserVO> userVOPage = new Page<>(current, size, userPage.getTotal());
        List<UserVO> userVO = userService.getUserVO(userPage.getRecords());
        userVOPage.setRecords(userVO);
        return ResultUtils.success(userVOPage);
    }

    // endregion

    /**
     * 更新个人信息
     *
     * @param userUpdateMyRequest
     * @param request
     * @return
     */
    @PostMapping("/update/my")
    public BaseResponse<Boolean> updateMyUser(@RequestBody UserUpdateMyRequest userUpdateMyRequest,
                                              HttpServletRequest request) {
        if (userUpdateMyRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        User user = new User();
        BeanUtils.copyProperties(userUpdateMyRequest, user);
        user.setId(loginUser.getId());
        boolean result = userService.updateById(user);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 头像上传（MinIO）
     * 仿照成长记录上传逻辑，将图片上传到 MinIO 并返回可访问 URL
     */
    @PostMapping("/upload/avatar")
    public BaseResponse<String> uploadAvatar(@RequestPart("file") MultipartFile file, HttpServletRequest request) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片不能为空");
        }
        User loginUser = userService.getLoginUser(request);
        try {
            byte[] fileBytes = file.getBytes();
            InputStream inputStream = new ByteArrayInputStream(fileBytes);
            // 计算 MD5，路径中带上 userId 做分隔
            String md5 = minioManager.calculateMerkleTreeMd5(new ByteArrayInputStream(fileBytes), 2 * 1024 * 1024);
            String objectName = "avatars/" + loginUser.getId() + "/" + md5 + "/" + file.getOriginalFilename();
            String url = minioManager.putObject(objectName, inputStream, file.getContentType(), file.getSize());
            url = url.replace(":9002/", ":9003/");
            return ResultUtils.success(url);
        } catch (Exception e) {
            log.error("头像上传失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "头像上传失败");
        }
    }
}
