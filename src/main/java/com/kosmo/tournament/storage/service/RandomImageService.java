package com.kosmo.tournament.storage.service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.minio.ListObjectsArgs;
import io.minio.MinioClient;
import io.minio.Result;
import io.minio.messages.Item;

@Service
public class RandomImageService {

    private final MinioClient minioClient;
    private final String bucket;
    private final String publicBaseUrl;

    public RandomImageService(
            MinioClient minioClient,
            @Value("${minio.bucket}") String bucket,
            @Value("${minio.public-url}") String publicBaseUrl
    ) {
        this.minioClient = minioClient;
        this.bucket = bucket;
        this.publicBaseUrl = publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
    }

    public String getRandomProfileImage() {
        return getRandomImageUrl("images/profiles/");
    }

    public String getRandomTeamImage() {
        return getRandomImageUrl("images/teams/");
    }

    public String getRandomTournamentImage() {
        return getRandomImageUrl("images/tournaments/");
    }

    private String getRandomImageUrl(String prefix) {
        List<String> objectNames = listImageObjects(prefix);

        if (objectNames.isEmpty()) {
            throw new RuntimeException("No images found in MinIO folder: " + prefix);
        }

        int index = ThreadLocalRandom.current().nextInt(objectNames.size());
        String objectName = objectNames.get(index);

        return buildPublicUrl(objectName);
    }

    private List<String> listImageObjects(String prefix) {
        List<String> result = new ArrayList<>();

        try {
            Iterable<Result<Item>> objects = minioClient.listObjects(
                    ListObjectsArgs.builder()
                            .bucket(bucket)
                            .prefix(prefix)
                            .recursive(true)
                            .build()
            );

            for (Result<Item> objectResult : objects) {
                Item item = objectResult.get();

                if (!item.isDir() && isImage(item.objectName())) {
                    result.add(item.objectName());
                }
            }

            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to list images from MinIO prefix: " + prefix, e);
        }
    }

    private boolean isImage(String objectName) {
        String lower = objectName.toLowerCase();
        return lower.endsWith(".png")
                || lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".webp");
    }

    private String buildPublicUrl(String objectName) {
        return publicBaseUrl + "/" + bucket + "/" + objectName;
    }
}