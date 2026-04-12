package com.kosmo.tournament.gametype.entity;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "GameTypes")
public class GameType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    private String description;

    @Column(nullable = false)
    private Boolean isActive;

    public GameType() {
    }

    @PrePersist
    public void prePersist() {
        if (isActive == null) isActive = false;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCode() { return code; }
    public String getDescription() { return description; }
    public Boolean getIsActive() { return isActive; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCode(String code) { this.code = code; }
    public void setDescription(String description) { this.description = description; }
    public void setIsActive(Boolean active) { isActive = active; }

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