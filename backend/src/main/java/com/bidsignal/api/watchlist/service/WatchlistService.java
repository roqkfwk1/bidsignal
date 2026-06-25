package com.bidsignal.api.watchlist.service;

import com.bidsignal.api.checklist.domain.ChecklistProgress;
import com.bidsignal.api.checklist.service.ChecklistService;
import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.repository.NoticeRepository;
import com.bidsignal.api.notification.repository.NotificationHistoryRepository;
import com.bidsignal.api.user.domain.User;
import com.bidsignal.api.user.repository.UserRepository;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.dto.request.WatchlistMemoUpdateRequest;
import com.bidsignal.api.watchlist.dto.request.WatchlistStatusUpdateRequest;
import com.bidsignal.api.watchlist.dto.response.WatchlistListResponse;
import com.bidsignal.api.watchlist.dto.response.WatchlistSaveResponse;
import com.bidsignal.api.watchlist.repository.WatchlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WatchlistService {

    private final WatchlistItemRepository watchlistItemRepository;
    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;
    private final NotificationHistoryRepository notificationHistoryRepository;
    private final ChecklistService checklistService;

    // 관심 공고 목록 조회
    public List<WatchlistListResponse> getWatchlist(Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        List<WatchlistItem> watchlistItems = watchlistItemRepository.findByUserIdWithNotice(userId);

        List<Long> watchlistItemIds = watchlistItems.stream()
                .map(WatchlistItem::getId)
                .toList();

        Map<Long, ChecklistProgress> progressMap = checklistService.getProgressMap(watchlistItemIds);

        return watchlistItems.stream()
                .map(item -> WatchlistListResponse.from(item, progressMap.get(item.getId())))
                .toList();
    }

    // 관심 공고 저장
    @Transactional
    public WatchlistSaveResponse saveWatchlist(Long userId, Long noticeId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));

        if (watchlistItemRepository.existsByUserIdAndNoticeId(userId, noticeId)) {
            throw new BusinessException(ErrorCode.DUPLICATE_WATCHLIST_ITEM);
        }

        WatchlistItem watchlistItem = WatchlistItem.create(user, notice);
        WatchlistItem savedWatchlistItem = watchlistItemRepository.save(watchlistItem);

        checklistService.createDefaultChecklistItems(savedWatchlistItem);

        return WatchlistSaveResponse.from(savedWatchlistItem);
    }

    // 관심 공고 삭제
    @Transactional
    public void deleteWatchlist(Long userId, Long noticeId) {

        WatchlistItem item = watchlistItemRepository.findByUserIdAndNoticeIdWithNotice(userId, noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WATCHLIST_ITEM_NOT_FOUND));

        deleteWatchlistItem(item);
    }

    // 사용자의 관심 공고 전체 삭제
    @Transactional
    public void deleteAllWatchlistItems(Long userId) {

        List<WatchlistItem> items = watchlistItemRepository.findByUserIdWithNotice(userId);

        for (WatchlistItem item : items) {
            deleteWatchlistItem(item);
        }
    }

    // 관심 공고 1건 삭제
    private void deleteWatchlistItem(WatchlistItem item) {

        checklistService.deleteChecklistItems(item);
        notificationHistoryRepository.deleteByWatchlistItem(item);
        watchlistItemRepository.delete(item);
    }

    // 관심 공고 상태 변경
    @Transactional
    public void updateStatus(Long userId, Long noticeId, WatchlistStatusUpdateRequest request) {

        WatchlistItem watchlistItem = watchlistItemRepository
                .findByUserIdAndNoticeIdWithNotice(userId, noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WATCHLIST_ITEM_NOT_FOUND));

        watchlistItem.updateStatus(request.getStatus());
    }

    // 관심 공고 메모 수정
    @Transactional
    public void updateMemo(Long userId, Long noticeId, WatchlistMemoUpdateRequest request) {

        WatchlistItem watchlistItem = watchlistItemRepository
                .findByUserIdAndNoticeIdWithNotice(userId, noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WATCHLIST_ITEM_NOT_FOUND));

        watchlistItem.updateMemo(request.getMemo());
    }
}