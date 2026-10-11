package com.bidsignal.api.global.monitoring;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SchedulerStatusTracker {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final Map<String, LocalDateTime> lastSuccessAt = new ConcurrentHashMap<>();
    private final Map<String, Duration> maxAges = new ConcurrentHashMap<>();

    // 감시할 작업을 등록한다. 등록 시각으로 시작하므로 재시작 직후에는 정상으로 판정된다.
    public void register(String jobName, Duration maxAge) {
        maxAges.put(jobName, maxAge);
        lastSuccessAt.put(jobName, LocalDateTime.now(SEOUL));
    }

    public void markSuccess(String jobName) {
        lastSuccessAt.put(jobName, LocalDateTime.now(SEOUL));
    }

    public Map<String, LocalDateTime> getLastSuccessTimes() {
        return Map.copyOf(lastSuccessAt);
    }

    public Map<String, Duration> getMaxAges() {
        return Map.copyOf(maxAges);
    }
}