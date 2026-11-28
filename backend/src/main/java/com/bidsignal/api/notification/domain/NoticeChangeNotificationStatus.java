package com.bidsignal.api.notification.domain;

public enum NoticeChangeNotificationStatus {
    PENDING,    // 발송 대기
    SENDING,    // 발송중
    SENT,       // 발송 완료
    FAILED,     // 발송 실패
    SKIPPED     // 발송 직전에 대상이 아니라서 건너뜀
}
