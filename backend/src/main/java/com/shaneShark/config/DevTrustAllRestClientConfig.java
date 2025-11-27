package com.shaneShark.config;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactoryBuilder;
import org.apache.hc.client5.http.ssl.TrustAllStrategy;
import org.apache.hc.core5.ssl.SSLContexts;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * 本地开发环境下用于忽略 HTTPS 证书校验的 RestClient 自定义配置。
 * 仅用于排查证书问题，不可在生产环境启用。
 */
@Configuration
@Profile("dev")
@ConditionalOnClass(RestClient.class)
public class DevTrustAllRestClientConfig implements RestClientCustomizer {

    @Override
    public void customize(RestClient.Builder restClientBuilder) {
        restClientBuilder.requestFactory(trustAllRequestFactory());
    }

    private ClientHttpRequestFactory trustAllRequestFactory() {
        return new HttpComponentsClientHttpRequestFactory(createTrustAllClient());
    }

    private CloseableHttpClient createTrustAllClient() {
        try {
            SSLConnectionSocketFactory socketFactory = SSLConnectionSocketFactoryBuilder.create()
                    .setSslContext(
                            SSLContexts.custom()
                                    .loadTrustMaterial(null, TrustAllStrategy.INSTANCE)
                                    .build())
                    .setHostnameVerifier(NoopHostnameVerifier.INSTANCE)
                    .build();

            PoolingHttpClientConnectionManager connectionManager =
                    PoolingHttpClientConnectionManagerBuilder.create()
                            .setSSLSocketFactory(socketFactory)
                            .build();

            return HttpClients.custom()
                    .setConnectionManager(connectionManager)
                    .build();
        } catch (Exception e) {
            throw new IllegalStateException("初始化忽略证书的 HttpClient 失败", e);
        }
    }
}

