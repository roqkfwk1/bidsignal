package com.bidsignal.api.notification.repository;

import com.bidsignal.api.notification.domain.NotificationSetting;
import com.bidsignal.api.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationSettingRepository extends JpaRepository<NotificationSetting, Long> {

    // 사용자의 알림 설정 조회
    Optional<NotificationSetting> findByUser(User user);
}
