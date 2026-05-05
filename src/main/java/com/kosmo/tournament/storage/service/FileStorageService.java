package com.kosmo.tournament.storage.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
    );

    private final MinioClient minioClient;
    private final String bucket;
    private final String publicBaseUrl;

    public FileStorageService(
            MinioClient minioClient,
            @Value("${minio.bucket}") String bucket,
            @Value("${minio.public-url}") String publicBaseUrl
    ) {
        this.minioClient = minioClient;
        this.bucket = bucket;
        this.publicBaseUrl = trimTrailingSlash(publicBaseUrl);
    }

    public String uploadProfileImage(MultipartFile file, Long userId) {
        validateImage(file);

        String extension = resolveExtension(file);
        String objectName = "profiles/profile-" + userId + extension;

        upload(file, objectName);
        return buildPublicUrl(objectName);
    }

    public String uploadGameImage(MultipartFile file, Long gameTypeId) {
        validateImage(file);

        String extension = resolveExtension(file);
        String objectName = "games/game-" + gameTypeId + extension;

        upload(file, objectName);
        return buildPublicUrl(objectName);
    }
    public String uploadTeamLogo(MultipartFile file, Long teamId) {
        validateImage(file);

        String extension = resolveExtension(file);
        String objectName = "teams/team-" + teamId + extension;

        upload(file, objectName);
        return buildPublicUrl(objectName);
    }

    /**
     * Совместимость со старым кодом.
     * Можно вызывать так:
     * uploadImage(file, "profiles")
     * uploadImage(file, "games")
     * uploadImage(file, "teams")
     */
    public String uploadImage(MultipartFile file, String folder) {
        validateImage(file);

        String safeFolder = normalizeFolder(folder);
        String extension = resolveExtension(file);
        String objectName = safeFolder + "/" + UUID.randomUUID() + extension;

        upload(file, objectName);
        return buildPublicUrl(objectName);
    }

    private void upload(MultipartFile file, String objectName) {
        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Файл пустой");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new RuntimeException("Файл слишком большой. Максимум 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new RuntimeException("Разрешены только JPG, PNG и WEBP");
        }

        String extension = resolveExtension(file);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("Неподдерживаемое расширение файла");
        }
    }

    private String resolveExtension(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.contains(".")) {
            return ".png";
        }

        String extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        return ALLOWED_EXTENSIONS.contains(extension) ? extension : ".png";
    }

    private String normalizeFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return "common";
        }

        String normalized = folder.trim().toLowerCase(Locale.ROOT);
        normalized = normalized.replace('\\', '/');
        normalized = normalized.replaceAll("[^a-z0-9/_-]", "-");
        normalized = normalized.replaceAll("/+", "/");
        normalized = normalized.replaceAll("^/", "");
        normalized = normalized.replaceAll("/$", "");

        return normalized.isBlank() ? "common" : normalized;
    }

    private String buildPublicUrl(String objectName) {
        return publicBaseUrl + "/" + bucket + "/" + objectName;
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:9000";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}