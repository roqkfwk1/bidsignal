package com.bidsignal.api.notice.service;

import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.domain.NoticeAttachment;
import com.bidsignal.api.notice.repository.NoticeAttachmentRepository;
import com.bidsignal.api.notice.repository.NoticeRepository;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.repository.WatchlistItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoticeSaveService {

    private final NoticeRepository noticeRepository;
    private final NoticeAttachmentRepository noticeAttachmentRepository;
    private final WatchlistItemRepository watchlistItemRepository;

    /**
     * 새 공고를 저장하고 같은 공고번호의 최신 차수 여부를 갱신한다.
     */
    @Transactional
    public void saveNotice(Notice notice, List<NoticeAttachment> attachments) {

        List<Notice> savedNotices = noticeRepository.findByBidNtceNoOrderByBidNtceOrdAsc(notice.getBidNtceNo());

        if (isLatestOrd(notice, savedNotices)) {
            for (Notice savedNotice : savedNotices) {
                savedNotice.updateLatest(false);
            }
        } else {
            notice.updateLatest(false);
        }

        noticeRepository.save(notice);

        if (notice.isLatest()) {
            moveWatchlistItems(savedNotices, notice);
        }

        if (!attachments.isEmpty()) {
            noticeAttachmentRepository.saveAll(attachments);
        }
    }

    /**
     * 새 공고의 차수가 기존 차수보다 높은지 확인한다.
     */
    private boolean isLatestOrd(Notice notice, List<Notice> savedNotices) {

        int newOrd = Integer.parseInt(notice.getBidNtceOrd().trim());

        for (Notice savedNotice : savedNotices) {

            int savedOrd = Integer.parseInt(savedNotice.getBidNtceOrd().trim());

            if (savedOrd >= newOrd) {
                return false;
            }
        }

        return true;
    }

    /**
     * 이전 차수를 가리키는 관심 공고를 최신 차수로 옮긴다.
     */
    private void moveWatchlistItems(List<Notice> savedNotices, Notice latestNotice) {

        if (savedNotices.isEmpty()) {
            return;
        }

        List<Long> savedNoticeIds = new ArrayList<>();

        for (Notice savedNotice : savedNotices) {
            savedNoticeIds.add(savedNotice.getId());
        }

        List<WatchlistItem> watchlistItems = watchlistItemRepository.findByNoticeIdInOrderByIdAsc(savedNoticeIds);
        Set<Long> movedUserIds = new HashSet<>();

        for (WatchlistItem watchlistItem : watchlistItems) {

            Long userId = watchlistItem.getUser().getId();

            // 사용자별로 한 건만 옮겨야 유니크 제약에 걸리지 않는다.
            if (!movedUserIds.add(userId)) {
                log.info("관심 공고 이동 건너뜀. watchlistItemId={}, userId={}", watchlistItem.getId(), userId);
                continue;
            }

            watchlistItem.updateNotice(latestNotice);
        }
    }
}
