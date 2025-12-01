package com.shaneShark.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * QA知识库实体
 */
@TableName(value = "qa_info")
@Data
public class QaInfo implements Serializable {

    /**
     * id（主键）
     *
     * 说明（SQLite 兼容）：
     * - 这里使用 ASSIGN_ID，让 MyBatis-Plus 在插入前自动生成全局唯一 ID
     * - 避免依赖 JDBC 的 getGeneratedKeys，从而绕过 SQLite 驱动不支持生成键的限制
     * - 对应的 SQLite 表中只需保证 id 列是 INTEGER PRIMARY KEY（可带或不带 AUTOINCREMENT）
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 问题标题
     */
    private String question;

    /**
     * 答案内容（text/lake格式）
     */
    private String answer;

    /**
     * 标签（关联预设标签）
     */
    private String tag;

    /**
     * 是否精选（0=否，1=是）
     */
    @TableField(value = "is_hot")
    private Integer isHot;

    /**
     * 浏览量（默认0）
     */
    @TableField(value = "view_count")
    private Integer viewCount;

    /**
     * 创建时间
     */
    @TableField(value = "create_time")
    private Date createTime;

    /**
     * 更新时间
     */
    @TableField(value = "update_time")
    private Date updateTime;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}

