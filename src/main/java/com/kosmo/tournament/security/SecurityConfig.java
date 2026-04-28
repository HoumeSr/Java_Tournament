package com.kosmo.tournament.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   SessionAuthenticationFilter sessionAuthenticationFilter) throws Exception {
        http
                // Пока оставлено как было в проекте, чтобы не сломать существующие fetch/ajax-формы.
                // Следующий шаг — включить CSRF и передавать токен во всех POST/PUT/DELETE запросах.
                .csrf(AbstractHttpConfigurer::disable)
                .addFilterBefore(sessionAuthenticationFilter, AnonymousAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/login",
                                "/signin",
                                "/register",
                                "/rating",
                                "/forgot-password",
                                "/error",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/favicon.ico",
                                "/api/auth/**",
                                "/tournaments",
                                "/tournaments/*",
                                "/teams",
                                "/teams/*",
                                "/profile/*"
                        ).permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/gametypes/**", "/api/game-types/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/gametypes/**", "/api/game-types/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/gametypes/**", "/api/game-types/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET,
                                "/api/tournaments",
                                "/api/tournaments/*",
                                "/api/tournaments/*/matches",
                                "/api/tournaments/*/participants",
                                "/api/tournaments/*/participants/count",
                                "/api/tournament/*/participants/count",
                                "/api/tournaments/status/*",
                                "/api/tournaments/game/*",
                                "/api/tournaments/search"
                        ).permitAll()
                        .requestMatchers("/api/tournaments/my", "/api/tournaments/*/my-eligible-teams").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/tournaments/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/tournaments/**").authenticated()

                        .requestMatchers(HttpMethod.GET, "/api/teams", "/api/teams/open", "/api/teams/*", "/api/teams/*/members").permitAll()
                        .requestMatchers("/api/teams/my").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/teams/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/teams/**").authenticated()

                        .requestMatchers(HttpMethod.GET, "/api/matches/tournament/*", "/api/matches/solo/*", "/api/matches/team/*").permitAll()
                        .requestMatchers("/api/matches/my").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/matches/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/matches/**").authenticated()

                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/api/users/**").authenticated()
                        .requestMatchers("/profile", "/my/**", "/notifications").authenticated()

                        .anyRequest().authenticated()
                )
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }
}