package com.bidsignal.api.user.domain;

import com.bidsignal.api.global.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Column(length = 20)
    private String phoneNumber;

    public static User create(String email, String password, String nickname, String phoneNumber) {
        User user = new User();
        user.email = email;
        user.password = password;
        user.nickname = nickname;
        user.phoneNumber = phoneNumber;
        return user;
    }
}