package com.bidsignal.api.user.controller;

import com.bidsignal.api.global.response.ApiResponse;
import com.bidsignal.api.user.dto.request.EmailVerificationSendRequest;
import com.bidsignal.api.user.dto.request.EmailVerificationVerifyRequest;
import com.bidsignal.api.user.service.EmailVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/email")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    // 인증번호 발송
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Void>> sendCode(@Valid @RequestBody EmailVerificationSendRequest request) {

        emailVerificationService.sendCode(request.getEmail());

        return ResponseEntity.ok(ApiResponse.success());
    }

    // 인증번호 확인
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Void>> verifyCode(@Valid @RequestBody EmailVerificationVerifyRequest request) {

        emailVerificationService.verifyCode(request.getEmail(), request.getCode());

        return ResponseEntity.ok(ApiResponse.success());
    }
}
