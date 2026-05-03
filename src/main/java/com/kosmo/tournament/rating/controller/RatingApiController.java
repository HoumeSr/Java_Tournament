package com.kosmo.tournament.rating.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kosmo.tournament.rating.dto.RatingDTO;
import com.kosmo.tournament.rating.service.RatingService;

@RestController
@RequestMapping("/api/rating")
public class RatingApiController {

    private final RatingService ratingService;

    public RatingApiController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @GetMapping("/global")
    public ResponseEntity<?> getGlobalRating(@RequestParam(required = false) Long gameTypeId,
                                             @RequestParam(defaultValue = "100") int limit) {
        try {
            List<RatingDTO> rating = ratingService.getGlobalRating(gameTypeId, Math.min(limit, 500));
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "rating", rating,
                    "count", rating.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/game/{gameTypeId}")
    public ResponseEntity<?> getRatingByGameType(@PathVariable Long gameTypeId) {
        try {
            List<RatingDTO> rating = ratingService.getRatingByGameType(gameTypeId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "gameTypeId", gameTypeId,
                    "rating", rating
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserRating(@PathVariable Long userId) {
        try {
            List<RatingDTO> rating = ratingService.getUserRating(userId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "userId", userId,
                    "rating", rating
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}