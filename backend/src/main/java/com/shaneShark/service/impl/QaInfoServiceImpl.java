package com.shaneShark.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shaneShark.common.ErrorCode;
import com.shaneShark.exception.BusinessException;
import com.shaneShark.exception.ThrowUtils;
import com.shaneShark.mapper.QaInfoMapper;
import com.shaneShark.model.dto.qa.QaQueryRequest;
import com.shaneShark.model.entity.QaInfo;
import com.shaneShark.model.vo.QaVO;
import com.shaneShark.service.QaInfoService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * QA知识库服务实现
 */
@Service
public class QaInfoServiceImpl extends ServiceImpl<QaInfoMapper, QaInfo> implements QaInfoService {

    @Override
    public void validQaInfo(QaInfo qaInfo, boolean add) {
        if (qaInfo == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String question = qaInfo.getQuestion();
        String answer = qaInfo.getAnswer();
        String tag = qaInfo.getTag();
        // 创建时，参数不能为空
        if (add) {
            ThrowUtils.throwIf(StringUtils.isAnyBlank(question, answer, tag), ErrorCode.PARAMS_ERROR);
        }
        // 有参数则校验
        if (StringUtils.isNotBlank(question) && question.length() > 500) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "问题标题过长");
        }
        if (StringUtils.isNotBlank(tag) && tag.length() > 50) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "标签过长");
        }
    }

    @Override
    public QueryWrapper<QaInfo> getQueryWrapper(QaQueryRequest qaQueryRequest) {
        QueryWrapper<QaInfo> queryWrapper = new QueryWrapper<>();
        if (qaQueryRequest == null) {
            queryWrapper.orderByDesc("create_time");
            return queryWrapper;
        }
        String tag = qaQueryRequest.getTag();
        String keyword = qaQueryRequest.getKeyword();
        Integer isHot = qaQueryRequest.getIsHot();
        queryWrapper.eq(StringUtils.isNotBlank(tag), "tag", tag);
        queryWrapper.eq(isHot != null, "is_hot", isHot);
        queryWrapper.like(StringUtils.isNotBlank(keyword), "question", keyword);
        queryWrapper.orderByDesc("create_time");
        return queryWrapper;
    }

    @Override
    public QaVO getQaVO(QaInfo qaInfo) {
        if (qaInfo == null) {
            return null;
        }
        QaVO qaVO = new QaVO();
        BeanUtils.copyProperties(qaInfo, qaVO);
        return qaVO;
    }

    @Override
    public Page<QaVO> getQaVOPage(Page<QaInfo> qaPage) {
        List<QaVO> qaVOList = qaPage.getRecords().stream()
                .map(this::getQaVO)
                .collect(Collectors.toList());
        Page<QaVO> qaVOPage = new Page<>(qaPage.getCurrent(), qaPage.getSize(), qaPage.getTotal());
        qaVOPage.setRecords(qaVOList);
        return qaVOPage;
    }
}

