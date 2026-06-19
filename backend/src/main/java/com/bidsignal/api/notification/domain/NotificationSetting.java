package com.bidsignal.api.notification.domain;

import com.bidsignal.api.global.domain.BaseEntity;
import com.bidsignal.api.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notification_settings")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class NotificationSetting extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private boolean emailNotificationEnabled;

    @Column(nullable = false)
    private boolean d3Enabled;

    @Column(nullable = false)
    private boolean d1Enabled;

    // 기본 알림 설정
    public static NotificationSetting createDefault(User user) {
        NotificationSetting setting = new NotificationSetting();

        setting.user = user;
        setting.emailNotificationEnabled = true;
        setting.d3Enabled = true;
        setting.d1Enabled = true;

        return setting;
    }

    // 알림 설정 변경
    public void update(boolean emailNotificationEnabled, boolean d3Enabled, boolean d1Enabled) {
        this.emailNotificationEnabled = emailNotificationEnabled;
        this.d3Enabled = d3Enabled;
        this.d1Enabled = d1Enabled;
    }
}
