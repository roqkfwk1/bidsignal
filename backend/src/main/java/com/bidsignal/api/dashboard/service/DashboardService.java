package com.bidsignal.api.dashboard.service;

import com.bidsignal.api.dashboard.dto.response.DashboardSummaryResponse;
import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import com.bidsignal.api.watchlist.repository.WatchlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final WatchlistItemRepository watchlistItemRepository;

    // 대시보드 요약 조회
    public DashboardSummaryResponse getSummary(Long userId) {

        LocalDateTime now = LocalDateTime.now();
        List<WatchlistStatus> activeStatuses = List.of(WatchlistStatus.REVIEWING, WatchlistStatus.PREPARING);
        long urgentCount = watchlistItemRepository.countDeadlineBetweenAndStatusIn(userId, now, now.plusDays(3), activeStatuses);
        long preparingCount = watchlistItemRepository.countByUserIdAndStatus(userId, WatchlistStatus.PREPARING);
        long weeklyCount = watchlistItemRepository.countDeadlineBetweenAndStatusIn(userId, now, now.plusDays(7), activeStatuses);

        return DashboardSummaryResponse.builder()
                .urgentCount(urgentCount)
                .preparingCount(preparingCount)
                .weeklyCount(weeklyCount)
                .build();
    }
}