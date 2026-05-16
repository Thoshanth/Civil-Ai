package com.civilai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Value("${ai.service.base-url}")
    private String aiServiceBaseUrl;

    @Value("${ai.service.timeout-seconds}")
    private int timeoutSeconds;

    @Bean
    public WebClient aiServiceWebClient() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(timeoutSeconds));

        return WebClient.builder()
                .baseUrl(aiServiceBaseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
