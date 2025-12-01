package com.shaneShark.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shaneShark.common.BaseResponse;
import com.shaneShark.common.ErrorCode;
import com.shaneShark.common.ResultUtils;
import com.shaneShark.exception.BusinessException;
import com.shaneShark.exception.ThrowUtils;
import com.shaneShark.model.dto.qa.QaQueryRequest;
import com.shaneShark.model.entity.QaInfo;
import com.shaneShark.model.vo.QaVO;
import com.shaneShark.service.QaInfoService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * QA知识库接口
 */
@RestController
@RequestMapping("/qa")
@Slf4j
public class QaController {

    @Resource
    private QaInfoService qaInfoService;

    /**
     * 分页查询QA列表
     *
     * @param qaQueryRequest
     * @return
     */
    @GetMapping("/list")
    public BaseResponse<Page<QaVO>> listQa(QaQueryRequest qaQueryRequest) {
        // 如果请求参数为空，使用默认值
        if (qaQueryRequest == null) {
            qaQueryRequest = new QaQueryRequest();
        }
        long current = qaQueryRequest.getCurrent() > 0 ? qaQueryRequest.getCurrent() : 1;
        long size = qaQueryRequest.getPageSize() > 0 ? qaQueryRequest.getPageSize() : 12;
        // 限制爬虫
        ThrowUtils.throwIf(size > 20, ErrorCode.PARAMS_ERROR);
        Page<QaInfo> qaPage = qaInfoService.page(new Page<>(current, size),
                qaInfoService.getQueryWrapper(qaQueryRequest));
        Page<QaVO> qaVOPage = qaInfoService.getQaVOPage(qaPage);
        return ResultUtils.success(qaVOPage);
    }

    /**
     * 获取单个QA详情
     *
     * @param id
     * @return
     */
    @GetMapping("/{id}")
    public BaseResponse<QaVO> getQaById(@PathVariable Long id) {
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        QaInfo qaInfo = qaInfoService.getById(id);
        ThrowUtils.throwIf(qaInfo == null, ErrorCode.NOT_FOUND_ERROR);
        // 增加浏览量
        qaInfo.setViewCount((qaInfo.getViewCount() == null ? 0 : qaInfo.getViewCount()) + 1);
        qaInfoService.updateById(qaInfo);
        QaVO qaVO = qaInfoService.getQaVO(qaInfo);
        return ResultUtils.success(qaVO);
    }

}

