package com.bidsignal.api.notice.controller;

import com.bidsignal.api.global.response.ApiResponse;
import com.bidsignal.api.notice.dto.request.NoticeSearchRequest;
import com.bidsignal.api.notice.dto.response.NoticeDetailResponse;
import com.bidsignal.api.notice.dto.response.NoticeListResponse;
import com.bidsignal.api.notice.dto.response.NoticeSyncResponse;
import com.bidsignal.api.notice.service.NoticeService;
import com.bidsignal.api.notice.service.NoticeSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;
    private final NoticeSyncService noticeSyncService;

    // 공고 목록 조회
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NoticeListResponse>>> search(@ModelAttribute NoticeSearchRequest request, @PageableDefault Pageable pageable) {

        Page<NoticeListResponse> response = noticeService.search(request, pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 공고 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoticeDetailResponse>> getNotice(@PathVariable Long id) {

        NoticeDetailResponse response = noticeService.getNotice(id);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 나라장터 공고 수동 동기화
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<NoticeSyncResponse>> syncAllBidNotices(@RequestParam String beginDateTime, @RequestParam String endDateTime) {

        NoticeSyncResponse response = noticeSyncService.syncAllBidNotices(beginDateTime, endDateTime);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}