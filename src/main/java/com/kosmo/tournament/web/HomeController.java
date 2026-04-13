package com.kosmo.tournament.web;

import com.kosmo.tournament.user.entity.User;
import com.kosmo.tournament.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@Controller
public class HomeController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public HomeController(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
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

    @PostMapping("/register")
    public String registerSubmit(@RequestParam String email,
                                 @RequestParam String password,
                                 @RequestParam String confirmPassword,
                                 Model model) {

        String username = email.split("@")[0];

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
        userRepository.save(newUser);

        return "redirect:/login?success=true";
    }

    @PostMapping("/signin")
    public String loginSubmit(@RequestParam String email,
                              @RequestParam String password,
                              HttpServletRequest request,
                              Model model) {

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            model.addAttribute("error", "Неверный email или пароль");
            return "auth/login";
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            model.addAttribute("error", "Неверный email или пароль");
            return "auth/login";
        }

        if (!user.getEnabled()) {
            model.addAttribute("error", "Аккаунт отключен");
            return "auth/login";
        }

        HttpSession session = request.getSession();
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
        userRepository.save(newUser);

        response.put("success", true);
        response.put("message", "Регистрация успешна!");
        return response;
    }

    @PostMapping("/api/auth/login")
    @ResponseBody
    public Map<String, Object> loginAjax(@RequestParam String username,
                                         @RequestParam String password,
                                         HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();

        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            response.put("success", false);
            response.put("message", "Неверное имя пользователя или пароль");
            return response;
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            response.put("success", false);
            response.put("message", "Неверное имя пользователя или пароль");
            return response;
        }

        if (!user.getEnabled()) {
            response.put("success", false);
            response.put("message", "Аккаунт отключен");
            return response;
        }

        HttpSession session = request.getSession();
        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());
        session.setAttribute("userRole", user.getRole());

        response.put("success", true);
        response.put("message", "Вход выполнен успешно");
        response.put("redirectUrl", "/profile");
        response.put("user", Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole()
        ));

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

        if (session != null && session.getAttribute("userId") != null) {
            response.put("authenticated", true);
            response.put("user", Map.of(
                    "id", session.getAttribute("userId"),
                    "username", session.getAttribute("username"),
                    "role", session.getAttribute("userRole")
            ));
        } else {
            response.put("authenticated", false);
        }

        return response;
    }
}