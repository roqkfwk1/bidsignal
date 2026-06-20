package com.bidsignal.api.notification.service;

import com.bidsignal.api.notification.domain.NotificationChannel;
import com.bidsignal.api.notification.domain.NotificationHistory;
import com.bidsignal.api.notification.dto.DeadlineNotificationTarget;
import com.bidsignal.api.notification.repository.NotificationHistoryRepository;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import com.bidsignal.api.watchlist.repository.WatchlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
// 외부 메일 발송은 롤백할 수 없으므로 전체 트랜잭션으로 묶지 않음
public class DeadlineNotificationService {

    private final WatchlistItemRepository watchlistItemRepository;
    private final NotificationHistoryRepository notificationHistoryRepository;
    private final EmailNotificationService emailNotificationService;

    /**
     * 마감 임박 알림을 발송한다.
     */
    public void sendDeadlineNotifications() {

        List<Integer> remainingDaysList = List.of(3, 1);
        List<WatchlistStatus> targetStatuses = List.of(WatchlistStatus.REVIEWING, WatchlistStatus.PREPARING);

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));

        for (Integer remainingDay : remainingDaysList) {

            LocalDateTime start = today.plusDays(remainingDay).atStartOfDay();
            LocalDateTime end = today.plusDays(remainingDay + 1).atStartOfDay();
            List<WatchlistItem> targets = watchlistItemRepository.findDeadlineNotificationTargets(start, end, targetStatuses, remainingDay);

            for (WatchlistItem item : targets) {

                // 중복 발송 확인
                boolean alreadySent = notificationHistoryRepository.existsByWatchlistItemAndChannelAndRemainingDaysAndSuccessTrue(
                                item,
                                NotificationChannel.EMAIL,
                                remainingDay
                        );

                if (alreadySent) {
                    continue;
                }

                // 알림 대상 생성
                DeadlineNotificationTarget target = DeadlineNotificationTarget.builder()
                        .toEmail(item.getUser().getEmail())
                        .noticeId(item.getNotice().getId())
                        .noticeTitle(item.getNotice().getBidNtceNm())
                        .bidCloseDate(item.getNotice().getBidClseDt())
                        .remainingDays(remainingDay)
                        .build();

                // 이메일 발송 & 이력 저장
                try {
                    emailNotificationService.sendDeadlineNotificationEmail(target);

                    NotificationHistory history = NotificationHistory.createSuccess(
                            item.getUser(),
                            item,
                            NotificationChannel.EMAIL,
                            remainingDay
                    );

                    notificationHistoryRepository.save(history);

                } catch (Exception e) {
                    NotificationHistory history = NotificationHistory.createFailure(
                            item.getUser(),
                            item,
                            NotificationChannel.EMAIL,
                            remainingDay,
                            e.getMessage()
                    );

                    notificationHistoryRepository.save(history);
                }
            }
        }
    }
}
