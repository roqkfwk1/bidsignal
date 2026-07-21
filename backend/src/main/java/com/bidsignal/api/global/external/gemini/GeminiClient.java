package com.bidsignal.api.global.external.gemini;

import com.bidsignal.api.global.config.GeminiProperties;
import com.bidsignal.api.global.external.gemini.dto.request.GeminiRequest;
import com.bidsignal.api.global.external.gemini.dto.response.GeminiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Slf4j
@Component
public class GeminiClient {

    private final GeminiProperties geminiProperties;
    private final RestClient restClient;

    public GeminiClient(GeminiProperties geminiProperties) {
        this.geminiProperties = geminiProperties;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000); // 3초
        requestFactory.setReadTimeout(10000);   // 10초

        this.restClient = RestClient.builder()
                .baseUrl(geminiProperties.getUrl())
                .requestFactory(requestFactory)
                .build();
    }

    public String generate(String prompt, double temperature, int maxOutputTokens) {

        GeminiRequest requestBody = GeminiRequest.of(prompt, temperature, maxOutputTokens);

        try {
            GeminiResponse response = restClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("key", geminiProperties.getKey())
                            .build())
                    .body(requestBody)
                    .retrieve()
                    .body(GeminiResponse.class);

            return extractText(response);

        } catch (Exception e) {
            log.error("Gemini API 호출 실패: {}", e.getMessage());
            return null;
        }
    }

    private String extractText(GeminiResponse response) {

        List<GeminiResponse.Candidate> candidates = response.getCandidates();

        if (candidates == null || candidates.isEmpty()) {
            log.warn("Gemini 응답에 candidates가 없습니다. response={}", response);
            return null;
        }

        GeminiResponse.Content content = candidates.get(0).getContent();

        if (content == null) {
            log.warn("Gemini 응답에 content가 없습니다. response={}", response);
            return null;
        }

        List<GeminiResponse.Part> parts = content.getParts();

        if (parts == null || parts.isEmpty()) {
            log.warn("Gemini 응답에 parts가 없습니다. response={}", response);
            return null;
        }

        return parts.get(0).getText();
    }
}