package com.bidsignal.api.watchlist.service;

import com.bidsignal.api.checklist.repository.ChecklistItemRepository;
import com.bidsignal.api.global.exception.BusinessException;
import com.bidsignal.api.global.exception.ErrorCode;
import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.repository.NoticeAttachmentRepository;
import com.bidsignal.api.notice.repository.NoticeRepository;
import com.bidsignal.api.notice.service.NoticeSaveService;
import com.bidsignal.api.notification.domain.NotificationSetting;
import com.bidsignal.api.notification.repository.NotificationHistoryRepository;
import com.bidsignal.api.notification.repository.NotificationSettingRepository;
import com.bidsignal.api.notification.service.DeadlineNotificationService;
import com.bidsignal.api.notification.service.EmailNotificationService;
import com.bidsignal.api.user.domain.User;
import com.bidsignal.api.user.repository.UserRepository;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import com.bidsignal.api.watchlist.dto.request.WatchlistStatusUpdateRequest;
import com.bidsignal.api.watchlist.dto.response.WatchlistSaveResponse;
import com.bidsignal.api.watchlist.repository.WatchlistItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class WatchlistVersionIntegrationTest {

    private static final String BID_NTCE_NO = "R26BK00000001";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @MockitoBean
    EmailNotificationService emailNotificationService;

    @Autowired
    NoticeSaveService noticeSaveService;

    @Autowired
    WatchlistService watchlistService;

    @Autowired
    DeadlineNotificationService deadlineNotificationService;

    @Autowired
    NoticeRepository noticeRepository;

    @Autowired
    NoticeAttachmentRepository noticeAttachmentRepository;

    @Autowired
    WatchlistItemRepository watchlistItemRepository;

    @Autowired
    ChecklistItemRepository checklistItemRepository;

    @Autowired
    NotificationHistoryRepository notificationHistoryRepository;

    @Autowired
    NotificationSettingRepository notificationSettingRepository;

    @Autowired
    UserRepository userRepository;

    @BeforeEach
    void setUp() {
        notificationHistoryRepository.deleteAllInBatch();
        checklistItemRepository.deleteAllInBatch();
        watchlistItemRepository.deleteAllInBatch();
        notificationSettingRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        noticeAttachmentRepository.deleteAllInBatch();
        noticeRepository.deleteAllInBatch();
    }

    private Notice saveNotice(String bidNtceNo, String bidNtceOrd, String ntceKindNm, LocalDateTime bidClseDt) {

        Notice notice = Notice.builder()
                .bidNtceNo(bidNtceNo)
                .bidNtceOrd(bidNtceOrd)
                .bidNtceNm("테스트 공고")
                .ntceInsttNm("테스트 기관")
                .bidType(BidType.SERVICE)
                .ntceKindNm(ntceKindNm)
                .bidClseDt(bidClseDt)
                .rgstDt(LocalDateTime.now(ZoneId.of("Asia/Seoul")))
                .build();

        noticeSaveService.saveNotice(notice, List.of());

        return notice;
    }

    private User saveUser() {

        User user = userRepository.save(User.create("test@example.com", "password", "테스터", null));
        notificationSettingRepository.save(NotificationSetting.createDefault(user));

        return user;
    }

    private LocalDateTime daysLater(int days) {
        return LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(days).atTime(10, 0);
    }

    private List<WatchlistItem> findWatchlistItems(User user) {
        return watchlistItemRepository.findByUserIdWithNotice(user.getId());
    }

    @Test
    @DisplayName("새 차수가 들어오면 관심 공고가 새 차수로 옮겨진다")
    void saveNotice_movesWatchlistItem() {

        // given
        User user = saveUser();
        Notice previousNotice = saveNotice(BID_NTCE_NO, "000", "등록공고", daysLater(7));

        WatchlistItem watchlistItem = WatchlistItem.create(user, previousNotice);
        watchlistItem.updateStatus(WatchlistStatus.PREPARING);
        watchlistItem.updateMemo("서류 준비중");
        watchlistItemRepository.save(watchlistItem);

        // when
        Notice latestNotice = saveNotice(BID_NTCE_NO, "001", "변경공고", daysLater(10));

        // then
        List<WatchlistItem> result = findWatchlistItems(user);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNotice().getId()).isEqualTo(latestNotice.getId());
        assertThat(result.get(0).getStatus()).isEqualTo(WatchlistStatus.PREPARING);
        assertThat(result.get(0).getMemo()).isEqualTo("서류 준비중");
    }

    @Test
    @DisplayName("이전 차수를 여러 개 담은 사용자는 한 건만 옮겨진다")
    void saveNotice_duplicateWatchlistItems() {

        // given
        User user = saveUser();
        Notice firstNotice = saveNotice(BID_NTCE_NO, "000", "등록공고", daysLater(7));
        Notice secondNotice = saveNotice(BID_NTCE_NO, "001", "변경공고", daysLater(7));

        watchlistItemRepository.save(WatchlistItem.create(user, firstNotice));
        watchlistItemRepository.save(WatchlistItem.create(user, secondNotice));

        // when
        Notice latestNotice = saveNotice(BID_NTCE_NO, "002", "변경공고", daysLater(10));

        // then
        List<WatchlistItem> result = findWatchlistItems(user);
        int movedCount = 0;

        for (WatchlistItem item : result) {
            if (item.getNotice().getId().equals(latestNotice.getId())) {
                movedCount++;
            }
        }

        assertThat(result).hasSize(2);
        assertThat(movedCount).isEqualTo(1);
    }

    @Test
    @DisplayName("이전 차수로 관심 공고를 저장하면 최신 차수로 저장된다")
    void saveWatchlist_previousOrd() {

        // given
        User user = saveUser();
        Notice previousNotice = saveNotice(BID_NTCE_NO, "000", "등록공고", daysLater(7));
        Notice latestNotice = saveNotice(BID_NTCE_NO, "001", "변경공고", daysLater(10));

        // when
        WatchlistSaveResponse result = watchlistService.saveWatchlist(user.getId(), previousNotice.getId());

        // then
        assertThat(result.getNoticeId()).isEqualTo(latestNotice.getId());
    }

    @Test
    @DisplayName("같은 공고번호를 다시 담으면 중복 예외가 발생한다")
    void saveWatchlist_duplicate() {

        // given
        User user = saveUser();
        Notice previousNotice = saveNotice(BID_NTCE_NO, "000", "등록공고", daysLater(7));
        Notice latestNotice = saveNotice(BID_NTCE_NO, "001", "변경공고", daysLater(10));

        watchlistService.saveWatchlist(user.getId(), previousNotice.getId());

        // when & then
        assertThatThrownBy(() -> watchlistService.saveWatchlist(user.getId(), latestNotice.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_WATCHLIST_ITEM);
    }

    @Test
    @DisplayName("이전 차수 id로 옮겨진 관심 공고의 상태를 바꾼다")
    void updateStatus_previousOrd() {

        // given
        User user = saveUser();
        Notice previousNotice = saveNotice(BID_NTCE_NO, "000", "등록공고", daysLater(7));
        watchlistItemRepository.save(WatchlistItem.create(user, previousNotice));

        saveNotice(BID_NTCE_NO, "001", "변경공고", daysLater(10));

        WatchlistStatusUpdateRequest request = new WatchlistStatusUpdateRequest();
        ReflectionTestUtils.setField(request, "status", WatchlistStatus.PREPARING);

        // when
        watchlistService.updateStatus(user.getId(), previousNotice.getId(), request);

        // then
        assertThat(findWatchlistItems(user).get(0).getStatus()).isEqualTo(WatchlistStatus.PREPARING);
    }

    @Test
    @DisplayName("이전 차수 id로 옮겨진 관심 공고를 삭제한다")
    void deleteWatchlist_previousOrd() {

        // given
        User user = saveUser();
        Notice previousNotice = saveNotice(BID_NTCE_NO, "000", "등록공고", daysLater(7));
        watchlistService.saveWatchlist(user.getId(), previousNotice.getId());

        saveNotice(BID_NTCE_NO, "001", "변경공고", daysLater(10));

        // when
        watchlistService.deleteWatchlist(user.getId(), previousNotice.getId());

        // then
        assertThat(findWatchlistItems(user)).isEmpty();
    }

    @Test
    @DisplayName("마감 알림 대상에서 취소공고는 제외된다")
    void findDeadlineNotificationTargets_canceled() {

        // given
        User user = saveUser();
        Notice activeNotice = saveNotice("R26BK00000001", "000", "등록공고", daysLater(3));
        Notice canceledNotice = saveNotice("R26BK00000002", "000", "취소공고", daysLater(3));

        watchlistItemRepository.save(WatchlistItem.create(user, activeNotice));
        watchlistItemRepository.save(WatchlistItem.create(user, canceledNotice));

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));

        // when
        List<WatchlistItem> result = watchlistItemRepository.findDeadlineNotificationTargets(
                today.plusDays(3).atStartOfDay(),
                today.plusDays(4).atStartOfDay(),
                List.of(WatchlistStatus.REVIEWING, WatchlistStatus.PREPARING),
                3
        );

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNotice().getId()).isEqualTo(activeNotice.getId());
    }

    @Test
    @DisplayName("마감일이 바뀐 새 차수는 같은 남은 일수라도 다시 알림을 보낸다")
    void sendDeadlineNotifications_changedDeadline() {

        // given
        User user = saveUser();
        Notice previousNotice = saveNotice(BID_NTCE_NO, "000", "등록공고", daysLater(3));
        watchlistItemRepository.save(WatchlistItem.create(user, previousNotice));

        deadlineNotificationService.sendDeadlineNotifications();

        saveNotice(BID_NTCE_NO, "001", "변경공고", daysLater(3).plusHours(5));

        // when
        deadlineNotificationService.sendDeadlineNotifications();

        // then
        verify(emailNotificationService, times(2)).sendDeadlineNotificationEmail(any());
        assertThat(notificationHistoryRepository.count()).isEqualTo(2);
    }
}
