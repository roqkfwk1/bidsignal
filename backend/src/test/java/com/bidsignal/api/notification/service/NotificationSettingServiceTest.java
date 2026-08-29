package com.bidsignal.api.notification.service;

import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notification.domain.NotificationSetting;
import com.bidsignal.api.notification.dto.request.NotificationSettingUpdateRequest;
import com.bidsignal.api.notification.dto.response.NotificationSettingResponse;
import com.bidsignal.api.notification.repository.NotificationSettingRepository;
import com.bidsignal.api.user.domain.User;
import com.bidsignal.api.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class NotificationSettingServiceTest {

    @Mock
    NotificationSettingRepository notificationSettingRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    NotificationSettingService notificationSettingService;

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
    @DisplayName("알림 설정을 조회하면 저장된 값을 반환한다")
    void getMyNotificationSetting_success() {

        // given
        User user = createUser();
        NotificationSetting setting = NotificationSetting.createDefault(user);

        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        given(notificationSettingRepository.findByUser(user)).willReturn(Optional.of(setting));

        // when
        NotificationSettingResponse response = notificationSettingService.getMyNotificationSetting(1L);

        // then
        assertThat(response.isEmailNotificationEnabled()).isTrue();
        assertThat(response.isD3Enabled()).isTrue();
        assertThat(response.isD1Enabled()).isTrue();
    }

    @Test
    @DisplayName("존재하지 않는 사용자의 알림 설정을 조회하면 예외가 발생한다")
    void getMyNotificationSetting_userNotFound() {

        // given
        given(userRepository.findById(1L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> notificationSettingService.getMyNotificationSetting(1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("알림 설정이 없으면 예외가 발생한다")
    void getMyNotificationSetting_settingNotFound() {

        // given
        User user = createUser();

        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        given(notificationSettingRepository.findByUser(user)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> notificationSettingService.getMyNotificationSetting(1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NOTIFICATION_SETTING_NOT_FOUND);
    }

    @Test
    @DisplayName("알림 설정을 수정하면 변경된 값을 반환한다")
    void updateMyNotificationSetting_success() {

        // given
        User user = createUser();
        NotificationSetting setting = NotificationSetting.createDefault(user);

        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        given(notificationSettingRepository.findByUser(user)).willReturn(Optional.of(setting));

        NotificationSettingUpdateRequest request = new NotificationSettingUpdateRequest();

        request.setEmailNotificationEnabled(false);
        request.setD3Enabled(true);
        request.setD1Enabled(false);

        // when
        NotificationSettingResponse response = notificationSettingService.updateMyNotificationSetting(1L, request);

        // then
        assertThat(response.isEmailNotificationEnabled()).isFalse();
        assertThat(response.isD3Enabled()).isTrue();
        assertThat(response.isD1Enabled()).isFalse();

        assertThat(setting.isEmailNotificationEnabled()).isFalse();
        assertThat(setting.isD1Enabled()).isFalse();
    }

    @Test
    @DisplayName("존재하지 않는 사용자의 알림 설정을 수정하면 예외가 발생한다")
    void updateMyNotificationSetting_userNotFound() {

        // given
        given(userRepository.findById(1L)).willReturn(Optional.empty());

        NotificationSettingUpdateRequest request = new NotificationSettingUpdateRequest();

        // when & then
        assertThatThrownBy(() -> notificationSettingService.updateMyNotificationSetting(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }
}