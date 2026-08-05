package com.bidsignal.api.notice.scheduler;

import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.repository.NoticeRepository;
import com.bidsignal.api.notice.service.NoticeSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NoticeSummaryScheduler {

    private final NoticeRepository noticeRepository;
    private final NoticeSummaryService noticeSummaryService;

    /**
     * 요약이 없는 공고를 순차적으로 처리한다. 이전 처리가 끝난 뒤 15초 후 다음 건을 처리한다.
     */
    @Scheduled(fixedDelay = 15000)
    public void summarizeOneNotice() {

        Notice notice = noticeRepository.findFirstByAiSummaryIsNullAndStdNtceDocUrlIsNotNull()
                .orElse(null);

        if (notice == null) {
            return;
        }

        noticeSummaryService.getSummary(notice.getId());

        log.info("공고 요약 처리 완료. noticeId={}", notice.getId());
    }
}