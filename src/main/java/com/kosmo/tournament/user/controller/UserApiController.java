package com.kosmo.tournament.user.controller;

import com.kosmo.tournament.user.dfh.UserProfileDFH;
import com.kosmo.tournament.user.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserApiController {
    private final UserService userService;

    public UserApiController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public UserProfileDFH getUserProfile(@PathVariable Long id,
                                         Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return userService.getUserProfile(id, currentUsername);
    }
}