# 数据库初始化

-- 创建库
create database if not exists shaneShark;

-- 切换库
use shaneShark;

-- 用户表
create table if not exists user
(
    id           bigint auto_increment comment 'id' primary key,
    userAccount  varchar(256)                           not null comment '账号（邮箱或者手机号）',
    userPassword varchar(512)                           not null comment '密码',
    userName     varchar(256)                           null comment '用户昵称',
    userAvatar   varchar(1024)                          null comment '用户头像',
    userProfile  varchar(512)                           null comment '用户简介',
    gender       varchar(16)                            null comment '性别：男/女/保密',
    userPhone    varchar(512)                           null comment '用户手机号',
    userEmail    varchar(512)                           null comment '用户邮箱',
    userRole     varchar(256) default 'user'            not null comment '用户角色：user/admin/ban',
    createTime   datetime     default CURRENT_TIMESTAMP not null comment '创建时间',
    updateTime   datetime     default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    isDelete     tinyint      default 0                 not null comment '是否删除'
) comment '用户表' collate = utf8mb4_unicode_ci;

-- 验证码表
create table if not exists verification_code
(
    id           bigint auto_increment comment 'id' primary key,
    account      varchar(256)                           not null comment '手机号/邮箱',
    code         varchar(6)                             not null comment '验证码',
    type         varchar(10)                            not null comment '类型：PHONE/EMAIL',
    status       tinyint      default 0                 not null comment '状态：0-未使用 1-已使用',
    expireTime   datetime                               not null comment '过期时间',
    createTime   datetime     default CURRENT_TIMESTAMP not null comment '创建时间',
    updateTime   datetime     default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    isDelete     tinyint      default 0                 not null comment '是否删除'
) comment '验证码表' collate = utf8mb4_unicode_ci;