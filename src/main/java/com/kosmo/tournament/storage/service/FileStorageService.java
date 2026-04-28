package com.kosmo.tournament.storage.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private final MinioClient minioClient;
    private final String bucket;
    private final String minioUrl;

    public FileStorageService(
            MinioClient minioClient,
            @Value("${minio.bucket}") String bucket,
            @Value("${minio.url}") String minioUrl
    ) {
        this.minioClient = minioClient;
        this.bucket = bucket;
        this.minioUrl = minioUrl;
    }

    public String uploadImage(MultipartFile file, String folder) {
        try {
            validateImage(file);

            String originalName = file.getOriginalFilename();
            String extension = getExtension(originalName);
            String objectName = folder + "/" + UUID.randomUUID() + extension;

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            return minioUrl + "/" + bucket + "/" + objectName;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new RuntimeException("Only image files are allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("File is too large. Max size is 5MB");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}