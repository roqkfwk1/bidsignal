package com.bidsignal.api.checklist.dto.response;

import com.bidsignal.api.checklist.domain.ChecklistItem;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChecklistItemResponse {

    private Long id;                    // 체크리스트 항목 ID
    private String title;               // 항목명
    private boolean checked;            // 완료 여부
    private int sortOrder;              // 표시 순서
    private boolean defaultItem;        // 기본 항목 여부
    private LocalDateTime checkedAt;    // 완료 시간

    public static ChecklistItemResponse from(ChecklistItem item) {
        return ChecklistItemResponse.builder()
                .id(item.getId())
                .title(item.getTitle())
                .checked(item.isChecked())
                .sortOrder(item.getSortOrder())
                .defaultItem(item.isDefaultItem())
                .checkedAt(item.getCheckedAt())
                .build();
    }
}
