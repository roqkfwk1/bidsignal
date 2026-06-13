package com.bidsignal.api.watchlist.repository;

import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {

    // 사용자별 관심 공고 목록 조회
    @Query("SELECT w FROM WatchlistItem w JOIN FETCH w.notice WHERE w.user.id = :userId")
    List<WatchlistItem> findByUserIdWithNotice(@Param("userId") Long userId);

    // 중복 저장 방지
    boolean existsByUserIdAndNoticeId(Long userId, Long noticeId);

    // 사용자 ID로 조회 (사용자 본인 소유 검증)
    Optional<WatchlistItem> findByIdAndUserId(Long id, Long userId);

    // 사용자 + 공고로 단건 조회
    @Query("SELECT w FROM WatchlistItem w JOIN FETCH w.notice WHERE w.user.id = :userId AND w.notice.id = :noticeId")
    Optional<WatchlistItem> findByUserIdAndNoticeIdWithNotice(@Param("userId") Long userId, @Param("noticeId") Long noticeId);

    // 기간 내 마감 건수 (D-3, D-7 공통 / 지정 상태만)
    @Query("SELECT COUNT(w) FROM WatchlistItem w WHERE w.user.id = :userId AND w.notice.bidClseDt BETWEEN :now AND :deadline AND w.status IN :statuses")
    long countDeadlineBetweenAndStatusIn(@Param("userId") Long userId, @Param("now") LocalDateTime now, @Param("deadline") LocalDateTime deadline, @Param("statuses") List<WatchlistStatus> statuses);

    // 상태별 건수
    long countByUserIdAndStatus(Long userId, WatchlistStatus status);
}