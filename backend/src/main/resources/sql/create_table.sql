-- 数据库初始化
-- 切换库

-- 用户表
CREATE TABLE IF NOT EXISTS user (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,              -- id
    userAccount  TEXT                      NOT NULL,             -- 账号（邮箱或者手机号）
    userPassword TEXT                      NOT NULL,             -- 密码
    userName     TEXT,                                           -- 用户昵称
    userAvatar   TEXT,                                           -- 用户头像
    userProfile  TEXT,                                           -- 用户简介
    gender       TEXT,                                           -- 性别：男/女/保密
    userPhone    TEXT,                                           -- 用户手机号
    userEmail    TEXT,                                           -- 用户邮箱
    userRole     TEXT      NOT NULL DEFAULT 'user',              -- 用户角色：user/admin/ban
    createTime   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    updateTime   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
    isDelete     INTEGER  NOT NULL DEFAULT 0                     -- 是否删除
);

CREATE TABLE IF NOT EXISTS verification_code (
                                                 id          INTEGER PRIMARY KEY AUTOINCREMENT,          -- id
     account     TEXT             NOT NULL,                  -- 手机号/邮箱
     code        TEXT             NOT NULL,                  -- 验证码（6 位）
     type        TEXT             NOT NULL,                  -- 类型：PHONE / EMAIL
     status      INTEGER NOT NULL DEFAULT 0,                 -- 状态：0-未使用 1-已使用
     expireTime  DATETIME         NOT NULL,                  -- 过期时间
     createTime  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updateTime  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     isDelete    INTEGER  NOT NULL DEFAULT 0                 -- 是否删除
);

