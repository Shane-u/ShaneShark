-- QA知识库表结构（SQLite）
CREATE TABLE IF NOT EXISTS qa_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    is_hot TINYINT(1) DEFAULT 0,
    view_count INT DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tag ON qa_info(tag);
CREATE INDEX IF NOT EXISTS idx_is_hot ON qa_info(is_hot);
CREATE INDEX IF NOT EXISTS idx_create_time ON qa_info(create_time);

