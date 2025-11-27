package com.shaneShark.config;

import lombok.Data;
import okhttp3.OkHttpClient;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * 火山引擎Doubao配置类
 * 用于管理火山引擎API的相关配置和HTTP客户端
 *
 * @author Shane
 */
@Configuration
@ConfigurationProperties(prefix = "doubao")
@Data
public class DoubaoConfig {

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
    private String model = "doubao-1-5-lite-32k-250115";

    /**
     * 请求超时时间（毫秒）
     */
    private int timeout = 60000;

    /**
     * 创建并配置 OkHttp 客户端（用于Doubao API）
     *
     * @return 配置好的 OkHttpClient 实例
     */
    @Bean(name = "doubaoOkHttpClient")
    public OkHttpClient doubaoOkHttpClient() {
        return new OkHttpClient.Builder()
                .connectTimeout(timeout, TimeUnit.MILLISECONDS)
                .readTimeout(timeout, TimeUnit.MILLISECONDS)
                .writeTimeout(timeout, TimeUnit.MILLISECONDS)
                .build();
    }
}

