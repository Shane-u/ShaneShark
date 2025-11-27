package com.shaneShark.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * 配置自定义异步线程池（替代默认的 SimpleAsyncTaskExecutor）
     */
    @Bean(name = "asyncTaskExecutor")
    public Executor asyncTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("async-task-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        
        return executor;
    }

    /**
     * 将自定义线程池绑定到 Spring MVC 的异步支持
     */
    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        // 绑定上面定义的线程池
        configurer.setTaskExecutor((AsyncTaskExecutor) asyncTaskExecutor());
        // 异步请求超时时间（可选，默认无超时，根据业务设置，比如 30 秒）
        configurer.setDefaultTimeout(30 * 1000);
    }
}