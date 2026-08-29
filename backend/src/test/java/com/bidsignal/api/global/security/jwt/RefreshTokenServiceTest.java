package com.bidsignal.api.global.security.jwt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    private static final long EXPIRATION_MS = Duration.ofDays(14).toMillis();

    @Mock
    StringRedisTemplate stringRedisTemplate;

    @Mock
    ValueOperations<String, String> valueOperations;

    @InjectMocks
    RefreshTokenService refreshTokenService;

    @Test
    @DisplayName("Refresh Token을 Redis에 저장한다")
    void save_success() {

        // given
        ReflectionTestUtils.setField(
                refreshTokenService,
                "refreshTokenExpirationMs",
                EXPIRATION_MS
        );

        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        // when
        refreshTokenService.save(1L, "refresh-token-value");

        // then
        verify(valueOperations).set(
                "refresh_token:1",
                "refresh-token-value",
                Duration.ofMillis(EXPIRATION_MS)
        );
    }

    @Test
    @DisplayName("저장된 Refresh Token을 조회한다")
    void findByUserId_tokenExists() {

        // given
        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.get("refresh_token:1")).willReturn("stored-token");

        // when
        Optional<String> result = refreshTokenService.findByUserId(1L);

        // then
        assertThat(result).contains("stored-token");
    }

    @Test
    @DisplayName("저장된 Refresh Token이 없으면 빈 Optional을 반환한다")
    void findByUserId_tokenNotExists() {

        // given
        given(stringRedisTemplate.opsForValue()).willReturn(valueOperations);

        given(valueOperations.get("refresh_token:1")).willReturn(null);

        // when
        Optional<String> result = refreshTokenService.findByUserId(1L);

        // then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("사용자의 Refresh Token을 삭제한다")
    void deleteByUserId_success() {

        // when
        refreshTokenService.deleteByUserId(1L);

        // then
        verify(stringRedisTemplate).delete("refresh_token:1");
    }
}