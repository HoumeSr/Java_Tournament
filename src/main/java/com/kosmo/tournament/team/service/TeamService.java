package com.kosmo.tournament.team.service;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kosmo.tournament.common.dto.PageResponseDTO;
import com.kosmo.tournament.gametype.entity.GameType;
import com.kosmo.tournament.gametype.repository.GameTypeRepository;
import com.kosmo.tournament.notification.entity.Notification;
import com.kosmo.tournament.notification.service.NotificationService;
import com.kosmo.tournament.team.dto.AddTeamMemberDTO;
import com.kosmo.tournament.team.dto.CreateTeamDTO;
import com.kosmo.tournament.team.dto.TeamFullDTO;
import com.kosmo.tournament.team.dto.TeamMemberDTO;
import com.kosmo.tournament.team.dto.TeamShortDTO;
import com.kosmo.tournament.team.entity.Team;
import com.kosmo.tournament.team.entity.TeamMember;
import com.kosmo.tournament.team.repository.TeamMemberRepository;
import com.kosmo.tournament.team.repository.TeamRepository;
import com.kosmo.tournament.tournament.entity.TournamentTeamParticipant;
import com.kosmo.tournament.tournament.model.TournamentStatus;
import com.kosmo.tournament.tournament.repository.TournamentTeamParticipantRepository;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final GameTypeRepository gameTypeRepository;
    private final TournamentTeamParticipantRepository tournamentTeamParticipantRepository;

    public TeamService(TeamRepository teamRepository,
                       TeamMemberRepository teamMemberRepository,
                       UserRepository userRepository,
                       NotificationService notificationService,
                       GameTypeRepository gameTypeRepository,
                       TournamentTeamParticipantRepository tournamentTeamParticipantRepository) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.gameTypeRepository = gameTypeRepository;
        this.tournamentTeamParticipantRepository = tournamentTeamParticipantRepository;
    }

    public List<TeamShortDTO> getAllTeams() {
        return teamRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(team -> {
                    TeamShortDTO dto = toShortDTO(team);
                    dto.setListType("open");
                    return dto;
                })
                .toList();
    }

    /**
     * Пока у Team нет отдельного поля access/visibility,
     * считаем все команды открытыми.
     */
    public List<TeamShortDTO> getOpenTeams() {
        return getAllTeams();
    }

    public PageResponseDTO<TeamShortDTO> getTeamsFeed(String username,
                                                      Long gameTypeId,
                                                      int page,
                                                      int size) {
        int safePage = normalizePage(page);
        int safeSize = normalizePageSize(size);

        List<Team> baseTeams = teamRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(team -> gameTypeId == null
                        || (team.getGameType() != null && gameTypeId.equals(team.getGameType().getId())))
                .sorted(Comparator.comparing(Team::getCreatedAt).reversed())
                .toList();

        final Set<Long> myTeamIds;
        if (username != null && !username.isBlank()) {
            User currentUser = userRepository.findByUsername(username).orElse(null);
            if (currentUser != null) {
                myTeamIds = teamMemberRepository.findByPlayerId(currentUser.getId())
                        .stream()
                        .map(TeamMember::getTeam)
                        .map(Team::getId)
                        .collect(Collectors.toSet());
            } else {
                myTeamIds = Set.of();
            }
        } else {
            myTeamIds = Set.of();
        }

        List<TeamShortDTO> mapped = baseTeams.stream()
                .map(team -> {
                    TeamShortDTO dto = toShortDTO(team);
                    dto.setListType(myTeamIds.contains(team.getId()) ? "my" : "open");
                    return dto;
                })
                .toList();

        return paginate(mapped, safePage, safeSize);
    }

    public List<TeamShortDTO> getMyTeams(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return teamMemberRepository.findByPlayerId(user.getId())
                .stream()
                .map(TeamMember::getTeam)
                .distinct()
                .map(team -> {
                    TeamShortDTO dto = toShortDTO(team);
                    dto.setListType("my");
                    return dto;
                })
                .toList();
    }

    public TeamFullDTO getTeamById(Long teamId, String currentUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        boolean owner = currentUsername != null
                && team.getCaptain() != null
                && currentUsername.equals(team.getCaptain().getUsername());

        boolean member = currentUsername != null
                && teamMemberRepository.findByTeamId(teamId)
                .stream()
                .anyMatch(tm -> currentUsername.equals(tm.getPlayer().getUsername()));

        return toFullDTO(team, owner, member);
    }

    @Transactional
    public TeamFullDTO createTeam(CreateTeamDTO dto, String username) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new RuntimeException("Team name is required");
        }

        if (dto.getGameTypeId() == null) {
            throw new RuntimeException("Game type is required");
        }

        if (teamRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Team with this name already exists");
        }

        User captain = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GameType gameType = gameTypeRepository.findById(dto.getGameTypeId())
                .orElseThrow(() -> new RuntimeException("Game type not found"));

        Team team = new Team();
        team.setName(dto.getName());
        team.setCaptain(captain);
        team.setGameType(gameType);
        team.setImageUrl(dto.getImageUrl());

        Team savedTeam = teamRepository.save(team);

        TeamMember captainMember = new TeamMember();
        captainMember.setTeam(savedTeam);
        captainMember.setPlayer(captain);
        captainMember.setRole("CAPTAIN");

        teamMemberRepository.save(captainMember);

        return toFullDTO(savedTeam, true, true);
    }

    @Transactional
    public TeamFullDTO addCurrentUserToTeam(Long teamId, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        AddTeamMemberDTO dto = new AddTeamMemberDTO();
        dto.setUserId(currentUser.getId());
        return addMember(teamId, dto, currentUsername);
    }

    /**
     * Совместимость с текущим фронтом:
     * - капитан может добавить любого участника
     * - обычный пользователь может добавить только самого себя (join)
     */
    @Transactional
    public TeamFullDTO addMember(Long teamId, AddTeamMemberDTO dto, String currentUsername) {
        if (dto == null || dto.getUserId() == null) {
            throw new RuntimeException("User id is required");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        assertRosterUnlocked(team);

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        User targetUser = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User to add not found"));

        boolean isCaptain = team.getCaptain() != null
                && team.getCaptain().getId().equals(currentUser.getId());

        boolean selfJoin = currentUser.getId().equals(targetUser.getId());

        if (!isCaptain && !selfJoin) {
            throw new RuntimeException("Only captain can add other users");
        }

        if (teamMemberRepository.existsByTeamIdAndPlayerId(teamId, targetUser.getId())) {
            throw new RuntimeException("User already in team");
        }

        validateTeamCapacity(team);

        TeamMember teamMember = new TeamMember();
        teamMember.setTeam(team);
        teamMember.setPlayer(targetUser);
        teamMember.setRole("MEMBER");

        teamMemberRepository.save(teamMember);

        boolean owner = team.getCaptain() != null && team.getCaptain().getId().equals(currentUser.getId());
        boolean member = true;

        return toFullDTO(team, owner, member);
    }

    @Transactional
    public TeamFullDTO removeMember(Long teamId, Long userIdToRemove, String currentUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        assertRosterUnlocked(team);

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (team.getCaptain() == null || !team.getCaptain().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only captain can remove members");
        }

        if (team.getCaptain() != null && team.getCaptain().getId().equals(userIdToRemove)) {
            throw new RuntimeException("Captain cannot be removed from team");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndPlayerId(teamId, userIdToRemove)
                .orElseThrow(() -> new RuntimeException("User is not in team"));

        teamMemberRepository.delete(member);

        return toFullDTO(team, true, true);
    }

    @Transactional
    public void leaveTeam(Long teamId, String currentUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        assertRosterUnlocked(team);

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TeamMember member = teamMemberRepository.findByTeamIdAndPlayerId(teamId, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this team"));

        boolean isCaptain = team.getCaptain() != null
                && team.getCaptain().getId().equals(currentUser.getId());

        long membersCount = teamMemberRepository.countByTeamId(teamId);

        if (isCaptain) {
            if (membersCount > 1) {
                throw new RuntimeException("Captain cannot leave the team until all members are removed");
            }

            teamMemberRepository.delete(member);
            teamRepository.delete(team);
            return;
        }

        teamMemberRepository.delete(member);
    }

    public List<TeamMemberDTO> getTeamMembers(Long teamId) {
        return teamMemberRepository.findByTeamId(teamId)
                .stream()
                .map(this::toMemberDTO)
                .toList();
    }

    @Transactional
    public void inviteUserToTeam(Long teamId, Long invitedUserId, String currentUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        assertRosterUnlocked(team);

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        boolean canInvite = canInviteToTeam(teamId, team, currentUser);

        if (!canInvite) {
            throw new RuntimeException("Only team members or admin can invite users");
        }

        User invitedUser = userRepository.findById(invitedUserId)
                .orElseThrow(() -> new RuntimeException("Invited user not found"));

        if (teamMemberRepository.existsByTeamIdAndPlayerId(teamId, invitedUserId)) {
            throw new RuntimeException("User already in team");
        }

        validateTeamCapacity(team);

        notificationService.createTeamInvite(invitedUser, team);
    }

    @Transactional
    public TeamFullDTO acceptInvite(Long notificationId, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationService.getById(notificationId);

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("This notification does not belong to current user");
        }

        if (!"TEAM_INVITE".equals(notification.getType())) {
            throw new RuntimeException("Notification is not a team invite");
        }

        if (!"PENDING".equals(notification.getStatus())) {
            throw new RuntimeException("Invitation already processed");
        }

        Team team = notification.getTeam();
        if (team == null) {
            throw new RuntimeException("Team not found in notification");
        }

        assertRosterUnlocked(team);

        if (!teamMemberRepository.existsByTeamIdAndPlayerId(team.getId(), currentUser.getId())) {
            validateTeamCapacity(team);

            TeamMember teamMember = new TeamMember();
            teamMember.setTeam(team);
            teamMember.setPlayer(currentUser);
            teamMember.setRole("MEMBER");
            teamMemberRepository.save(teamMember);
        }

        notificationService.markAccepted(notification);

        boolean owner = team.getCaptain() != null
                && team.getCaptain().getId().equals(currentUser.getId());

        return toFullDTO(team, owner, true);
    }

    @Transactional
    public void declineInvite(Long notificationId, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationService.getById(notificationId);

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("This notification does not belong to current user");
        }

        if (!"TEAM_INVITE".equals(notification.getType())) {
            throw new RuntimeException("Notification is not a team invite");
        }

        if (!"PENDING".equals(notification.getStatus())) {
            throw new RuntimeException("Invitation already processed");
        }

        notificationService.markDeclined(notification);
    }

    private boolean canInviteToTeam(Long teamId, Team team, User currentUser) {
        if (currentUser == null) {
            return false;
        }

        boolean isCaptain = team.getCaptain() != null
                && team.getCaptain().getId().equals(currentUser.getId());

        boolean isMember = teamMemberRepository.existsByTeamIdAndPlayerId(teamId, currentUser.getId());

        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());

        return isCaptain || isMember || isAdmin;
    }

    private int normalizePage(int page) {
        return Math.max(page, 0);
    }

    private int normalizePageSize(int size) {
        int safeSize = size <= 0 ? 9 : size;
        safeSize = Math.max(3, Math.min(safeSize, 60));

        int remainder = safeSize % 3;
        if (remainder != 0) {
            safeSize += (3 - remainder);
            if (safeSize > 60) {
                safeSize = 60;
            }
        }

        return safeSize;
    }

    private PageResponseDTO<TeamShortDTO> paginate(List<TeamShortDTO> items, int page, int size) {
        long totalElements = items.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);

        int fromIndex = Math.min(page * size, items.size());
        int toIndex = Math.min(fromIndex + size, items.size());

        List<TeamShortDTO> content = fromIndex >= toIndex
                ? List.of()
                : items.subList(fromIndex, toIndex);

        boolean first = page == 0;
        boolean last = totalPages == 0 || page >= totalPages - 1;

        return new PageResponseDTO<>(
                content,
                page,
                size,
                totalElements,
                totalPages,
                first,
                last,
                content.isEmpty()
        );
    }

    private void validateTeamCapacity(Team team) {
        long currentCount = teamMemberRepository.countByTeamId(team.getId());

        GameType gameType = team.getGameType();
        Integer maxPlayers = gameType != null ? gameType.getMaxPlayers() : null;
        int maxCount = maxPlayers != null ? maxPlayers : 1;

        if (currentCount >= maxCount) {
            throw new RuntimeException("Team is already full");
        }
    }

    private boolean isRosterLocked(Team team) {
        return tournamentTeamParticipantRepository.findByTeamId(team.getId())
                .stream()
                .map(TournamentTeamParticipant::getTournament)
                .filter(tournament -> tournament != null && tournament.getStatus() != null)
                .anyMatch(tournament ->
                        TournamentStatus.REGISTRATION_OPEN.value().equalsIgnoreCase(tournament.getStatus())
                                || TournamentStatus.IN_PROGRESS.value().equalsIgnoreCase(tournament.getStatus()));
    }

    private String getRosterLockReason(Team team) {
        return tournamentTeamParticipantRepository.findByTeamId(team.getId())
                .stream()
                .map(TournamentTeamParticipant::getTournament)
                .filter(tournament -> tournament != null && tournament.getStatus() != null)
                .filter(tournament ->
                        TournamentStatus.REGISTRATION_OPEN.value().equalsIgnoreCase(tournament.getStatus())
                                || TournamentStatus.IN_PROGRESS.value().equalsIgnoreCase(tournament.getStatus()))
                .findFirst()
                .map(tournament -> "Состав команды заблокирован: команда участвует в турнире \"" + tournament.getTitle() + "\"")
                .orElse(null);
    }

    private void assertRosterUnlocked(Team team) {
        if (isRosterLocked(team)) {
            String reason = getRosterLockReason(team);
            throw new RuntimeException(reason != null ? reason : "Team roster is locked while participating in a tournament");
        }
    }

    private TeamShortDTO toShortDTO(Team team) {
        TeamShortDTO dto = new TeamShortDTO();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setCaptainUsername(team.getCaptain() != null ? team.getCaptain().getUsername() : null);
        dto.setGameTypeName(team.getGameType() != null ? team.getGameType().getName() : null);
        dto.setImageUrl(team.getImageUrl());
        dto.setCurrentMembersCount((int) teamMemberRepository.countByTeamId(team.getId()));

        Integer maxPlayers = team.getGameType() != null ? team.getGameType().getMaxPlayers() : null;
        dto.setMaxMembersCount(maxPlayers != null ? maxPlayers : 1);

        return dto;
    }

    private TeamMemberDTO toMemberDTO(TeamMember member) {
        TeamMemberDTO dto = new TeamMemberDTO();
        dto.setUserId(member.getPlayer().getId());
        dto.setUsername(member.getPlayer().getUsername());
        dto.setRole(member.getRole());
        dto.setCountry(member.getPlayer().getCountry());
        dto.setImageUrl(member.getPlayer().getImageUrl());
        dto.setJoinedAt(member.getJoinedAt());
        return dto;
    }

    private TeamFullDTO toFullDTO(Team team, boolean owner, boolean member) {
        TeamFullDTO dto = new TeamFullDTO();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setCaptainId(team.getCaptain() != null ? team.getCaptain().getId() : null);
        dto.setCaptainUsername(team.getCaptain() != null ? team.getCaptain().getUsername() : null);
        dto.setGameTypeId(team.getGameType() != null ? team.getGameType().getId() : null);
        dto.setGameTypeName(team.getGameType() != null ? team.getGameType().getName() : null);
        dto.setImageUrl(team.getImageUrl());
        dto.setCreatedAt(team.getCreatedAt());
        dto.setOwner(owner);
        dto.setMember(member);

        int currentMembersCount = (int) teamMemberRepository.countByTeamId(team.getId());
        dto.setCurrentMembersCount(currentMembersCount);

        GameType gameType = team.getGameType();
        Integer maxPlayers = gameType != null ? gameType.getMaxPlayers() : null;
        int maxMembersCount = maxPlayers != null ? maxPlayers : 1;

        dto.setMaxMembersCount(maxMembersCount);
        dto.setMembers(getTeamMembers(team.getId()));

        boolean rosterLocked = isRosterLocked(team);
        dto.setRosterLocked(rosterLocked);
        dto.setRosterLockReason(rosterLocked ? getRosterLockReason(team) : null);

        dto.setCanLeaveTeam(member && !rosterLocked);
        dto.setCanKickMembers(owner && !rosterLocked);
        dto.setCanInviteMembers(member && !rosterLocked);
        dto.setCanAddMembers(member && !rosterLocked && currentMembersCount < maxMembersCount);

        return dto;
    }
}