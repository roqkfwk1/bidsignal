package com.bidsignal.api.notification.controller;

import com.bidsignal.api.global.response.ApiResponse;
import com.bidsignal.api.notification.dto.response.NotificationHistoryResponse;
import com.bidsignal.api.notification.service.NotificationHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notification-histories")
public class NotificationHistoryController {

    private final NotificationHistoryService notificationHistoryService;

    // 내 알림 내역 조회
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationHistoryResponse>>> getMyNotificationHistories(
            @AuthenticationPrincipal Long userId,
            @PageableDefault Pageable pageable
    ) {
        Page<NotificationHistoryResponse> responses = notificationHistoryService.getMyNotificationHistories(userId, pageable);

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    // 알림 읽음 처리
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id, @AuthenticationPrincipal Long userId) {

        notificationHistoryService.markAsRead(id, userId);

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // 안 읽은 알림 개수 조회
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@AuthenticationPrincipal Long userId) {

        long count = notificationHistoryService.getUnreadCount(userId);

        return ResponseEntity.ok(ApiResponse.success(count));
    }
}