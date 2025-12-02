package com.shaneShark.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.io.File;

/**
 * SQLite数据源配置
 * 项目使用SQLite作为主数据源，所有模块（包括QA）都使用SQLite
 * 
 * 配置说明：
 * 1. 从 application.yml 的 sqlite.db.path 读取数据库路径
 * 2. application.yml 中 sqlite.db.path 支持环境变量 SQLITE_DB_PATH
 * 3. 服务器部署时，环境变量从 /root/envFiles/.env 文件加载（通过 systemd 的 EnvironmentFile）
 * 4. 如果未设置环境变量，则使用默认值 ./data/qa.db
 */
@Configuration
@Slf4j
public class SqliteConfig {

    @Value("${sqlite.db.path:./data/qa.db}")
    private String sqliteDbPath;

    /**
     * SQLite数据源（主数据源）
     * 确保数据库文件目录存在，如果数据库文件不存在会自动创建
     */
    @Bean
    @Primary
    public DataSource sqliteDataSource() {
        // 记录实际使用的数据库路径（用于调试）
        log.info("=== SQLite 数据库配置 ===");
        log.info("数据库路径配置值: {}", sqliteDbPath);
        
        // 检查环境变量是否被读取
        String envPath = System.getenv("SQLITE_DB_PATH");
        if (envPath != null) {
            log.info("环境变量 SQLITE_DB_PATH: {}", envPath);
        } else {
            log.warn("未检测到环境变量 SQLITE_DB_PATH，使用默认值或 application.yml 中的配置");
        }
        
        // 确保数据库文件目录存在
        File dbFile = new File(sqliteDbPath);
        File parentDir = dbFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            log.info("创建数据库目录: {}", parentDir.getAbsolutePath());
            parentDir.mkdirs();
        }
        
        String absolutePath = dbFile.getAbsolutePath();
        log.info("SQLite 数据库绝对路径: {}", absolutePath);
        log.info("========================");

        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.sqlite.JDBC");
        dataSource.setUrl("jdbc:sqlite:" + sqliteDbPath);
        return dataSource;
    }
}

