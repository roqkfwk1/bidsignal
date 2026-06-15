package com.bidsignal.api.watchlist.service;

import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.repository.NoticeRepository;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WatchlistService {

    private final WatchlistItemRepository watchlistItemRepository;
    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;

    // 관심 공고 목록 조회
    public List<WatchlistListResponse> getWatchlist(Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        return watchlistItemRepository.findByUserIdWithNotice(userId).stream()
                .map(WatchlistListResponse::from)
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

        return WatchlistSaveResponse.from(savedWatchlistItem);
    }

    // 관심 공고 삭제
    @Transactional
    public void deleteWatchlist(Long userId, Long noticeId) {

        WatchlistItem watchlistItem = watchlistItemRepository
                .findByUserIdAndNoticeIdWithNotice(userId, noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WATCHLIST_ITEM_NOT_FOUND));

        watchlistItemRepository.delete(watchlistItem);
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