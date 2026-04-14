package com.kosmo.tournament.usergame.entity;

import java.util.Objects;

import com.kosmo.tournament.gametype.entity.GameType;
import com.kosmo.tournament.user.entity.User;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "\"UserGames\"",
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"userId", "gameId"})
        }
)
public class UserGame {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"gameId\"", nullable = false)
    private GameType game;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"", nullable = false)
    private User user;

    public UserGame() {
    }

    public Long getId() { return id; }
    public GameType getGame() { return game; }
    public User getUser() { return user; }

    public void setId(Long id) { this.id = id; }
    public void setGame(GameType game) { this.game = game; }
    public void setUser(User user) { this.user = user; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserGame userGame)) return false;
        return Objects.equals(id, userGame.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}