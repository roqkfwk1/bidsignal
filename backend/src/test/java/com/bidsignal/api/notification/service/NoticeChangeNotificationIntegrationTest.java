package com.bidsignal.api.notification.service;

import com.bidsignal.api.checklist.repository.ChecklistItemRepository;
import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.repository.NoticeAttachmentRepository;
import com.bidsignal.api.notice.repository.NoticeRepository;
import com.bidsignal.api.notice.service.NoticeSaveService;
import com.bidsignal.api.notification.domain.NoticeChangeNotification;
import com.bidsignal.api.notification.domain.NoticeChangeNotificationStatus;
import com.bidsignal.api.notification.domain.NoticeChangeType;
import com.bidsignal.api.notification.domain.NotificationSetting;
import com.bidsignal.api.notification.repository.NoticeChangeNotificationRepository;
import com.bidsignal.api.notification.repository.NotificationHistoryRepository;
import com.bidsignal.api.notification.repository.NotificationSettingRepository;
import com.bidsignal.api.notification.scheduler.NoticeChangeNotificationScheduler;
import com.bidsignal.api.user.domain.User;
import com.bidsignal.api.user.repository.UserRepository;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import com.bidsignal.api.watchlist.domain.WatchlistStatus;
import com.bidsignal.api.watchlist.repository.WatchlistItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class NoticeChangeNotificationIntegrationTest {

    private static final String BID_NTCE_NO = "R26BK00000001";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @MockitoBean
    EmailNotificationService emailNotificationService;

    // 테스트 중에 스케줄러가 발송 대기 알림을 발송하지 않도록 막는다.
    @MockitoBean
    NoticeChangeNotificationScheduler noticeChangeNotificationScheduler;

    @Autowired
    NoticeSaveService noticeSaveService;

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
    NoticeChangeNotificationRepository noticeChangeNotificationRepository;

    @Autowired
    NotificationSettingRepository notificationSettingRepository;

    @Autowired
    UserRepository userRepository;

    @BeforeEach
    void setUp() {
        noticeChangeNotificationRepository.deleteAllInBatch();
        notificationHistoryRepository.deleteAllInBatch();
        checklistItemRepository.deleteAllInBatch();
        watchlistItemRepository.deleteAllInBatch();
        notificationSettingRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        noticeAttachmentRepository.deleteAllInBatch();
        noticeRepository.deleteAllInBatch();
    }

    private Notice saveNotice(String bidNtceOrd, String ntceKindNm, LocalDateTime bidClseDt, LocalDateTime opengDt) {

        Notice notice = Notice.builder()
                .bidNtceNo(BID_NTCE_NO)
                .bidNtceOrd(bidNtceOrd)
                .bidNtceNm("테스트 공고")
                .ntceInsttNm("테스트 기관")
                .bidType(BidType.SERVICE)
                .ntceKindNm(ntceKindNm)
                .bidClseDt(bidClseDt)
                .opengDt(opengDt)
                .rgstDt(LocalDateTime.now(ZoneId.of("Asia/Seoul")))
                .build();

        noticeSaveService.saveNotice(notice, List.of());

        return notice;
    }

    private User saveUser(String email, boolean emailNotificationEnabled) {

        User user = userRepository.save(User.create(email, "password", "테스터", null));

        NotificationSetting setting = NotificationSetting.createDefault(user);
        setting.update(emailNotificationEnabled, true, true);
        notificationSettingRepository.save(setting);

        return user;
    }

    private void saveWatchlistItem(User user, Notice notice, WatchlistStatus status) {

        WatchlistItem watchlistItem = WatchlistItem.create(user, notice);
        watchlistItem.updateStatus(status);
        watchlistItemRepository.save(watchlistItem);
    }

    private LocalDateTime daysLater(int days) {
        return LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(days).atTime(10, 0);
    }

    @Test
    @DisplayName("마감일이 바뀐 변경공고가 들어오면 변경 알림이 발송 대기로 만들어진다")
    void saveNotice_changedBidClseDt() {

        // given
        User user = saveUser("test@example.com", true);
        Notice previousNotice = saveNotice("000", "등록공고", daysLater(7), daysLater(8));
        saveWatchlistItem(user, previousNotice, WatchlistStatus.PREPARING);

        // when
        Notice latestNotice = saveNotice("001", "변경공고", daysLater(10), daysLater(8));

        // then
        List<NoticeChangeNotification> result = noticeChangeNotificationRepository.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUser().getId()).isEqualTo(user.getId());
        assertThat(result.get(0).getNotice().getId()).isEqualTo(latestNotice.getId());
        assertThat(result.get(0).getType()).isEqualTo(NoticeChangeType.CHANGED);
        assertThat(result.get(0).getStatus()).isEqualTo(NoticeChangeNotificationStatus.PENDING);
        assertThat(result.get(0).getPreviousBidClseDt()).isEqualTo(daysLater(7));
        assertThat(result.get(0).getPreviousOpengDt()).isEqualTo(daysLater(8));
        assertThat(result.get(0).getRetryCount()).isZero();
    }

    @Test
    @DisplayName("개찰일만 새로 생긴 변경공고도 변경 알림이 만들어진다")
    void saveNotice_changedOpengDt() {

        // given
        User user = saveUser("test@example.com", true);
        Notice previousNotice = saveNotice("000", "등록공고", daysLater(7), null);
        saveWatchlistItem(user, previousNotice, WatchlistStatus.REVIEWING);

        // when
        saveNotice("001", "변경공고", daysLater(7), daysLater(8));

        // then
        List<NoticeChangeNotification> result = noticeChangeNotificationRepository.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getType()).isEqualTo(NoticeChangeType.CHANGED);
        assertThat(result.get(0).getPreviousOpengDt()).isNull();
    }

    @Test
    @DisplayName("취소공고가 들어오면 취소 알림이 만들어진다")
    void saveNotice_canceled() {

        // given
        User user = saveUser("test@example.com", true);
        Notice previousNotice = saveNotice("000", "등록공고", daysLater(7), daysLater(8));
        saveWatchlistItem(user, previousNotice, WatchlistStatus.REVIEWING);

        // when
        saveNotice("001", "취소공고", daysLater(7), daysLater(8));

        // then
        List<NoticeChangeNotification> result = noticeChangeNotificationRepository.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getType()).isEqualTo(NoticeChangeType.CANCELED);
        assertThat(result.get(0).getStatus()).isEqualTo(NoticeChangeNotificationStatus.PENDING);
    }

    @Test
    @DisplayName("마감일과 개찰일이 같은 변경공고는 알림이 만들어지지 않는다")
    void saveNotice_sameDates() {

        // given
        User user = saveUser("test@example.com", true);
        Notice previousNotice = saveNotice("000", "등록공고", daysLater(7), daysLater(8));
        saveWatchlistItem(user, previousNotice, WatchlistStatus.REVIEWING);

        // when
        saveNotice("001", "변경공고", daysLater(7), daysLater(8));

        // then
        assertThat(noticeChangeNotificationRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("이메일 알림을 끈 사용자와 진행중이 아닌 관심 공고는 알림이 만들어지지 않는다")
    void saveNotice_notTarget() {

        // given
        User disabledUser = saveUser("disabled@example.com", false);
        User submittedUser = saveUser("submitted@example.com", true);
        User droppedUser = saveUser("dropped@example.com", true);
        Notice previousNotice = saveNotice("000", "등록공고", daysLater(7), daysLater(8));

        saveWatchlistItem(disabledUser, previousNotice, WatchlistStatus.PREPARING);
        saveWatchlistItem(submittedUser, previousNotice, WatchlistStatus.SUBMITTED);
        saveWatchlistItem(droppedUser, previousNotice, WatchlistStatus.DROPPED);

        // when
        saveNotice("001", "변경공고", daysLater(10), daysLater(11));

        // then
        assertThat(noticeChangeNotificationRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("이전 차수를 여러 개 담은 사용자는 알림이 한 건만 만들어진다")
    void saveNotice_duplicateWatchlistItems() {

        // given
        User user = saveUser("test@example.com", true);
        Notice firstNotice = saveNotice("000", "등록공고", daysLater(7), daysLater(8));
        Notice secondNotice = saveNotice("001", "변경공고", daysLater(7), daysLater(8));

        saveWatchlistItem(user, firstNotice, WatchlistStatus.REVIEWING);
        saveWatchlistItem(user, secondNotice, WatchlistStatus.REVIEWING);

        // when
        saveNotice("002", "변경공고", daysLater(10), daysLater(11));

        // then
        assertThat(noticeChangeNotificationRepository.findAll()).hasSize(1);
    }
}
