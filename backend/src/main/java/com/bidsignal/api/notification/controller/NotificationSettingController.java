package com.bidsignal.api.notification.controller;

import com.bidsignal.api.global.response.ApiResponse;
import com.bidsignal.api.notification.dto.request.NotificationSettingUpdateRequest;
import com.bidsignal.api.notification.dto.response.NotificationSettingResponse;
import com.bidsignal.api.notification.service.NotificationSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notification-settings")
public class NotificationSettingController {

    private final NotificationSettingService notificationSettingService;

    // 내 알림 설정 조회
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<NotificationSettingResponse>> getMyNotificationSetting(@AuthenticationPrincipal Long userId) {

        NotificationSettingResponse response = notificationSettingService.getMyNotificationSetting(userId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 내 알림 설정 수정
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<NotificationSettingResponse>> updateMyNotificationSetting(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody NotificationSettingUpdateRequest request
    ) {

        NotificationSettingResponse response = notificationSettingService.updateMyNotificationSetting(userId, request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}