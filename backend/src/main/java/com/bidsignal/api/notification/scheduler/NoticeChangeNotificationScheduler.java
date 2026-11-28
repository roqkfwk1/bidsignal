package com.bidsignal.api.notification.scheduler;

import com.bidsignal.api.notification.service.NoticeChangeNotificationSender;
import com.bidsignal.api.notification.service.NoticeChangeNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NoticeChangeNotificationScheduler {

    private final NoticeChangeNotificationService noticeChangeNotificationService;
    private final NoticeChangeNotificationSender noticeChangeNotificationSender;

    /**
     * 발송중에 멈춘 알림을 복구하고 공고 변경 알림 메일을 발송한다.
     */
    @Scheduled(fixedDelay = 60000)
    public void sendNoticeChangeNotifications() {

        try {
            int recoveredCount = noticeChangeNotificationService.recoverSendingNotifications();

            if (recoveredCount > 0) {
                log.info("발송중에 멈춘 공고 변경 알림 복구. count={}", recoveredCount);
            }

            noticeChangeNotificationSender.sendPendingNotifications();

        } catch (Exception e) {
            log.error("공고 변경 알림 메일 발송 스케줄러 실패", e);
        }
    }
}
