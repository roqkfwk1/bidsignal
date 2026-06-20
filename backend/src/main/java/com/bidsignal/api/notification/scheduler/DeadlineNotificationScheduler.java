package com.bidsignal.api.notification.scheduler;

import com.bidsignal.api.notification.service.DeadlineNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeadlineNotificationScheduler {

    private final DeadlineNotificationService deadlineNotificationService;

    /**
     * 마감 임박 알림 메일을 발송한다.
     * cron = 초 분 시 일 월 요일
     */
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    public void sendDeadlineNotifications() {

        try {
            log.info("마감 임박 알림 메일 발송 스케줄러 시작");

            deadlineNotificationService.sendDeadlineNotifications();

            log.info("마감 임박 알림 메일 발송 스케줄러 종료");

        } catch (Exception e) {
            log.error("마감 임박 알림 메일 발송 스케줄러 실패", e);
        }
    }
}
