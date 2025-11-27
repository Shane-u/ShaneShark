package com.shaneShark.config;

import lombok.Data;
import okhttp3.OkHttpClient;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * 火山引擎DeepSeek配置类
 * 用于管理火山引擎API的相关配置和HTTP客户端
 *
 * @author Shane
 */
@Configuration
@ConfigurationProperties(prefix = "deepseek")
@Data
public class DeepSeekConfig {

    /**
     * API密钥
     */
    private String apiKey;

    /**
     * API基础URL
     */
    private String baseUrl = "https://ark.cn-beijing.volces.com/api/v3";

    /**
     * 默认模型名称
     */
    private String model = "deepseek-v3-1-terminus";

    /**
     * 请求超时时间（毫秒）
     */
    private int timeout = 60000;

    /**
     * 创建并配置 OkHttp 客户端（用于DeepSeek API）
     *
     * @return 配置好的 OkHttpClient 实例
     */
    @Bean(name = "deepseekOkHttpClient")
    public OkHttpClient deepseekOkHttpClient() {
        return new OkHttpClient.Builder()
                .connectTimeout(timeout, TimeUnit.MILLISECONDS)
                .readTimeout(timeout, TimeUnit.MILLISECONDS)
                .writeTimeout(timeout, TimeUnit.MILLISECONDS)
                .build();
    }
}

