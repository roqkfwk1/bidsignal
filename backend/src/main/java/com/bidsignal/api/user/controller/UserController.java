package com.bidsignal.api.user.controller;

import com.bidsignal.api.global.response.ApiResponse;
import com.bidsignal.api.user.dto.request.UserLoginRequest;
import com.bidsignal.api.user.dto.request.UserSignupRequest;
import com.bidsignal.api.user.dto.response.UserResponse;
import com.bidsignal.api.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApiResponse<UserResponse>> login(@Valid @RequestBody UserLoginRequest request) {

        UserResponse response = userService.login(request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 로그아웃 - JWT 붙기 전 임시
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestParam Long userId) {

        userService.logout(userId);

        return ResponseEntity.ok(ApiResponse.success());
    }

    // 내 정보 조회 - JWT 붙기 전 임시
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo(@RequestParam Long userId) {

        UserResponse response = userService.getMyInfo(userId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}