package com.shaneShark.model.dto.user;

import java.io.Serializable;
import lombok.Data;

/**
 * 用户更新个人信息请求
 *
 *
 */
@Data
public class UserUpdateMyRequest implements Serializable {

    /**
     * 用户昵称
     */
    private String userName;

    /**
     * 用户头像
     */
    private String userAvatar;

    /**
     * 简介
     */
    private String userProfile;

    /**
     * 性别：男/女/保密
     */
    private String gender;

    /**
     * 年级，如：大一/大二/大三/大四
     */
    private String grade;

    /**
     * 专业
     */
    private String major;

    /**
     * 学校
     */
    private String school;

    private static final long serialVersionUID = 1L;
}