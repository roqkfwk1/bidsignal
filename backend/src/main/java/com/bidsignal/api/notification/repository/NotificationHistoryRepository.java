package com.bidsignal.api.notification.repository;

import com.bidsignal.api.notification.domain.NotificationChannel;
import com.bidsignal.api.notification.domain.NotificationHistory;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, Long> {

    // 중복 발송 확인
    boolean existsByWatchlistItemAndChannelAndRemainingDaysAndSuccessTrue(WatchlistItem watchlistItem, NotificationChannel channel, int remainingDays);
}
