package com.shaneShark.service.impl;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.RandomUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shaneShark.common.ErrorCode;
import com.shaneShark.exception.BusinessException;
import com.shaneShark.mapper.VerificationCodeMapper;
import com.shaneShark.model.entity.VerificationCode;
import com.shaneShark.service.EmailService;
import com.shaneShark.service.SmsService;
import com.shaneShark.service.VerificationCodeService;
import com.shaneShark.utils.AccountUtils;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class VerificationCodeServiceImpl extends ServiceImpl<VerificationCodeMapper, VerificationCode> implements VerificationCodeService {

    @Resource
    private SmsService smsService;

    @Resource
    private EmailService emailService;

    @Override
    public void sendCode(String account) {
        String type = AccountUtils.getAccountType(account);
        String code = RandomUtil.randomNumbers(6); // 生成6位数字验证码

        // 验证码10分钟内有效
        Date expireTime = DateUtil.offsetMinute(new Date(), 10);

        // 保存验证码
        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setAccount(account);
        verificationCode.setCode(code);
        verificationCode.setType(type);
        verificationCode.setStatus(VerificationCode.STATUS_UNUSED);
        verificationCode.setExpireTime(expireTime);
        this.save(verificationCode);

        // 发送验证码
        if (VerificationCode.TYPE_PHONE.equals(type)) {
            smsService.sendSms(account, code);
        } else {
            // 使用漂亮的HTML模板发送邮件
            emailService.sendVerificationCodeEmail(account, code);
        }
    }

    @Override
    public void validateCode(String account, String code) {
        QueryWrapper<VerificationCode> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("account", account)
                .eq("code", code)
                .eq("status", VerificationCode.STATUS_UNUSED)
                .gt("expireTime", new Date());

        VerificationCode verificationCode = this.getOne(queryWrapper);
        if (verificationCode == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "验证码错误或已过期");
        }

        // 标记为已使用
        verificationCode.setStatus(VerificationCode.STATUS_USED);
        this.updateById(verificationCode);
    }
}