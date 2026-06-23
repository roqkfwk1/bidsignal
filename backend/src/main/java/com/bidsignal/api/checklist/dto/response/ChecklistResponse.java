package com.bidsignal.api.checklist.dto.response;

import com.bidsignal.api.checklist.domain.ChecklistItem;
import com.bidsignal.api.checklist.domain.ChecklistTemplate;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import lombok.Builder;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
public class ChecklistResponse {

    private Long noticeId;          // 공고 ID
    private String noticeTitle;     // 공고명

    private String templateType;    // 템플릿 유형
    private String templateTitle;   // 템플릿 제목
    private String guideMessage;    // 준비 가이드

    private String sucsfbidMthdNm;  // 낙찰방법명
    private String techAbltEvlRt;   // 기술능력평가비율
    private String bidPrceEvlRt;    // 입찰가격평가비율

    private int totalCount;         // 전체 항목 수
    private int checkedCount;       // 완료 항목 수
    private int progressRate;       // 진행률

    private List<ChecklistItemResponse> items;  // 체크리스트 항목 목록

    public static ChecklistResponse of(
            WatchlistItem watchlistItem,
            List<ChecklistItem> items,
            ChecklistTemplate template
    ) {
        Notice notice = watchlistItem.getNotice();

        int totalCount = items.size();
        int checkedCount = 0;

        List<ChecklistItemResponse> itemResponses = new ArrayList<>();

        for (ChecklistItem item : items) {
            if (item.isChecked()) {
                checkedCount++;
            }

            itemResponses.add(ChecklistItemResponse.from(item));
        }

        int progressRate = 0;

        if (totalCount > 0) {
            progressRate = checkedCount * 100 / totalCount;
        }

        return ChecklistResponse.builder()
                .noticeId(notice.getId())
                .noticeTitle(notice.getBidNtceNm())
                .templateType(template.name())
                .templateTitle(template.getTitle())
                .guideMessage(template.getGuideMessage(notice))
                .sucsfbidMthdNm(notice.getSucsfbidMthdNm())
                .techAbltEvlRt(notice.getTechAbltEvlRt())
                .bidPrceEvlRt(notice.getBidPrceEvlRt())
                .totalCount(totalCount)
                .checkedCount(checkedCount)
                .progressRate(progressRate)
                .items(itemResponses)
                .build();
    }
}