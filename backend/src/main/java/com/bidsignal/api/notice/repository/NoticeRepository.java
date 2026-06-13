package com.bidsignal.api.notice.repository;

import com.bidsignal.api.notice.domain.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // 공고번호 + 차수 조회
    Optional<Notice> findByBidNtceNoAndBidNtceOrd(String bidNtceNo, String bidNtceOrd);

    // 공고번호 + 차수 존재 여부 확인
    boolean existsByBidNtceNoAndBidNtceOrd(String bidNtceNo, String bidNtceOrd);
}
