package com.kosmo.tournament.web;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.kosmo.tournament.rating.repository.RatingStatsRepository;
import com.kosmo.tournament.storage.service.FileStorageService;
import com.kosmo.tournament.storage.service.RandomImageService;
import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Controller
public class HomeController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final RandomImageService randomImageService;

    public HomeController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          FileStorageService fileStorageService,
                          RandomImageService randomImageService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
        this.randomImageService = randomImageService;
    }

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("pageTitle", "Главная");
        return "home";
    }

    @GetMapping("/rating")
    public String rating(Model model) {
        model.addAttribute("pageTitle", "Рейтинг игроков");
        return "rating";
    }

    @GetMapping("/login")
    public String login(Model model) {
        model.addAttribute("pageTitle", "Авторизация");
        return "auth/login";
    }

    @GetMapping("/register")
    public String register(Model model) {
        model.addAttribute("pageTitle", "Регистрация");
        return "auth/register";
    }

    @GetMapping("/forgot-password")
    public String forgotPassword() {
        return "redirect:/login";
    }

    @PostMapping("/register")
    public String registerSubmit(@RequestParam String username,
                                 @RequestParam String email,
                                 @RequestParam String password,
                                 @RequestParam String confirmPassword,
                                 Model model) {

        if (username == null || username.isBlank()) {
            model.addAttribute("error", "Никнейм обязателен");
            return "auth/register";
        }

        if (email == null || email.isBlank()) {
            model.addAttribute("error", "Email обязателен");
            return "auth/register";
        }

        if (!password.equals(confirmPassword)) {
            model.addAttribute("error", "Пароли не совпадают");
            return "auth/register";
        }

        if (userRepository.existsByUsername(username)) {
            model.addAttribute("error", "Имя пользователя уже занято");
            return "auth/register";
        }

        if (userRepository.existsByEmail(email)) {
            model.addAttribute("error", "Email уже используется");
            return "auth/register";
        }

        String passwordHash = passwordEncoder.encode(password);
        User newUser = new User(username, email, passwordHash);
        newUser.setImageUrl(randomImageService.getRandomProfileImage());
        userRepository.save(newUser);

        return "redirect:/login?success=true";
    }

    @PostMapping("/signin")
    public String loginSubmit(@RequestParam String login,
                              @RequestParam String password,
                              HttpServletRequest request,
                              Model model) {

        User user = findUserByLogin(login);

        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            model.addAttribute("error", "Неверный логин/email или пароль");
            return "auth/login";
        }

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            model.addAttribute("error", "Аккаунт отключен");
            return "auth/login";
        }

        HttpSession session = request.getSession(true);
        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());
        session.setAttribute("userRole", user.getRole());

        return "redirect:/profile";
    }

    @PostMapping("/api/auth/register")
    @ResponseBody
    public Map<String, Object> registerAjax(@RequestParam String username,
                                            @RequestParam String email,
                                            @RequestParam String password,
                                            @RequestParam String confirmPassword) {
        Map<String, Object> response = new HashMap<>();

        if (username == null || username.isBlank()) {
            response.put("success", false);
            response.put("message", "Никнейм обязателен");
            return response;
        }

        if (email == null || email.isBlank()) {
            response.put("success", false);
            response.put("message", "Email обязателен");
            return response;
        }

        if (!password.equals(confirmPassword)) {
            response.put("success", false);
            response.put("message", "Пароли не совпадают");
            return response;
        }

        if (userRepository.existsByUsername(username)) {
            response.put("success", false);
            response.put("message", "Имя пользователя уже занято");
            return response;
        }

        if (userRepository.existsByEmail(email)) {
            response.put("success", false);
            response.put("message", "Email уже используется");
            return response;
        }

        String passwordHash = passwordEncoder.encode(password);
        User newUser = new User(username, email, passwordHash);
        newUser.setImageUrl(randomImageService.getRandomProfileImage());
        userRepository.save(newUser);

        response.put("success", true);
        response.put("message", "Регистрация успешна!");
        response.put("redirectUrl", "/login");
        return response;
    }

    @PostMapping("/api/auth/login")
    @ResponseBody
    public Map<String, Object> loginAjax(@RequestParam String login,
                                         @RequestParam String password,
                                         HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();

        User user = findUserByLogin(login);

        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            response.put("success", false);
            response.put("message", "Неверный логин/email или пароль");
            return response;
        }

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            response.put("success", false);
            response.put("message", "Аккаунт отключен");
            return response;
        }

        HttpSession session = request.getSession(true);
        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());
        session.setAttribute("userRole", user.getRole());

        response.put("success", true);
        response.put("message", "Вход выполнен успешно");
        response.put("redirectUrl", "/profile");

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("username", user.getUsername());
        userMap.put("role", user.getRole());
        userMap.put("imageUrl", user.getImageUrl() != null ? user.getImageUrl() : randomImageService.getRandomProfileImage());

        response.put("user", userMap);

        return response;
    }

    @PostMapping("/api/auth/logout")
    @ResponseBody
    public Map<String, Object> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("redirectUrl", "/");
        return response;
    }

    @GetMapping("/api/auth/check")
    @ResponseBody
    public Map<String, Object> checkAuth(HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            response.put("authenticated", false);
            return response;
        }

        Object userIdObj = session.getAttribute("userId");
        if (!(userIdObj instanceof Long userId)) {
            response.put("authenticated", false);
            return response;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            response.put("authenticated", false);
            return response;
        }

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("username", user.getUsername());
        userMap.put("role", user.getRole());
        userMap.put("imageUrl", user.getImageUrl());

        response.put("authenticated", true);
        response.put("user", userMap);

        return response;
    }

    private User findUserByLogin(String login) {
        if (login == null || login.isBlank()) {
            return null;
        }

        if (login.contains("@")) {
            return userRepository.findByEmail(login).orElse(null);
        }

        User byUsername = userRepository.findByUsername(login).orElse(null);
        if (byUsername != null) {
            return byUsername;
        }

        return userRepository.findByEmail(login).orElse(null);
    }
}