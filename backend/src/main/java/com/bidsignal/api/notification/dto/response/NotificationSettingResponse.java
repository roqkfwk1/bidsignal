package com.bidsignal.api.notification.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationSettingResponse {

    private boolean emailNotificationEnabled;
    private boolean d3Enabled;
    private boolean d1Enabled;
}
