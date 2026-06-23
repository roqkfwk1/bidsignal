package com.bidsignal.api.checklist.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ChecklistItemCreateRequest {

    @NotBlank
    @Size(max = 100)
    private String title;   // 항목명
}
