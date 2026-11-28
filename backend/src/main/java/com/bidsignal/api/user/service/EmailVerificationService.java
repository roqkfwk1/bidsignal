package com.bidsignal.api.user.service;

import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notification.service.EmailNotificationService;
import com.bidsignal.api.user.domain.User;
import com.bidsignal.api.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final String CODE_PREFIX = "email:verify:code:";
    private static final String ATTEMPT_PREFIX = "email:verify:attempt:";
    private static final String COOLDOWN_PREFIX = "email:verify:cooldown:";
    private static final String VERIFIED_PREFIX = "email:verified:";

    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    private static final Duration COOLDOWN_TTL = Duration.ofSeconds(60);
    private static final Duration VERIFIED_TTL = Duration.ofMinutes(30);
    private static final int MAX_ATTEMPTS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final StringRedisTemplate stringRedisTemplate;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;

    /**
     * 인증번호를 만들어 저장하고 메일로 발송한다.
     */
    public void sendCode(String email) {

        if (userRepository.existsByEmail(User.normalizeEmail(email))) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        String cooldownKey = createKey(COOLDOWN_PREFIX, email);
        Boolean acquired = stringRedisTemplate.opsForValue().setIfAbsent(cooldownKey, "1", COOLDOWN_TTL);

        if (!Boolean.TRUE.equals(acquired)) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOO_FREQUENT);
        }

        String codeKey = createKey(CODE_PREFIX, email);
        String code = createCode();

        stringRedisTemplate.opsForValue().set(codeKey, code, CODE_TTL);
        // 새 코드는 시도 횟수를 처음부터 센다
        stringRedisTemplate.delete(createKey(ATTEMPT_PREFIX, email));

        try {
            emailNotificationService.sendEmailVerificationCodeEmail(email, code);
        } catch (MailException e) {
            stringRedisTemplate.delete(codeKey);
            stringRedisTemplate.delete(cooldownKey);
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    /**
     * 인증번호를 확인하고 인증 완료 표시를 남긴다.
     */
    public void verifyCode(String email, String code) {

        String codeKey = createKey(CODE_PREFIX, email);
        String storedCode = stringRedisTemplate.opsForValue().get(codeKey);

        if (storedCode == null) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_CODE_NOT_FOUND);
        }

        String attemptKey = createKey(ATTEMPT_PREFIX, email);

        if (!storedCode.equals(code)) {
            throw new BusinessException(countFailure(codeKey, attemptKey));
        }

        stringRedisTemplate.delete(codeKey);
        stringRedisTemplate.delete(attemptKey);
        stringRedisTemplate.opsForValue().set(createKey(VERIFIED_PREFIX, email), "true", VERIFIED_TTL);
    }

    /**
     * 이메일 인증을 마쳤는지 확인한다.
     */
    public boolean isVerified(String email) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(createKey(VERIFIED_PREFIX, email)));
    }

    /**
     * 인증 완료 표시를 삭제한다.
     */
    public void deleteVerified(String email) {
        stringRedisTemplate.delete(createKey(VERIFIED_PREFIX, email));
    }

    /**
     * 실패 횟수를 올리고 한도에 닿으면 코드를 폐기한다.
     */
    private ErrorCode countFailure(String codeKey, String attemptKey) {

        Long attempts = stringRedisTemplate.opsForValue().increment(attemptKey);

        if (attempts != null && attempts == 1) {
            stringRedisTemplate.expire(attemptKey, CODE_TTL);
        }

        if (attempts != null && attempts >= MAX_ATTEMPTS) {
            stringRedisTemplate.delete(codeKey);
            stringRedisTemplate.delete(attemptKey);
            return ErrorCode.EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED;
        }

        return ErrorCode.INVALID_EMAIL_VERIFICATION_CODE;
    }

    private String createKey(String prefix, String email) {
        return prefix + User.normalizeEmail(email);
    }

    private String createCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }
}
