package com.kosmo.tournament.notification.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.notification.dfh.NotificationDFH;
import com.kosmo.tournament.notification.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationApiController {

    private final NotificationService notificationService;

    public NotificationApiController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/my")
    public List<NotificationDFH> getMyNotifications(Authentication authentication) {
        return notificationService.getMyNotifications(authentication.getName());
    }
}