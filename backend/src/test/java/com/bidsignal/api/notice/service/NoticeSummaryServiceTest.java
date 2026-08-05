package com.bidsignal.api.notice.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class NoticeSummaryServiceTest {

    @Autowired
    NoticeSummaryService noticeSummaryService;

    @Test
    void getSummary() {

        String summary = noticeSummaryService.getSummary(18669L);

        assertThat(summary).isNotBlank();
    }
}