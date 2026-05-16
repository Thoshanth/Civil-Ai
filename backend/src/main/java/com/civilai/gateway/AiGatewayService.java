package com.civilai.gateway;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiGatewayService {

    private final WebClient webClient;

    @Value("${ai.service.timeout-seconds:90}")
    private int timeoutSeconds;

    /**
     * Call AI service with file upload
     */
    public Mono<String> analyzeWithFile(String endpoint, byte[] fileBytes, String fileName) {
        log.info("Calling AI service: {} with file: {}", endpoint, fileName);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return fileName;
            }
        });

        return webClient.post()
                .uri(endpoint)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .doOnSuccess(response -> log.info("AI service call successful: {}", endpoint))
                .doOnError(error -> log.error("AI service call failed: {}", endpoint, error));
    }

    /**
     * Call AI service with JSON body
     */
    public Mono<String> analyzeWithJson(String endpoint, Map<String, Object> requestBody) {
        log.info("Calling AI service: {} with JSON body", endpoint);

        return webClient.post()
                .uri(endpoint)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .doOnSuccess(response -> log.info("AI service call successful: {}", endpoint))
                .doOnError(error -> log.error("AI service call failed: {}", endpoint, error));
    }

    /**
     * Call AI service with form data
     */
    public Mono<String> analyzeWithFormData(String endpoint, Map<String, String> formData) {
        log.info("Calling AI service: {} with form data", endpoint);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        formData.forEach(builder::part);

        return webClient.post()
                .uri(endpoint)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .doOnSuccess(response -> log.info("AI service call successful: {}", endpoint))
                .doOnError(error -> log.error("AI service call failed: {}", endpoint, error));
    }
}
