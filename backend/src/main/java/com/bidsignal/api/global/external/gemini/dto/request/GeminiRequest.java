package com.bidsignal.api.global.external.gemini.dto.request;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class GeminiRequest {

    private List<Content> contents;
    private GenerationConfig generationConfig;

    @Getter
    @Builder
    public static class Content {
        private String role;
        private List<Part> parts;
    }

    @Getter
    @Builder
    public static class Part {
        private String text;
    }

    @Getter
    @Builder
    public static class GenerationConfig {
        private double temperature;
        private int maxOutputTokens;
    }

    public static GeminiRequest of(String prompt, double temperature, int maxOutputTokens) {
        return GeminiRequest.builder()
                .contents(List.of(
                        Content.builder()
                                .role("user")
                                .parts(List.of(
                                        Part.builder().text(prompt).build()
                                ))
                                .build()
                ))
                .generationConfig(
                        GenerationConfig.builder()
                                .temperature(temperature)
                                .maxOutputTokens(maxOutputTokens)
                                .build()
                )
                .build();
    }
}