package com.bidsignal.api.notice.scheduler;

import com.bidsignal.api.notice.service.NoticeSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NoticeSyncScheduler {

    private final NoticeSyncService noticeSyncService;

    /**
     * 매시간 정각마다 나라장터 공고를 수집한다.
     * cron = 초 분 시 일 월 요일
     */
    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Seoul")
    public void syncTodayNotices() {

        log.info("나라장터 공고 수집 스케줄러 시작");

        noticeSyncService.syncTodayNotices();

        log.info("나라장터 공고 수집 스케줄러 종료");
    }
}