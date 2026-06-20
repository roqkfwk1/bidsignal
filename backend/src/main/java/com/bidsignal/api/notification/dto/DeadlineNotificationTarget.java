package com.bidsignal.api.notification.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DeadlineNotificationTarget {

    private String toEmail;             // 수신 이메일
    private Long noticeId;              // 공고 ID
    private String noticeTitle;         // 공고명
    private LocalDateTime bidCloseDate; // 마감일
    private int remainingDays;          // D-3 / D-1
}
