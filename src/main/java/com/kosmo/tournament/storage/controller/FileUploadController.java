package com.kosmo.tournament.storage.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.kosmo.tournament.storage.service.FileStorageService;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    public FileUploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "common") String folder,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Authentication required"
            ));
        }

        try {
            String imageUrl = fileStorageService.uploadImage(file, folder);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "imageUrl", imageUrl
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}