package com.bidsignal.api.notification.service;

import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notification.domain.NotificationChannel;
import com.bidsignal.api.notification.domain.NotificationHistory;
import com.bidsignal.api.notification.dto.response.NotificationHistoryResponse;
import com.bidsignal.api.notification.repository.NotificationHistoryRepository;
import com.bidsignal.api.user.domain.User;
import com.bidsignal.api.user.repository.UserRepository;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationHistoryServiceTest {

    @Mock
    NotificationHistoryRepository notificationHistoryRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    NotificationHistoryService notificationHistoryService;

    private User createUser() {
        User user = User.create(
                "test@test.com",
                "12345678",
                "테스터",
                "01012345678"
        );

        ReflectionTestUtils.setField(user, "id", 1L);

        return user;
    }

    @Test
    @DisplayName("알림 내역을 조회하면 응답 DTO 페이지를 반환한다")
    void getMyNotificationHistories_success() {

        // given
        User user = createUser();
        Pageable pageable = PageRequest.of(0, 10);

        Notice notice = mock(Notice.class);
        given(notice.getId()).willReturn(500L);
        given(notice.getBidNtceNm()).willReturn("테스트 공고");

        WatchlistItem watchlistItem = mock(WatchlistItem.class);
        given(watchlistItem.getNotice()).willReturn(notice);

        NotificationHistory history = mock(NotificationHistory.class);
        given(history.getId()).willReturn(100L);
        given(history.getWatchlistItem()).willReturn(watchlistItem);
        given(history.getChannel()).willReturn(NotificationChannel.EMAIL);
        given(history.getRemainingDays()).willReturn(3);
        given(history.isRead()).willReturn(false);

        Page<NotificationHistory> page = new PageImpl<>(List.of(history), pageable, 1);

        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        given(notificationHistoryRepository.findByUserIdWithNotice(1L, pageable)).willReturn(page);

        // when
        Page<NotificationHistoryResponse> result = notificationHistoryService.getMyNotificationHistories(1L, pageable);

        // then
        assertThat(result.getContent()).hasSize(1);

        NotificationHistoryResponse response = result.getContent().getFirst();

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getNoticeId()).isEqualTo(500L);
        assertThat(response.getNoticeTitle()).isEqualTo("테스트 공고");
        assertThat(response.getChannel()).isEqualTo("EMAIL");
        assertThat(response.getRemainingDays()).isEqualTo(3);
        assertThat(response.isRead()).isFalse();
    }

    @Test
    @DisplayName("존재하지 않는 사용자의 알림 내역을 조회하면 예외가 발생한다")
    void getMyNotificationHistories_userNotFound() {

        // given
        Pageable pageable = PageRequest.of(0, 10);

        given(userRepository.findById(1L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> notificationHistoryService.getMyNotificationHistories(1L, pageable))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("알림을 읽음 처리한다")
    void markAsRead_success() {

        // given
        NotificationHistory history =
                NotificationHistory.createSuccess(
                        createUser(),
                        mock(WatchlistItem.class),
                        NotificationChannel.EMAIL,
                        3
                );

        given(notificationHistoryRepository.findByIdAndUserId(100L, 1L)).willReturn(Optional.of(history));

        // when
        notificationHistoryService.markAsRead(100L, 1L);

        // then
        assertThat(history.isRead()).isTrue();
    }

    @Test
    @DisplayName("존재하지 않는 알림을 읽음 처리하면 예외가 발생한다")
    void markAsRead_historyNotFound() {

        // given
        given(notificationHistoryRepository.findByIdAndUserId(100L, 1L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> notificationHistoryService.markAsRead(100L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NOTIFICATION_HISTORY_NOT_FOUND);
    }

    @Test
    @DisplayName("안 읽은 알림 개수를 반환한다")
    void getUnreadCount_success() {

        // given
        User user = createUser();

        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        given(notificationHistoryRepository.countByUserIdAndSuccessTrueAndIsReadFalse(1L)).willReturn(5L);

        // when
        long result = notificationHistoryService.getUnreadCount(1L);

        // then
        assertThat(result).isEqualTo(5L);
    }

    @Test
    @DisplayName("존재하지 않는 사용자의 안 읽은 알림 개수를 조회하면 예외가 발생한다")
    void getUnreadCount_userNotFound() {

        // given
        given(userRepository.findById(1L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> notificationHistoryService.getUnreadCount(1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("안 읽은 알림 전체를 읽음 처리한다")
    void markAllAsRead_success() {

        // given
        given(notificationHistoryRepository.markAllAsReadByUserId(1L)).willReturn(7);

        // when
        int result = notificationHistoryService.markAllAsRead(1L);

        // then
        assertThat(result).isEqualTo(7);
        verify(notificationHistoryRepository).markAllAsReadByUserId(1L);
    }
}