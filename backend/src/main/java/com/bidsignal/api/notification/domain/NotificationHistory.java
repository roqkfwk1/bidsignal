package com.bidsignal.api.notification.domain;

import com.bidsignal.api.global.domain.BaseEntity;
import com.bidsignal.api.user.domain.User;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notification_histories")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class NotificationHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "watchlist_item_id", nullable = false)
    private WatchlistItem watchlistItem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationChannel channel;

    @Column(nullable = false)
    private int remainingDays;

    @Column(nullable = false)
    private boolean success;

    @Column(length = 500)
    private String errorMessage;

    @Column(nullable = false)
    private boolean isRead;

    // 성공 이력 생성
    public static NotificationHistory createSuccess(User user, WatchlistItem watchlistItem, NotificationChannel channel, int remainingDays) {
        NotificationHistory history = new NotificationHistory();

        history.user = user;
        history.watchlistItem = watchlistItem;
        history.channel = channel;
        history.remainingDays = remainingDays;
        history.success = true;

        return history;
    }

    // 실패 이력 생성
    public static NotificationHistory createFailure(User user, WatchlistItem watchlistItem, NotificationChannel channel, int remainingDays, String errorMessage) {
        NotificationHistory history = new NotificationHistory();

        history.user = user;
        history.watchlistItem = watchlistItem;
        history.channel = channel;
        history.remainingDays = remainingDays;
        history.success = false;
        history.errorMessage = errorMessage;

        return history;
    }

    // 읽음 처리
    public void markAsRead() {
        this.isRead = true;
    }
}
