package com.civilai.report;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportRepository reportRepository;
    private final LlmAuditRepository llmAuditRepository;

    @GetMapping("/{reportId}")
    public ResponseEntity<ReportEntity> getReport(@PathVariable UUID reportId) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        return ResponseEntity.ok(report);
    }

    @GetMapping("/document/{documentId}")
    public ResponseEntity<List<ReportEntity>> getDocumentReports(@PathVariable UUID documentId) {
        List<ReportEntity> reports = reportRepository.findByDocumentIdOrderByCreatedAtDesc(documentId);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/module/{module}")
    public ResponseEntity<List<ReportEntity>> getModuleReports(@PathVariable String module) {
        List<ReportEntity> reports = reportRepository.findByModuleOrderByCreatedAtDesc(module);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{reportId}/audit")
    public ResponseEntity<List<LlmAuditEntity>> getReportAudit(@PathVariable UUID reportId) {
        List<LlmAuditEntity> audits = llmAuditRepository.findByReportIdOrderByCreatedAtAsc(reportId);
        return ResponseEntity.ok(audits);
    }
}
