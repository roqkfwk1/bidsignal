package com.bidsignal.api.checklist.domain;

import com.bidsignal.api.global.domain.BaseEntity;
import com.bidsignal.api.watchlist.domain.WatchlistItem;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "checklist_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class ChecklistItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "watchlist_item_id", nullable = false)
    private WatchlistItem watchlistItem;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false)
    private boolean checked;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean defaultItem;

    @Column
    private LocalDateTime checkedAt;

    public static ChecklistItem createDefault(WatchlistItem watchlistItem, String title, int sortOrder) {
        ChecklistItem item = new ChecklistItem();

        item.watchlistItem = watchlistItem;
        item.title = title;
        item.checked = false;
        item.sortOrder = sortOrder;
        item.defaultItem = true;
        item.checkedAt = null;

        return item;
    }

    public static ChecklistItem createCustom(WatchlistItem watchlistItem, String title, int sortOrder) {
        ChecklistItem item = new ChecklistItem();

        item.watchlistItem = watchlistItem;
        item.title = title;
        item.checked = false;
        item.sortOrder = sortOrder;
        item.defaultItem = false;
        item.checkedAt = null;

        return item;
    }

    public void updateChecked(boolean checked) {

        this.checked = checked;

        if (checked) {
            this.checkedAt = LocalDateTime.now();
        } else {
            this.checkedAt = null;
        }
    }
}