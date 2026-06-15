package com.bidsignal.api.user.controller;

import com.bidsignal.api.global.response.ApiResponse;
import com.bidsignal.api.user.dto.request.UserLoginRequest;
import com.bidsignal.api.user.dto.request.UserSignupRequest;
import com.bidsignal.api.user.dto.response.TokenResponse;
import com.bidsignal.api.user.dto.response.UserResponse;
import com.bidsignal.api.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signup(@Valid @RequestBody UserSignupRequest request) {

        UserResponse response = userService.signup(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody UserLoginRequest request) {

        TokenResponse response = userService.login(request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 로그아웃 - Refresh Token 삭제 적용 전 임시
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal Long userId) {

        userService.logout(userId);

        return ResponseEntity.ok(ApiResponse.success());
    }

    // 내 정보 조회
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo(@AuthenticationPrincipal Long userId) {

        UserResponse response = userService.getMyInfo(userId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}