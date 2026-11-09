package com.bidsignal.api.notice.controller;

import com.bidsignal.api.global.response.ApiResponse;
import com.bidsignal.api.notice.dto.response.NoticeSyncResponse;
import com.bidsignal.api.notice.service.NoticeSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Profile("local")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notices")
public class NoticeSyncController {

    private final NoticeSyncService noticeSyncService;

    // 나라장터 공고 수동 동기화
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<NoticeSyncResponse>> syncAllBidNotices(@RequestParam String beginDateTime, @RequestParam String endDateTime) {

        NoticeSyncResponse response = noticeSyncService.syncAllBidNotices(beginDateTime, endDateTime);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}