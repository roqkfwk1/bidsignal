package com.bidsignal.api.notice.repository;

import com.bidsignal.api.notice.domain.Notice;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long>, NoticeRepositoryCustom {

    // 공고번호 + 차수 조회
    Optional<Notice> findByBidNtceNoAndBidNtceOrd(String bidNtceNo, String bidNtceOrd);

    // 공고번호 + 차수 존재 여부 확인
    boolean existsByBidNtceNoAndBidNtceOrd(String bidNtceNo, String bidNtceOrd);

    // 마감 전 공고 중 요약이 없는 공고를 마감이 가까운 순으로 조회
    @Query("""
            select n from Notice n
            where n.aiSummary is null
              and n.stdNtceDocUrl is not null
              and n.stdNtceDocUrl <> ''
              and n.bidClseDt >= :now
            order by n.bidClseDt asc
            """)
    List<Notice> findSummaryTargets(@Param("now") LocalDateTime now, Pageable pageable);
}