package com.bidsignal.api.global.response;

import lombok.Getter;

@Getter
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final String message;

    private ApiResponse(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    // 성공 (데이터 O)
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    // 성공 (데이터 X)
    public static ApiResponse<Void> success() {
        return new ApiResponse<>(true, null, null);
    }

    // 실패
    public static ApiResponse<Void> fail(String message) {
        return new ApiResponse<>(false, null, message);
    }
}