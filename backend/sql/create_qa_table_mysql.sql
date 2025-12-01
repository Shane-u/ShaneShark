-- QA知识库表结构（MySQL版本，当前项目使用）
CREATE TABLE IF NOT EXISTS qa_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question VARCHAR(500) NOT NULL COMMENT '问题标题',
    answer TEXT NOT NULL COMMENT '答案内容（text/lake格式）',
    tag VARCHAR(50) NOT NULL COMMENT '标签',
    is_hot TINYINT(1) DEFAULT 0 COMMENT '是否精选（0=否，1=是）',
    view_count INT DEFAULT 0 COMMENT '浏览量',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='QA知识库表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tag ON qa_info(tag);
CREATE INDEX IF NOT EXISTS idx_is_hot ON qa_info(is_hot);
CREATE INDEX IF NOT EXISTS idx_create_time ON qa_info(create_time);

