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
                .csrf(AbstractHttpConfigurer::disable)
                .addFilterBefore(sessionAuthenticationFilter, AnonymousAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/login",
                                "/register",
                                "/rating",
                                "/forgot-password",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/favicon.ico",
                                "/api/auth/**",
                                "/api/tournaments",
                                "/api/tournaments/*",
                                "/api/tournaments/status/*",
                                "/api/tournaments/game/*",
                                "/api/tournaments/search",
                                "/api/gametypes/**",
                                "/tournaments",
                                "/tournaments/*",
                                "/teams",
                                "/teams/*",
                                "/profile/*"
                        ).permitAll()

                        .requestMatchers("/api/tournaments/my").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/tournaments").authenticated()

                        .requestMatchers("/api/teams/my").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/teams").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/teams/open").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/teams/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/teams/*/members").permitAll()
                        .requestMatchers("/api/teams/**", "/api/notifications/**", "/api/matches/my").authenticated()

                        .requestMatchers(HttpMethod.POST, "/api/matches/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/matches/**").authenticated()

                        .requestMatchers("/profile", "/my/**", "/notifications").authenticated()
                        .anyRequest().permitAll()
                )
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }
}