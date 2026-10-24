package com.bidsignal.api.global.external.gemini;

import lombok.Getter;

@Getter
public class GeminiTemporaryException extends RuntimeException {

    private final int status;

    /**
     * 한도 초과(429), 서비스 불가(503)처럼 나중에 다시 시도하면 될 수 있는 Gemini API 오류
     */
    public GeminiTemporaryException(int status) {
        super("Gemini API 일시 오류 status=" + status);
        this.status = status;
    }

}