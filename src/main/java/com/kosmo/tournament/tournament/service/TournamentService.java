package com.kosmo.tournament.tournament.service;

import com.kosmo.tournament.tournament.dto.TournamentShortResponse;
import com.kosmo.tournament.tournament.entity.Tournament;
import com.kosmo.tournament.tournament.repository.TournamentRepository;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TournamentService {

    private final UserRepository userRepository;
    private final TournamentRepository tournamentRepository;

    public TournamentService(UserRepository userRepository,
                             TournamentRepository tournamentRepository) {
        this.userRepository = userRepository;
        this.tournamentRepository = tournamentRepository;
    }

    public List<TournamentShortResponse> getMyTournaments(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Tournament> tournaments = tournamentRepository.findByOrganizerId(user.getId());

        return tournaments.stream()
                .map(this::toShortResponse)
                .toList();
    }

    private TournamentShortResponse toShortResponse(Tournament tournament) {
        return new TournamentShortResponse(
                tournament.getId(),
                tournament.getTitle(),
                tournament.getStatus()
        );
    }
}