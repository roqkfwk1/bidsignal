package com.bidsignal.api.notification.repository;

import com.bidsignal.api.notification.domain.NotificationChannel;
import com.bidsignal.api.notification.domain.NotificationHistory;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, Long> {

    // 중복 발송 확인
    boolean existsByWatchlistItemAndChannelAndRemainingDaysAndSuccessTrue(WatchlistItem watchlistItem, NotificationChannel channel, int remainingDays);

    // 사용자 알림 내역 조회
    @Query(
            value = """
                SELECT h
                FROM NotificationHistory h
                JOIN FETCH h.watchlistItem w
                JOIN FETCH w.notice n
                WHERE h.user.id = :userId
                  AND h.success = true
                ORDER BY h.createdAt DESC
                """,
            countQuery = """
                SELECT COUNT(h)
                FROM NotificationHistory h
                WHERE h.user.id = :userId
                  AND h.success = true
                """
    )
    Page<NotificationHistory> findByUserIdWithNotice(@Param("userId") Long userId, Pageable pageable);

    // 사용자 알림 이력 조회
    Optional<NotificationHistory> findByIdAndUserId(Long id, Long userId);

    // 안 읽은 알림 개수 조회
    long countByUserIdAndSuccessTrueAndIsReadFalse(Long userId);

    // 안 읽은 알림 전체 읽음 처리
    @Modifying
    @Query("UPDATE NotificationHistory h SET h.isRead = true WHERE h.user.id = :userId AND h.success = true AND h.isRead = false")
    int markAllAsReadByUserId(@Param("userId") Long userId);

    // 관심공고의 연관 알림 이력 삭제
    void deleteByWatchlistItem(WatchlistItem watchlistItem);
}