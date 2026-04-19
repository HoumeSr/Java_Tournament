package com.kosmo.tournament.notification.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.notification.dfh.NotificationDFH;
import com.kosmo.tournament.notification.entity.Notification;
import com.kosmo.tournament.notification.repository.NotificationRepository;
import com.kosmo.tournament.team.entity.Team;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public List<NotificationDFH> getMyNotifications(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDFH)
                .toList();
    }

    @Transactional
    public void createTeamInvite(User invitedUser, Team team) {
        boolean exists = notificationRepository.existsByUserIdAndTeamIdAndTypeAndStatus(
                invitedUser.getId(),
                team.getId(),
                "TEAM_INVITE",
                "PENDING"
        );

        if (exists) {
            throw new RuntimeException("Invitation already sent");
        }

        Notification notification = new Notification();
        notification.setUser(invitedUser);
        notification.setTeam(team);
        notification.setTeamName(team.getName());
        notification.setType("TEAM_INVITE");
        notification.setStatus("PENDING");
        notification.setMessage("Вы приглашены в команду " + team.getName());

        notificationRepository.save(notification);
    }

    @Transactional
    public void markAccepted(Notification notification) {
        notification.setStatus("ACCEPTED");
        notificationRepository.save(notification);
    }

    @Transactional
    public void markDeclined(Notification notification) {
        notification.setStatus("DECLINED");
        notificationRepository.save(notification);
    }

    public Notification getById(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    private NotificationDFH toDFH(Notification notification) {
        NotificationDFH dfh = new NotificationDFH();
        dfh.setId(notification.getId());
        dfh.setMessage(notification.getMessage());
        dfh.setTeamId(notification.getTeam() != null ? notification.getTeam().getId() : null);
        dfh.setTeamName(notification.getTeamName());
        dfh.setType(notification.getType());
        dfh.setStatus(notification.getStatus());
        dfh.setCreatedAt(notification.getCreatedAt());
        return dfh;
    }
}