package com.shaneShark.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * 线程池配置
 *
 * @author Shane
 */
@Configuration
@EnableAsync
public class ThreadPoolConfig {

    /**
     * 文件处理线程池
     * 用于文件上传、MD5 计算等操作
     *
     * @return 线程池
     */
    @Bean("fileProcessExecutor")
    public ExecutorService fileProcessExecutor() {
        int corePoolSize = Runtime.getRuntime().availableProcessors();
        int maximumPoolSize = corePoolSize * 2;
        return new ThreadPoolExecutor(
                corePoolSize,
                maximumPoolSize,
                60L,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(1000),
                r -> {
                    Thread thread = new Thread(r, "file-process-" + System.currentTimeMillis());
                    thread.setDaemon(false);
                    return thread;
                },
                new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }
}















