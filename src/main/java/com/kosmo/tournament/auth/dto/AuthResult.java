package com.kosmo.tournament.auth.dto;

import java.util.Map;

public record AuthResult(
        boolean success,
        String message,
        Map<String, Object> user
) {

    public static AuthResult ok(Map<String, Object> user) {
        return new AuthResult(true, null, user);
    }

    public static AuthResult fail(String message) {
        return new AuthResult(false, message, null);
    }
}