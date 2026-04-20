package com.kosmo.tournament.team.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.team.dto.AddTeamMemberDTO;
import com.kosmo.tournament.team.dto.CreateTeamDTO;
import com.kosmo.tournament.team.dto.InviteTeamMemberDTO;
import com.kosmo.tournament.team.dto.TeamFullDTO;
import com.kosmo.tournament.team.dto.TeamMemberDTO;
import com.kosmo.tournament.team.dto.TeamShortDTO;
import com.kosmo.tournament.team.service.TeamService;

@RestController
@RequestMapping("/api/teams")
public class TeamApiController {

    private final TeamService teamService;

    public TeamApiController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping("/my")
    public List<TeamShortDTO> getMyTeams(Authentication authentication) {
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
    public TeamFullDTO createTeam(@RequestBody CreateTeamDTO dfh,
                                  Authentication authentication) {
        return teamService.createTeam(dfh, authentication.getName());
    }

    @PostMapping("/{id}/members")
    public TeamFullDTO addMember(@PathVariable Long id,
                                 @RequestBody AddTeamMemberDTO dfh,
                                 Authentication authentication) {
        return teamService.addMember(id, dfh, authentication.getName());
    }
    @PostMapping("/{id}/invite")
    public void inviteUser(@PathVariable Long id,
                        @RequestBody InviteTeamMemberDTO dfh,
                        Authentication authentication) {
        teamService.inviteUserToTeam(id, dfh.getUserId(), authentication.getName());
    }

    @PostMapping("/invite/{notificationId}/accept")
    public TeamFullDTO acceptInvite(@PathVariable Long notificationId,
                                    Authentication authentication) {
        return teamService.acceptInvite(notificationId, authentication.getName());
    }

    @PostMapping("/invite/{notificationId}/decline")
    public void declineInvite(@PathVariable Long notificationId,
                            Authentication authentication) {
        teamService.declineInvite(notificationId, authentication.getName());
    }
}