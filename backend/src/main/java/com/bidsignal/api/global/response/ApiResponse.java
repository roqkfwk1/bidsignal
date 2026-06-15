package com.bidsignal.api.global.response;

import lombok.Getter;

@Getter
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final String code;
    private final String message;

    private ApiResponse(boolean success, T data, String code, String message) {
        this.success = success;
        this.data = data;
        this.code = code;
        this.message = message;
    }

    // 성공 (데이터 O)
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, "SUCCESS", "요청에 성공했습니다.");
    }

    // 성공 (데이터 X)
    public static ApiResponse<Void> success() {
        return new ApiResponse<>(true, null, "SUCCESS", "요청에 성공했습니다.");
    }

    // 실패
    public static ApiResponse<Void> fail(String code, String message) {
        return new ApiResponse<>(false, null, code, message);
    }
}