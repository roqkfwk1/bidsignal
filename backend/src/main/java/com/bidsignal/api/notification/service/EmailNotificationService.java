package com.bidsignal.api.notification.service;

import com.bidsignal.api.notification.dto.DeadlineNotificationTarget;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

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
}