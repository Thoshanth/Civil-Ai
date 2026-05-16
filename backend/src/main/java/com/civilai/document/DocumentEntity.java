package com.civilai.document;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "minio_key", nullable = false, columnDefinition = "TEXT")
    private String minioKey;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(length = 100)
    private String module;

    @Column(name = "file_size_kb")
    private Integer fileSizeKb;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
}
