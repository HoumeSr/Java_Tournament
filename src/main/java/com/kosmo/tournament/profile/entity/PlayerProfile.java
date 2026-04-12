package com.kosmo.tournament.profile.entity;

import com.kosmo.tournament.gametype.entity.GameType;
import com.kosmo.tournament.user.entity.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(name = "PlayerProfile")
public class PlayerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    private GameType game;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String nickname;

    private String description;

    @Column(nullable = false)
    private String country;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal rating;

    public PlayerProfile() {
    }

    @PrePersist
    public void prePersist() {
        if (rating == null) rating = BigDecimal.ZERO;
    }

    public Long getId() { return id; }
    public GameType getGame() { return game; }
    public User getUser() { return user; }
    public String getNickname() { return nickname; }
    public String getDescription() { return description; }
    public String getCountry() { return country; }
    public BigDecimal getRating() { return rating; }

    public void setId(Long id) { this.id = id; }
    public void setGame(GameType game) { this.game = game; }
    public void setUser(User user) { this.user = user; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public void setDescription(String description) { this.description = description; }
    public void setCountry(String country) { this.country = country; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PlayerProfile that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}