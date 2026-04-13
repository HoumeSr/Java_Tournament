package com.kosmo.tournament.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "\"User\"")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "\"passwordHash\"", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"country\"", nullable = false)
    private String country = "Не указана";

    public User() {
    }

    public User(String username, String email, String passwordHash) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = "PLAYER";
        this.enabled = true;
        this.createdAt = LocalDateTime.now();
        this.country = "Не указана";
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (enabled == null) enabled = true;
        if (role == null) role = "PLAYER";
        if (country == null) country = "Не указана";
    }

    // Геттеры
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getRole() { return role; }
    public Boolean getEnabled() { return enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getCountry() { return country; }

    // Сеттеры
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setRole(String role) { this.role = role; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setCountry(String country) { this.country = country; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User user)) return false;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}