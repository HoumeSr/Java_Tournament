package com.kosmo.tournament.notification.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.notification.dto.CreateNotificationDTO;
import com.kosmo.tournament.notification.dto.UpdateNotificationDTO;
import com.kosmo.tournament.notification.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationApiController {

    private final NotificationService notificationService;

    public NotificationApiController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyNotifications(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }
        return ResponseEntity.ok(notificationService.getMyNotifications(authentication.getName()));
    }

    @GetMapping("/my/pending")
    public ResponseEntity<?> getMyPendingNotifications(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }
        return ResponseEntity.ok(notificationService.getMyPendingNotifications(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNotificationById(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }
        try {
            return ResponseEntity.ok(notificationService.getNotificationDTOById(id, authentication.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Обычные пользователи не должны создавать произвольные уведомления.
     * Для приглашений в команду используется POST /api/teams/{id}/invite.
     */
    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody CreateNotificationDTO dto,
                                                Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Только ADMIN может создавать произвольные уведомления"));
        }

        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Уведомление создано",
                    "notification", notificationService.createNotification(dto)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNotification(@PathVariable Long id,
                                                @RequestBody UpdateNotificationDTO dto,
                                                Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Уведомление обновлено",
                    "notification", notificationService.updateNotificationStatus(id, dto, authentication.getName())
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Уведомление отмечено прочитанным",
                    "notification", notificationService.markRead(id, authentication.getName())
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Все уведомления отмечены прочитанными",
                    "notifications", notificationService.markAllRead(authentication.getName())
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}