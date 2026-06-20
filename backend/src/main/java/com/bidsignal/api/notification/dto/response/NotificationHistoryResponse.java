package com.bidsignal.api.notification.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationHistoryResponse {

    private Long id;              // 알림 ID
    private Long noticeId;        // 공고 ID
    private String noticeTitle;   // 공고명
    private String channel;       // 발송 채널
    private int remainingDays;    // D-3 / D-1
    private LocalDateTime sentAt; // 발송 일시
    private boolean isRead;       // 읽음 여부
}
