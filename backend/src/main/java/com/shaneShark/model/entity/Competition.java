package com.shaneShark.model.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;

/**
 * 竞赛信息实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Competition implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 排名
     */
    private Integer rank;

    /**
     * 竞赛名称
     */
    private String name;

    /**
     * 热度值
     */
    private String popularity;

    /**
     * 竞赛链接
     */
    private String url;
}
