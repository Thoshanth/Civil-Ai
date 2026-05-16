package com.civilai.storage;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    public String uploadFile(MultipartFile file, String module) {
        try {
            // Generate unique object key
            String objectKey = String.format("%s/%s_%s",
                    module,
                    UUID.randomUUID(),
                    file.getOriginalFilename());

            // Upload to MinIO
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());

            log.info("Uploaded file to MinIO: {}", objectKey);
            return objectKey;

        } catch (Exception e) {
            log.error("Failed to upload file to MinIO", e);
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    public InputStream downloadFile(String objectKey) {
        try {
            return minioClient.getObject(GetObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .build());
        } catch (Exception e) {
            log.error("Failed to download file from MinIO: {}", objectKey, e);
            throw new RuntimeException("File download failed: " + e.getMessage());
        }
    }

    public String getPresignedUrl(String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .method(Method.GET)
                    .expiry(1, TimeUnit.HOURS)
                    .build());
        } catch (Exception e) {
            log.error("Failed to generate presigned URL for: {}", objectKey, e);
            throw new RuntimeException("Failed to generate download URL: " + e.getMessage());
        }
    }

    public void deleteFile(String objectKey) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .build());
            log.info("Deleted file from MinIO: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to delete file from MinIO: {}", objectKey, e);
            throw new RuntimeException("File deletion failed: " + e.getMessage());
        }
    }
}
