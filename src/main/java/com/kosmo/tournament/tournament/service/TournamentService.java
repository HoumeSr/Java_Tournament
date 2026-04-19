package com.kosmo.tournament.tournament.service;

import com.kosmo.tournament.tournament.dfh.TournamentShortDFH;
import com.kosmo.tournament.tournament.entity.Tournament;
import com.kosmo.tournament.tournament.repository.TournamentRepository;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class TournamentService {

    private final TournamentRepository tournamentRepository;

    public TournamentService(TournamentRepository tournamentRepository) {
        this.tournamentRepository = tournamentRepository;
    }

    public List<TournamentShortDFH> getMyTournaments(String username) {
        List<Tournament> tournaments = tournamentRepository.findAll();
        List<TournamentShortDFH> result = new ArrayList<>();

        for (Tournament tournament : tournaments) {
            TournamentShortDFH dfh = new TournamentShortDFH();
            dfh.setTournamentId(tournament.getId());
            dfh.setName(tournament.getTitle());                 // ✅ getTitle() вместо getName()
            dfh.setStatus(tournament.getStatus());
            dfh.setCurrentPlayers(0);                           // ✅ Заглушка, т.к. поля нет в Entity
            dfh.setMaxPlayers(tournament.getMaxParticipants()); // ✅ getMaxParticipants() вместо getMaxPlayers()
            dfh.setStartDate(tournament.getStartDate() != null ? tournament.getStartDate().toString() : null);
            dfh.setImageUrl(tournament.getImageUrl());

            result.add(dfh);
        }

        return result;
    }
}