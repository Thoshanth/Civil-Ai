package com.civilai.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<ReportEntity, UUID> {
    List<ReportEntity> findByDocumentIdOrderByCreatedAtDesc(UUID documentId);
    List<ReportEntity> findByModuleOrderByCreatedAtDesc(String module);
}
