package com.bidsignal.api.notification.service;

import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notification.domain.NotificationHistory;
import com.bidsignal.api.notification.dto.response.NotificationHistoryResponse;
import com.bidsignal.api.notification.repository.NotificationHistoryRepository;
import com.bidsignal.api.user.domain.User;
import com.bidsignal.api.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationHistoryService {

    private final NotificationHistoryRepository notificationHistoryRepository;
    private final UserRepository userRepository;

    /**
     * 내 알림 내역을 조회한다.
     */
    public Page<NotificationHistoryResponse> getMyNotificationHistories(Long userId, Pageable pageable) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Page<NotificationHistory> histories = notificationHistoryRepository.findByUserIdWithNotice(user.getId(), pageable);

        return histories.map(history -> NotificationHistoryResponse.builder()
                .id(history.getId())
                .noticeId(history.getWatchlistItem().getNotice().getId())
                .noticeTitle(history.getWatchlistItem().getNotice().getBidNtceNm())
                .channel(history.getChannel().name())
                .remainingDays(history.getRemainingDays())
                .sentAt(history.getCreatedAt())
                .isRead(history.isRead())
                .build());
    }

    /**
     * 알림을 읽음 처리한다.
     */
    @Transactional
    public void markAsRead(Long id, Long userId) {

        NotificationHistory history = notificationHistoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_HISTORY_NOT_FOUND));

        history.markAsRead();
    }

    /**
     * 안 읽은 알림 개수를 조회한다.
     */
    public long getUnreadCount(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        return notificationHistoryRepository.countByUserIdAndSuccessTrueAndIsReadFalse(user.getId());
    }
}
