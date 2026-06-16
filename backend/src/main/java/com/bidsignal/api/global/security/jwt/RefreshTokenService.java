package com.bidsignal.api.global.security.jwt;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";
    private final StringRedisTemplate stringRedisTemplate;
    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    /**
     * Refresh Token을 Redis에 저장한다.
     */
    public void save(Long userId, String refreshToken) {

        String key = createKey(userId);
        Duration ttl = Duration.ofMillis(refreshTokenExpirationMs);

        stringRedisTemplate.opsForValue().set(key, refreshToken, ttl);
    }

    /**
     * Redis에서 Refresh Token을 조회한다.
     */
    public Optional<String> findByUserId(Long userId) {

        String key = createKey(userId);
        String refreshToken = stringRedisTemplate.opsForValue().get(key);

        return Optional.ofNullable(refreshToken);
    }

    /**
     * Redis에서 Refresh Token을 삭제한다.
     */
    public void deleteByUserId(Long userId) {

        String key = createKey(userId);

        stringRedisTemplate.delete(key);
    }

    private String createKey(Long userId) {
        return REFRESH_TOKEN_PREFIX + userId;
    }
}