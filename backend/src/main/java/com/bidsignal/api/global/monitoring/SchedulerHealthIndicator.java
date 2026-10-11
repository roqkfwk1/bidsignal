package com.bidsignal.api.global.monitoring;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component("scheduler")
@RequiredArgsConstructor
public class SchedulerHealthIndicator implements HealthIndicator {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final SchedulerStatusTracker schedulerStatusTracker;

    /**
     * 등록된 스케줄러 중 허용 시간 안에 성공하지 못한 작업이 있으면 DOWN으로 응답한다.
     */
    @Override
    public Health health() {

        LocalDateTime now = LocalDateTime.now(SEOUL);
        Map<String, LocalDateTime> lastSuccessTimes = schedulerStatusTracker.getLastSuccessTimes();
        Map<String, Duration> maxAges = schedulerStatusTracker.getMaxAges();

        List<String> staleJobs = new ArrayList<>();

        for (Map.Entry<String, Duration> entry : maxAges.entrySet()) {
            String jobName = entry.getKey();
            LocalDateTime lastSuccessAt = lastSuccessTimes.get(jobName);

            if (lastSuccessAt == null || Duration.between(lastSuccessAt, now).compareTo(entry.getValue()) > 0) {
                staleJobs.add(jobName);
            }
        }

        if (staleJobs.isEmpty()) {
            return Health.up().build();
        }

        return Health.down()
                .withDetail("staleJobs", staleJobs)
                .build();
    }
}