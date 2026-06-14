package com.bidsignal.api.watchlist.controller;

import com.bidsignal.api.global.response.ApiResponse;
import com.bidsignal.api.watchlist.dto.request.WatchlistMemoUpdateRequest;
import com.bidsignal.api.watchlist.dto.request.WatchlistStatusUpdateRequest;
import com.bidsignal.api.watchlist.dto.response.WatchlistListResponse;
import com.bidsignal.api.watchlist.dto.response.WatchlistSaveResponse;
import com.bidsignal.api.watchlist.service.WatchlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notices")
public class WatchlistController {

    private final WatchlistService watchlistService;

    // 관심 공고 목록 조회
    @GetMapping("/watchlist")
    public ResponseEntity<ApiResponse<List<WatchlistListResponse>>> getWatchlist(@RequestParam Long userId) {

        List<WatchlistListResponse> response = watchlistService.getWatchlist(userId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 관심 공고 저장
    @PostMapping("/{id}/watchlist")
    public ResponseEntity<ApiResponse<WatchlistSaveResponse>> saveWatchlist(@RequestParam Long userId, @PathVariable("id") Long noticeId) {

        WatchlistSaveResponse response = watchlistService.saveWatchlist(userId, noticeId);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // 관심 공고 삭제
    @DeleteMapping("/{id}/watchlist")
    public ResponseEntity<ApiResponse<Void>> deleteWatchlist(@RequestParam Long userId, @PathVariable("id") Long noticeId) {

        watchlistService.deleteWatchlist(userId, noticeId);

        return ResponseEntity.ok(ApiResponse.success());
    }

    // 관심 공고 상태 변경
    @PatchMapping("/{id}/watchlist/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(@RequestParam Long userId, @PathVariable("id") Long noticeId, @Valid @RequestBody WatchlistStatusUpdateRequest request) {

        watchlistService.updateStatus(userId, noticeId, request);

        return ResponseEntity.ok(ApiResponse.success());
    }

    // 관심 공고 메모 수정
    @PatchMapping("/{id}/watchlist/memo")
    public ResponseEntity<ApiResponse<Void>> updateMemo(@RequestParam Long userId, @PathVariable("id") Long noticeId, @Valid @RequestBody WatchlistMemoUpdateRequest request) {

        watchlistService.updateMemo(userId, noticeId, request);

        return ResponseEntity.ok(ApiResponse.success());
    }
}