package com.bidsignal.api.dashboard.controller;

import com.bidsignal.api.dashboard.dto.response.DashboardSummaryResponse;
import com.bidsignal.api.dashboard.service.DashboardService;
import com.bidsignal.api.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    // 대시보드 요약 조회
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary(@AuthenticationPrincipal Long userId) {

        DashboardSummaryResponse response = dashboardService.getSummary(userId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}