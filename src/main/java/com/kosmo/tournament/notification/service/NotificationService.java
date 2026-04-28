package com.kosmo.tournament.notification.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.notification.dto.CreateNotificationDTO;
import com.kosmo.tournament.notification.dto.NotificationDTO;
import com.kosmo.tournament.notification.dto.UpdateNotificationDTO;
import com.kosmo.tournament.notification.entity.Notification;
import com.kosmo.tournament.notification.repository.NotificationRepository;
import com.kosmo.tournament.team.entity.Team;
import com.kosmo.tournament.team.repository.TeamRepository;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               TeamRepository teamRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
    }

    public List<NotificationDTO> getMyNotifications(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<NotificationDTO> getMyPendingNotifications(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), "PENDING")
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public NotificationDTO getNotificationDTOById(Long notificationId, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("This notification does not belong to current user");
        }

        return toDTO(notification);
    }

    @Transactional
    public NotificationDTO createNotification(CreateNotificationDTO dto) {
        if (dto.getUserId() == null) {
            throw new RuntimeException("User id is required");
        }

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = new Notification();
        notification.setUser(user);

        if (dto.getTeamId() != null) {
            Team team = teamRepository.findById(dto.getTeamId())
                    .orElseThrow(() -> new RuntimeException("Team not found"));
            notification.setTeam(team);
            notification.setTeamName(dto.getTeamName() != null ? dto.getTeamName() : team.getName());
        } else {
            notification.setTeam(null);
            notification.setTeamName(dto.getTeamName());
        }

        notification.setMessage(dto.getMessage() != null && !dto.getMessage().isBlank()
                ? dto.getMessage()
                : "Новое уведомление");
        notification.setType(dto.getType() != null && !dto.getType().isBlank()
                ? dto.getType()
                : "TEAM_INVITE");
        notification.setStatus(dto.getStatus() != null && !dto.getStatus().isBlank()
                ? dto.getStatus()
                : "PENDING");
        notification.setRead(false);

        Notification saved = notificationRepository.save(notification);
        return toDTO(saved);
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
        notification.setRead(false);

        notificationRepository.save(notification);
    }

    @Transactional
    public NotificationDTO updateNotificationStatus(Long notificationId,
                                                    UpdateNotificationDTO dto,
                                                    String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("This notification does not belong to current user");
        }
        if (dto.getStatus() == null || dto.getStatus().isBlank()) {
            throw new RuntimeException("Status is required");
        }

        String newStatus = dto.getStatus().trim().toUpperCase();
        if (!newStatus.equals("PENDING") && !newStatus.equals("ACCEPTED") && !newStatus.equals("DECLINED")) {
            throw new RuntimeException("Unsupported notification status");
        }

        notification.setStatus(newStatus);
        Notification saved = notificationRepository.save(notification);
        return toDTO(saved);
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
    @Transactional
    public NotificationDTO markRead(Long notificationId, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("This notification does not belong to current user");
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return toDTO(saved);
    }

    @Transactional
    public List<NotificationDTO> markAllRead(String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> notifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());

        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);

        return notifications.stream()
                .map(this::toDTO)
                .toList();
    }

    private NotificationDTO toDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setMessage(notification.getMessage());
        dto.setTeamId(notification.getTeam() != null ? notification.getTeam().getId() : null);
        dto.setTeamName(notification.getTeamName());
        dto.setType(notification.getType());
        dto.setStatus(notification.getStatus());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setRead(notification.getRead());
        return dto;
    }
}