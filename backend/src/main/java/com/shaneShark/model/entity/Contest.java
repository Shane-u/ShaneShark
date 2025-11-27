package com.shaneShark.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 竞赛实体类
 *
 * @author Shane
 */
@TableName(value = "contest")
@Data
public class Contest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 竞赛ID（来自API）
     */
    private Long contestId;

    /**
     * 竞赛名称
     */
    private String contestName;

    /**
     * 竞赛URL
     */
    private String contestUrl;

    /**
     * 是否为考试：0-否，2-是
     */
    private Integer isExam;

    /**
     * 竞赛状态
     */
    private Integer isContestStatus;

    /**
     * 报名开始时间（时间戳）
     */
    private Long registStartTime;

    /**
     * 报名结束时间（时间戳）
     */
    private Long registEndTime;

    /**
     * 竞赛开始时间（时间戳）
     */
    private Long contestStartTime;

    /**
     * 竞赛结束时间（时间戳）
     */
    private Long contestEndTime;

    /**
     * 缩略图URL
     */
    private String thumbPic;

    /**
     * 级别名称（校级/市级/省级等）
     */
    private String levelName;

    /**
     * 主办方
     */
    private String organiser;

    /**
     * 主办方名称
     */
    private String organiserName;

    /**
     * 参赛范围
     */
    private String enterRange;

    /**
     * 竞赛一级分类
     */
    private String contestClassFirst;

    /**
     * 竞赛二级分类
     */
    private String contestClassSecond;

    /**
     * 竞赛二级分类ID（关联competition_category.categoryId）
     */
    private Integer contestClassSecondId;

    /**
     * 时间状态
     */
    private Integer timeStatus;

    /**
     * 时间状态名称
     */
    private String timeName;

    /**
     * 排名
     */
    private Integer rank;

    /**
     * 是否新竞赛
     */
    private Integer isNew;

    /**
     * 模块
     */
    private Integer module;

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
}















