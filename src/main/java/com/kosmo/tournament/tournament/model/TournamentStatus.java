package com.kosmo.tournament.tournament.model;

import java.util.Locale;

public enum TournamentStatus {
    DRAFT,
    REGISTRATION_OPEN,
    IN_PROGRESS,
    FINISHED,
    CANCELLED;

    public static TournamentStatus from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Tournament status is required");
        }

        try {
            return TournamentStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown tournament status: " + value);
        }
    }

    public String value() {
        return name();
    }
}