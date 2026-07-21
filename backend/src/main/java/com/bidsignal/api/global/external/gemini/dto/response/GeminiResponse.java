package com.bidsignal.api.global.external.gemini.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Getter
@ToString
@NoArgsConstructor
public class GeminiResponse {

    private List<Candidate> candidates;

    @Getter
    @ToString
    @NoArgsConstructor
    public static class Candidate {
        private Content content;
    }

    @Getter
    @ToString
    @NoArgsConstructor
    public static class Content {
        private List<Part> parts;
    }

    @Getter
    @ToString
    @NoArgsConstructor
    public static class Part {
        private String text;
    }
}