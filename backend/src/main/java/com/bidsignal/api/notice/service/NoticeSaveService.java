package com.bidsignal.api.notice.service;

import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.domain.NoticeAttachment;
import com.bidsignal.api.notice.repository.NoticeAttachmentRepository;
import com.bidsignal.api.notice.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeSaveService {

    private final NoticeRepository noticeRepository;
    private final NoticeAttachmentRepository noticeAttachmentRepository;

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
}
