package com.shaneShark.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shaneShark.model.entity.VerificationCode;
import org.apache.ibatis.annotations.Mapper;

/**
 * 验证码Mapper
 */
@Mapper
public interface VerificationCodeMapper extends BaseMapper<VerificationCode> {
}

