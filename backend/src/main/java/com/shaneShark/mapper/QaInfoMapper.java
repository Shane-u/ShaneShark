package com.shaneShark.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shaneShark.model.entity.QaInfo;
import org.apache.ibatis.annotations.Mapper;

/**
 * QA知识库数据库操作
 */
@Mapper
public interface QaInfoMapper extends BaseMapper<QaInfo> {
}

