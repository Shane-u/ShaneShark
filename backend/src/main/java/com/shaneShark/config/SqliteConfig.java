package com.shaneShark.config;

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
 */
@Configuration
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

