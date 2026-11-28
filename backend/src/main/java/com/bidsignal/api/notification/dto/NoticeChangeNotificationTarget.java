package com.bidsignal.api.notification.dto;

import com.bidsignal.api.notification.domain.NoticeChangeType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NoticeChangeNotificationTarget {

    private String toEmail;                     // 수신 이메일
    private Long noticeId;                      // 공고 ID
    private String noticeTitle;                 // 공고명
    private NoticeChangeType type;              // 변경 / 취소
    private LocalDateTime previousBidCloseDate; // 이전 마감일
    private LocalDateTime previousOpeningDate;  // 이전 개찰일
    private LocalDateTime bidCloseDate;         // 현재 마감일
    private LocalDateTime openingDate;          // 현재 개찰일
}
