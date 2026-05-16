package com.civilai.report;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "document_id")
    private UUID documentId;

    @Column(nullable = false, length = 100)
    private String module;

    @Column(length = 50)
    private String status; // PENDING, SUCCESS, FAILED

    @Column(name = "result_json", columnDefinition = "JSONB")
    private String resultJson;

    @Column(name = "llm_used", length = 100)
    private String llmUsed;

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
