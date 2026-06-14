package com.bidsignal.api.watchlist.domain;

import com.bidsignal.api.global.domain.BaseEntity;
import com.bidsignal.api.notice.domain.Notice;
import com.bidsignal.api.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "watchlist_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_watchlist_items_user_id_notice_id",
                columnNames = {"user_id", "notice_id"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class WatchlistItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WatchlistStatus status;

    @Column(length = 1000)
    private String memo;

    public static WatchlistItem create(User user, Notice notice) {
        WatchlistItem watchlistItem = new WatchlistItem();
        watchlistItem.user = user;
        watchlistItem.notice = notice;
        watchlistItem.status = WatchlistStatus.REVIEWING;
        return watchlistItem;
    }

    public void updateStatus(WatchlistStatus status) {
        this.status = status;
    }

    public void updateMemo(String memo) {
        this.memo = memo;
    }
}