package com.shaneShark.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.io.File;

/**
 * SQLite数据源配置
 * 注意：当前项目使用MySQL作为主数据源，如需使用SQLite，需要配置多数据源
 * 这里提供一个SQLite配置示例，实际使用时需要根据项目结构调整
 */
@Configuration
public class SqliteConfig {

    @Value("${sqlite.db.path:./data/qa.db}")
    private String sqliteDbPath;

    /**
     * SQLite数据源（可选配置）
     * 如需使用，需要配置多数据源并指定QA模块使用此数据源
     */
    @Bean(name = "sqliteDataSource")
    public DataSource sqliteDataSource() {
        // 确保数据库文件目录存在
        File dbFile = new File(sqliteDbPath);
        File parentDir = dbFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.sqlite.JDBC");
        dataSource.setUrl("jdbc:sqlite:" + sqliteDbPath);
        return dataSource;
    }
}

