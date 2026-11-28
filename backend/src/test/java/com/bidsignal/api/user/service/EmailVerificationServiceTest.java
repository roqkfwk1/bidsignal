package com.bidsignal.api.user.service;

import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notification.service.EmailNotificationService;
import com.bidsignal.api.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mail.MailSendException;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    private static final String EMAIL = "test@test.com";
    private static final String CODE_KEY = "email:verify:code:test@test.com";
    private static final String ATTEMPT_KEY = "email:verify:attempt:test@test.com";
    private static final String COOLDOWN_KEY = "email:verify:cooldown:test@test.com";
    private static final String VERIFIED_KEY = "email:verified:test@test.com";

    @Mock
    StringRedisTemplate stringRedisTemplate;

    @Mock
    ValueOperations<String, String> valueOperations;

    @Mock
    UserRepository userRepository;

    @Mock
    EmailNotificationService emailNotificationService;

    @InjectMocks
    EmailVerificationService emailVerificationService;

    @Test
    @DisplayName("인증번호를 요청하면 6자리 코드를 저장하고 메일을 한 번 발송한다")
    void sendCode_success() {

        // given
        given(userRepository.existsByEmail(EMAIL)).willReturn(false);

        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.setIfAbsent(COOLDOWN_KEY, "1", Duration.ofSeconds(60))).willReturn(true);

        // when
        emailVerificationService.sendCode(EMAIL);

        // then
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(eq(CODE_KEY), codeCaptor.capture(), eq(Duration.ofMinutes(5)));

        assertThat(codeCaptor.getValue()).matches("\\d{6}");
        verify(emailNotificationService, times(1)).sendEmailVerificationCodeEmail(EMAIL, codeCaptor.getValue());
    }

    @Test
    @DisplayName("이미 가입된 이메일이면 인증번호 요청을 거절한다")
    void sendCode_duplicateEmail() {

        // given
        given(userRepository.existsByEmail(EMAIL)).willReturn(true);

        // when & then
        assertThatThrownBy(() -> emailVerificationService.sendCode(EMAIL))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_EMAIL);

        verify(emailNotificationService, never()).sendEmailVerificationCodeEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("가입된 이메일을 대소문자만 바꿔 요청해도 거절한다")
    void sendCode_duplicateEmailIgnoringCase() {

        // given
        given(userRepository.existsByEmail(EMAIL)).willReturn(true);

        // when & then
        assertThatThrownBy(() -> emailVerificationService.sendCode(" Test@TEST.com"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_EMAIL);

        verify(emailNotificationService, never()).sendEmailVerificationCodeEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("60초 안에 다시 요청하면 거절한다")
    void sendCode_tooFrequent() {

        // given
        given(userRepository.existsByEmail(EMAIL)).willReturn(false);

        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.setIfAbsent(COOLDOWN_KEY, "1", Duration.ofSeconds(60))).willReturn(false);

        // when & then
        assertThatThrownBy(() -> emailVerificationService.sendCode(EMAIL))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.EMAIL_VERIFICATION_TOO_FREQUENT);

        verify(emailNotificationService, never()).sendEmailVerificationCodeEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("메일 발송이 실패하면 저장한 코드와 재발송 제한 키를 지운다")
    void sendCode_mailFailed() {

        // given
        given(userRepository.existsByEmail(EMAIL)).willReturn(false);

        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.setIfAbsent(COOLDOWN_KEY, "1", Duration.ofSeconds(60))).willReturn(true);

        willThrow(new MailSendException("발송 실패"))
                .given(emailNotificationService)
                .sendEmailVerificationCodeEmail(anyString(), anyString());

        // when & then
        assertThatThrownBy(() -> emailVerificationService.sendCode(EMAIL))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.EMAIL_SEND_FAILED);

        verify(stringRedisTemplate).delete(CODE_KEY);
        verify(stringRedisTemplate).delete(COOLDOWN_KEY);
    }

    @Test
    @DisplayName("올바른 코드를 입력하면 코드를 지우고 인증 완료 표시를 남긴다")
    void verifyCode_success() {

        // given
        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.get(CODE_KEY)).willReturn("123456");

        // when
        emailVerificationService.verifyCode(EMAIL, "123456");

        // then
        verify(stringRedisTemplate).delete(CODE_KEY);
        verify(stringRedisTemplate).delete(ATTEMPT_KEY);
        verify(valueOperations).set(VERIFIED_KEY, "true", Duration.ofMinutes(30));
    }

    @Test
    @DisplayName("이메일의 앞뒤 공백과 대문자는 정리해서 같은 키로 처리한다")
    void verifyCode_normalizedEmail() {

        // given
        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.get(CODE_KEY)).willReturn("123456");

        // when
        emailVerificationService.verifyCode("  Test@TEST.com ", "123456");

        // then
        verify(stringRedisTemplate).delete(CODE_KEY);
        verify(stringRedisTemplate).delete(ATTEMPT_KEY);
        verify(valueOperations).set(VERIFIED_KEY, "true", Duration.ofMinutes(30));
    }

    @Test
    @DisplayName("틀린 코드를 입력하면 시도 횟수를 올리고 코드는 유지한다")
    void verifyCode_wrongCode() {

        // given
        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.get(CODE_KEY)).willReturn("123456");

        given(valueOperations.increment(ATTEMPT_KEY)).willReturn(1L);

        // when & then
        assertThatThrownBy(() -> emailVerificationService.verifyCode(EMAIL, "000000"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_EMAIL_VERIFICATION_CODE);

        verify(stringRedisTemplate).expire(ATTEMPT_KEY, Duration.ofMinutes(5));
        verify(stringRedisTemplate, never()).delete(CODE_KEY);
    }

    @Test
    @DisplayName("5번째로 틀리면 코드를 폐기하고 거절한다")
    void verifyCode_attemptsExceeded() {

        // given
        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.get(CODE_KEY)).willReturn("123456");

        given(valueOperations.increment(ATTEMPT_KEY)).willReturn(5L);

        // when & then
        assertThatThrownBy(() -> emailVerificationService.verifyCode(EMAIL, "000000"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED);

        verify(stringRedisTemplate).delete(CODE_KEY);
        verify(stringRedisTemplate).delete(ATTEMPT_KEY);
        verify(valueOperations, never()).set(VERIFIED_KEY, "true", Duration.ofMinutes(30));
    }

    @Test
    @DisplayName("코드가 없거나 만료되었으면 거절한다")
    void verifyCode_codeNotFound() {

        // given
        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.get(CODE_KEY)).willReturn(null);

        // when & then
        assertThatThrownBy(() -> emailVerificationService.verifyCode(EMAIL, "123456"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.EMAIL_VERIFICATION_CODE_NOT_FOUND);

        verify(valueOperations, never()).increment(ATTEMPT_KEY);
    }
}
