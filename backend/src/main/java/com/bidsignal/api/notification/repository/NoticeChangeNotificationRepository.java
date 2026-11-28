package com.bidsignal.api.notification.repository;

import com.bidsignal.api.notification.domain.NoticeChangeNotification;
import com.bidsignal.api.notification.domain.NoticeChangeNotificationStatus;
import com.bidsignal.api.user.domain.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NoticeChangeNotificationRepository extends JpaRepository<NoticeChangeNotification, Long> {

    // 사용자 변경 알림 삭제
    void deleteByUser(User user);

    // 상태별 변경 알림 조회 (먼저 만든 순, 발송에 쓰는 사용자와 공고 포함)
    @Query("""
        SELECT n
        FROM NoticeChangeNotification n
        JOIN FETCH n.user
        JOIN FETCH n.notice
        WHERE n.status = :status
        ORDER BY n.id ASC
        """)
    List<NoticeChangeNotification> findByStatusWithUserAndNotice(@Param("status") NoticeChangeNotificationStatus status, Pageable pageable);

    // 발송 대기 알림 선점 (벌크 UPDATE는 감사가 동작하지 않아서 updatedAt을 직접 바꾼다)
    @Modifying
    @Query("""
        UPDATE NoticeChangeNotification n
        SET n.status = :sending, n.updatedAt = :now
        WHERE n.id = :id
          AND n.status = :pending
        """)
    int claimPendingNotification(
            @Param("id") Long id,
            @Param("pending") NoticeChangeNotificationStatus pending,
            @Param("sending") NoticeChangeNotificationStatus sending,
            @Param("now") LocalDateTime now
    );

    // 기준 시각 전부터 발송중인 알림을 발송 대기로 복구
    @Modifying
    @Query("""
        UPDATE NoticeChangeNotification n
        SET n.status = :pending, n.updatedAt = :now
        WHERE n.status = :sending
          AND n.updatedAt < :threshold
        """)
    int recoverSendingNotifications(
            @Param("pending") NoticeChangeNotificationStatus pending,
            @Param("sending") NoticeChangeNotificationStatus sending,
            @Param("threshold") LocalDateTime threshold,
            @Param("now") LocalDateTime now
    );
}
