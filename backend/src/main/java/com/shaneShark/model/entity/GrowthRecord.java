package com.shaneShark.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import lombok.Data;

/**
 * 成长记录
 *
 * @author Shane
 */
@TableName(value = "growth_record")
@Data
public class GrowthRecord implements Serializable {

    /**
     * 成长记录id
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 用户id
     */
    private Long userId;

    /**
     * 事件描述
     */
    private String eventDesc;

    /**
     * 个人感悟
     */
    private String reflection;

    /**
     * 重要程度（最多五颗星，支持4.5颗星）
     */
    private BigDecimal importance;

    /**
     * 记录的时间
     */
    private Date recordTime;

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















