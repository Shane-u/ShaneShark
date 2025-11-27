package com.shaneShark.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 成长记录图片
 *
 * @author Shane
 */
@TableName(value = "growth_image")
@Data
public class GrowthImage implements Serializable {

    /**
     * 图片id
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 用户id
     */
    private Long userId;

    /**
     * 成长记录id（如果是记录在成长记录中的才有）
     */
    private Long growthRecordId;

    /**
     * 存储在minio的图片地址
     */
    private String imageUrl;

    /**
     * 图片名
     */
    private String imageName;

    /**
     * 图片大小（字节）
     */
    private Long imageSize;

    /**
     * 图片MD5值
     */
    private String imageMd5;

    /**
     * 类型：1-单纯作为照片存储，2-成长记录中的照片
     */
    private Integer type;

    /**
     * 目标上传时间（用户选择的上传时间）
     */
    private Date uploadTime;

    /**
     * 存储时间
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

