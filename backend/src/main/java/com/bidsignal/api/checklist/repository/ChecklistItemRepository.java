package com.bidsignal.api.checklist.repository;

import com.bidsignal.api.checklist.domain.ChecklistItem;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Long> {

    // 관심공고 체크리스트 목록 조회
    List<ChecklistItem> findByWatchlistItemIdOrderBySortOrderAsc(Long watchlistItemId);

    // 관심공고 체크리스트 항목 조회
    Optional<ChecklistItem> findByIdAndWatchlistItemId(Long itemId, Long watchlistItemId);

    // 마지막 표시 순서 조회
    @Query("SELECT COALESCE(MAX(c.sortOrder), 0) FROM ChecklistItem c WHERE c.watchlistItem.id = :watchlistItemId")
    int findMaxSortOrderByWatchlistItemId(@Param("watchlistItemId") Long watchlistItemId);

    // 관심공고 체크리스트 존재 여부 확인
    boolean existsByWatchlistItemId(Long watchlistItemId);

    // 관심공고 체크리스트 삭제
    void deleteByWatchlistItem(WatchlistItem watchlistItem);

    // 여러 관심공고의 체크리스트 항목을 한 번에 조회 (목록 화면용)
    List<ChecklistItem> findByWatchlistItemIdIn(List<Long> watchlistItemIds);
}