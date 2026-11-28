package com.bidsignal.api.notification.service;

import com.bidsignal.api.checklist.repository.ChecklistItemRepository;
import com.bidsignal.api.notice.domain.BidType;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.notice.repository.NoticeAttachmentRepository;
import com.bidsignal.api.notice.repository.NoticeRepository;
import com.bidsignal.api.notice.service.NoticeSaveService;
import com.bidsignal.api.notification.domain.NoticeChangeNotification;
import com.bidsignal.api.notification.domain.NoticeChangeNotificationStatus;
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
import org.springframework.mail.MailSendException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class NoticeChangeNotificationSenderIntegrationTest {

    private static final String BID_NTCE_NO = "R26BK00000001";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @MockitoBean
    EmailNotificationService emailNotificationService;

    // 테스트 중에 스케줄러가 같이 발송하지 않도록 막는다.
    @MockitoBean
    NoticeChangeNotificationScheduler noticeChangeNotificationScheduler;

    @Autowired
    NoticeChangeNotificationSender noticeChangeNotificationSender;

    @Autowired
    NoticeChangeNotificationService noticeChangeNotificationService;

    @Autowired
    NoticeSaveService noticeSaveService;

    @Autowired
    TransactionTemplate transactionTemplate;

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

    private Notice saveNotice(String bidNtceOrd, String ntceKindNm, LocalDateTime bidClseDt) {

        Notice notice = Notice.builder()
                .bidNtceNo(BID_NTCE_NO)
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

    private User saveUser(String email) {

        User user = userRepository.save(User.create(email, "password", "테스터", null));
        notificationSettingRepository.save(NotificationSetting.createDefault(user));

        return user;
    }

    private void saveWatchlistItem(User user, Notice notice) {

        WatchlistItem watchlistItem = WatchlistItem.create(user, notice);
        watchlistItem.updateStatus(WatchlistStatus.PREPARING);
        watchlistItemRepository.save(watchlistItem);
    }

    private void updateWatchlistStatus(User user, WatchlistStatus status) {

        WatchlistItem watchlistItem = watchlistItemRepository.findByUserIdWithNotice(user.getId()).get(0);
        watchlistItem.updateStatus(status);
        watchlistItemRepository.save(watchlistItem);
    }

    // 사용자마다 관심 공고를 담고 마감일이 바뀐 변경공고를 넣어 발송 대기 알림을 만든다.
    private void createPendingNotifications(List<User> users) {

        Notice previousNotice = saveNotice("000", "등록공고", daysLater(7));

        for (User user : users) {
            saveWatchlistItem(user, previousNotice);
        }

        saveNotice("001", "변경공고", daysLater(10));
    }

    private NoticeChangeNotification findNotification(User user) {

        for (NoticeChangeNotification notification : noticeChangeNotificationRepository.findAll()) {
            if (notification.getUser().getId().equals(user.getId())) {
                return notification;
            }
        }

        return null;
    }

    private LocalDateTime daysLater(int days) {
        return LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(days).atTime(10, 0);
    }

    @Test
    @DisplayName("발송 대기 알림을 발송하면 발송 완료가 되고 메일은 한 번 발송된다")
    void sendPendingNotifications_sent() {

        // given
        User user = saveUser("test@example.com");
        createPendingNotifications(List.of(user));

        // when
        noticeChangeNotificationSender.sendPendingNotifications();

        // then
        assertThat(findNotification(user).getStatus()).isEqualTo(NoticeChangeNotificationStatus.SENT);
        verify(emailNotificationService, times(1)).sendNoticeChangeNotificationEmail(any());
    }

    @Test
    @DisplayName("여러 스레드가 동시에 발송해도 알림 한 건당 메일은 한 번만 발송된다")
    void sendPendingNotifications_concurrent() throws Exception {

        // given
        List<User> users = new ArrayList<>();

        for (int i = 0; i < 3; i++) {
            users.add(saveUser("test" + i + "@example.com"));
        }

        createPendingNotifications(users);

        // 발송이 겹치도록 메일 발송에 지연을 넣는다.
        doAnswer(invocation -> {
            Thread.sleep(200);
            return null;
        }).when(emailNotificationService).sendNoticeChangeNotificationEmail(any());

        int threadCount = 5;
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executorService.submit(() -> {
                startLatch.await();
                noticeChangeNotificationSender.sendPendingNotifications();
                return null;
            }));
        }

        // when
        startLatch.countDown();

        for (Future<?> future : futures) {
            future.get(30, TimeUnit.SECONDS);
        }

        executorService.shutdown();

        // then
        verify(emailNotificationService, times(3)).sendNoticeChangeNotificationEmail(any());

        for (User user : users) {
            assertThat(findNotification(user).getStatus()).isEqualTo(NoticeChangeNotificationStatus.SENT);
        }
    }

    @Test
    @DisplayName("메일 발송이 실패하면 발송 대기로 돌아가고 세 번째 실패에는 발송 실패가 된다")
    void sendPendingNotifications_failed() {

        // given
        User user = saveUser("test@example.com");
        createPendingNotifications(List.of(user));

        doThrow(new MailSendException("x".repeat(600)))
                .when(emailNotificationService).sendNoticeChangeNotificationEmail(any());

        // when
        noticeChangeNotificationSender.sendPendingNotifications();
        NoticeChangeNotification firstResult = findNotification(user);

        noticeChangeNotificationSender.sendPendingNotifications();
        noticeChangeNotificationSender.sendPendingNotifications();
        NoticeChangeNotification thirdResult = findNotification(user);

        // then
        assertThat(firstResult.getStatus()).isEqualTo(NoticeChangeNotificationStatus.PENDING);
        assertThat(firstResult.getRetryCount()).isEqualTo(1);
        assertThat(firstResult.getErrorMessage()).hasSize(500);

        assertThat(thirdResult.getStatus()).isEqualTo(NoticeChangeNotificationStatus.FAILED);
        assertThat(thirdResult.getRetryCount()).isEqualTo(3);

        verify(emailNotificationService, times(3)).sendNoticeChangeNotificationEmail(any());
    }

    @Test
    @DisplayName("관심 공고를 삭제했거나 제출완료, 포기로 바꾼 사용자의 알림은 건너뛴다")
    void sendPendingNotifications_skipped() {

        // given
        User deletedUser = saveUser("deleted@example.com");
        User submittedUser = saveUser("submitted@example.com");
        User droppedUser = saveUser("dropped@example.com");
        createPendingNotifications(List.of(deletedUser, submittedUser, droppedUser));

        watchlistItemRepository.delete(watchlistItemRepository.findByUserIdWithNotice(deletedUser.getId()).get(0));
        updateWatchlistStatus(submittedUser, WatchlistStatus.SUBMITTED);
        updateWatchlistStatus(droppedUser, WatchlistStatus.DROPPED);

        // when
        noticeChangeNotificationSender.sendPendingNotifications();

        // then
        assertThat(findNotification(deletedUser).getStatus()).isEqualTo(NoticeChangeNotificationStatus.SKIPPED);
        assertThat(findNotification(submittedUser).getStatus()).isEqualTo(NoticeChangeNotificationStatus.SKIPPED);
        assertThat(findNotification(droppedUser).getStatus()).isEqualTo(NoticeChangeNotificationStatus.SKIPPED);
        verify(emailNotificationService, never()).sendNoticeChangeNotificationEmail(any());
    }

    @Test
    @DisplayName("발송중에 10분 넘게 멈춘 알림은 복구하면 발송 대기가 된다")
    void recoverSendingNotifications() {

        // given
        User stuckUser = saveUser("stuck@example.com");
        User sendingUser = saveUser("sending@example.com");
        createPendingNotifications(List.of(stuckUser, sendingUser));

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));
        Long stuckId = findNotification(stuckUser).getId();
        Long sendingId = findNotification(sendingUser).getId();

        transactionTemplate.executeWithoutResult(status -> {
            noticeChangeNotificationRepository.claimPendingNotification(
                    stuckId, NoticeChangeNotificationStatus.PENDING, NoticeChangeNotificationStatus.SENDING, now.minusMinutes(11));
            noticeChangeNotificationRepository.claimPendingNotification(
                    sendingId, NoticeChangeNotificationStatus.PENDING, NoticeChangeNotificationStatus.SENDING, now);
        });

        // when
        int recoveredCount = noticeChangeNotificationService.recoverSendingNotifications();

        // then
        assertThat(recoveredCount).isEqualTo(1);
        assertThat(findNotification(stuckUser).getStatus()).isEqualTo(NoticeChangeNotificationStatus.PENDING);
        assertThat(findNotification(sendingUser).getStatus()).isEqualTo(NoticeChangeNotificationStatus.SENDING);
    }

    @Test
    @DisplayName("이미 발송 완료된 알림은 다시 발송하지 않는다")
    void sendPendingNotifications_alreadySent() {

        // given
        User user = saveUser("test@example.com");
        createPendingNotifications(List.of(user));

        noticeChangeNotificationSender.sendPendingNotifications();

        // when
        noticeChangeNotificationSender.sendPendingNotifications();

        // then
        assertThat(findNotification(user).getStatus()).isEqualTo(NoticeChangeNotificationStatus.SENT);
        verify(emailNotificationService, times(1)).sendNoticeChangeNotificationEmail(any());
    }
}
