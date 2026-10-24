package com.bidsignal.api.notice.scheduler;

import com.bidsignal.api.global.external.gemini.GeminiTemporaryException;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.repository.NoticeRepository;
import com.bidsignal.api.notice.service.NoticeSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NoticeSummaryScheduler {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final Duration PAUSE = Duration.ofHours(1);

    private final NoticeRepository noticeRepository;
    private final NoticeSummaryService noticeSummaryService;

    private LocalDateTime pausedUntil;

    /**
     * 마감 전 공고를 마감이 가까운 순서로 한 건씩 요약한다. 이전 처리가 끝난 뒤 3분 후 다음 건을 처리한다.
     * Gemini 호출이 한도 초과로 막히면 1시간 동안 쉰다.
     */
    @Scheduled(fixedDelay = 180000)
    public void summarizeOneNotice() {

        LocalDateTime now = LocalDateTime.now(SEOUL);

        if (pausedUntil != null && now.isBefore(pausedUntil)) {
            return;
        }

        List<Notice> targets = noticeRepository.findSummaryTargets(now, PageRequest.of(0, 1));

        if (targets.isEmpty()) {
            return;
        }

        Long noticeId = targets.get(0).getId();

        try {
            String summary = noticeSummaryService.getSummary(noticeId);

            if (summary == null) {
                log.info("공고 요약 불가로 처리. noticeId={}", noticeId);
                return;
            }

            log.info("공고 요약 처리 완료. noticeId={}", noticeId);

        } catch (GeminiTemporaryException e) {
            pausedUntil = now.plus(PAUSE);
            log.warn("Gemini 일시 오류로 요약을 쉽니다. status={}, 재개 시각={}", e.getStatus(), pausedUntil);
        }
    }
}