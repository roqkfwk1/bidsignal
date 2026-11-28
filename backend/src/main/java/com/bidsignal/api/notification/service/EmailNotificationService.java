package com.bidsignal.api.notification.service;

import com.bidsignal.api.notification.domain.NoticeChangeType;
import com.bidsignal.api.notification.dto.DeadlineNotificationTarget;
import com.bidsignal.api.notification.dto.NoticeChangeNotificationTarget;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-base-url}")
    private String frontendBaseUrl;
    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * 마감 임박 이메일 발송
     */
    public void sendDeadlineNotificationEmail(DeadlineNotificationTarget target) {

        String subject = "[BidSignal] 마감 D-" + target.getRemainingDays() + " 관심 공고 알림";

        String detailUrl = frontendBaseUrl + "/notices/" + target.getNoticeId();

        String body = """
                안녕하세요. BidSignal입니다.

                관심 공고로 등록한 입찰 공고의 마감일이 %d일 남았습니다.

                공고명: %s
                마감일: %s

                마감 전에 필요한 서류와 제출 일정을 확인해 주세요.

                공고 확인하기: %s
                """.formatted(
                target.getRemainingDays(),
                target.getNoticeTitle(),
                target.getBidCloseDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                detailUrl
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(target.getToEmail());
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }

    /**
     * 관심 공고 변경 및 취소 이메일 발송
     */
    public void sendNoticeChangeNotificationEmail(NoticeChangeNotificationTarget target) {

        String subject = "[BidSignal] 관심 공고 일정이 변경되었습니다";
        String guide = "관심 공고로 등록한 입찰 공고의 일정이 변경되었습니다.";

        if (target.getType() == NoticeChangeType.CANCELED) {
            subject = "[BidSignal] 관심 공고가 취소되었습니다";
            guide = "관심 공고로 등록한 입찰 공고가 취소되었습니다.";
        }

        String detailUrl = frontendBaseUrl + "/notices/" + target.getNoticeId();

        String body = """
                안녕하세요. BidSignal입니다.

                %s

                공고명: %s

                [변경 전]
                마감일: %s
                개찰일: %s

                [변경 후]
                마감일: %s
                개찰일: %s

                공고 확인하기: %s
                """.formatted(
                guide,
                target.getNoticeTitle(),
                formatDateTime(target.getPreviousBidCloseDate()),
                formatDateTime(target.getPreviousOpeningDate()),
                formatDateTime(target.getBidCloseDate()),
                formatDateTime(target.getOpeningDate()),
                detailUrl
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(target.getToEmail());
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }

    /**
     * 메일에 쓸 날짜를 문자열로 바꾼다.
     */
    private String formatDateTime(LocalDateTime dateTime) {

        if (dateTime == null) {
            return "미정";
        }

        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}