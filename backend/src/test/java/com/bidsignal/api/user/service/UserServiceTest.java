package com.bidsignal.api.user.service;

import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.global.security.jwt.JwtProvider;
import com.bidsignal.api.global.security.jwt.RefreshTokenService;
import com.bidsignal.api.notification.repository.NoticeChangeNotificationRepository;
import com.bidsignal.api.notification.repository.NotificationSettingRepository;
import com.bidsignal.api.user.domain.User;
import com.bidsignal.api.user.dto.request.UserLoginRequest;
import com.bidsignal.api.user.dto.request.UserSignupRequest;
import com.bidsignal.api.user.dto.response.TokenResponse;
import com.bidsignal.api.user.dto.response.UserResponse;
import com.bidsignal.api.user.repository.UserRepository;
import com.bidsignal.api.watchlist.service.WatchlistService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    JwtProvider jwtProvider;

    @Mock
    RefreshTokenService refreshTokenService;

    @Mock
    NotificationSettingRepository notificationSettingRepository;

    @Mock
    NoticeChangeNotificationRepository noticeChangeNotificationRepository;

    @Mock
    WatchlistService watchlistService;

    @Mock
    EmailVerificationService emailVerificationService;

    @InjectMocks
    UserService userService;

    private UserSignupRequest createSignupRequest() {
        return createSignupRequest("test@test.com");
    }

    private UserSignupRequest createSignupRequest(String email) {
        UserSignupRequest request = new UserSignupRequest();

        ReflectionTestUtils.setField(request, "email", email);
        ReflectionTestUtils.setField(request, "password", "12345678");
        ReflectionTestUtils.setField(request, "nickname", "테스터");
        ReflectionTestUtils.setField(request, "phoneNumber", "01012345678");

        return request;
    }

    @Test
    @DisplayName("이메일 인증을 하지 않았으면 가입을 거절한다")
    void signup_emailNotVerified() {

        // given
        UserSignupRequest request = createSignupRequest();

        given(emailVerificationService.isVerified("test@test.com")).willReturn(false);

        // when & then
        assertThatThrownBy(() -> userService.signup(request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.EMAIL_NOT_VERIFIED);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("이메일 인증을 했으면 가입하고 인증 완료 표시를 지운다")
    void signup_success() {

        // given
        UserSignupRequest request = createSignupRequest();

        User user = User.create("test@test.com", "encoded", "테스터", "01012345678");
        ReflectionTestUtils.setField(user, "id", 1L);

        given(emailVerificationService.isVerified("test@test.com")).willReturn(true);

        given(userRepository.existsByEmail("test@test.com")).willReturn(false);

        given(passwordEncoder.encode("12345678")).willReturn("encoded");

        given(userRepository.save(any(User.class))).willReturn(user);

        // when
        UserResponse response = userService.signup(request);

        // then
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getEmail()).isEqualTo("test@test.com");
        verify(emailVerificationService).deleteVerified("test@test.com");
    }

    @Test
    @DisplayName("인증 후 다른 이유로 가입이 실패하면 인증 완료 표시를 지우지 않는다")
    void signup_failedKeepsVerified() {

        // given
        UserSignupRequest request = createSignupRequest();

        given(emailVerificationService.isVerified("test@test.com")).willReturn(true);

        given(userRepository.existsByEmail("test@test.com")).willReturn(true);

        // when & then
        assertThatThrownBy(() -> userService.signup(request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_EMAIL);

        verify(emailVerificationService, never()).deleteVerified("test@test.com");
    }

    @Test
    @DisplayName("대문자와 공백이 섞인 이메일로 가입하면 정리된 이메일로 저장한다")
    void signup_normalizedEmail() {

        // given
        UserSignupRequest request = createSignupRequest("  Test@TEST.com ");

        User user = User.create("test@test.com", "encoded", "테스터", "01012345678");
        ReflectionTestUtils.setField(user, "id", 1L);

        given(emailVerificationService.isVerified("test@test.com")).willReturn(true);

        given(userRepository.existsByEmail("test@test.com")).willReturn(false);

        given(passwordEncoder.encode("12345678")).willReturn("encoded");

        given(userRepository.save(any(User.class))).willReturn(user);

        // when
        userService.signup(request);

        // then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        assertThat(userCaptor.getValue().getEmail()).isEqualTo("test@test.com");
        verify(emailVerificationService).deleteVerified("test@test.com");
    }

    @Test
    @DisplayName("가입된 이메일을 대소문자만 바꿔 가입하면 중복으로 거절한다")
    void signup_duplicateEmailIgnoringCase() {

        // given
        UserSignupRequest request = createSignupRequest("TEST@Test.com");

        given(emailVerificationService.isVerified("test@test.com")).willReturn(true);

        given(userRepository.existsByEmail("test@test.com")).willReturn(true);

        // when & then
        assertThatThrownBy(() -> userService.signup(request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_EMAIL);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("대소문자와 공백이 다른 이메일로도 로그인한다")
    void login_emailIgnoringCase() {

        // given
        UserLoginRequest request = new UserLoginRequest();
        ReflectionTestUtils.setField(request, "email", " Test@TEST.com");
        ReflectionTestUtils.setField(request, "password", "12345678");

        User user = User.create("test@test.com", "encoded", "테스터", "01012345678");
        ReflectionTestUtils.setField(user, "id", 1L);

        given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));

        given(passwordEncoder.matches("12345678", "encoded")).willReturn(true);

        given(jwtProvider.generateAccessToken(1L)).willReturn("access-token");

        given(jwtProvider.generateRefreshToken(1L)).willReturn("refresh-token");

        // when
        TokenResponse response = userService.login(request);

        // then
        assertThat(response.getAccessToken()).isEqualTo("access-token");
        verify(refreshTokenService).save(1L, "refresh-token");
    }
}
