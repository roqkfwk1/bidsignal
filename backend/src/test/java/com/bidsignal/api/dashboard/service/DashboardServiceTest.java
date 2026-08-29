package com.bidsignal.api.dashboard.service;

import com.bidsignal.api.dashboard.dto.response.DashboardSummaryResponse;
import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.user.repository.UserRepository;
import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import com.bidsignal.api.watchlist.repository.WatchlistItemRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    WatchlistItemRepository watchlistItemRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    DashboardService dashboardService;

    @Test
    @DisplayName("대시보드 요약을 조회하면 각 상태별 건수를 반환한다")
    void getSummary_success() {

        // given
        long userId = 1L;

        given(userRepository.existsById(userId)).willReturn(true);
        given(watchlistItemRepository.countDeadlineBetweenAndStatusIn(
                eq(userId),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                anyList()
        )).willReturn(2L, 5L);

        given(watchlistItemRepository.countByUserIdAndStatus(
                userId,
                WatchlistStatus.PREPARING
        )).willReturn(3L);

        // when
        DashboardSummaryResponse response = dashboardService.getSummary(userId);

        // then
        assertThat(response.getUrgentCount()).isEqualTo(2L);
        assertThat(response.getPreparingCount()).isEqualTo(3L);
        assertThat(response.getWeeklyCount()).isEqualTo(5L);
    }

    @Test
    @DisplayName("마감 건수는 검토중과 준비중 상태만 집계한다")
    void getSummary_countsTargetStatuses() {

        // given
        long userId = 1L;
        List<WatchlistStatus> statuses = List.of(
                WatchlistStatus.REVIEWING,
                WatchlistStatus.PREPARING
        );

        given(userRepository.existsById(userId)).willReturn(true);
        given(watchlistItemRepository.countDeadlineBetweenAndStatusIn(
                eq(userId),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                eq(statuses)
        )).willReturn(1L);

        // when
        DashboardSummaryResponse response = dashboardService.getSummary(userId);

        // then
        assertThat(response.getUrgentCount()).isEqualTo(1L);
        assertThat(response.getWeeklyCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("존재하지 않는 사용자가 조회하면 USER_NOT_FOUND 예외가 발생한다")
    void getSummary_userNotFound() {

        // given
        given(userRepository.existsById(1L)).willReturn(false);

        // when & then
        assertThatThrownBy(() -> dashboardService.getSummary(1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }
}