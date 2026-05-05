package com.kosmo.tournament.team.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kosmo.tournament.common.dto.PageResponseDTO;
import com.kosmo.tournament.team.dto.AddTeamMemberDTO;
import com.kosmo.tournament.team.dto.CreateTeamDTO;
import com.kosmo.tournament.team.dto.InviteTeamMemberDTO;
import com.kosmo.tournament.team.dto.RemoveTeamMemberDTO;
import com.kosmo.tournament.team.dto.TeamFullDTO;
import com.kosmo.tournament.team.dto.TeamMemberDTO;
import com.kosmo.tournament.team.dto.TeamShortDTO;
import com.kosmo.tournament.team.service.TeamService;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/teams")
public class TeamApiController {

    private final TeamService teamService;

    public TeamApiController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public List<TeamShortDTO> getAllTeams() {
        return teamService.getAllTeams();
    }

    @GetMapping("/open")
    public List<TeamShortDTO> getOpenTeams() {
        return teamService.getOpenTeams();
    }

    @GetMapping("/feed")
    public PageResponseDTO<TeamShortDTO> getTeamsFeed(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "9") int size,
                                                      @RequestParam(required = false) Long gameTypeId,
                                                      Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return teamService.getTeamsFeed(currentUsername, gameTypeId, page, size);
    }

    @GetMapping("/my")
    public List<TeamShortDTO> getMyTeams(Authentication authentication) {
        if (authentication == null) {
            return List.of();
        }
        return teamService.getMyTeams(authentication.getName());
    }

    @GetMapping("/{id}")
    public TeamFullDTO getTeam(@PathVariable Long id, Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return teamService.getTeamById(id, currentUsername);
    }

    @GetMapping("/{id}/members")
    public List<TeamMemberDTO> getMembers(@PathVariable Long id) {
        return teamService.getTeamMembers(id);
    }

    @PostMapping
    public TeamFullDTO createTeam(@RequestBody CreateTeamDTO dto,
                                  Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return teamService.createTeam(dto, authentication.getName());
    }

    @PostMapping("/{id}/members")
    public TeamFullDTO addMember(@PathVariable Long id,
                                 @RequestBody AddTeamMemberDTO dto,
                                 Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return teamService.addMember(id, dto, authentication.getName());
    }
    
    @PostMapping(value = "/update-logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateLogo(@RequestParam Long teamId,
                                        @RequestParam("file") MultipartFile file,
                                        Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            String imageUrl = teamService.updateLogo(teamId, file, authentication.getName());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Логотип команды обновлён",
                    "imageUrl", imageUrl,
                    "url", imageUrl
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
    /**
     * Старый фронт team-profile.js отправляет application/x-www-form-urlencoded:
     * POST /api/teams/join, body: teamId=123.
     */
    @PostMapping("/join")
    public ResponseEntity<?> joinTeamLegacy(@RequestParam Long teamId,
                                            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            TeamFullDTO updated = teamService.addCurrentUserToTeam(teamId, authentication.getName());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Вы вступили в команду",
                    "team", updated
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}/members")
    public TeamFullDTO removeMember(@PathVariable Long id,
                                    @RequestBody RemoveTeamMemberDTO dto,
                                    Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return teamService.removeMember(id, dto.getUserId(), authentication.getName());
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public TeamFullDTO removeMemberByPath(@PathVariable Long teamId,
                                          @PathVariable Long userId,
                                          Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        TeamFullDTO currentTeam = teamService.getTeamById(teamId, authentication.getName());
        if (currentTeam.getMembers() != null) {
            boolean selfDelete = currentTeam.getMembers().stream()
                    .anyMatch(member -> member.getUserId().equals(userId)
                            && member.getUsername().equals(authentication.getName()));

            if (selfDelete) {
                teamService.leaveTeam(teamId, authentication.getName());
                return teamService.getTeamById(teamId, authentication.getName());
            }
        }

        return teamService.removeMember(teamId, userId, authentication.getName());
    }

    @PostMapping("/{id}/leave")
    public void leaveTeam(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        teamService.leaveTeam(id, authentication.getName());
    }

    /**
     * Старый фронт team-profile.js отправляет application/x-www-form-urlencoded:
     * POST /api/teams/leave, body: teamId=123.
     */
    @PostMapping("/leave")
    public ResponseEntity<?> leaveTeamLegacy(@RequestParam Long teamId,
                                             Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            teamService.leaveTeam(teamId, authentication.getName());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Вы покинули команду"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteUser(@PathVariable Long id,
                                        @RequestBody InviteTeamMemberDTO dto,
                                        Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Необходимо авторизоваться"));
        }

        try {
            teamService.inviteUserToTeam(id, dto.getUserId(), authentication.getName());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Приглашение отправлено"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/invite/{notificationId}/accept")
    public TeamFullDTO acceptInvite(@PathVariable Long notificationId,
                                    Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return teamService.acceptInvite(notificationId, authentication.getName());
    }

    @PostMapping("/invite/{notificationId}/decline")
    public void declineInvite(@PathVariable Long notificationId,
                              Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        teamService.declineInvite(notificationId, authentication.getName());
    }
}