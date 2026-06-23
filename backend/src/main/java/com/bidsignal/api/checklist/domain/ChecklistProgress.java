package com.bidsignal.api.checklist.domain;

public record ChecklistProgress(int totalCount, int checkedCount) {

    public int progressRate() {
        if (totalCount == 0) {
            return 0;
        }
        return checkedCount * 100 / totalCount;
    }
}