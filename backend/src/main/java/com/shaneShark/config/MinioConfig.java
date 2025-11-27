package com.shaneShark.config;

import io.minio.MinioClient;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "minio")
public class MinioConfig {
      
    // Minio核心参数
    private String endpoint;
    private String accessKey;
    private String secretKey;
    private String bucketName;
    // 清理规则参数
    private CleanConfig clean;

    // 内部类：封装清理规则
    @Data
    public static class CleanConfig {
        private boolean enabled;
        private String cron;
        private Integer expireDays;
        private String ignorePrefixes;
        private Integer maxBatchSize;
    }

    // 注册MinioClient Bean（始终创建，供文件上传等功能使用）
    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }
}
