package com.bidsignal.api.notification.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class NotificationSettingUpdateRequest {

    private boolean emailNotificationEnabled;
    private boolean d3Enabled;
    private boolean d1Enabled;
}
