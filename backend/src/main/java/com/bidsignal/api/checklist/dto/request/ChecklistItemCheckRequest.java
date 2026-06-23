package com.bidsignal.api.checklist.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ChecklistItemCheckRequest {

    @NotNull
    private Boolean checked;
}
