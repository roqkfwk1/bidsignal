package com.bidsignal.api.checklist.service;

import com.bidsignal.api.checklist.domain.ChecklistItem;
import com.bidsignal.api.checklist.domain.ChecklistTemplate;
import com.bidsignal.api.checklist.dto.request.ChecklistItemCheckRequest;
import com.bidsignal.api.checklist.dto.request.ChecklistItemCreateRequest;
import com.bidsignal.api.checklist.dto.response.ChecklistItemResponse;
import com.bidsignal.api.checklist.dto.response.ChecklistResponse;
import com.bidsignal.api.checklist.repository.ChecklistItemRepository;
import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.repository.WatchlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChecklistService {

    private final ChecklistItemRepository checklistItemRepository;
    private final WatchlistItemRepository watchlistItemRepository;

    /**
     * 관심공고 체크리스트를 조회한다.
     */
    public ChecklistResponse getChecklist(Long userId, Long noticeId) {

        WatchlistItem watchlistItem = findWatchlistItem(userId, noticeId);

        List<ChecklistItem> checklistItems = checklistItemRepository.findByWatchlistItemIdOrderBySortOrderAsc(watchlistItem.getId());

        ChecklistTemplate template = ChecklistTemplate.from(watchlistItem.getNotice());

        return ChecklistResponse.of(watchlistItem, checklistItems, template);
    }

    /**
     * 관심공고 등록 시 기본 체크리스트를 생성한다.
     */
    @Transactional
    public void createDefaultChecklistItems(WatchlistItem watchlistItem) {

        if (checklistItemRepository.existsByWatchlistItemId(watchlistItem.getId())) {
            return;
        }

        ChecklistTemplate template = ChecklistTemplate.from(watchlistItem.getNotice());
        List<String> defaultItems = template.getDefaultItems(watchlistItem.getNotice());

        List<ChecklistItem> checklistItems = new ArrayList<>();
        int sortOrder = 1;

        for (String title : defaultItems) {
            checklistItems.add(ChecklistItem.createDefault(watchlistItem, title, sortOrder));
            sortOrder++;
        }

        checklistItemRepository.saveAll(checklistItems);
    }

    /**
     * 사용자 체크리스트 항목을 추가한다.
     */
    @Transactional
    public ChecklistItemResponse addChecklistItem(
            Long userId,
            Long noticeId,
            ChecklistItemCreateRequest request
    ) {
        WatchlistItem watchlistItem = findWatchlistItem(userId, noticeId);

        int nextSortOrder = checklistItemRepository.findMaxSortOrderByWatchlistItemId(watchlistItem.getId()) + 1;

        ChecklistItem checklistItem = ChecklistItem.createCustom(
                watchlistItem,
                request.getTitle(),
                nextSortOrder
        );

        ChecklistItem savedItem = checklistItemRepository.save(checklistItem);

        return ChecklistItemResponse.from(savedItem);
    }

    /**
     * 체크리스트 항목 완료 여부를 변경한다.
     */
    @Transactional
    public ChecklistItemResponse updateChecklistItemChecked(Long userId, Long noticeId, Long itemId, ChecklistItemCheckRequest request) {

        WatchlistItem watchlistItem = findWatchlistItem(userId, noticeId);

        ChecklistItem checklistItem = checklistItemRepository.findByIdAndWatchlistItemId(itemId, watchlistItem.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CHECKLIST_ITEM_NOT_FOUND));

        checklistItem.updateChecked(request.getChecked());

        return ChecklistItemResponse.from(checklistItem);
    }

    /**
     * 사용자의 관심공고를 조회한다.
     */
    private WatchlistItem findWatchlistItem(Long userId, Long noticeId) {

        return watchlistItemRepository.findByUserIdAndNoticeIdWithNotice(userId, noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WATCHLIST_ITEM_NOT_FOUND));
    }

    /**
     * 관심공고의 체크리스트를 삭제한다.
     */
    @Transactional
    public void deleteChecklistItems(WatchlistItem watchlistItem) {

        checklistItemRepository.deleteByWatchlistItem(watchlistItem);
    }
}