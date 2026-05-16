package com.civilai.report;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "llm_audit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlmAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "report_id")
    private UUID reportId;

    @Column(name = "provider_tried", length = 100)
    private String providerTried;

    @Column
    private Boolean success;

    @Column(name = "fallback_reason", columnDefinition = "TEXT")
    private String fallbackReason;

    @Column(name = "latency_ms")
    private Integer latencyMs;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
