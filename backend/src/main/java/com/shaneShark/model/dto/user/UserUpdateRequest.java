package com.shaneShark.model.dto.user;

import java.io.Serializable;
import lombok.Data;

/**
 * 用户更新请求
 *
 *
 */
@Data
public class UserUpdateRequest implements Serializable {
    /**
     * id
     */
    private Long id;

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
     * 用户角色：user/admin/ban
     */
    private String userRole;

    /**
     * 性别：男/女/保密
     */
    private String gender;

    /**
     * 年级
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