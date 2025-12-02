package com.shaneShark.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * SQLite数据库初始化
 * 应用启动时自动检查并创建所有表结构（user, verification_code, qa_info）
 */
@Component
@Slf4j
public class QaDatabaseInit implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 需要初始化的表列表
    private static final List<String> REQUIRED_TABLES = Arrays.asList("user", "verification_code", "qa_info");
    
    // SQL初始化脚本列表
    private static final List<String> SQL_SCRIPTS = Arrays.asList(
        "sql/create_table.sql",
        "sql/create_qa_table.sql"
    );

    @Override
    public void run(String... args) {
        try {
            log.info("开始检查数据库表结构...");
            
            // 检查哪些表不存在
            List<String> missingTables = checkMissingTables();
            
            if (missingTables.isEmpty()) {
                log.info("所有表已存在，跳过初始化");
            } else {
                log.info("发现缺失的表: {}", missingTables);
                log.info("开始初始化数据库表...");
                
                // 执行所有SQL初始化脚本
                for (String sqlScript : SQL_SCRIPTS) {
                    executeSqlScript(sqlScript);
                }
                
                log.info("数据库表初始化完成");
            }
            
            log.info("数据库初始化完成（当前使用SQLite）");
        } catch (Exception e) {
            log.error("数据库初始化失败", e);
            // 不抛出异常，避免影响应用启动
            // 如果数据库文件不存在，SQLite会自动创建
        }
    }

    /**
     * 检查缺失的表
     */
    private List<String> checkMissingTables() {
        List<String> missingTables = new java.util.ArrayList<>();
        
        for (String tableName : REQUIRED_TABLES) {
            try {
                String checkTableSql = "SELECT name FROM sqlite_master WHERE type='table' AND name=?";
                String result = jdbcTemplate.queryForObject(checkTableSql, String.class, tableName);
                if (result == null) {
                    missingTables.add(tableName);
                }
            } catch (Exception e) {
                // 表不存在
                missingTables.add(tableName);
            }
        }
        
        return missingTables;
    }

    /**
     * 执行SQL初始化脚本
     */
    private void executeSqlScript(String sqlScriptPath) {
        try {
            ClassPathResource resource = new ClassPathResource(sqlScriptPath);
            if (!resource.exists()) {
                log.warn("SQL脚本文件不存在: {}", sqlScriptPath);
                return;
            }
            
            String sql = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            
            // 执行SQL语句（SQLite需要按分号分割执行，忽略注释）
            String[] statements = sql.split(";");
            for (String statement : statements) {
                statement = statement.trim();
                // 跳过空语句和注释
                if (!statement.isEmpty() && !statement.startsWith("--")) {
                    // 移除行内注释
                    statement = statement.replaceAll("--.*", "").trim();
                    if (!statement.isEmpty()) {
                        jdbcTemplate.execute(statement);
                        log.debug("执行SQL: {}", statement.substring(0, Math.min(50, statement.length())));
                    }
                }
            }
            
            log.info("已执行SQL脚本: {}", sqlScriptPath);
        } catch (Exception e) {
            log.error("执行SQL脚本失败: {}", sqlScriptPath, e);
        }
    }
}

