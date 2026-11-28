package com.bidsignal.api.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "잘못된 입력값입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    INVALID_LOGIN(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    EMAIL_NOT_VERIFIED(HttpStatus.BAD_REQUEST, "이메일 인증이 필요합니다."),

    // EmailVerification
    EMAIL_VERIFICATION_TOO_FREQUENT(HttpStatus.TOO_MANY_REQUESTS, "인증번호는 1분에 한 번만 요청할 수 있습니다."),
    EMAIL_VERIFICATION_CODE_NOT_FOUND(HttpStatus.BAD_REQUEST, "인증번호가 없거나 만료되었습니다. 인증번호를 다시 요청해 주세요."),
    INVALID_EMAIL_VERIFICATION_CODE(HttpStatus.BAD_REQUEST, "인증번호가 올바르지 않습니다."),
    EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED(HttpStatus.BAD_REQUEST, "인증번호를 5회 잘못 입력했습니다. 인증번호를 다시 요청해 주세요."),
    EMAIL_SEND_FAILED(HttpStatus.BAD_GATEWAY, "인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요."),

    // Notice
    NOTICE_NOT_FOUND(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다."),

    // Watchlist
    WATCHLIST_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "관심 공고를 찾을 수 없습니다."),
    DUPLICATE_WATCHLIST_ITEM(HttpStatus.CONFLICT, "이미 관심 공고에 저장된 공고입니다."),

    // Checklist
    CHECKLIST_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "체크리스트 항목을 찾을 수 없습니다."),

    // NotificationSetting
    NOTIFICATION_SETTING_NOT_FOUND(HttpStatus.NOT_FOUND, "알림 설정을 찾을 수 없습니다."),

    // NotificationHistory
    NOTIFICATION_HISTORY_NOT_FOUND(HttpStatus.NOT_FOUND, "알림 이력을 찾을 수 없습니다."),

    // Token
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 Refresh Token입니다."),

    // External API
    NARA_API_ERROR(HttpStatus.BAD_GATEWAY, "나라장터 API 호출에 실패했습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}