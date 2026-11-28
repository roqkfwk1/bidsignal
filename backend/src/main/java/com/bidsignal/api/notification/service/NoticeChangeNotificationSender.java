package com.bidsignal.api.notification.service;

import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notification.domain.NoticeChangeNotification;
import com.bidsignal.api.notification.domain.NoticeChangeNotificationStatus;
import com.bidsignal.api.notification.dto.NoticeChangeNotificationTarget;
import com.bidsignal.api.notification.repository.NoticeChangeNotificationRepository;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import com.bidsignal.api.watchlist.repository.WatchlistItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
// 외부 메일 발송은 롤백할 수 없으므로 전체 트랜잭션으로 묶지 않음
public class NoticeChangeNotificationSender {

    private static final int BATCH_SIZE = 50;

    private final NoticeChangeNotificationRepository noticeChangeNotificationRepository;
    private final NoticeChangeNotificationService noticeChangeNotificationService;
    private final WatchlistItemRepository watchlistItemRepository;
    private final EmailNotificationService emailNotificationService;

    /**
     * 발송 대기중인 공고 변경 알림 메일을 발송한다.
     */
    public void sendPendingNotifications() {

        List<NoticeChangeNotification> notifications = noticeChangeNotificationRepository.findByStatusWithUserAndNotice(
                NoticeChangeNotificationStatus.PENDING,
                PageRequest.of(0, BATCH_SIZE)
        );

        for (NoticeChangeNotification notification : notifications) {

            // 다른 실행이 먼저 선점했으면 건너뛴다.
            if (!noticeChangeNotificationService.claimNotification(notification.getId())) {
                continue;
            }

            if (!isSendTarget(notification)) {
                noticeChangeNotificationService.markSkipped(notification.getId());
                continue;
            }

            try {
                emailNotificationService.sendNoticeChangeNotificationEmail(toTarget(notification));
            } catch (Exception e) {
                log.warn("공고 변경 알림 메일 발송 실패. notificationId={}", notification.getId(), e);
                noticeChangeNotificationService.markFailed(notification.getId(), e.getMessage());
                continue;
            }

            noticeChangeNotificationService.markSent(notification.getId());
        }
    }

    /**
     * 사용자가 이 공고번호를 진행중인 관심 공고로 갖고 있는지 확인한다.
     */
    private boolean isSendTarget(NoticeChangeNotification notification) {

        Optional<WatchlistItem> watchlistItem = watchlistItemRepository.findByUserIdAndNoticeIdWithNotice(
                notification.getUser().getId(),
                notification.getNotice().getId()
        );

        if (watchlistItem.isEmpty()) {
            return false;
        }

        WatchlistStatus status = watchlistItem.get().getStatus();

        return status == WatchlistStatus.REVIEWING || status == WatchlistStatus.PREPARING;
    }

    /**
     * 변경 알림을 메일 발송 대상으로 바꾼다.
     */
    private NoticeChangeNotificationTarget toTarget(NoticeChangeNotification notification) {

        Notice notice = notification.getNotice();

        return NoticeChangeNotificationTarget.builder()
                .toEmail(notification.getUser().getEmail())
                .noticeId(notice.getId())
                .noticeTitle(notice.getBidNtceNm())
                .type(notification.getType())
                .previousBidCloseDate(notification.getPreviousBidClseDt())
                .previousOpeningDate(notification.getPreviousOpengDt())
                .bidCloseDate(notice.getBidClseDt())
                .openingDate(notice.getOpengDt())
                .build();
    }
}
