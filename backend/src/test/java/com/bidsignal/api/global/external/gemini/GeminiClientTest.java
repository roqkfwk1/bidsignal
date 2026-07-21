package com.bidsignal.api.global.external.gemini;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class GeminiClientTest {

    @Autowired
    GeminiClient geminiClient;

    @Test
    void generate() {

        String prompt = "How does AI work?";

        String result = geminiClient.generate(prompt, 0.2, 1000);

        assertThat(result).isNotBlank();
    }
}