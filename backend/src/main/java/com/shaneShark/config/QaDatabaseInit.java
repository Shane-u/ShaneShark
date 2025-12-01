package com.shaneShark.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * QA数据库初始化（SQLite）
 * 注意：当前项目使用MySQL作为主数据源
 * 如需使用SQLite，需要配置多数据源，这里提供一个初始化示例
 */
@Component
@Slf4j
public class QaDatabaseInit implements CommandLineRunner {

    @Override
    public void run(String... args) {
        // 如果使用SQLite，在这里初始化数据库
        // 当前项目使用MySQL，QA表会在MySQL中创建
        // 如需切换到SQLite，需要：
        // 1. 配置多数据源
        // 2. 为QA模块指定SQLite数据源
        // 3. 执行sql/create_qa_table.sql创建表结构
        
        log.info("QA数据库初始化完成（当前使用MySQL）");
    }
}

