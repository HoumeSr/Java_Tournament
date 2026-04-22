package com.kosmo.tournament.user.dto;

public class AuthorizationUserDTO {

    private String login;
    private String password;

    public AuthorizationUserDTO() {
    }

    public String getLogin() {
        return login;
    }

    public String getPassword() {
        return password;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}