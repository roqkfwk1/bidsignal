package com.bidsignal.api.notice.service;

import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.dto.request.NoticeSearchRequest;
import com.bidsignal.api.notice.dto.response.NoticeDetailResponse;
import com.bidsignal.api.notice.dto.response.NoticeListResponse;
import com.bidsignal.api.notice.dto.response.NoticeSyncResponse;
import com.bidsignal.api.notice.external.nara.NaraBidNoticeClient;
import com.bidsignal.api.notice.external.nara.dto.NaraBidNoticeResponse;
import com.bidsignal.api.notice.repository.NoticeAttachmentRepository;
import com.bidsignal.api.notice.repository.NoticeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class NoticeVersionIntegrationTest {

    private static final String BEGIN_DATE_TIME = "202611260000";
    private static final String END_DATE_TIME = "202611262359";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @MockitoBean
    NaraBidNoticeClient naraBidNoticeClient;

    @Autowired
    NoticeSyncService noticeSyncService;

    @Autowired
    NoticeService noticeService;

    @Autowired
    NoticeRepository noticeRepository;

    @Autowired
    NoticeAttachmentRepository noticeAttachmentRepository;

    @Autowired
    ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        noticeAttachmentRepository.deleteAllInBatch();
        noticeRepository.deleteAllInBatch();
    }

    private Map<String, Object> createItem(String bidNtceNo, String bidNtceOrd, String ntceKindNm) {

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        return Map.of(
                "bidNtceNo", bidNtceNo,
                "bidNtceOrd", bidNtceOrd,
                "bidNtceNm", "테스트 공고",
                "ntceInsttNm", "테스트 기관",
                "ntceKindNm", ntceKindNm,
                "bidNtceDt", now.format(formatter),
                "rgstDt", now.format(formatter),
                "bidClseDt", now.plusDays(7).format(formatter)
        );
    }

    private NaraBidNoticeResponse createResponse(List<Map<String, Object>> items) {

        Map<String, Object> response = Map.of(
                "response", Map.of(
                        "header", Map.of("resultCode", "00", "resultMsg", "NORMAL SERVICE."),
                        "body", Map.of("items", items, "totalCount", items.size())
                )
        );

        return objectMapper.convertValue(response, NaraBidNoticeResponse.class);
    }

    private void givenServiceNotices(List<Map<String, Object>> items) {

        given(naraBidNoticeClient.fetchBidNotices(any(), anyInt(), anyInt(), anyString(), anyString()))
                .willReturn(createResponse(List.of()));

        given(naraBidNoticeClient.fetchBidNotices(eq(BidType.SERVICE), anyInt(), anyInt(), anyString(), anyString()))
                .willReturn(createResponse(items));
    }

    private NoticeSyncResponse syncServiceNotices(List<Map<String, Object>> items) {

        givenServiceNotices(items);

        return noticeSyncService.syncAllBidNotices(BEGIN_DATE_TIME, END_DATE_TIME);
    }

    private Notice findNotice(String bidNtceNo, String bidNtceOrd) {
        return noticeRepository.findByBidNtceNoAndBidNtceOrd(bidNtceNo, bidNtceOrd).orElseThrow();
    }

    @Test
    @DisplayName("새 차수가 들어오면 최신 차수가 바뀐다")
    void syncAllBidNotices_newOrd() {

        // given
        syncServiceNotices(List.of(createItem("R26BK00000001", "000", "등록공고")));

        // when
        syncServiceNotices(List.of(createItem("R26BK00000001", "001", "변경공고")));

        // then
        assertThat(findNotice("R26BK00000001", "000").isLatest()).isFalse();
        assertThat(findNotice("R26BK00000001", "001").isLatest()).isTrue();
    }

    @Test
    @DisplayName("차수가 거꾸로 들어와도 높은 차수가 최신이다")
    void syncAllBidNotices_reversedOrd() {

        // given
        syncServiceNotices(List.of(createItem("R26BK00000001", "001", "변경공고")));

        // when
        syncServiceNotices(List.of(createItem("R26BK00000001", "000", "등록공고")));

        // then
        assertThat(findNotice("R26BK00000001", "000").isLatest()).isFalse();
        assertThat(findNotice("R26BK00000001", "001").isLatest()).isTrue();
    }

    @Test
    @DisplayName("같은 공고를 두 번 수집해도 한 건만 저장한다")
    void syncAllBidNotices_duplicate() {

        // given
        syncServiceNotices(List.of(createItem("R26BK00000001", "000", "등록공고")));

        // when
        NoticeSyncResponse result = syncServiceNotices(List.of(createItem("R26BK00000001", "000", "등록공고")));

        // then
        assertThat(result.getSavedCount()).isZero();
        assertThat(result.getSkippedCount()).isEqualTo(1);
        assertThat(noticeRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("검색은 최신 차수만 보여주고 취소공고는 제외한다")
    void search_latestOnly() {

        // given
        syncServiceNotices(List.of(
                createItem("R26BK00000001", "000", "등록공고"),
                createItem("R26BK00000001", "001", "변경공고"),
                createItem("R26BK00000002", "000", "등록공고"),
                createItem("R26BK00000002", "001", "취소공고")
        ));

        // when
        Page<NoticeListResponse> result = noticeService.search(new NoticeSearchRequest(), PageRequest.of(0, 20));

        // then
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getBidNtceNo()).isEqualTo("R26BK00000001");
        assertThat(result.getContent().get(0).getBidNtceOrd()).isEqualTo("001");
    }

    @Test
    @DisplayName("이전 차수 상세에 최신 차수와 차수 이력을 담는다")
    void getNotice_previousOrd() {

        // given
        syncServiceNotices(List.of(
                createItem("R26BK00000001", "002", "취소공고"),
                createItem("R26BK00000001", "000", "등록공고"),
                createItem("R26BK00000001", "001", "변경공고")
        ));

        Notice previousNotice = findNotice("R26BK00000001", "000");
        Notice latestNotice = findNotice("R26BK00000001", "002");

        // when
        NoticeDetailResponse result = noticeService.getNotice(previousNotice.getId());

        // then
        assertThat(result.isLatest()).isFalse();
        assertThat(result.getLatestNoticeId()).isEqualTo(latestNotice.getId());
        assertThat(result.isCanceled()).isTrue();
        assertThat(result.getVersions()).hasSize(3);
        assertThat(result.getVersions().get(0).getBidNtceOrd()).isEqualTo("000");
        assertThat(result.getVersions().get(1).getBidNtceOrd()).isEqualTo("001");
        assertThat(result.getVersions().get(2).getBidNtceOrd()).isEqualTo("002");
        assertThat(result.getVersions().get(2).getNtceKindNm()).isEqualTo("취소공고");
    }

    @Test
    @DisplayName("같은 공고를 동시에 저장해도 한 건만 저장한다")
    void syncAllBidNotices_concurrent() throws Exception {

        // given
        int threadCount = 5;
        givenServiceNotices(List.of(createItem("R26BK00000001", "000", "등록공고")));

        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        List<Future<NoticeSyncResponse>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executorService.submit(() -> {
                startLatch.await();
                return noticeSyncService.syncAllBidNotices(BEGIN_DATE_TIME, END_DATE_TIME);
            }));
        }

        // when
        startLatch.countDown();

        int savedCount = 0;

        for (Future<NoticeSyncResponse> future : futures) {
            NoticeSyncResponse result = future.get(30, TimeUnit.SECONDS);

            // 수집 중 예외가 나면 조회 건수가 0이 된다.
            assertThat(result.getFetchedCount()).isEqualTo(1);
            assertThat(result.getSavedCount() + result.getSkippedCount()).isEqualTo(1);

            savedCount += result.getSavedCount();
        }

        executorService.shutdown();

        // then
        assertThat(savedCount).isEqualTo(1);
        assertThat(noticeRepository.count()).isEqualTo(1);
    }
}
