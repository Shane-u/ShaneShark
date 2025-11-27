package com.shaneShark.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 验证码实体类
 */
@TableName(value = "verification_code")
@Data
public class VerificationCode implements Serializable {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private String account;
    private String code;
    private String type; // PHONE/EMAIL
    private Integer status; // 0-未使用 1-已使用
    private Date expireTime;
    private Date createTime;
    private Date updateTime;
    @TableLogic
    private Integer isDelete;

    public static final String TYPE_PHONE = "PHONE";
    public static final String TYPE_EMAIL = "EMAIL";
    public static final Integer STATUS_UNUSED = 0;
    public static final Integer STATUS_USED = 1;
}