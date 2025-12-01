package com.shaneShark.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.shaneShark.model.dto.qa.QaQueryRequest;
import com.shaneShark.model.entity.QaInfo;
import com.shaneShark.model.vo.QaVO;

/**
 * QA知识库服务
 */
public interface QaInfoService extends IService<QaInfo> {

    /**
     * 校验QA
     *
     * @param qaInfo
     * @param add
     */
    void validQaInfo(QaInfo qaInfo, boolean add);

    /**
     * 获取查询条件
     *
     * @param qaQueryRequest
     * @return
     */
    QueryWrapper<QaInfo> getQueryWrapper(QaQueryRequest qaQueryRequest);

    /**
     * 获取QA封装
     *
     * @param qaInfo
     * @return
     */
    QaVO getQaVO(QaInfo qaInfo);

    /**
     * 分页获取QA封装
     *
     * @param qaPage
     * @return
     */
    Page<QaVO> getQaVOPage(Page<QaInfo> qaPage);
}

