package com.kosmo.tournament.team.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.team.dfh.AddTeamMemberDFH;
import com.kosmo.tournament.team.dfh.CreateTeamDFH;
import com.kosmo.tournament.team.dfh.InviteTeamMemberDFH;
import com.kosmo.tournament.team.dfh.TeamFullDFH;
import com.kosmo.tournament.team.dfh.TeamMemberDFH;
import com.kosmo.tournament.team.dfh.TeamShortDFH;
import com.kosmo.tournament.team.service.TeamService;

@RestController
@RequestMapping("/api/teams")
public class TeamApiController {

    private final TeamService teamService;

    public TeamApiController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping("/my")
    public List<TeamShortDFH> getMyTeams(Authentication authentication) {
        return teamService.getMyTeams(authentication.getName());
    }

    @GetMapping("/{id}")
    public TeamFullDFH getTeam(@PathVariable Long id, Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return teamService.getTeamById(id, currentUsername);
    }

    @GetMapping("/{id}/members")
    public List<TeamMemberDFH> getMembers(@PathVariable Long id) {
        return teamService.getTeamMembers(id);
    }

    @PostMapping
    public TeamFullDFH createTeam(@RequestBody CreateTeamDFH dfh,
                                  Authentication authentication) {
        return teamService.createTeam(dfh, authentication.getName());
    }

    @PostMapping("/{id}/members")
    public TeamFullDFH addMember(@PathVariable Long id,
                                 @RequestBody AddTeamMemberDFH dfh,
                                 Authentication authentication) {
        return teamService.addMember(id, dfh, authentication.getName());
    }
    @PostMapping("/{id}/invite")
    public void inviteUser(@PathVariable Long id,
                        @RequestBody InviteTeamMemberDFH dfh,
                        Authentication authentication) {
        teamService.inviteUserToTeam(id, dfh.getUserId(), authentication.getName());
    }

    @PostMapping("/invite/{notificationId}/accept")
    public TeamFullDFH acceptInvite(@PathVariable Long notificationId,
                                    Authentication authentication) {
        return teamService.acceptInvite(notificationId, authentication.getName());
    }

    @PostMapping("/invite/{notificationId}/decline")
    public void declineInvite(@PathVariable Long notificationId,
                            Authentication authentication) {
        teamService.declineInvite(notificationId, authentication.getName());
    }
}