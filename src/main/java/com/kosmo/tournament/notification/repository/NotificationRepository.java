package com.kosmo.tournament.notification.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kosmo.tournament.notification.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    boolean existsByUserIdAndTeamIdAndTypeAndStatus(Long userId, Long teamId, String type, String status);
}