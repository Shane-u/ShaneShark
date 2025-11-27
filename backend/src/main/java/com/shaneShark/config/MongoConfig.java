package com.shaneShark.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/**
 * MongoDB配置检查类
 * 在应用启动时检查MongoDB连接和集合是否存在
 *
 * @author Shane
 */
@Component
@Slf4j
public class MongoConfig {

    @Autowired(required = false)
    private MongoTemplate mongoTemplate;

    @PostConstruct
    public void checkMongoConnection() {
        if (mongoTemplate == null) {
            log.error("MongoDB未配置或连接失败！请检查application.yml中的MongoDB配置");
            return;
        }

        try {
            // 检查MongoDB连接
            String databaseName = mongoTemplate.getDb().getName();
            log.info("MongoDB连接成功，数据库: {}", databaseName);

            // 检查集合是否存在，如果不存在会自动创建
            if (!mongoTemplate.collectionExists("chat_sessions")) {
                log.warn("集合 chat_sessions 不存在，将在首次保存时自动创建");
            } else {
                log.info("集合 chat_sessions 已存在");
            }

            if (!mongoTemplate.collectionExists("chat_messages")) {
                log.warn("集合 chat_messages 不存在，将在首次保存时自动创建");
            } else {
                log.info("集合 chat_messages 已存在");
            }

            log.info("MongoDB配置检查完成");
        } catch (Exception e) {
            log.error("MongoDB连接检查失败: {}", e.getMessage(), e);
            log.error("请检查MongoDB配置和网络连接");
        }
    }
}

