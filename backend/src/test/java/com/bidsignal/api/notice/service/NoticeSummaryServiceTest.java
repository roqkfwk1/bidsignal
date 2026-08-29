package com.bidsignal.api.notice.service;

import com.bidsignal.api.global.external.gemini.GeminiClient;
import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.external.document.NoticeDocumentExtractor;
import com.bidsignal.api.notice.repository.NoticeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NoticeSummaryServiceTest {

    @Mock
    NoticeDocumentExtractor noticeDocumentExtractor;

    @Mock
    GeminiClient geminiClient;

    @Mock
    NoticeRepository noticeRepository;

    @InjectMocks
    NoticeSummaryService noticeSummaryService;

    private Notice createNotice(String documentUrl) {
        return Notice.builder()
                .bidNtceNo("20240001")
                .bidNtceOrd("000")
                .bidNtceNm("테스트 공고")
                .ntceInsttNm("테스트 기관")
                .bidType(BidType.SERVICE)
                .rgstDt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .stdNtceDocUrl(documentUrl)
                .build();
    }

    @Test
    @DisplayName("존재하지 않는 공고를 조회하면 예외가 발생한다")
    void getSummary_noticeNotFound() {

        // given
        given(noticeRepository.findById(1L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noticeSummaryService.getSummary(1L)).isInstanceOf(NoSuchElementException.class);
    }

    @Test
    @DisplayName("저장된 요약이 있으면 해당 값을 바로 반환한다")
    void getSummary_cached() {

        // given
        Notice notice = createNotice("http://example.com/doc.hwp");
        notice.updateAiSummary("기존 요약");

        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));

        // when
        String result = noticeSummaryService.getSummary(1L);

        // then
        assertThat(result).isEqualTo("기존 요약");

        verify(noticeDocumentExtractor, never()).extractText(anyString());

        verify(geminiClient, never()).generate(anyString(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("공고문 URL이 없으면 요약하지 않는다")
    void getSummary_documentUrlNotExists() {

        // given
        Notice notice = createNotice(null);

        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));

        // when
        String result = noticeSummaryService.getSummary(1L);

        // then
        assertThat(result).isNull();
        assertThat(notice.getAiSummary()).isEmpty();

        verify(noticeDocumentExtractor, never()).extractText(anyString());

        verify(geminiClient, never()).generate(anyString(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("공고문에서 내용을 추출하지 못하면 요약하지 않는다")
    void getSummary_extractedTextIsBlank() {

        // given
        Notice notice = createNotice("http://example.com/doc.hwp");

        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));

        given(noticeDocumentExtractor.extractText("http://example.com/doc.hwp")).willReturn("");

        // when
        String result = noticeSummaryService.getSummary(1L);

        // then
        assertThat(result).isNull();
        assertThat(notice.getAiSummary()).isEmpty();

        verify(geminiClient, never()).generate(anyString(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("Gemini가 요약을 생성하지 못하면 null을 반환한다")
    void getSummary_geminiReturnsNull() {

        // given
        Notice notice = createNotice("http://example.com/doc.hwp");

        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));

        given(noticeDocumentExtractor.extractText("http://example.com/doc.hwp")).willReturn("공고문 본문");

        given(geminiClient.generate(
                anyString(),
                eq(0.2),
                eq(800)
        )).willReturn(null);

        // when
        String result = noticeSummaryService.getSummary(1L);

        // then
        assertThat(result).isNull();
        assertThat(notice.getAiSummary()).isEmpty();
    }

    @Test
    @DisplayName("요약을 생성하면 공고에 저장하고 반환한다")
    void getSummary_success() {

        // given
        Notice notice = createNotice("http://example.com/doc.hwp");

        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));

        given(noticeDocumentExtractor.extractText("http://example.com/doc.hwp")).willReturn("공고문 본문");

        given(geminiClient.generate(
                anyString(),
                eq(0.2),
                eq(800)
        )).willReturn("AI 생성 요약");

        // when
        String result = noticeSummaryService.getSummary(1L);

        // then
        assertThat(result).isEqualTo("AI 생성 요약");
        assertThat(notice.getAiSummary()).isEqualTo("AI 생성 요약");
    }
}