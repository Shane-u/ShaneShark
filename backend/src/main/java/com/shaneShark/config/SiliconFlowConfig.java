package com.shaneShark.config;

import lombok.Data;
import okhttp3.OkHttpClient;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * 硅基流动 AI 配置类
 * 用于管理硅基流动 API 的相关配置和 HTTP 客户端
 *
 * @author Shane
 */
@Configuration
@ConfigurationProperties(prefix = "silicon-flow")
@Data
public class SiliconFlowConfig {

    /**
     * API密钥
     */
    private String apiKey;

    /**
     * API基础URL
     */
    private String baseUrl = "https://api.siliconflow.cn";

    /**
     * 默认模型名称
     */
    private String model = "Qwen/Qwen3-30B-A3B-Instruct-2507";

    /**
     * 请求超时时间（毫秒）
     */
    private int timeout = 30000;

    /**
     * 创建并配置 OkHttp 客户端
     *
     * @return 配置好的 OkHttpClient 实例
     */
    @Bean
    public OkHttpClient okHttpClient() {
        return new OkHttpClient.Builder()
                .connectTimeout(timeout, TimeUnit.MILLISECONDS)
                .readTimeout(timeout, TimeUnit.MILLISECONDS)
                .writeTimeout(timeout, TimeUnit.MILLISECONDS)
                .build();
    }
}












