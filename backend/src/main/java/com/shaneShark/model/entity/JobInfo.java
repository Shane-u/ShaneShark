package com.shaneShark.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * BOSS直聘招聘信息表
 *
 * @author digital
 */
@TableName(value = "job_info")
@Data
public class JobInfo implements Serializable {

    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 招聘链接
     */
    private String url;

    /**
     * 工作名称
     */
    private String workName;

    /**
     * 薪水
     */
    private String workSalary;

    /**
     * 工作地址
     */
    private String workAddress;

    /**
     * 工作内容
     */
    private String workContent;

    /**
     * 要求工作年限
     */
    private String workYear;

    /**
     * 学历要求
     */
    private String graduate;

    /**
     * 招聘人什么时候活跃
     */
    private String hrTime;

    /**
     * 公司名
     */
    private String companyName;

    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 更新时间
     */
    private Date updateTime;

    /**
     * 是否删除
     */
    @TableLogic
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}

