package com.civilai.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LlmAuditRepository extends JpaRepository<LlmAuditEntity, UUID> {
    List<LlmAuditEntity> findByReportIdOrderByCreatedAtAsc(UUID reportId);
}
