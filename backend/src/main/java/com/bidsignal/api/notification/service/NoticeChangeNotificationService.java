package com.bidsignal.api.notification.service;

import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notification.domain.NoticeChangeNotification;
import com.bidsignal.api.notification.domain.NoticeChangeNotificationStatus;
import com.bidsignal.api.notification.domain.NoticeChangeType;
import com.bidsignal.api.notification.domain.NotificationSetting;
import com.bidsignal.api.notification.repository.NoticeChangeNotificationRepository;
import com.bidsignal.api.notification.repository.NotificationSettingRepository;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NoticeChangeNotificationService {

    private static final int SENDING_TIMEOUT_MINUTES = 10;

    private final NoticeChangeNotificationRepository noticeChangeNotificationRepository;
    private final NotificationSettingRepository notificationSettingRepository;

    /**
     * 최신 차수로 옮긴 관심 공고의 사용자에게 보낼 변경 알림을 발송 대기로 저장한다.
     */
    public void createNotifications(List<WatchlistItem> movedWatchlistItems, Notice previousNotice, Notice latestNotice) {

        NoticeChangeType type = findChangeType(previousNotice, latestNotice);

        if (type == null) {
            return;
        }

        for (WatchlistItem watchlistItem : movedWatchlistItems) {

            if (!isNotificationTarget(watchlistItem)) {
                continue;
            }

            NoticeChangeNotification notification = NoticeChangeNotification.create(
                    watchlistItem.getUser(),
                    latestNotice,
                    type,
                    previousNotice.getBidClseDt(),
                    previousNotice.getOpengDt()
            );

            noticeChangeNotificationRepository.save(notification);
        }
    }

    /**
     * 이전 최신 차수와 비교해서 알림 종류를 정한다.
     */
    private NoticeChangeType findChangeType(Notice previousNotice, Notice latestNotice) {

        if (latestNotice.isCanceled()) {
            return NoticeChangeType.CANCELED;
        }

        boolean bidClseDtChanged = !Objects.equals(previousNotice.getBidClseDt(), latestNotice.getBidClseDt());
        boolean opengDtChanged = !Objects.equals(previousNotice.getOpengDt(), latestNotice.getOpengDt());

        if (bidClseDtChanged || opengDtChanged) {
            return NoticeChangeType.CHANGED;
        }

        return null;
    }

    /**
     * 진행중인 관심 공고이고 이메일 알림을 켠 사용자인지 확인한다.
     */
    private boolean isNotificationTarget(WatchlistItem watchlistItem) {

        WatchlistStatus status = watchlistItem.getStatus();

        if (status != WatchlistStatus.REVIEWING && status != WatchlistStatus.PREPARING) {
            return false;
        }

        Optional<NotificationSetting> setting = notificationSettingRepository.findByUser(watchlistItem.getUser());

        return setting.isPresent() && setting.get().isEmailNotificationEnabled();
    }

    /**
     * 발송 대기 알림을 발송중으로 선점하고 선점 여부를 반환한다.
     */
    @Transactional
    public boolean claimNotification(Long notificationId) {

        int updatedCount = noticeChangeNotificationRepository.claimPendingNotification(
                notificationId,
                NoticeChangeNotificationStatus.PENDING,
                NoticeChangeNotificationStatus.SENDING,
                LocalDateTime.now(ZoneId.of("Asia/Seoul"))
        );

        return updatedCount > 0;
    }

    /**
     * 발송중에 멈춘 알림을 발송 대기로 되돌리고 되돌린 건수를 반환한다.
     */
    @Transactional
    public int recoverSendingNotifications() {

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));

        return noticeChangeNotificationRepository.recoverSendingNotifications(
                NoticeChangeNotificationStatus.PENDING,
                NoticeChangeNotificationStatus.SENDING,
                now.minusMinutes(SENDING_TIMEOUT_MINUTES),
                now
        );
    }

    /**
     * 알림을 발송 완료로 바꾼다.
     */
    @Transactional
    public void markSent(Long notificationId) {

        NoticeChangeNotification notification = noticeChangeNotificationRepository.findById(notificationId).orElseThrow();
        notification.markSent();
    }

    /**
     * 알림을 발송 건너뜀으로 바꾼다.
     */
    @Transactional
    public void markSkipped(Long notificationId) {

        NoticeChangeNotification notification = noticeChangeNotificationRepository.findById(notificationId).orElseThrow();
        notification.markSkipped();
    }

    /**
     * 알림을 발송 실패로 바꾼다.
     */
    @Transactional
    public void markFailed(Long notificationId, String errorMessage) {

        NoticeChangeNotification notification = noticeChangeNotificationRepository.findById(notificationId).orElseThrow();
        notification.markFailed(errorMessage);
    }
}
