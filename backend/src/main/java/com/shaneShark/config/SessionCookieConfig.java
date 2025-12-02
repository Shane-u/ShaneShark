package com.shaneShark.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.util.http.Rfc6265CookieProcessor;
import org.apache.tomcat.util.http.SameSiteCookies;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Session Cookie 跨域配置
 * 配置Tomcat的Cookie处理器，设置SameSite属性以支持跨域请求
 */
@Configuration
@Slf4j
public class SessionCookieConfig {

    @Value("${server.servlet.session.cookie.secure:false}")
    private boolean cookieSecure;

    /**
     * 配置Tomcat的Cookie处理器，设置SameSite属性
     */
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> cookieProcessorCustomizer() {
        return factory -> {
            factory.addContextCustomizers(context -> {
                Rfc6265CookieProcessor processor = new Rfc6265CookieProcessor();
                // 设置SameSite=None以支持跨域Cookie
                // 注意：SameSite=None必须配合Secure=true使用（HTTPS）
                // 如果使用HTTP，浏览器可能会阻止SameSite=None的Cookie
                processor.setSameSiteCookies(cookieSecure ? SameSiteCookies.NONE.getValue() : SameSiteCookies.LAX.getValue());
                context.setCookieProcessor(processor);
                
                log.info("Session cookie configured: SameSite={}, Secure={}", 
                    cookieSecure ? SameSiteCookies.NONE.getValue() : SameSiteCookies.LAX.getValue(),
                    cookieSecure);
                
                if (!cookieSecure) {
                    log.warn("Using HTTP with SameSite=None may be blocked by browsers. " +
                            "For cross-domain requests, consider using HTTPS and setting server.servlet.session.cookie.secure=true");
                }
            });
        };
    }
}

