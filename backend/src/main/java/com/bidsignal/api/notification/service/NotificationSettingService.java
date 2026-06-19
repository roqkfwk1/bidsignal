package com.bidsignal.api.notification.service;

import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notification.domain.NotificationSetting;
import com.bidsignal.api.notification.dto.request.NotificationSettingUpdateRequest;
import com.bidsignal.api.notification.dto.response.NotificationSettingResponse;
import com.bidsignal.api.notification.repository.NotificationSettingRepository;
import com.bidsignal.api.user.domain.User;
import com.bidsignal.api.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationSettingService {

    private final NotificationSettingRepository notificationSettingRepository;
    private final UserRepository userRepository;

    /**
     * 나의 알림 설정을 조회한다.
     */
    public NotificationSettingResponse getMyNotificationSetting(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        NotificationSetting setting = notificationSettingRepository.findByUser(user)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_SETTING_NOT_FOUND));

        return NotificationSettingResponse.builder()
                .emailNotificationEnabled(setting.isEmailNotificationEnabled())
                .d3Enabled(setting.isD3Enabled())
                .d1Enabled(setting.isD1Enabled())
                .build();
    }

    /**
     * 나의 알림 설정을 수정한다.
     */
    @Transactional
    public NotificationSettingResponse updateMyNotificationSetting(Long userId, NotificationSettingUpdateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        NotificationSetting setting = notificationSettingRepository.findByUser(user)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_SETTING_NOT_FOUND));

        setting.update(request.isEmailNotificationEnabled(), request.isD3Enabled(), request.isD1Enabled());

        return NotificationSettingResponse.builder()
                .emailNotificationEnabled(setting.isEmailNotificationEnabled())
                .d3Enabled(setting.isD3Enabled())
                .d1Enabled(setting.isD1Enabled())
                .build();
    }
}