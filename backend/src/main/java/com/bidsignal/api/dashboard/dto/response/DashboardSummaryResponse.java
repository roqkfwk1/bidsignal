package com.bidsignal.api.dashboard.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardSummaryResponse {
    private long urgentCount;    // D-3 이내 마감 임박
    private long preparingCount; // 준비중 상태
    private long weeklyCount;    // D-7 이내 마감
}
