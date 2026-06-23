package com.bidsignal.api.checklist.controller;

import com.bidsignal.api.checklist.dto.request.ChecklistItemCheckRequest;
import com.bidsignal.api.checklist.dto.request.ChecklistItemCreateRequest;
import com.bidsignal.api.checklist.dto.response.ChecklistItemResponse;
import com.bidsignal.api.checklist.dto.response.ChecklistResponse;
import com.bidsignal.api.checklist.service.ChecklistService;
import com.bidsignal.api.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/watchlist/{noticeId}/checklist")
public class ChecklistController {

    private final ChecklistService checklistService;

    // 체크리스트 조회
    @GetMapping
    public ResponseEntity<ApiResponse<ChecklistResponse>> getChecklist(@AuthenticationPrincipal Long userId, @PathVariable Long noticeId) {

        ChecklistResponse response = checklistService.getChecklist(userId, noticeId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 체크리스트 항목 추가
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<ChecklistItemResponse>> addChecklistItem(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long noticeId,
            @Valid @RequestBody ChecklistItemCreateRequest request
    ) {
        ChecklistItemResponse response = checklistService.addChecklistItem(userId, noticeId, request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 체크리스트 항목 완료 여부 변경
    @PatchMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<ChecklistItemResponse>> updateChecklistItemChecked(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long noticeId,
            @PathVariable Long itemId,
            @Valid @RequestBody ChecklistItemCheckRequest request
    ) {
        ChecklistItemResponse response = checklistService.updateChecklistItemChecked(userId, noticeId, itemId, request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}