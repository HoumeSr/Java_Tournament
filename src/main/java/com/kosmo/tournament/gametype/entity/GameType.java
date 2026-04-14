package com.kosmo.tournament.gametype.entity;

import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "\"GameTypes\"")
public class GameType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "\"name\"", nullable = false)
    private String name;

    @Column(name = "\"code\"", nullable = false)
    private String code;

    @Column(name = "\"description\"")
    private String description;

    @Column(name = "\"isActive\"", nullable = false)
    private Boolean isActive;

    @Column(name = "\"imageUrl\"")
    private String imageUrl;

    @Column(name = "\"maxPlayers\"", nullable = false)
    private Integer maxPlayers;

    public GameType() {
    }

    @PrePersist
    public void prePersist() {
        if (isActive == null) isActive = false;
        if (imageUrl == null) imageUrl = "DEFAULT_GAME_IMAGE.jpg";
        if (maxPlayers == null) maxPlayers = 1;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCode() { return code; }
    public String getDescription() { return description; }
    public Boolean getIsActive() { return isActive; }
    public String getImageUrl() { return imageUrl; }
    public Integer getMaxPlayers() { return maxPlayers; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCode(String code) { this.code = code; }
    public void setDescription(String description) { this.description = description; }
    public void setIsActive(Boolean active) { isActive = active; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setMaxPlayers(Integer maxPlayers) { this.maxPlayers = maxPlayers; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof GameType gameType)) return false;
        return Objects.equals(id, gameType.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}