package com.bidsignal.api.notification.domain;

import com.bidsignal.api.global.domain.BaseEntity;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "notice_change_notifications",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_notice_change_notifications_user_id_notice_id",
                columnNames = {"user_id", "notice_id"}
        ),
        indexes = @Index(name = "idx_notice_change_notifications_status", columnList = "status")
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class NoticeChangeNotification extends BaseEntity {

    private static final int MAX_RETRY_COUNT = 3;
    private static final int MAX_ERROR_MESSAGE_LENGTH = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoticeChangeType type;

    private LocalDateTime previousBidClseDt;

    private LocalDateTime previousOpengDt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoticeChangeNotificationStatus status;

    @Column(nullable = false)
    private int retryCount;

    @Column(length = 500)
    private String errorMessage;

    // 발송 대기 알림 생성
    public static NoticeChangeNotification create(User user, Notice notice, NoticeChangeType type, LocalDateTime previousBidClseDt, LocalDateTime previousOpengDt) {
        NoticeChangeNotification notification = new NoticeChangeNotification();

        notification.user = user;
        notification.notice = notice;
        notification.type = type;
        notification.previousBidClseDt = previousBidClseDt;
        notification.previousOpengDt = previousOpengDt;
        notification.status = NoticeChangeNotificationStatus.PENDING;
        notification.retryCount = 0;

        return notification;
    }

    // 발송 완료 처리
    public void markSent() {
        this.status = NoticeChangeNotificationStatus.SENT;
    }

    // 발송 건너뜀 처리
    public void markSkipped() {
        this.status = NoticeChangeNotificationStatus.SKIPPED;
    }

    // 발송 실패 처리 (3번째 실패면 FAILED, 그 전이면 다시 발송 대기)
    public void markFailed(String errorMessage) {
        this.retryCount++;

        if (errorMessage != null && errorMessage.length() > MAX_ERROR_MESSAGE_LENGTH) {
            errorMessage = errorMessage.substring(0, MAX_ERROR_MESSAGE_LENGTH);
        }

        this.errorMessage = errorMessage;

        if (this.retryCount >= MAX_RETRY_COUNT) {
            this.status = NoticeChangeNotificationStatus.FAILED;
        } else {
            this.status = NoticeChangeNotificationStatus.PENDING;
        }
    }
}
